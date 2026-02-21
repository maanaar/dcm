from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional, Dict
from urllib.parse import parse_qs, urlencode

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://172.16.16.221:5173","http://localhost:5173","http://smart.nextasolutions.net:5173","https://curalink.nextasolutions.net:5173"],  # No trailing slash
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend URLs
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "https://172.16.16.221:8843")
DCM4CHEE_URL = os.getenv("DCM4CHEE_URL", "http://172.16.16.221:8080")
USERNAME     = os.getenv("DCM4CHEE_USERNAME", "root")
PASSWORD     = os.getenv("DCM4CHEE_PASSWORD", "changeit")

client = httpx.AsyncClient(verify=False)

# ============================================================================
# DCM4CHEE CONFIGURATION
# ============================================================================

DEFAULT_WEBAPP = os.getenv("DEFAULT_WEBAPP", "DCM4CHEE")

def get_webapp_path(webapp: str) -> str:
    return f"/dcm4chee-arc/aets/{webapp}/rs"



async def get_token() -> str:
    """Get authentication token from Keycloak"""
    url = f"{KEYCLOAK_URL}/realms/dcm4che/protocol/openid-connect/token"
    data = {
        "grant_type": "password",
        "client_id": "dcm4chee-arc-ui",
        "username": USERNAME,
        "password": PASSWORD,
    }
    response = await client.post(url, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Authentication failed")
    return response.json()["access_token"]


def clean_query_params(query_string: str) -> str:
    """Remove webAppService from query parameters"""
    if not query_string:
        return ""
    
    params = parse_qs(query_string)
    # Remove webAppService parameter
    params.pop('webAppService', None)
    
    # Rebuild query string
    return urlencode(params, doseq=True)


# ============================================================================
# HOSPITALS  — sourced from dcm4chee /institutions
# ============================================================================

@app.get("/api/hospitals")
async def list_hospitals():
    """Return institutions from dcm4chee as hospital list."""
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        response = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/institutions",
            headers=headers,
        )
        if response.status_code == 200:
            names = response.json()  # list of strings
            return [
                {"id": idx + 1, "name": name, "institutionName": name, "status": "active"}
                for idx, name in enumerate(names)
                if name
            ]
        return []
    except Exception as e:
        print(f"Error fetching institutions: {e}")
        return []


@app.get("/api/hospitals/{hospital_id}")
async def get_hospital(hospital_id: int):
    hospitals = await list_hospitals()
    for h in hospitals:
        if h["id"] == hospital_id:
            return h
    raise HTTPException(status_code=404, detail="Hospital not found")


# ============================================================================
# PATIENTS
# ============================================================================

@app.get("/api/patients")
async def search_patients(request: Request, webAppService: str = DEFAULT_WEBAPP):
    try:
        token = await get_token()
        query_params = clean_query_params(str(request.url.query))
        dcm_path = get_webapp_path(webAppService)
        url = f"{DCM4CHEE_URL}{dcm_path}/patients"
        if query_params:
            url += f"?{query_params}"
        headers = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/patients/{patient_id}/studies")
async def get_patient_studies(patient_id: str, webAppService: str = DEFAULT_WEBAPP):
    try:
        token = await get_token()
        dcm_path = get_webapp_path(webAppService)
        url = f"{DCM4CHEE_URL}{dcm_path}/patients/{patient_id}/studies"
        headers = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STUDIES
# ============================================================================

@app.get("/api/studies")
async def search_studies(request: Request, webAppService: str = DEFAULT_WEBAPP):
    try:
        token = await get_token()
        query_params = clean_query_params(str(request.url.query))
        dcm_path = get_webapp_path(webAppService)
        url = f"{DCM4CHEE_URL}{dcm_path}/studies"
        if query_params:
            url += f"?{query_params}"
        headers = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MWL
# ============================================================================

