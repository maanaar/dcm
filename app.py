from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional, Dict, List
from urllib.parse import parse_qs, urlencode

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "https://172.16.16.221:8843")
DCM4CHEE_URL = os.getenv("DCM4CHEE_URL", "http://172.16.16.221:8080")
USERNAME     = os.getenv("DCM4CHEE_USERNAME", "root")
PASSWORD     = os.getenv("DCM4CHEE_PASSWORD", "changeit")

client = httpx.AsyncClient(verify=False)

DEFAULT_WEBAPP = os.getenv("DEFAULT_WEBAPP", "DCM4CHEE")

def get_webapp_path(webapp: str) -> str:
    return f"/dcm4chee-arc/aets/{webapp}/rs"

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

def clean_query_params(query_string: str) -> str:
    if not query_string:
        return ""
    params = parse_qs(query_string)
    params.pop('webAppService', None)
    return urlencode(params, doseq=True)

def _gv(obj: dict, tag: str, idx: int = 0):
    vals = obj.get(tag, {}).get("Value", [])
    return vals[idx] if idx < len(vals) else ""

def _fmt_date(raw: str) -> str:
    if raw and len(raw) == 8:
        return f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
    return raw or ""

# ============================================================================
# HOSPITALS — built by grouping series by InstitutionName (series-level attribute)
# ============================================================================

async def _fetch_all_series(token: str, dcm_path: str) -> list:
    """
    Paginate through ALL series to collect InstitutionName data.
    Uses offset/limit to avoid the server-side cap.
    """
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
    fields = (
        "&includefield=00080080"   # InstitutionName
        ",00080081"                # InstitutionAddress
        ",00081040"                # InstitutionalDepartmentName
        ",00080060"                # Modality
        ",0020000D"                # StudyInstanceUID
        ",00100020"                # PatientID
        ",00080021"                # SeriesDate
        ",00080031"                # SeriesTime
    )
    all_series = []
    limit = 1000
    offset = 0
    while True:
        resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/series?limit={limit}&offset={offset}{fields}",
            headers=headers,
        )
        if resp.status_code in (204, 404):
            break
        if resp.status_code != 200:
            break
        page = resp.json() or []
        all_series.extend(page)
        if len(page) < limit:
            break
        offset += limit
    return all_series


async def _fetch_all_studies_sup(token: str, dcm_path: str) -> list:
    """
    Paginate through ALL studies to supplement series-based institution data.
    Only fetches the tags needed for institution grouping.
    """
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
    fields = "&includefield=00080080,00080081,00081040,00080061,0020000D,00100020,00080020"
    all_studies = []
    limit = 1000
    offset = 0
    while True:
        resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/studies?limit={limit}&offset={offset}{fields}",
            headers=headers,
        )
        if resp.status_code in (204, 404):
            break
        if resp.status_code != 200:
            break
        page = resp.json() or []
        all_studies.extend(page)
        if len(page) < limit:
            break
        offset += limit
    return all_studies


def _build_institutions_from_series(series_list: list, studies_list: list = None) -> List[dict]:
    """
    Group by InstitutionName using series as primary source, studies as supplemental.
    Studies fill in institutions whose series lack the tag or weren't returned due to limit.
    """
    buckets: Dict[str, dict] = {}

    def _ensure_bucket(inst_name: str, address: str) -> dict:
        if inst_name not in buckets:
            buckets[inst_name] = {
                "address":     address,
                "study_uids":  set(),
                "patient_ids": set(),
                "modalities":  set(),
                "departments": set(),
                "dates":       [],
            }
        return buckets[inst_name]

    # Primary: series-level InstitutionName (most accurate)
    for s in series_list:
        inst_name = (_gv(s, "00080080") or "").strip()
        if not inst_name:
            continue
        b = _ensure_bucket(inst_name, _gv(s, "00080081") or "")
        uid = _gv(s, "0020000D");  uid and b["study_uids"].add(uid)
        pid = _gv(s, "00100020");  pid and b["patient_ids"].add(pid)
        mod = _gv(s, "00080060");  mod and b["modalities"].add(mod)
        dept = _gv(s, "00081040"); dept and b["departments"].add(dept)
        d = _gv(s, "00080021");    d and b["dates"].append(d)

    # Supplemental: study-level InstitutionName (catches devices that set it at study level only)
    for study in (studies_list or []):
        inst_name = (_gv(study, "00080080") or "").strip()
        if not inst_name:
            continue
        b = _ensure_bucket(inst_name, _gv(study, "00080081") or "")
        uid = _gv(study, "0020000D");  uid and b["study_uids"].add(uid)
        pid = _gv(study, "00100020");  pid and b["patient_ids"].add(pid)
        for mod in (study.get("00080061", {}).get("Value", []) or []):
            mod and b["modalities"].add(mod)
        dept = _gv(study, "00081040"); dept and b["departments"].add(dept)
        d = _gv(study, "00080020");    d and b["dates"].append(d)

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


