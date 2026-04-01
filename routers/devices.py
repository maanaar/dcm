from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Request

from app_state import CURALINK_URL, client, get_token

router = APIRouter()


# ── Shared helpers ────────────────────────────────────────────────────────────

async def _get_device_config(token: str, device_name: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp    = await client.get(
        f"{CURALINK_URL}/curalink4chee-arc/devices/{device_name}", headers=headers
    )
    return resp.json() if resp.status_code == 200 else {}


async def _all_device_names(token: str) -> list:
    headers = {"Authorization": f"Bearer {token}"}
    resp    = await client.get(f"{CURALINK_URL}/curalink4chee-arc/devices", headers=headers)
    if resp.status_code != 200:
        return []
    return [
        d["dicomDeviceName"] if isinstance(d, dict) else d
        for d in (resp.json() or [])
    ]


async def _find_ae_in_devices(token: str, local_ae: str, device_names: list):
    """Return (device_name, config, ae_index) for the device that owns local_ae."""
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


# ── Devices ───────────────────────────────────────────────────────────────────

@router.get("/devices")
async def list_devices():
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/devices",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/{device_name}")
async def get_device(device_name: str):
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/devices/{device_name}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Routing rules ─────────────────────────────────────────────────────────────

@router.get("/routing-rules")
async def list_routing_rules():
    try:
        token        = await get_token()
        device_names = await _all_device_names(token)
        rules        = []
        for name in device_names:
            config = await _get_device_config(token, name)
            for ae in config.get("dicomNetworkAE", []):
                local_ae = ae.get("dicomAETitle", "")
                for rule in ae.get("curalinkNetworkAE", {}).get("curalinkForwardRule", []):
                    rules.append({
                        "cn":            rule.get("cn", ""),
                        "description":   rule.get("dicomDescription", ""),
                        "deviceName":    name,
                        "localAETitle":  local_ae,
                        "sourceAETitle": rule.get("curalinkForwardRuleSCUAETitle", []),
                        "destAETitle":   rule.get("curalinkDestinationAETitle", []),
                        "queueName":     rule.get("curalinkQueueName", ""),
                        "bind":          rule.get("curalinkProperty", []),
                        "priority":      rule.get("curalinkRulePriority", 0),
                        "status":        "active",
                    })
        return rules
    except Exception as e:
        print(f"Error fetching routing rules: {e}")
        return []