@app.get("/api/mwl")
async def search_mwl(request: Request, webAppService: str = DEFAULT_WEBAPP):
    try:
        token = await get_token()
        query_params = clean_query_params(str(request.url.query))
        dcm_path = get_webapp_path(webAppService)
        url = f"{DCM4CHEE_URL}{dcm_path}/mwlitems"
        if query_params:
            url += f"?{query_params}"
        headers = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DASHBOARD helpers
# ============================================================================

def _gv(obj: dict, tag: str, idx: int = 0):
    vals = obj.get(tag, {}).get("Value", [])
    return vals[idx] if idx < len(vals) else ""


def _fmt_date(raw: str) -> str:
    if raw and len(raw) == 8:
        return f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
    return raw or ""


def _transform_study_for_dashboard(study: dict, idx: int) -> dict:
    pat_raw = _gv(study, "00100010")
    if isinstance(pat_raw, dict):
        alphabetic = pat_raw.get("Alphabetic", "")
        parts = alphabetic.split("^")
        display = f"{parts[1]} {parts[0]}" if len(parts) > 1 else alphabetic
    else:
        display = str(pat_raw) if pat_raw else "Unknown"

    modalities = study.get("00080061", {}).get("Value", [])
    n_inst = study.get("numberOfStudyRelatedInstances") or _gv(study, "00201208") or 0
    n_ser  = study.get("numberOfStudyRelatedSeries")    or _gv(study, "00201206") or 0

    return {
        "id": _gv(study, "0020000D") or f"study_{idx}",
        "studyInstanceUID": _gv(study, "0020000D"),
        "patientName": display or "Unknown",
        "patientId": _gv(study, "00100020"),
        "studyDate": _fmt_date(_gv(study, "00080020")),
        "modality": ", ".join(str(m) for m in modalities if m),
        "description": _gv(study, "00081030"),
        "accessionNumber": _gv(study, "00080050"),
        "numberOfInstances": n_inst,
        "numberOfSeries": n_ser,
    }


async def _aggregate_stats(studies_raw: list, total_patients: int, hospital_id: Optional[str] = None) -> dict:
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
        "totalStudies":      len(studies_raw),
        "totalPatients":     total_patients,
        "totalSeries":       total_series,
        "totalInstances":    total_instances,
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


# ============================================================================
# DASHBOARD
# ============================================================================

@app.get("/api/dashboard")
async def get_dashboard_stats():
    """Network-wide aggregated dashboard statistics."""
    try:
        token   = await get_token()
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}

        dcm_path = get_webapp_path(DEFAULT_WEBAPP)
        studies_resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/studies?limit=1000&orderby=-StudyDate",
            headers=headers,
        )
        studies_raw: list = []
        if studies_resp.status_code == 200:
            studies_raw = studies_resp.json() or []
        elif studies_resp.status_code not in (204, 404):
            raise HTTPException(status_code=studies_resp.status_code, detail=studies_resp.text)

        patients_resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/patients?limit=1",
            headers=headers,
        )
        total_patients = 0
        if patients_resp.status_code == 200:
            total_patients = int(
                patients_resp.headers.get("X-Total-Count", 0)
                or len(patients_resp.json() or [])
            )

        return await _aggregate_stats(studies_raw, total_patients)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/hospital/{hospital_id}")