@app.get("/api/hospitals")
async def list_hospitals():
    """Return institutions built by grouping series (primary) + studies (supplemental) by InstitutionName."""
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)

        # Primary: series-level InstitutionName (paginated)
        series_list = await _fetch_all_series(token, dcm_path)

        # Supplemental: study-level InstitutionName (paginated)
        studies_sup = await _fetch_all_studies_sup(token, dcm_path)

        institutions = _build_institutions_from_series(series_list, studies_sup)
        print(f"[hospitals] {len(institutions)} institutions from {len(series_list)} series + {len(studies_sup)} studies")
        return institutions
    except Exception as e:
        print(f"[hospitals] Error: {e}")
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
# DASHBOARD
# ============================================================================

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

        # Also enrich with institution breakdown
        series_list = await _fetch_all_series(token, dcm_path)
        institutions = _build_institutions_from_series(series_list)

        stats = await _aggregate_stats(studies_raw, total_patients)
        stats["institutionCount"] = len(institutions)
        return stats

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/hospital/{hospital_id}")
async def get_hospital_dashboard(hospital_id: str):
    """
    Per-hospital dashboard.
    Loads all studies, groups by InstitutionName, then filters to just this hospital.
    """
    try:
        token    = await get_token()
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)

        # Get the institution name for this hospital_id
        hospitals = await list_hospitals()
        institution_name = None
        try:
            hid = int(hospital_id)
            for h in hospitals:
                if h["id"] == hid:
                    institution_name = h.get("institutionName")
                    break
        except (ValueError, TypeError):
            pass

        # Fetch studies — try InstitutionName filter first (study-level tag, may work)
        query = "limit=2000&orderby=-StudyDate&includefield=00080080,00080061,00100020,00080020,00081030,00080050,00201206,00201208"
        if institution_name and institution_name != "Unknown":
            query += f"&InstitutionName={institution_name}"

        studies_resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/studies?{query}",
            headers=headers,
        )
        studies_raw: list = []
        if studies_resp.status_code == 200:
            studies_raw = studies_resp.json() or []

        # If the server-side filter returned nothing, fall back:
        # fetch all studies and filter client-side using series InstitutionName map
        if not studies_raw and institution_name and institution_name != "Unknown":
            all_studies_resp = await client.get(
                f"{DCM4CHEE_URL}{dcm_path}/studies?limit=2000&orderby=-StudyDate"
                "&includefield=00080080,00080061,00100020,00080020,00081030,00080050,00201206,00201208",
                headers=headers,
            )
            all_studies = all_studies_resp.json() if all_studies_resp.status_code == 200 else []
            series_list = await _fetch_all_series(token, dcm_path)
            uid_to_inst = {
                _gv(s, "0020000D"): _gv(s, "00080080") or ""
                for s in series_list
                if _gv(s, "0020000D")
            }

            studies_raw = [
                s for s in all_studies
                if (
                    uid_to_inst.get(_gv(s, "0020000D"), "").lower() == institution_name.lower()
                    or (_gv(s, "00080080") or "").lower() == institution_name.lower()
                )
            ]

        # Count unique patients in this institution's studies
        patient_ids = {_gv(s, "00100020") for s in studies_raw if _gv(s, "00100020")}
        total_patients = len(patient_ids)

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
# DEVICES
# ============================================================================

@app.get("/api/devices")
async def list_devices():
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
# ROUTING / TRANSFORM RULES
# ============================================================================