@router.post("/routing-rules")
async def create_routing_rule(request: Request):
    try:
        body         = await request.json()
        token        = await get_token()
        headers      = {"Authorization": f"Bearer {token}"}
        device_names = await _all_device_names(token)
        if not device_names:
            raise HTTPException(status_code=500, detail="Could not fetch devices")

        local_ae                    = body.get("localAETitle", "CURALINK")
        dev_name, config, ae_idx    = await _find_ae_in_devices(token, local_ae, device_names)
        if dev_name is None:
            raise HTTPException(status_code=404, detail=f"AE '{local_ae}' not found in any device")

        ae       = config["dicomNetworkAE"][ae_idx]
        local_ae = ae.get("dicomAETitle", local_ae)
        existing = ae.setdefault("curalinkNetworkAE", {}).setdefault("curalinkForwardRule", [])

        rule_cn  = body.get("cn") or f"forward-rule-{len(existing) + 1}"
        new_rule: Dict = {"cn": rule_cn}
        if body.get("description"):
            new_rule["dicomDescription"] = body["description"]
        src = [s.strip() for s in body.get("sourceAETitle", "").split(",") if s.strip()]
        if src: new_rule["curalinkForwardRuleSCUAETitle"] = src
        dst = [s.strip() for s in body.get("destAETitle", "").split(",") if s.strip()]
        if dst: new_rule["curalinkDestinationAETitle"] = dst
        props = [s.strip() for s in body.get("bind", "").split(",") if s.strip()]
        if props: new_rule["curalinkProperty"] = props
        if body.get("queueName"): new_rule["curalinkQueueName"] = body["queueName"]
        try:
            if body.get("priority") not in (None, ""):
                new_rule["curalinkRulePriority"] = int(body["priority"])
        except (ValueError, TypeError):
            pass

        existing.append(new_rule)
        put = await client.put(
            f"{CURALINK_URL}/curalink4chee-arc/devices/{dev_name}",
            json=config, headers={**headers, "Content-Type": "application/json"},
        )
        if put.status_code not in (200, 204):
            raise HTTPException(status_code=put.status_code, detail=put.text)
        return {"success": True, "cn": rule_cn, "localAETitle": local_ae, "device": dev_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Transform rules ───────────────────────────────────────────────────────────

@router.get("/transform-rules")
async def list_transform_rules():
    try:
        token        = await get_token()
        device_names = await _all_device_names(token)
        rules        = []
        for name in device_names:
            config = await _get_device_config(token, name)
            for ae in config.get("dicomNetworkAE", []):
                local_ae = ae.get("dicomAETitle", "")
                for rule in ae.get("curalinkNetworkAE", {}).get("curalinkCoercionRule", []):
                    rules.append({
                        "cn":           rule.get("cn", ""),
                        "description":  rule.get("dicomDescription", ""),
                        "localAETitle": local_ae,
                        "sourceAE":     rule.get("curalinkCoercionAETitlePattern", ""),
                        "target":       rule.get("curalinkURI", ""),
                        "gateway":      rule.get("curalinkCoercionSuffix", ""),
                        "priority":     rule.get("curalinkRulePriority", 0),
                        "status":       "active",
                    })
        return rules
    except Exception as e:
        print(f"Error fetching transform rules: {e}")
        return []


@router.post("/transform-rules")
async def create_transform_rule(request: Request):
    try:
        body         = await request.json()
        token        = await get_token()
        headers      = {"Authorization": f"Bearer {token}"}
        device_names = await _all_device_names(token)
        if not device_names:
            raise HTTPException(status_code=500, detail="Could not fetch devices")

        local_ae                 = body.get("localAETitle", "CURALINK")
        dev_name, config, ae_idx = await _find_ae_in_devices(token, local_ae, device_names)
        if dev_name is None:
            raise HTTPException(status_code=404, detail=f"AE '{local_ae}' not found in any device")

        ae       = config["dicomNetworkAE"][ae_idx]
        local_ae = ae.get("dicomAETitle", local_ae)
        existing = ae.setdefault("curalinkNetworkAE", {}).setdefault("curalinkCoercionRule", [])

        rule_cn  = body.get("cn") or f"coercion-rule-{len(existing) + 1}"
        new_rule: Dict = {"cn": rule_cn}
        if body.get("description"): new_rule["dicomDescription"]             = body["description"]
        if body.get("sourceAE"):    new_rule["curalinkCoercionAETitlePattern"] = body["sourceAE"]
        if body.get("target"):      new_rule["curalinkURI"]                  = body["target"]
        if body.get("gateway"):     new_rule["curalinkCoercionSuffix"]       = body["gateway"]
        try:
            if body.get("priority") not in (None, ""):
                new_rule["curalinkRulePriority"] = int(body["priority"])
        except (ValueError, TypeError):
            pass

        existing.append(new_rule)
        put = await client.put(
            f"{CURALINK_URL}/curalink4chee-arc/devices/{dev_name}",
            json=config, headers={**headers, "Content-Type": "application/json"},
        )
        if put.status_code not in (200, 204):
            raise HTTPException(status_code=put.status_code, detail=put.text)
        return {"success": True, "cn": rule_cn, "localAETitle": local_ae, "device": dev_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Web Apps / AEs / HL7 / Modalities ────────────────────────────────────────

@router.get("/webapps")
async def list_webapps():
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/webapps?dcmWebServiceClass=QIDO_RS",
            headers={"Authorization": f"Bearer {token}"},
        )
        return response.json() if response.status_code == 200 else []
    except Exception as e:
        print(f"Error fetching webapps: {e}")
        return []


@router.get("/aes")
async def list_application_entities():
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/aets",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/aes/{aet}")
async def get_application_entity(aet: str):
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/aets/{aet}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hl7apps")
async def list_hl7_applications():
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/hl7apps",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hl7apps/{hl7_app_name}")
async def get_hl7_application(hl7_app_name: str):
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/hl7apps/{hl7_app_name}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/modalities")
async def list_modalities():
    try:
        token    = await get_token()
        response = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/modalities",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
        return response.json() if response.status_code == 200 else []
    except Exception as e:
        print(f"Error fetching modalities: {e}")
        return []


# ── Debug ─────────────────────────────────────────────────────────────────────

@router.get("/debug/institutions")
async def debug_institutions():
    try:
        token    = await get_token()
        dcm_path = f"/curalink4chee-arc/aets/CURALINK/rs"
        headers  = {"Authorization": f"Bearer {token}", "Accept": "application/dicom+json"}

        studies_resp = await client.get(
            f"{CURALINK_URL}{dcm_path}/studies?limit=50&includefield=00080080",
            headers=headers,
        )
        studies_data = studies_resp.json() if studies_resp.status_code == 200 else []
        study_names  = list({
            s.get("00080080", {}).get("Value", [""])[0]
            for s in studies_data if s.get("00080080", {}).get("Value")
        })

        series_resp = await client.get(
            f"{CURALINK_URL}{dcm_path}/series?limit=50&includefield=00080080",
            headers=headers,
        )
        series_data = series_resp.json() if series_resp.status_code == 200 else []
        series_names = list({
            s.get("00080080", {}).get("Value", [""])[0]
            for s in series_data if s.get("00080080", {}).get("Value")
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
