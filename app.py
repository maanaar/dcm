from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import os
import sqlite3
import uuid
import hashlib
import json
from typing import Optional, Dict, List

# ── shared state (config, httpx client, DICOM helpers) ───────────────────────
from app_state import (
    DCM4CHEE_URL, DEFAULT_WEBAPP, client,
    get_token, get_webapp_path, clean_query_params, _gv, _fmt_date,
    _fetch_all_series, fetch_hospitals_cached,
)

# ── routers ───────────────────────────────────────────────────────────────────
from routers.smart_search import router as smart_search_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(smart_search_router, prefix="/api")

# ============================================================================
# HOSPITALS
# ============================================================================

@app.get("/api/hospitals")
async def list_hospitals():
    """Return institutions (cached 5 min)."""
    return await fetch_hospitals_cached()


@app.get("/api/hospitals/{hospital_id}")
async def get_hospital(hospital_id: int):
    hospitals = await fetch_hospitals_cached()
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
        headers = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}

        # If caller already specified a limit, honour it (single request)
        parsed = parse_qs(query_params)
        if "limit" in parsed:
            url = f"{DCM4CHEE_URL}{dcm_path}/patients"
            if query_params:
                url += f"?{query_params}"
            response = await client.get(url, headers=headers)
            if response.status_code == 204:
                return []
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()

        # No limit specified — paginate to retrieve all patients
        base_params = f"?{query_params}&" if query_params else "?"
        page_size = 1000
        all_patients: list = []
        offset = 0
        while True:
            url = f"{DCM4CHEE_URL}{dcm_path}/patients{base_params}limit={page_size}&offset={offset}"
            response = await client.get(url, headers=headers)
            if response.status_code == 204:
                break
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            page = response.json() or []
            all_patients.extend(page)
            if len(page) < page_size:
                break
            offset += page_size
        return all_patients
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
        token    = await get_token()
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}
        dcm_path = get_webapp_path(DEFAULT_WEBAPP)

        # Fetch recent studies for modality breakdown, series/instance counts, recent-studies widget
        recent_resp = await client.get(
            f"{DCM4CHEE_URL}{dcm_path}/studies?limit=200&orderby=-StudyDate"
            "&includefield=00080061,00100020,00080020,00081030,00080050,00201206,00201208",
            headers=headers,
        )
        recent_raw: list = []
        if recent_resp.status_code == 200:
            recent_raw = recent_resp.json() or []

        # Count unique patients in recent studies as a quick proxy
        total_patients = len({_gv(s, "00100020") for s in recent_raw if _gv(s, "00100020")})

        stats = await _aggregate_stats(recent_raw, total_patients)
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
        if body.get("queueName"):
            new_rule["dcmQueueName"] = body["queueName"]
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
                        "deviceName":    name,
                        "localAETitle":  local_ae,
                        "sourceAETitle": rule.get("dcmForwardRuleSCUAETitle", []),
                        "destAETitle":   rule.get("dcmDestinationAETitle", []),
                        "queueName":     rule.get("dcmQueueName", ""),
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
# EXPORT RULES & EXPORTERS
# ============================================================================

async def _get_all_device_configs(token: str) -> list[tuple[str, dict]]:
    """Return [(device_name, config), ...] for all devices."""
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get(f"{DCM4CHEE_URL}/dcm4chee-arc/devices", headers=headers)
    if resp.status_code != 200:
        return []
    names = [d["dicomDeviceName"] if isinstance(d, dict) else d for d in (resp.json() or [])]
    configs = await asyncio.gather(*[_get_device_config(token, n) for n in names])
    return list(zip(names, configs))


