from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

# ─── Static hospital registry (server-side) ───────────────────────────────────
# In a real deployment replace this with a database query.
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
        "institutionName": "City General",   # matches InstitutionName DICOM tag (00080080)
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
]


async def get_token() -> str:
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


# ============================================================================
# HOSPITALS  ← NEW
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


# ============================================================================
# PATIENTS
# ============================================================================

@app.get("/api/patients")
async def search_patients(request: Request):
    try:
        token = await get_token()
        query_params = str(request.url.query)
        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/patients?{query_params}"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/patients/{patient_id}/studies")
async def get_patient_studies(patient_id: str):
    try:
        token = await get_token()
        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/patients/{patient_id}/studies"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STUDIES
# ============================================================================

@app.get("/api/studies")
async def search_studies(request: Request):
    try:
        token = await get_token()
        query_params = str(request.url.query)
        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies?{query_params}"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MWL
# ============================================================================

@app.get("/api/mwl")
async def search_mwl(request: Request):
    try:
        token = await get_token()
        query_params = str(request.url.query)
        url = (
            f"{DCM4CHEE_URL}"
            "/dcm4chee-arc/aets/DCM4CHEE/rs/mwlitems"
            f"?{query_params}"
        )
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
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
    """
    Per-hospital dashboard.
    Filters studies by InstitutionName matching the hospital registry entry.
    Uses wildcard matching and falls back to network-wide data if empty.
    """
    try:
        token   = await get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/dicom+json"
        }

        # ─────────────────────────────────────────────────────────────
        # 1️⃣ Get InstitutionName from registry
        # ─────────────────────────────────────────────────────────────
        institution_name = None

        try:
            hid = int(hospital_id)
            for h in HOSPITAL_REGISTRY:
                if h["id"] == hid:
                    institution_name = h.get("institutionName")
                    break
        except (ValueError, TypeError):
            pass

        # Debug logs
        print("Hospital ID:", hospital_id)
        print("InstitutionName:", institution_name)

        # ─────────────────────────────────────────────────────────────
        # 2️⃣ Build Studies Query (Wildcard Match)
        # ─────────────────────────────────────────────────────────────
        query = "limit=1000&orderby=-StudyDate"

        if institution_name:
            query += f"&InstitutionName=*{institution_name}*"

        studies_url = (
            f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies?{query}"
        )

        print("Studies Query:", studies_url)

        studies_resp = await client.get(studies_url, headers=headers)

        studies_raw: list = []

        if studies_resp.status_code == 200:
            studies_raw = studies_resp.json() or []
        elif studies_resp.status_code not in (204, 404):
            raise HTTPException(
                status_code=studies_resp.status_code,
                detail=studies_resp.text
            )

        # ─────────────────────────────────────────────────────────────
        # 3️⃣ Patient Count Query
        # ─────────────────────────────────────────────────────────────
        pat_query = "limit=1"

        if institution_name:
            pat_query += f"&InstitutionName=*{institution_name}*"

        patients_url = (
            f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/patients?{pat_query}"
        )

        print("Patients Query:", patients_url)

        patients_resp = await client.get(patients_url, headers=headers)

        total_patients = 0

        if patients_resp.status_code == 200:
            total_patients = int(
                patients_resp.headers.get("X-Total-Count", 0)
                or len(patients_resp.json() or [])
            )

        # ─────────────────────────────────────────────────────────────
        # 4️⃣ Fallback — If No Institution Data Found
        # ─────────────────────────────────────────────────────────────
        if not studies_raw:
            print("⚠️ No studies found for hospital — using fallback data")

            fallback_resp = await client.get(
                f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies"
                "?limit=1000&orderby=-StudyDate",
                headers=headers,
            )

            if fallback_resp.status_code == 200:
                studies_raw = fallback_resp.json() or []

        # ─────────────────────────────────────────────────────────────
        # 5️⃣ Aggregate Stats
        # ─────────────────────────────────────────────────────────────
        return await _aggregate_stats(
            studies_raw,
            total_patients,
            hospital_id=hospital_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH
# ============================================================================

@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)