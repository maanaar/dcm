from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional
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

# ─── Static hospital registry (server-side) ───────────────────────────────────
# In a real deployment, replace this with a database query
HOSPITAL_REGISTRY = [
    {
        "id": 1,
        "name": "City General Hospital",
        "location": "Downtown, Alexandria",
        "type": "General Hospital",
        "beds": 450,
        "staff": 320,
        "departments": ["Cardiology", "Neurology", "Orthopedics", "Emergency"],
        "modalities": ["CT", "MRI", "X-Ray", "Ultrasound"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=350&fit=crop",
        "institutionName": "City General",
    },
    {
        "id": 2,
        "name": "St. Mary Medical Center",
        "location": "North District, Alexandria",
        "type": "Specialized Center",
        "beds": 280,
        "staff": 210,
        "departments": ["Oncology", "Radiology", "Surgery"],
        "modalities": ["CT", "PET-CT", "MRI"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=350&fit=crop",
        "institutionName": "St. Mary",
    },
    {
        "id": 3,
        "name": "Alexandria Children's Hospital",
        "location": "West Side, Alexandria",
        "type": "Pediatric Hospital",
        "beds": 200,
        "staff": 180,
        "departments": ["Pediatrics", "NICU", "Pediatric Surgery"],
        "modalities": ["X-Ray", "Ultrasound", "MRI"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=600&h=350&fit=crop",
        "institutionName": "Children Hospital",
    },
    {
        "id": 4,
        "name": "Eastern Regional Medical",
        "location": "East Alexandria",
        "type": "Regional Hospital",
        "beds": 350,
        "staff": 270,
        "departments": ["Emergency", "ICU", "General Medicine"],
        "modalities": ["CT", "X-Ray", "Ultrasound", "Mammography"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&h=350&fit=crop",
        "institutionName": "Eastern Regional",
    },
    {
        "id": 5,
        "name": "Coastal Heart Institute",
        "location": "Waterfront, Alexandria",
        "type": "Cardiac Specialty",
        "beds": 150,
        "staff": 130,
        "departments": ["Cardiology", "Cardiac Surgery", "Interventional"],
        "modalities": ["CT Angiography", "Echocardiography", "Nuclear"],
        "status": "maintenance",
        "image": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=350&fit=crop",
        "institutionName": "Coastal Heart",
    },
    {
        "id": 6,
        "name": "University Teaching Hospital",
        "location": "University District, Alexandria",
        "type": "Teaching Hospital",
        "beds": 550,
        "staff": 420,
        "departments": ["All Specialties", "Research", "Emergency"],
        "modalities": ["CT", "MRI", "PET-CT", "X-Ray", "Ultrasound", "Nuclear"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=600&h=350&fit=crop",
        "institutionName": "University Hospital",
    },
    {
        "id": 7,
        "name": "Sunrise Diagnostic Center",
        "location": "Sidi Gaber, Alexandria",
        "type": "Diagnostic Center",
        "beds": 80,
        "staff": 90,
        "departments": ["Radiology", "Pathology", "Nuclear Medicine"],
        "modalities": ["CT", "MRI", "PET-CT", "X-Ray"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=350&fit=crop",
        "institutionName": "Sunrise Diagnostic",
    },
    {
        "id": 8,
        "name": "Al-Salam Orthopedic Hospital",
        "location": "Smouha, Alexandria",
        "type": "Orthopedic Specialty",
        "beds": 120,
        "staff": 100,
        "departments": ["Orthopedics", "Physiotherapy", "Spine Surgery"],
        "modalities": ["X-Ray", "MRI", "CT"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&h=350&fit=crop",
        "institutionName": "Al-Salam Orthopedic",
    },
    {
        "id": 9,
        "name": "Nile Eye & ENT Center",
        "location": "Miami, Alexandria",
        "type": "Specialized Center",
        "beds": 60,
        "staff": 75,
        "departments": ["Ophthalmology", "ENT", "Audiology"],
        "modalities": ["Ultrasound", "X-Ray"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&h=350&fit=crop",
        "institutionName": "Nile Eye ENT",
    },
    {
        "id": 10,
        "name": "Cleopatra Women's Hospital",
        "location": "Gleem, Alexandria",
        "type": "Women's Health",
        "beds": 180,
        "staff": 150,
        "departments": ["Obstetrics", "Gynecology", "Neonatology"],
        "modalities": ["Ultrasound", "Mammography", "MRI"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=350&fit=crop",
        "institutionName": "Cleopatra Women",
    },
    {
        "id": 11,
        "name": "Port Said Trauma Center",
        "location": "El-Anfoushy, Alexandria",
        "type": "Trauma Center",
        "beds": 230,
        "staff": 200,
        "departments": ["Trauma Surgery", "Emergency", "Burn Unit"],
        "modalities": ["CT", "X-Ray", "Ultrasound"],
        "status": "maintenance",
        "image": "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=600&h=350&fit=crop",
        "institutionName": "Port Said Trauma",
    },
    {
        "id": 12,
        "name": "Delta Respiratory Institute",
        "location": "Agami, Alexandria",
        "type": "Pulmonary Specialty",
        "beds": 140,
        "staff": 110,
        "departments": ["Pulmonology", "Sleep Medicine", "Allergy"],
        "modalities": ["CT", "X-Ray", "Nuclear"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=350&fit=crop",
        "institutionName": "Delta Respiratory",
    },
    {
        "id": 13,
        "name": "Mediterranean Cancer Center",
        "location": "Stanley, Alexandria",
        "type": "Cancer Specialty",
        "beds": 200,
        "staff": 175,
        "departments": ["Medical Oncology", "Radiation Oncology", "Surgical Oncology"],
        "modalities": ["PET-CT", "MRI", "CT", "Nuclear"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600&h=350&fit=crop",
        "institutionName": "Mediterranean Cancer",
    },
    {
        "id": 14,
        "name": "Alexandria Neurological Institute",
        "location": "Rushdy, Alexandria",
        "type": "Neurological Specialty",
        "beds": 160,
        "staff": 140,
        "departments": ["Neurology", "Neurosurgery", "Neuroradiology"],
        "modalities": ["MRI", "CT", "PET", "Angiography"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&h=350&fit=crop",
        "institutionName": "Neuro Institute",
    },
    {
        "id": 15,
        "name": "Green Crescent Rehabilitation",
        "location": "Montaza, Alexandria",
        "type": "Rehabilitation Center",
        "beds": 100,
        "staff": 85,
        "departments": ["Physical Therapy", "Occupational Therapy", "Speech Therapy"],
        "modalities": ["X-Ray", "Ultrasound"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&h=350&fit=crop",
        "institutionName": "Green Crescent",
    },
    {
        "id": 16,
        "name": "Pharos Surgical Hospital",
        "location": "Camp Caesar, Alexandria",
        "type": "Surgical Specialty",
        "beds": 220,
        "staff": 190,
        "departments": ["General Surgery", "Vascular Surgery", "Plastic Surgery"],
        "modalities": ["CT", "X-Ray", "Ultrasound", "Fluoroscopy"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=350&fit=crop",
        "institutionName": "Pharos Surgical",
    },
    {
        "id": 17,
        "name": "Royal Maternity Hospital",
        "location": "San Stefano, Alexandria",
        "type": "Maternity Hospital",
        "beds": 130,
        "staff": 110,
        "departments": ["Labor & Delivery", "High-Risk Pregnancy", "NICU"],
        "modalities": ["Ultrasound", "Fetal MRI", "Mammography"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1519483691394-c3fbe4dc2e8f?w=600&h=350&fit=crop",
        "institutionName": "Royal Maternity",
    },
    {
        "id": 18,
        "name": "Alexandria Sports Medicine Clinic",
        "location": "Sporting, Alexandria",
        "type": "Sports Medicine",
        "beds": 50,
        "staff": 45,
        "departments": ["Orthopedics", "Sports Rehabilitation", "Sports Nutrition"],
        "modalities": ["MRI", "X-Ray", "Ultrasound"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=350&fit=crop",
        "institutionName": "Sports Medicine",
    },
    {
        "id": 19,
        "name": "Corniche Cardiovascular Center",
        "location": "Corniche, Alexandria",
        "type": "Cardiovascular Specialty",
        "beds": 170,
        "staff": 155,
        "departments": ["Cardiology", "Cardiac Surgery", "Vascular Surgery"],
        "modalities": ["CT Angiography", "Cardiac MRI", "Echocardiography", "Nuclear"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&h=350&fit=crop",
        "institutionName": "Corniche Cardiovascular",
    },
    {
        "id": 20,
        "name": "Al-Madina Polyclinic",
        "location": "Moharam Bey, Alexandria",
        "type": "Polyclinic",
        "beds": 70,
        "staff": 60,
        "departments": ["Family Medicine", "Internal Medicine", "Pediatrics"],
        "modalities": ["X-Ray", "Ultrasound"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=600&h=350&fit=crop",
        "institutionName": "Al-Madina",
    },
    {
        "id": 21,
        "name": "Bibliotheca Medical Complex",
        "location": "Shatby, Alexandria",
        "type": "Medical Complex",
        "beds": 320,
        "staff": 280,
        "departments": ["Multi-Specialty", "Emergency", "Diagnostics"],
        "modalities": ["CT", "MRI", "X-Ray", "Ultrasound", "Mammography"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&h=350&fit=crop",
        "institutionName": "Bibliotheca Medical",
    },
    {
        "id": 22,
        "name": "Abu Qir Military Hospital",
        "location": "Abu Qir, Alexandria",
        "type": "Military Hospital",
        "beds": 400,
        "staff": 350,
        "departments": ["All Specialties", "Military Medicine", "Trauma"],
        "modalities": ["CT", "MRI", "X-Ray", "Ultrasound", "Nuclear"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1519494140681-03682a90037f?w=600&h=350&fit=crop",
        "institutionName": "Abu Qir Military",
    },
    {
        "id": 23,
        "name": "Borg El Arab Diagnostic Center",
        "location": "Borg El Arab, Alexandria",
        "type": "Diagnostic Center",
        "beds": 40,
        "staff": 55,
        "departments": ["Radiology", "Laboratory", "Cardiology"],
        "modalities": ["CT", "MRI", "X-Ray", "Ultrasound"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=350&fit=crop",
        "institutionName": "Borg El Arab Diagnostic",
    },
    {
        "id": 24,
        "name": "Victoria Hospital",
        "location": "Victoria, Alexandria",
        "type": "General Hospital",
        "beds": 260,
        "staff": 220,
        "departments": ["Internal Medicine", "Surgery", "Pediatrics", "Emergency"],
        "modalities": ["CT", "X-Ray", "Ultrasound"],
        "status": "active",
        "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=350&fit=crop",
        "institutionName": "Victoria Hospital",
    },
]


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
# SERIES
# ============================================================================

@app.get("/api/series")
async def search_series(request: Request, webAppService: str = "dcm4chee-arc"):
    """Search for series in specified archive"""
    try:
        archive = get_archive_config(webAppService)

        token = None
        if archive["auth_required"]:
            token = await get_token()

        query_params = clean_query_params(str(request.url.query))

        url = f"{archive['url']}{archive['path']}/series"
        if query_params:
            url += f"?{query_params}"

        print(f"🔍 Searching series in {webAppService}: {url}")

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

@app.get("/health")
async def health_check():
    return {"status": "ok", "archives": list(ARCHIVE_CONFIGS.keys())}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)