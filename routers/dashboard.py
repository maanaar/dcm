from typing import Optional
from typing import Dict

from fastapi import APIRouter, HTTPException

from app_state import (
    CURALINK_URL, DEFAULT_WEBAPP, client,
    get_token, get_webapp_path,
    fetch_hospitals_cached, _fetch_all_series,
    _gv, _fmt_date,
)

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _transform_study_for_dashboard(study: dict, idx: int) -> dict:
    pat_raw = _gv(study, "00100010")
    if isinstance(pat_raw, dict):
        alphabetic = pat_raw.get("Alphabetic", "")
        parts      = alphabetic.split("^")
        display    = f"{parts[1]} {parts[0]}" if len(parts) > 1 else alphabetic
    else:
        display = str(pat_raw) if pat_raw else "Unknown"

    modalities = study.get("00080061", {}).get("Value", [])
    n_inst = study.get("numberOfStudyRelatedInstances") or _gv(study, "00201208") or 0
    n_ser  = study.get("numberOfStudyRelatedSeries")    or _gv(study, "00201206") or 0

    return {
        "id":               _gv(study, "0020000D") or f"study_{idx}",
        "studyInstanceUID": _gv(study, "0020000D"),
        "patientName":      display or "Unknown",
        "patientId":        _gv(study, "00100020"),
        "studyDate":        _fmt_date(_gv(study, "00080020")),
        "modality":         ", ".join(str(m) for m in modalities if m),
        "description":      _gv(study, "00081030"),
        "accessionNumber":  _gv(study, "00080050"),
        "numberOfInstances": n_inst,
        "numberOfSeries":   n_ser,
    }


async def _aggregate_stats(
    studies_raw: list, total_patients: int, hospital_id: Optional[str] = None
) -> dict:
    modality_counts: Dict[str, int] = {}
    date_counts:     Dict[str, int] = {}
    total_series    = 0
    total_instances = 0

    for study in studies_raw:
        for m in study.get("00080061", {}).get("Value", []):
            if m:
                modality_counts[m] = modality_counts.get(m, 0) + 1
        fmt = _fmt_date(_gv(study, "00080020"))
        if fmt:
            date_counts[fmt] = date_counts.get(fmt, 0) + 1
        try:
            total_series    += int(study.get("numberOfStudyRelatedSeries")    or _gv(study, "00201206") or 0)
            total_instances += int(study.get("numberOfStudyRelatedInstances") or _gv(study, "00201208") or 0)
        except (ValueError, TypeError):
            pass

    result = {
        "totalStudies":    len(studies_raw),
        "totalPatients":   total_patients,
        "totalSeries":     total_series,
        "totalInstances":  total_instances,
        "studiesByModality": sorted(
            [{"modality": k, "count": v} for k, v in modality_counts.items()],
            key=lambda x: -x["count"],
        ),
        "studiesByDate": [
            {"date": d, "count": c}
            for d, c in sorted(date_counts.items())[-30:]
        ],
        "recentStudies": [
            _transform_study_for_dashboard(s, i)
            for i, s in enumerate(studies_raw[:10])
        ],
    }
    if hospital_id is not None:
        result["hospitalId"] = hospital_id
    return result


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard_stats():
    """Network-wide aggregated dashboard statistics."""
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}

        recent_resp = await client.get(
            f"{CURALINK_URL}{dcm_path}/studies?limit=200&orderby=-StudyDate"
            "&includefield=00080061,00100020,00080020,00081030,00080050,00201206,00201208",
            headers=headers,
        )
        recent_raw: list = recent_resp.json() or [] if recent_resp.status_code == 200 else []
        total_patients   = len({_gv(s, "00100020") for s in recent_raw if _gv(s, "00100020")})
        return await _aggregate_stats(recent_raw, total_patients)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/hospital/{hospital_id}")
async def get_hospital_dashboard(hospital_id: str):
    """Per-hospital dashboard statistics."""
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}

        hospitals        = await fetch_hospitals_cached()
        institution_name = None
        try:
            hid = int(hospital_id)
            for h in hospitals:
                if h["id"] == hid:
                    institution_name = h.get("institutionName")
                    break
        except (ValueError, TypeError):
            pass

        query = (
            "limit=2000&orderby=-StudyDate"
            "&includefield=00080080,00080061,00100020,00080020,00081030,00080050,00201206,00201208"
        )
        if institution_name and institution_name != "Unknown":
            query += f"&InstitutionName={institution_name}"

        studies_resp = await client.get(
            f"{CURALINK_URL}{dcm_path}/studies?{query}", headers=headers,
        )
        studies_raw: list = studies_resp.json() or [] if studies_resp.status_code == 200 else []

        # Fallback: fetch all and filter client-side by series InstitutionName
        if not studies_raw and institution_name and institution_name != "Unknown":
            all_resp    = await client.get(
                f"{CURALINK_URL}{dcm_path}/studies?limit=2000&orderby=-StudyDate"
                "&includefield=00080080,00080061,00100020,00080020,00081030,00080050,00201206,00201208",
                headers=headers,
            )
            all_studies = all_resp.json() if all_resp.status_code == 200 else []
            series_list = await _fetch_all_series(token, dcm_path)
            uid_to_inst = {
                _gv(s, "0020000D"): _gv(s, "00080080") or ""
                for s in series_list if _gv(s, "0020000D")
            }
            studies_raw = [
                s for s in all_studies
                if (
                    uid_to_inst.get(_gv(s, "0020000D"), "").lower() == institution_name.lower()
                    or (_gv(s, "00080080") or "").lower() == institution_name.lower()
                )
            ]

        total_patients = len({_gv(s, "00100020") for s in studies_raw if _gv(s, "00100020")})
        return await _aggregate_stats(studies_raw, total_patients, hospital_id=hospital_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
