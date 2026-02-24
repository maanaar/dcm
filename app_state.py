"""
Shared application state: config, httpx client, token cache, DICOM helpers.
Imported by app.py and all routers to avoid circular dependencies.
"""
import asyncio
import os
import time
import httpx
from typing import Dict, List, Optional
from urllib.parse import parse_qs, urlencode

from fastapi import HTTPException

# ── Config ────────────────────────────────────────────────────────────────────
KEYCLOAK_URL            = os.getenv("KEYCLOAK_URL",            "https://172.16.16.221:8843")
DCM4CHEE_URL            = os.getenv("DCM4CHEE_URL",            "http://172.16.16.221:8080")
USERNAME                = os.getenv("DCM4CHEE_USERNAME",        "root")
PASSWORD                = os.getenv("DCM4CHEE_PASSWORD",        "changeit")
KEYCLOAK_ADMIN_USERNAME = os.getenv("KEYCLOAK_ADMIN_USERNAME",  "admin")
KEYCLOAK_ADMIN_PASSWORD = os.getenv("KEYCLOAK_ADMIN_PASSWORD",  "admin")
OLLAMA_URL              = os.getenv("OLLAMA_URL",               "http://localhost:11434")
OLLAMA_MODEL            = os.getenv("OLLAMA_MODEL",             "qwen2.5")
DEFAULT_WEBAPP          = os.getenv("DEFAULT_WEBAPP",           "DCM4CHEE")

# ── HTTP client (shared, single instance) ────────────────────────────────────
client = httpx.AsyncClient(verify=False, timeout=30.0)

# ── In-memory caches ─────────────────────────────────────────────────────────
_token_cache: Dict     = {"value": "", "expires_at": 0.0}
_hospitals_cache: Dict = {"data": None, "expires_at": 0.0}
HOSPITALS_TTL          = 300  # seconds

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_webapp_path(webapp: str) -> str:
    return f"/dcm4chee-arc/aets/{webapp}/rs"


async def get_token() -> str:
    now = time.monotonic()
    if _token_cache["value"] and now < _token_cache["expires_at"]:
        return _token_cache["value"]
    url  = f"{KEYCLOAK_URL}/realms/dcm4che/protocol/openid-connect/token"
    data = {
        "grant_type": "password",
        "client_id":  "dcm4chee-arc-ui",
        "username":   USERNAME,
        "password":   PASSWORD,
    }
    response = await client.post(url, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Authentication failed")
    payload = response.json()
    _token_cache["value"]      = payload["access_token"]
    _token_cache["expires_at"] = now + payload.get("expires_in", 300) * 0.8
    return _token_cache["value"]


def clean_query_params(query_string: str) -> str:
    if not query_string:
        return ""
    params = parse_qs(query_string)
    params.pop("webAppService", None)
    return urlencode(params, doseq=True)


def _gv(obj: dict, tag: str, idx: int = 0):
    vals = obj.get(tag, {}).get("Value", [])
    return vals[idx] if idx < len(vals) else ""


def _fmt_date(raw: str) -> str:
    if raw and len(raw) == 8:
        return f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
    return raw or ""


# ── Hospital / institution helpers ────────────────────────────────────────────

async def _fetch_all_series(token: str, dcm_path: str) -> list:
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
    fields  = (
        "&includefield=00080080,00080081,00081040,00080060"
        ",0020000D,00100020,00080021,00080031"
    )
    all_series, limit, offset = [], 1000, 0
    while True:
        resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/series?limit={limit}&offset={offset}{fields}",
            headers=headers,
        )
        if resp.status_code in (200,):
            page = resp.json() or []
            all_series.extend(page)
            if len(page) < limit:
                break
            offset += limit
        else:
            break
    return all_series


async def _fetch_all_studies_sup(token: str, dcm_path: str) -> list:
    headers    = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
    fields     = "&includefield=00080080,00080081,00081040,00080061,0020000D,00100020,00080020"
    all_studies, limit, offset = [], 1000, 0
    while True:
        resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/studies?limit={limit}&offset={offset}{fields}",
            headers=headers,
        )
        if resp.status_code == 200:
            page = resp.json() or []
            all_studies.extend(page)
            if len(page) < limit:
                break
            offset += limit
        else:
            break
    return all_studies


def _build_institutions_from_series(
    series_list: list, studies_list: Optional[list] = None
) -> List[dict]:
    buckets: Dict[str, dict] = {}

    def _ensure(inst_name: str, address: str) -> dict:
        if inst_name not in buckets:
            buckets[inst_name] = {
                "address": address, "study_uids": set(),
                "patient_ids": set(), "modalities": set(),
                "departments": set(), "dates": [],
            }
        return buckets[inst_name]

    for s in series_list:
        inst = (_gv(s, "00080080") or "").strip()
        if not inst:
            continue
        b = _ensure(inst, _gv(s, "00080081") or "")
        uid  = _gv(s, "0020000D"); uid  and b["study_uids"].add(uid)
        pid  = _gv(s, "00100020"); pid  and b["patient_ids"].add(pid)
        mod  = _gv(s, "00080060"); mod  and b["modalities"].add(mod)
        dept = _gv(s, "00081040"); dept and b["departments"].add(dept)
        d    = _gv(s, "00080021"); d    and b["dates"].append(d)

    for study in (studies_list or []):
        inst = (_gv(study, "00080080") or "").strip()
        if not inst:
            continue
        b = _ensure(inst, _gv(study, "00080081") or "")
        uid  = _gv(study, "0020000D"); uid  and b["study_uids"].add(uid)
        pid  = _gv(study, "00100020"); pid  and b["patient_ids"].add(pid)
        for mod in (study.get("00080061", {}).get("Value", []) or []):
            mod and b["modalities"].add(mod)
        dept = _gv(study, "00081040"); dept and b["departments"].add(dept)
        d    = _gv(study, "00080020"); d    and b["dates"].append(d)

    result = []
    for i, (name, b) in enumerate(
        sorted(buckets.items(), key=lambda x: -len(x[1]["study_uids"]))
    ):
        result.append({
            "id":              i + 1,
            "name":            name,
            "institutionName": name,
            "address":         b["address"],
            "status":          "active",
            "studyCount":      len(b["study_uids"]),
            "patientCount":    len(b["patient_ids"]),
            "modalities":      sorted(b["modalities"]),
            "departments":     sorted(b["departments"]),
            "lastStudyDate":   _fmt_date(max(b["dates"])) if b["dates"] else None,
        })
    return result


async def fetch_hospitals_cached() -> list:
    """Build institution list from series+studies, cached for HOSPITALS_TTL seconds."""
    now = time.monotonic()
    if _hospitals_cache["data"] is not None and now < _hospitals_cache["expires_at"]:
        return _hospitals_cache["data"]
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)
        series_list, studies_sup = await asyncio.gather(
            _fetch_all_series(token, dcm_path),
            _fetch_all_studies_sup(token, dcm_path),
        )
        institutions = _build_institutions_from_series(series_list, studies_sup)
        print(f"[hospitals] {len(institutions)} institutions from "
              f"{len(series_list)} series + {len(studies_sup)} studies")
        _hospitals_cache["data"]       = institutions
        _hospitals_cache["expires_at"] = now + HOSPITALS_TTL
        return institutions
    except Exception as e:
        print(f"[hospitals] Error: {e}")
        return []