async def get_hospital_dashboard(hospital_id: str):
    """Per-hospital dashboard with InstitutionName filtering"""
    try:
        token   = await get_token()
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}

        institution_name = None
        try:
            hid = int(hospital_id)
            hospitals = await list_hospitals()
            for h in hospitals:
                if h["id"] == hid:
                    institution_name = h.get("institutionName")
                    break
        except (ValueError, TypeError):
            pass

        dcm_path = get_webapp_path(DEFAULT_WEBAPP)
        query = "limit=1000&orderby=-StudyDate"
        if institution_name:
            query += f"&InstitutionName=*{institution_name}*"

        studies_url = f"{DCM4CHEE_URL}{dcm_path}/studies?{query}"
        studies_resp = await client.get(studies_url, headers=headers)

        studies_raw: list = []
        if studies_resp.status_code == 200:
            studies_raw = studies_resp.json() or []
        elif studies_resp.status_code not in (204, 404):
            raise HTTPException(status_code=studies_resp.status_code, detail=studies_resp.text)

        pat_query = "limit=1"
        if institution_name:
            pat_query += f"&InstitutionName=*{institution_name}*"

        patients_url = f"{DCM4CHEE_URL}{dcm_path}/patients?{pat_query}"
        patients_resp = await client.get(patients_url, headers=headers)

        total_patients = 0
        if patients_resp.status_code == 200:
            total_patients = int(
                patients_resp.headers.get("X-Total-Count", 0)
                or len(patients_resp.json() or [])
            )

        if not studies_raw:
            fallback_resp = await client.get(
                f"{DCM4CHEE_URL}{dcm_path}/studies?limit=1000&orderby=-StudyDate",
                headers=headers,
            )
            if fallback_resp.status_code == 200:
                studies_raw = fallback_resp.json() or []

        return await _aggregate_stats(studies_raw, total_patients, hospital_id=hospital_id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SERIES
# ============================================================================

@app.get("/api/series")
async def search_series(request: Request, webAppService: str = DEFAULT_WEBAPP):
    try:
        token = await get_token()
        query_params = clean_query_params(str(request.url.query))
        dcm_path = get_webapp_path(webAppService)
        url = f"{DCM4CHEE_URL}{dcm_path}/series"
        if query_params:
            url += f"?{query_params}"
        headers = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DEVICES CONFIGURATION
# ============================================================================

@app.get("/api/devices")
async def list_devices():
    """List all configured DICOM devices"""
    try:
        token = await get_token()

        url = f"{DCM4CHEE_URL}/dcm4chee-arc/devices"
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/devices/{device_name}")
async def get_device(device_name: str):
    """Get specific device configuration"""
    try:
        token = await get_token()

        url = f"{DCM4CHEE_URL}/dcm4chee-arc/devices/{device_name}"
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WEB APP SERVICES (QIDO-RS capable)
# ============================================================================

@app.get("/api/webapps")
async def list_webapps():
    """List Web Application Services that have QIDO_RS capability."""
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/webapps?dcmWebServiceClass=QIDO_RS",
            headers=headers,
        )
        if response.status_code != 200:
            return []
        return response.json()
    except Exception as e:
        print(f"Error fetching webapps: {e}")
        return []


# ============================================================================
# APPLICATION ENTITIES (AE TITLES)
# ============================================================================

@app.get("/api/aes")
async def list_application_entities():
    """List all Application Entity Titles"""
    try:
        token = await get_token()

        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aes"
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/aes/{aet}")
async def get_application_entity(aet: str):
    """Get specific Application Entity configuration"""
    try:
        token = await get_token()

        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aes/{aet}"
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HL7 APPLICATIONS
# ============================================================================

@app.get("/api/hl7apps")
async def list_hl7_applications():
    """List all HL7 applications"""
    try:
        token = await get_token()

        url = f"{DCM4CHEE_URL}/dcm4chee-arc/hl7apps"
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/hl7apps/{hl7_app_name}")
async def get_hl7_application(hl7_app_name: str):
    """Get specific HL7 application configuration"""
    try:
        token = await get_token()

        url = f"{DCM4CHEE_URL}/dcm4chee-arc/hl7apps/{hl7_app_name}"
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH
# ============================================================================

@app.get("/api/modalities")
async def list_modalities():
    """Return distinct modalities from dcm4chee received series."""
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        response = await client.get(f"{DCM4CHEE_URL}/dcm4chee-arc/modalities", headers=headers)
        if response.status_code == 200:
            return response.json()  # list of modality strings
        return []
    except Exception as e:
        print(f"Error fetching modalities: {e}")
        return []


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dcm4chee-arc"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)