@app.get("/api/exporters")
async def list_exporters():
    try:
        token = await get_token()
        device_configs = await _get_all_device_configs(token)
        result = []
        for name, config in device_configs:
            archive = config.get("dcmDevice", {}).get("dcmArchiveDevice", {})
            for exp in archive.get("dcmExporter", []):
                result.append({
                    "deviceName":  name,
                    "exporterID":  exp.get("dcmExporterID", ""),
                    "aeTitle":     exp.get("dicomAETitle", ""),
                    "uri":         exp.get("dcmURI", ""),
                    "queueName":   exp.get("dcmQueueName", ""),
                    "storageID":   exp.get("dcmExportStorageID", ""),
                    "description": exp.get("dicomDescription", ""),
                    "status":      "active",
                })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/exporters")
async def create_exporter(request: Request):
    try:
        body = await request.json()
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}

        device_configs = await _get_all_device_configs(token)
        target_device = body.get("deviceName") or (device_configs[0][0] if device_configs else None)
        if not target_device:
            raise HTTPException(status_code=400, detail="No device available")

        config = next((c for n, c in device_configs if n == target_device), {})
        archive = config.setdefault("dcmDevice", {}).setdefault("dcmArchiveDevice", {})
        exporters = archive.setdefault("dcmExporter", [])

        new_exp: Dict = {
            "dcmExporterID": body.get("exporterID", ""),
            "dicomAETitle":  body.get("aeTitle", ""),
            "dcmURI":        body.get("uri", ""),
            "dcmQueueName":  body.get("queueName", "Export1"),
        }
        if body.get("storageID"):   new_exp["dcmExportStorageID"] = body["storageID"]
        if body.get("description"): new_exp["dicomDescription"]   = body["description"]
        exporters.append(new_exp)

        put = await client.put(
            f"{DCM4CHEE_URL}/dcm4chee-arc/devices/{target_device}",
            json=config, headers={**headers, "Content-Type": "application/json"},
        )
        if put.status_code not in (200, 204):
            raise HTTPException(status_code=put.status_code, detail=put.text)
        return {"success": True, "exporterID": new_exp["dcmExporterID"], "device": target_device}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export-rules")
async def list_export_rules():
    try:
        token = await get_token()
        device_configs = await _get_all_device_configs(token)
        result = []
        for name, config in device_configs:
            archive = config.get("dcmDevice", {}).get("dcmArchiveDevice", {})
            for rule in archive.get("dcmExportRule", []):
                result.append({
                    "cn":          rule.get("cn", ""),
                    "description": rule.get("dicomDescription", ""),
                    "deviceName":  name,
                    "exporterID":  rule.get("dcmExporterID", []),
                    "entity":      rule.get("dcmEntity", ""),
                    "property":    rule.get("dcmProperty", []),
                    "schedule":    rule.get("dcmSchedule", []),
                    "priority":    rule.get("dcmRulePriority", 0),
                    "status":      "active",
                })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export-rules")
async def create_export_rule_endpoint(request: Request):
    try:
        body = await request.json()
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}

        device_configs = await _get_all_device_configs(token)
        target_device = body.get("deviceName") or (device_configs[0][0] if device_configs else None)
        if not target_device:
            raise HTTPException(status_code=400, detail="No device available")

        config = next((c for n, c in device_configs if n == target_device), {})
        archive = config.setdefault("dcmDevice", {}).setdefault("dcmArchiveDevice", {})
        rules = archive.setdefault("dcmExportRule", [])

        rule_cn = body.get("cn") or f"export-rule-{len(rules) + 1}"
        new_rule: Dict = {"cn": rule_cn}
        if body.get("description"): new_rule["dicomDescription"] = body["description"]
        if body.get("entity"):      new_rule["dcmEntity"]        = body["entity"]

        exp_ids = [s.strip() for s in body.get("exporterID", "").split(",") if s.strip()]
        if exp_ids: new_rule["dcmExporterID"] = exp_ids

        props = [s.strip() for s in body.get("property", "").split(",") if s.strip()]
        if props: new_rule["dcmProperty"] = props

        try:
            if body.get("priority") not in (None, ""):
                new_rule["dcmRulePriority"] = int(body["priority"])
        except (ValueError, TypeError):
            pass

        rules.append(new_rule)

        put = await client.put(
            f"{DCM4CHEE_URL}/dcm4chee-arc/devices/{target_device}",
            json=config, headers={**headers, "Content-Type": "application/json"},
        )
        if put.status_code not in (200, 204):
            raise HTTPException(status_code=put.status_code, detail=put.text)
        return {"success": True, "cn": rule_cn, "device": target_device}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/export-rules/{rule_cn}")
