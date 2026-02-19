from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
import time
from typing import Optional
from urllib.parse import parse_qs, urlencode

# ── Lazy HTTP client (created on startup, closed on shutdown) ─────────────────
client: httpx.AsyncClient | None = None

# ── Token cache (lazy refresh — only fetches when expired) ───────────────────
_token_cache: dict = {"token": None, "expires_at": 0.0}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global client
    client = httpx.AsyncClient(verify=False)
    yield
    await client.aclose()


app = FastAPI(lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Dev
        "http://localhost:5173",
        "http://172.16.16.221:5173",
        # Production
        "https://curalink.nextasolutions.net:8888",
        "http://smart.nextasolutions.net:5173",
        "https://smart.nextasolutions.net:8888",
    ],
    allow_credentials=True,
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
# ARCHIVE CONFIGURATIONS - Multi-Archive Support
# ============================================================================

ARCHIVE_CONFIGS = {
    "dcm4chee-arc": {
        "url": os.getenv("DCM4CHEE_URL", "http://172.16.16.221:8080"),
        "path": "/dcm4chee-arc/aets/DCM4CHEE/rs",
        "auth_required": True,
        "description": "DCM4CHEE Archive 5.x"
    },
    "orthanc": {
        "url": os.getenv("ORTHANC_URL", "http://172.16.16.221:8042"),
        "path": "/dicom-web",
        "auth_required": False,
        "description": "Orthanc DICOM Server"
    },
    "conquest": {
        "url": os.getenv("CONQUEST_URL", "http://172.16.16.221:5678"),
        "path": "/wado",
        "auth_required": False,
        "description": "Conquest DICOM Server"
    },
}

async def get_token() -> str:
    """Return a cached Keycloak token, fetching a new one only when expired."""
    now = time.monotonic()
    if _token_cache["token"] and now < _token_cache["expires_at"]:
        return _token_cache["token"]

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

    result = response.json()
    _token_cache["token"] = result["access_token"]
    # Refresh 30 s before actual expiry to avoid edge-case rejections
    _token_cache["expires_at"] = now + result.get("expires_in", 300) - 30
    return _token_cache["token"]


def get_archive_config(web_app_service: str = "dcm4chee-arc"):
    """Get configuration for specified archive"""
    if web_app_service not in ARCHIVE_CONFIGS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown archive: {web_app_service}. Available: {', '.join(ARCHIVE_CONFIGS.keys())}"
        )
    return ARCHIVE_CONFIGS[web_app_service]


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
# HOSPITALS
# ============================================================================

@app.get("/api/hospitals")
async def list_hospitals():
    """Return the full hospital registry (metadata only, no live DICOM stats)."""
    return HOSPITAL_REGISTRY


@app.get("/api/hospitals/{hospital_id}")
async def get_hospital(hospital_id: int):
    """Return a single hospital record by id."""
    for h in HOSPITAL_REGISTRY:
        if h["id"] == hospital_id:
            return h
    raise HTTPException(status_code=404, detail="Hospital not found")


@app.get("/api/archives")
async def list_archives():
    """List available DICOM archives/servers"""
    return [
        {
            "id": key,
            "name": key,
            "description": config["description"],
            "url": config["url"],
            "status": "active"  # You could add health checks here
        }
        for key, config in ARCHIVE_CONFIGS.items()
    ]


# ============================================================================
# PATIENTS
# ============================================================================

@app.get("/api/patients")
async def search_patients(request: Request, webAppService: str = "dcm4chee-arc"):
    """Search for patients in specified archive"""
    try:
        # Get archive configuration
        archive = get_archive_config(webAppService)
        
        # Get authentication token if required
        token = None
        if archive["auth_required"]:
            token = await get_token()
        
        # Clean query parameters (remove webAppService)
        query_params = clean_query_params(str(request.url.query))
        
        # Build URL for selected archive
        url = f"{archive['url']}{archive['path']}/patients"
        if query_params:
            url += f"?{query_params}"
        
        print(f"🔍 Searching patients in {webAppService}: {url}")
        
        # Build headers
        headers = {"Accept": "application/dicom+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        # Make request to archive
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
async def get_patient_studies(patient_id: str, webAppService: str = "dcm4chee-arc"):
    """Get studies for a specific patient"""
    try:
        archive = get_archive_config(webAppService)
        
        token = None
        if archive["auth_required"]:
            token = await get_token()
        
        url = f"{archive['url']}{archive['path']}/patients/{patient_id}/studies"
        
        headers = {"Accept": "application/dicom+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
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
async def search_studies(request: Request, webAppService: str = "dcm4chee-arc"):
    """Search for studies in specified archive"""
    try:
        # Get archive configuration
        archive = get_archive_config(webAppService)
        
        # Get authentication token if required
        token = None
        if archive["auth_required"]:
            token = await get_token()
        
        # Clean query parameters (remove webAppService)
        query_params = clean_query_params(str(request.url.query))
        
        # Build URL for selected archive
        url = f"{archive['url']}{archive['path']}/studies"
        if query_params:
            url += f"?{query_params}"
        
        print(f"🔍 Searching studies in {webAppService}: {url}")
        
        # Build headers
        headers = {"Accept": "application/dicom+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        # Make request to archive
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
async def search_mwl(request: Request, webAppService: str = "dcm4chee-arc"):
    """Search modality worklist in specified archive"""
    try:
        archive = get_archive_config(webAppService)
        
        token = None
        if archive["auth_required"]:
            token = await get_token()
        
        query_params = clean_query_params(str(request.url.query))
        
        url = f"{archive['url']}{archive['path']}/mwlitems"
        if query_params:
            url += f"?{query_params}"
        
        headers = {"Accept": "application/dicom+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
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


async def _aggregate_stats(studies_raw: list, total_patients: int, hospital_id: str | None = None) -> dict:
    modality_counts: dict[str, int] = {}
    date_counts:     dict[str, int] = {}
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

        studies_resp = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies"
            "?limit=1000&orderby=-StudyDate",
            headers=headers,
        )
        studies_raw: list = []
        if studies_resp.status_code == 200:
            studies_raw = studies_resp.json() or []
        elif studies_resp.status_code not in (204, 404):
            raise HTTPException(status_code=studies_resp.status_code, detail=studies_resp.text)

        patients_resp = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/patients?limit=1",
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
            for h in HOSPITAL_REGISTRY:
                if h["id"] == hid:
                    institution_name = h.get("institutionName")
                    break
        except (ValueError, TypeError):
            pass

        query = "limit=1000&orderby=-StudyDate"
        if institution_name:
            query += f"&InstitutionName=*{institution_name}*"

        studies_url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies?{query}"
        studies_resp = await client.get(studies_url, headers=headers)

        studies_raw: list = []
        if studies_resp.status_code == 200:
            studies_raw = studies_resp.json() or []
        elif studies_resp.status_code not in (204, 404):
            raise HTTPException(status_code=studies_resp.status_code, detail=studies_resp.text)

        pat_query = "limit=1"
        if institution_name:
            pat_query += f"&InstitutionName=*{institution_name}*"

        patients_url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/patients?{pat_query}"
        patients_resp = await client.get(patients_url, headers=headers)

        total_patients = 0
        if patients_resp.status_code == 200:
            total_patients = int(
                patients_resp.headers.get("X-Total-Count", 0)
                or len(patients_resp.json() or [])
            )

        if not studies_raw:
            fallback_resp = await client.get(
                f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies?limit=1000&orderby=-StudyDate",
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
# HEALTH
# ============================================================================

@app.get("/health")
async def health_check():
    return {"status": "ok", "archives": list(ARCHIVE_CONFIGS.keys())}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)