async def _get_device_config(token: str, device_name: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get(f"{DCM4CHEE_URL}/dcm4chee-arc/devices/{device_name}", headers=headers)
    return resp.json() if resp.status_code == 200 else {}


async def _find_ae_in_devices(token: str, local_ae: str, device_names: list):
    """Return (device_name, config, ae_index) for the device that owns local_ae."""
    headers = {"Authorization": f"Bearer {token}"}
    for name in device_names:
        config = await _get_device_config(token, name)
        for idx, ae in enumerate(config.get("dicomNetworkAE", [])):
            if ae.get("dicomAETitle") == local_ae:
                return name, config, idx
    # Fallback: first device, first AE
    if device_names:
        config = await _get_device_config(token, device_names[0])
        if config.get("dicomNetworkAE"):
            return device_names[0], config, 0
    return None, None, None


@app.post("/api/routing-rules")
async def create_routing_rule(request: Request):
    """Add a dcmForwardRule to the device that owns the given localAETitle."""
    try:
        body = await request.json()
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}

        devices_resp = await client.get(f"{DCM4CHEE_URL}/dcm4chee-arc/devices", headers=headers)
        if devices_resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Could not fetch devices")
        device_names = [
            d["dicomDeviceName"] if isinstance(d, dict) else d
            for d in (devices_resp.json() or [])
        ]

        local_ae = body.get("localAETitle", DEFAULT_WEBAPP)
        dev_name, config, ae_idx = await _find_ae_in_devices(token, local_ae, device_names)
        if dev_name is None:
            raise HTTPException(status_code=404, detail=f"AE '{local_ae}' not found in any device")

        ae = config["dicomNetworkAE"][ae_idx]
        local_ae = ae.get("dicomAETitle", local_ae)
        dcm_ae = ae.setdefault("dcmNetworkAE", {})
        existing = dcm_ae.setdefault("dcmForwardRule", [])

        rule_cn = body.get("cn") or f"forward-rule-{len(existing) + 1}"
        new_rule: Dict = {"cn": rule_cn}

        if body.get("description"):
            new_rule["dicomDescription"] = body["description"]
        src = [s.strip() for s in body.get("sourceAETitle", "").split(",") if s.strip()]
        if src:
            new_rule["dcmForwardRuleSCUAETitle"] = src
        dst = [s.strip() for s in body.get("destAETitle", "").split(",") if s.strip()]
        if dst:
            new_rule["dcmDestinationAETitle"] = dst
        props = [s.strip() for s in body.get("bind", "").split(",") if s.strip()]
        if props:
            new_rule["dcmProperty"] = props
        try:
            if body.get("priority") not in (None, ""):
                new_rule["dcmRulePriority"] = int(body["priority"])
        except (ValueError, TypeError):
            pass

        existing.append(new_rule)

        put_resp = await client.put(
            f"{DCM4CHEE_URL}/dcm4chee-arc/devices/{dev_name}",
            json=config,
            headers={**headers, "Content-Type": "application/json"},
        )
        if put_resp.status_code not in (200, 204):
            raise HTTPException(status_code=put_resp.status_code, detail=put_resp.text)

        return {"success": True, "cn": rule_cn, "localAETitle": local_ae, "device": dev_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/transform-rules")
async def create_transform_rule(request: Request):
    """Add a dcmCoercionRule to the device that owns the given localAETitle."""
    try:
        body = await request.json()
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}

        devices_resp = await client.get(f"{DCM4CHEE_URL}/dcm4chee-arc/devices", headers=headers)
        if devices_resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Could not fetch devices")
        device_names = [
            d["dicomDeviceName"] if isinstance(d, dict) else d
            for d in (devices_resp.json() or [])
        ]

        local_ae = body.get("localAETitle", DEFAULT_WEBAPP)
        dev_name, config, ae_idx = await _find_ae_in_devices(token, local_ae, device_names)
        if dev_name is None:
            raise HTTPException(status_code=404, detail=f"AE '{local_ae}' not found in any device")

        ae = config["dicomNetworkAE"][ae_idx]
        local_ae = ae.get("dicomAETitle", local_ae)
        dcm_ae = ae.setdefault("dcmNetworkAE", {})
        existing = dcm_ae.setdefault("dcmCoercionRule", [])

        rule_cn = body.get("cn") or f"coercion-rule-{len(existing) + 1}"
        new_rule: Dict = {"cn": rule_cn}

        if body.get("description"):
            new_rule["dicomDescription"] = body["description"]
        if body.get("sourceAE"):
            new_rule["dcmCoercionAETitlePattern"] = body["sourceAE"]
        if body.get("target"):
            new_rule["dcmURI"] = body["target"]
        if body.get("gateway"):
            new_rule["dcmCoercionSuffix"] = body["gateway"]
        try:
            if body.get("priority") not in (None, ""):
                new_rule["dcmRulePriority"] = int(body["priority"])
        except (ValueError, TypeError):
            pass

        existing.append(new_rule)

        put_resp = await client.put(
            f"{DCM4CHEE_URL}/dcm4chee-arc/devices/{dev_name}",
            json=config,
            headers={**headers, "Content-Type": "application/json"},
        )
        if put_resp.status_code not in (200, 204):
            raise HTTPException(status_code=put_resp.status_code, detail=put_resp.text)

        return {"success": True, "cn": rule_cn, "localAETitle": local_ae, "device": dev_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/routing-rules")
async def list_routing_rules():
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}
        devices_resp = await client.get(f"{DCM4CHEE_URL}/dcm4chee-arc/devices", headers=headers)
        if devices_resp.status_code != 200:
            return []
        device_names = [
            d["dicomDeviceName"] if isinstance(d, dict) else d
            for d in (devices_resp.json() or [])
        ]
        rules = []
        for name in device_names:
            config = await _get_device_config(token, name)
            for ae in config.get("dicomNetworkAE", []):
                local_ae = ae.get("dicomAETitle", "")
                for rule in ae.get("dcmNetworkAE", {}).get("dcmForwardRule", []):
                    rules.append({
                        "cn":            rule.get("cn", ""),
                        "description":   rule.get("dicomDescription", ""),
                        "sourceAETitle": rule.get("dcmForwardRuleSCUAETitle", []),
                        "localAETitle":  local_ae,
                        "destAETitle":   rule.get("dcmDestinationAETitle", []),
                        "bind":          rule.get("dcmProperty", []),
                        "priority":      rule.get("dcmRulePriority", 0),
                        "status":        "active",
                    })
        return rules
    except Exception as e:
        print(f"Error fetching routing rules: {e}")
        return []


