"""
Smart Search router — LangChain + Ollama/Qwen
  GET  /api/quick-search   fast fuzzy search across patients & studies
  POST /api/smart-search   natural-language Q&A about the DICOM archive
"""
import asyncio
import os
from typing import List

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

# ── shared state ─────────────────────────────────────────────────────────────
from app_state import (
    DCM4CHEE_URL,
    DEFAULT_WEBAPP,
    OLLAMA_MODEL,
    OLLAMA_URL,
    client,
    fetch_hospitals_cached,
    get_token,
    get_webapp_path,
    _fmt_date,
    _gv,
)

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────

def _make_llm() -> ChatOllama:
    return ChatOllama(base_url=OLLAMA_URL, model=OLLAMA_MODEL, timeout=60)


# ── endpoints ────────────────────────────────────────────────────────────────

@router.get("/quick-search")
async def quick_search(q: str = "", webAppService: str = DEFAULT_WEBAPP):
    """Fast fuzzy search across patients and studies."""
    if not q.strip():
        return {"patients": [], "studies": []}
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(webAppService)
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        term     = q.strip()

        pat_resp, pid_resp, st_resp = await asyncio.gather(
            client.get(f"{DCM4CHEE_URL}{dcm_path}/patients?limit=8&fuzzymatching=true&PatientName={term}", headers=headers),
            client.get(f"{DCM4CHEE_URL}{dcm_path}/patients?limit=8&PatientID={term}*", headers=headers),
            client.get(
                f"{DCM4CHEE_URL}{dcm_path}/studies?limit=8&fuzzymatching=true&PatientName={term}"
                "&includefield=00100010,00100020,00080020,00080061,00081030,0020000D",
                headers=headers,
            ),
        )

        patients: List[dict] = []
        seen: set = set()
        for resp in (pat_resp, pid_resp):
            if resp.status_code == 200:
                for p in (resp.json() or []):
                    pid = _gv(p, "00100020")
                    if pid and pid not in seen:
                        seen.add(pid)
                        nv = p.get("00100010", {}).get("Value", [{}])[0]
                        patients.append({
                            "patientId":   pid,
                            "patientName": nv.get("Alphabetic", pid) if isinstance(nv, dict) else pid,
                        })

        studies: List[dict] = []
        if st_resp.status_code == 200:
            for s in (st_resp.json() or []):
                nv = s.get("00100010", {}).get("Value", [{}])[0]
                studies.append({
                    "studyInstanceUID": _gv(s, "0020000D"),
                    "patientName":      nv.get("Alphabetic", "?") if isinstance(nv, dict) else "?",
                    "patientId":        _gv(s, "00100020"),
                    "studyDate":        _fmt_date(_gv(s, "00080020")),
                    "modality":         ", ".join(s.get("00080061", {}).get("Value", []) or []),
                    "description":      _gv(s, "00081030"),
                })

        return {"patients": patients[:8], "studies": studies[:8]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smart-search")
async def smart_search(request: Request):
    """Answer natural-language questions about the DICOM archive using LangChain + Ollama."""
    body     = await request.json()
    question = (body.get("question") or "").strip()
    history  = body.get("history", [])   # [{role: "user"|"assistant", content: "..."}]

    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    # ── Build archive context ─────────────────────────────────────────────
    context_parts: List[str] = []
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        q_lower  = question.lower()

        # Always include institution summary
        hospitals = await fetch_hospitals_cached()
        if hospitals:
            total_patients = sum(h.get("patientCount", 0) for h in hospitals)
            total_studies  = sum(h.get("studyCount", 0)   for h in hospitals)
            inst_lines = "\n".join(
                f"  - {h['name']}: {h['studyCount']} studies, {h['patientCount']} patients"
                for h in hospitals[:15]
            )
            context_parts.append(
                f"Archive totals: {total_studies} studies, {total_patients} patients\n"
                f"Institutions:\n{inst_lines}"
            )

        # Recent studies if asked
        if any(w in q_lower for w in ("study", "studies", "scan", "recent", "last", "latest", "exam")):
            st = await client.get(
                f"{DCM4CHEE_URL}{dcm_path}/studies?limit=10&orderby=-StudyDate"
                "&includefield=00080061,00100010,00100020,00080020,00081030",
                headers=headers,
            )
            if st.status_code == 200:
                lines = []
                for s in (st.json() or [])[:10]:
                    nv   = s.get("00100010", {}).get("Value", [{}])[0]
                    name = nv.get("Alphabetic", "?") if isinstance(nv, dict) else "?"
                    mods = ", ".join(s.get("00080061", {}).get("Value", []) or [])
                    lines.append(f"  - {name} | {mods} | {_fmt_date(_gv(s, '00080020'))} | {_gv(s, '00081030')}")
                if lines:
                    context_parts.append("Recent studies:\n" + "\n".join(lines))

        # Patient lookup if mentioned
        if any(w in q_lower for w in ("patient", "name", "id", "who", "find")):
            pr = await client.get(
                f"{DCM4CHEE_URL}{dcm_path}/patients?limit=15&fuzzymatching=true",
                headers=headers,
            )
            if pr.status_code == 200:
                lines = []
                for p in (pr.json() or [])[:15]:
                    pid  = _gv(p, "00100020")
                    nv   = p.get("00100010", {}).get("Value", [{}])[0]
                    name = nv.get("Alphabetic", pid) if isinstance(nv, dict) else pid
                    lines.append(f"  - {name} (ID: {pid})")
                if lines:
                    context_parts.append("Patients in archive:\n" + "\n".join(lines))

        # Modalities if asked
        if any(w in q_lower for w in ("modality", "modalities", "ct", "mr", "mri", "us", "xray", "x-ray", "nm", "pet")):
            mr = await client.get(
                f"{DCM4CHEE_URL}/dcm4chee-arc/modalities",
                headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            )
            if mr.status_code == 200:
                mods = mr.json() or []
                context_parts.append(f"Available modalities: {', '.join(mods)}")

    except Exception as e:
        context_parts.append(f"(archive data partially unavailable: {e})")

    context = "\n\n".join(context_parts) if context_parts else "No archive data available."

    system_content = (
        "You are a helpful medical imaging assistant for a DICOM archive system called CuraLink. "
        "Answer questions concisely and accurately based only on the provided archive data. "
        "If the data doesn't contain enough information to answer, say so clearly. "
        "Use plain professional language.\n\n"
        f"Current archive data:\n{context}"
    )

    # ── Build LangChain message list ──────────────────────────────────────
    lc_messages = [SystemMessage(content=system_content)]
    for h in history:
        if h.get("role") == "user":
            lc_messages.append(HumanMessage(content=h["content"]))
        elif h.get("role") == "assistant":
            lc_messages.append(AIMessage(content=h["content"]))
    lc_messages.append(HumanMessage(content=question))

    # ── Call Ollama via LangChain ─────────────────────────────────────────
    try:
        llm    = _make_llm()
        result = await asyncio.get_event_loop().run_in_executor(None, llm.invoke, lc_messages)
        return {"answer": result.content, "model": OLLAMA_MODEL}
    except Exception as e:
        err = str(e)
        if "connect" in err.lower() or "connection" in err.lower():
            raise HTTPException(status_code=503, detail=f"Cannot connect to Ollama at {OLLAMA_URL}. Is it running?")
        raise HTTPException(status_code=502, detail=f"LLM error: {err}")