async def delete_export_rule(rule_cn: str, deviceName: Optional[str] = None):
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}
        device_configs = await _get_all_device_configs(token)

        for name, config in device_configs:
            if deviceName and name != deviceName:
                continue
            archive = config.get("dcmDevice", {}).get("dcmArchiveDevice", {})
            rules = archive.get("dcmExportRule", [])
            new_rules = [r for r in rules if r.get("cn") != rule_cn]
            if len(new_rules) == len(rules):
                continue
            archive["dcmExportRule"] = new_rules
            put = await client.put(
                f"{DCM4CHEE_URL}/dcm4chee-arc/devices/{name}",
                json=config, headers={**headers, "Content-Type": "application/json"},
            )
            if put.status_code not in (200, 204):
                raise HTTPException(status_code=put.status_code, detail=put.text)
            return {"success": True, "cn": rule_cn, "device": name}

        raise HTTPException(status_code=404, detail=f"Export rule '{rule_cn}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export-tasks")
async def list_export_tasks():
    """Return aggregate export task counts by status from dcm4chee monitoring API."""
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}
        statuses = ["SCHEDULED", "IN PROCESS", "COMPLETED", "WARNING", "FAILED", "CANCELED"]

        async def get_count(status: str) -> int:
            try:
                resp = await client.get(
                    f"{DCM4CHEE_URL}/dcm4chee-arc/monitor/export/count",
                    params={"status": status},
                    headers=headers,
                    timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("count", 0) if isinstance(data, dict) else int(data)
            except Exception:
                pass
            return 0

        counts = await asyncio.gather(*[get_count(s) for s in statuses])
        return {s: c for s, c in zip(statuses, counts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# USER MANAGEMENT  (Curalink internal SQLite database)
# ============================================================================

DB_PATH = os.getenv("CURALINK_DB_PATH", "curalink_users.db")

_ALL_PERM_IDS = [
    "dashboard", "patients", "studies", "devices",
    "app-entities", "hl7-application", "routing-rules", "transform-rules", "export-rules",
]


def _hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def _row_to_user(row) -> dict:
    """Convert a DB row to a user dict. Works with tuple rows or sqlite3.Row."""
    return {
        "id":          row[0],
        "username":    row[1],
        "email":       row[2] if len(row) > 2 else '',
        "firstName":   row[3] if len(row) > 3 else '',
        "lastName":    row[4] if len(row) > 4 else '',
        "isAdmin":     bool(row[6]) if len(row) > 6 else False,
        "enabled":     bool(row[7]) if len(row) > 7 else True,
        "permissions": json.loads(row[8] or "[]") if len(row) > 8 else [],
    }


def _init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS curalink_users (
            id            TEXT PRIMARY KEY,
            username      TEXT UNIQUE NOT NULL,
            email         TEXT DEFAULT '',
            first_name    TEXT DEFAULT '',
            last_name     TEXT DEFAULT '',
            password_hash TEXT NOT NULL,
            is_admin      INTEGER DEFAULT 0,
            enabled       INTEGER DEFAULT 1,
            permissions   TEXT DEFAULT '[]'
        )
    """)
    # Schema migration: add any missing columns from a previous schema version
    existing_cols = {row[1] for row in c.execute("PRAGMA table_info(curalink_users)")}
    for col, definition in [
        ('email',       "TEXT DEFAULT ''"),
        ('first_name',  "TEXT DEFAULT ''"),
        ('last_name',   "TEXT DEFAULT ''"),
        ('is_admin',    "INTEGER DEFAULT 0"),
        ('enabled',     "INTEGER DEFAULT 1"),
        ('permissions', "TEXT DEFAULT '[]'"),
    ]:
        if col not in existing_cols:
            c.execute(f"ALTER TABLE curalink_users ADD COLUMN {col} {definition}")
    # Ensure the default admin account exists
    c.execute("SELECT COUNT(*) FROM curalink_users WHERE username = 'admin'")
    if c.fetchone()[0] == 0:
        c.execute(
            "INSERT INTO curalink_users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), "admin", "admin@hospital.com", "Admin", "User",
             _hash_pw("admin123"), 1, 1, json.dumps(_ALL_PERM_IDS))
        )
    conn.commit()
    conn.close()


_init_db()


@app.post("/api/auth/login")
async def curalink_login(request: Request):
    """Authenticate a Curalink user by email and return their profile + permissions."""
    try:
        body     = await request.json()
        email    = body.get("email", "").strip()
        password = body.get("password", "")
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute("SELECT * FROM curalink_users WHERE email = ? AND enabled = 1", (email,))
        row = c.fetchone()
        conn.close()
        if not row or row[5] != _hash_pw(password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {"success": True, "user": _row_to_user(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users")
async def list_users():
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute("SELECT * FROM curalink_users ORDER BY username")
        rows = c.fetchall()
        conn.close()
        return [_row_to_user(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute("SELECT * FROM curalink_users WHERE id = ?", (user_id,))
        row  = c.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return _row_to_user(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users")
async def create_user(request: Request):
    try:
        body     = await request.json()
        username = body.get("username", "").strip()
        password = body.get("password", "")
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        user_id = str(uuid.uuid4())
        conn    = sqlite3.connect(DB_PATH)
        c       = conn.cursor()
        try:
            c.execute(
                "INSERT INTO curalink_users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (user_id, username,
                 body.get("email", ""),
                 body.get("firstName", ""),
                 body.get("lastName", ""),
                 _hash_pw(password),
                 1 if body.get("isAdmin") else 0,
                 1 if body.get("enabled", True) else 0,
                 json.dumps(body.get("permissions", [])))
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Username '{username}' already exists")
        finally:
            conn.close()
        return {"success": True, "id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/users/{user_id}")
async def update_user(user_id: str, request: Request):
    try:
        body  = await request.json()
        conn  = sqlite3.connect(DB_PATH)
        c     = conn.cursor()
        c.execute("SELECT id FROM curalink_users WHERE id = ?", (user_id,))
        if not c.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        fields: List[str] = []
        values: list      = []
        if "email"       in body: fields.append("email = ?");        values.append(body["email"])
        if "firstName"   in body: fields.append("first_name = ?");   values.append(body["firstName"])
        if "lastName"    in body: fields.append("last_name = ?");    values.append(body["lastName"])
        if "enabled"     in body: fields.append("enabled = ?");      values.append(1 if body["enabled"] else 0)
        if "isAdmin"     in body: fields.append("is_admin = ?");     values.append(1 if body["isAdmin"] else 0)
        if "permissions" in body: fields.append("permissions = ?");  values.append(json.dumps(body["permissions"]))
        if "password"    in body and body["password"]:
            fields.append("password_hash = ?"); values.append(_hash_pw(body["password"]))
        if fields:
            values.append(user_id)
            c.execute(f"UPDATE curalink_users SET {', '.join(fields)} WHERE id = ?", values)
            conn.commit()
        conn.close()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute("DELETE FROM curalink_users WHERE id = ?", (user_id,))
        if c.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        conn.commit()
        conn.close()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/roles")  # kept for backwards compat
async def list_roles():
    return []


# ============================================================================
# HEALTH
# ============================================================================

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dcm4chee-arc"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)