@app.get("/api/transform-rules")
async def list_transform_rules():
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}
        devices_resp = await client.get(f"{DCM4CHEE_URL}/dcm4chee-arc/devices", headers=headers)
        if devices_resp.status_code != 200:
            return []
        device_names = [
            d["dicomDeviceName"] if isinstance(d, dict) else d
            for d in (devices_resp.json() or [])
        ]
        rules = []
        for name in device_names:
            config = await _get_device_config(token, name)
            for ae in config.get("dicomNetworkAE", []):
                local_ae = ae.get("dicomAETitle", "")
                for rule in ae.get("dcmNetworkAE", {}).get("dcmCoercionRule", []):
                    rules.append({
                        "cn":           rule.get("cn", ""),
                        "description":  rule.get("dicomDescription", ""),
                        "localAETitle": local_ae,
                        "sourceAE":     rule.get("dcmCoercionAETitlePattern", ""),
                        "target":       rule.get("dcmURI", ""),
                        "gateway":      rule.get("dcmCoercionSuffix", ""),
                        "priority":     rule.get("dcmRulePriority", 0),
                        "status":       "active",
                    })
        return rules
    except Exception as e:
        print(f"Error fetching transform rules: {e}")
        return []


# ============================================================================
# WEB APPS / AES / HL7
# ============================================================================

@app.get("/api/webapps")
async def list_webapps():
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


@app.get("/api/aes")
async def list_application_entities():
    try:
        token = await get_token()
        response = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/aes",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/aes/{aet}")
async def get_application_entity(aet: str):
    try:
        token = await get_token()
        response = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/aes/{aet}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/hl7apps")
async def list_hl7_applications():
    try:
        token = await get_token()
        response = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/hl7apps",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/hl7apps/{hl7_app_name}")
async def get_hl7_application(hl7_app_name: str):
    try:
        token = await get_token()
        response = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/hl7apps/{hl7_app_name}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODALITIES
# ============================================================================

@app.get("/api/modalities")
async def list_modalities():
    try:
        token = await get_token()
        response = await client.get(
            f"{DCM4CHEE_URL}/dcm4chee-arc/modalities",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching modalities: {e}")
        return []


# ============================================================================
# DEBUG
# ============================================================================

@app.get("/api/debug/institutions")
async def debug_institutions():
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}

        studies_resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/studies?limit=50&includefield=00080080",
            headers=headers,
        )
        studies_data = studies_resp.json() if studies_resp.status_code == 200 else []
        study_names = list({
            s.get("00080080", {}).get("Value", [""])[0]
            for s in studies_data
            if s.get("00080080", {}).get("Value")
        })

        series_resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/series?limit=50&includefield=00080080",
            headers=headers,
        )
        series_data = series_resp.json() if series_resp.status_code == 200 else []
        series_names = list({
            s.get("00080080", {}).get("Value", [""])[0]
            for s in series_data
            if s.get("00080080", {}).get("Value")
        })

        return {
            "studies_status": studies_resp.status_code,
            "study_count": len(studies_data),
            "institution_names_in_studies": study_names,
            "series_status": series_resp.status_code,
            "series_count": len(series_data),
            "institution_names_in_series": series_names,
        }
    except Exception as e:
        return {"error": str(e)}


# ============================================================================
# HEALTH
# ============================================================================

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dcm4chee-arc"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)