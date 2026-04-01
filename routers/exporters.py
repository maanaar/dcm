import asyncio
import io
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app_state import CURALINK_URL, client, get_token

router = APIRouter()


# ── Shared helper ─────────────────────────────────────────────────────────────

async def _get_all_device_configs(token: str) -> List[Tuple[str, dict]]:
    """Return [(device_name, config), ...] for all devices."""
    headers = {"Authorization": f"Bearer {token}"}
    resp    = await client.get(f"{CURALINK_URL}/curalink4chee-arc/devices", headers=headers)
    if resp.status_code != 200:
        return []
    names   = [d["dicomDeviceName"] if isinstance(d, dict) else d for d in (resp.json() or [])]
    headers_list = [{"Authorization": f"Bearer {token}"} for _ in names]

    async def _fetch(name: str) -> dict:
        r = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/devices/{name}",
            headers={"Authorization": f"Bearer {token}"},
        )
        return r.json() if r.status_code == 200 else {}

    configs = await asyncio.gather(*[_fetch(n) for n in names])
    return list(zip(names, configs))


# ── Exporters ─────────────────────────────────────────────────────────────────

@router.get("/exporters")
async def list_exporters():
    try:
        token          = await get_token()
        device_configs = await _get_all_device_configs(token)
        result         = []
        for name, config in device_configs:
            archive = config.get("curalinkDevice", {}).get("curalinkArchiveDevice", {})
            for exp in archive.get("curalinkExporter", []):
                result.append({
                    "deviceName":  name,
                    "exporterID":  exp.get("curalinkExporterID", ""),
                    "aeTitle":     exp.get("dicomAETitle", ""),
                    "uri":         exp.get("curalinkURI", ""),
                    "queueName":   exp.get("curalinkQueueName", ""),
                    "storageID":   exp.get("curalinkExportStorageID", ""),
                    "description": exp.get("dicomDescription", ""),
                    "status":      "active",
                })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/exporters")
async def create_exporter(request: Request):
    try:
        body           = await request.json()
        token          = await get_token()
        headers        = {"Authorization": f"Bearer {token}"}
        device_configs = await _get_all_device_configs(token)
        target_device  = body.get("deviceName") or (device_configs[0][0] if device_configs else None)
        if not target_device:
            raise HTTPException(status_code=400, detail="No device available")

        config  = next((c for n, c in device_configs if n == target_device), {})
        archive = config.setdefault("curalinkDevice", {}).setdefault("curalinkArchiveDevice", {})
        exporters = archive.setdefault("curalinkExporter", [])

        new_exp: Dict = {
            "curalinkExporterID": body.get("exporterID", ""),
            "dicomAETitle":       body.get("aeTitle", ""),
            "curalinkURI":        body.get("uri", ""),
            "curalinkQueueName":  body.get("queueName", "Export1"),
        }
        if body.get("storageID"):   new_exp["curalinkExportStorageID"] = body["storageID"]
        if body.get("description"): new_exp["dicomDescription"]        = body["description"]
        exporters.append(new_exp)

        put = await client.put(
            f"{CURALINK_URL}/curalink4chee-arc/devices/{target_device}",
            json=config, headers={**headers, "Content-Type": "application/json"},
        )
        if put.status_code not in (200, 204):
            raise HTTPException(status_code=put.status_code, detail=put.text)
        return {"success": True, "exporterID": new_exp["curalinkExporterID"], "device": target_device}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/exporters/{exporter_id}")
async def delete_exporter(exporter_id: str, deviceName: Optional[str] = None):
    try:
        token          = await get_token()
        headers        = {"Authorization": f"Bearer {token}"}
        device_configs = await _get_all_device_configs(token)
        for name, config in device_configs:
            if deviceName and name != deviceName:
                continue
            archive      = config.get("curalinkDevice", {}).get("curalinkArchiveDevice", {})
            exporters    = archive.get("curalinkExporter", [])
            new_exporters = [e for e in exporters if e.get("curalinkExporterID") != exporter_id]
            if len(new_exporters) == len(exporters):
                continue
            archive["curalinkExporter"] = new_exporters
            put = await client.put(
                f"{CURALINK_URL}/curalink4chee-arc/devices/{name}",
                json=config, headers={**headers, "Content-Type": "application/json"},
            )
            if put.status_code not in (200, 204):
                raise HTTPException(status_code=put.status_code, detail=put.text)
            return {"success": True, "exporterID": exporter_id, "device": name}
        raise HTTPException(status_code=404, detail=f"Exporter '{exporter_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Export Rules ──────────────────────────────────────────────────────────────

@router.get("/export-rules")
async def list_export_rules():
    try:
        token          = await get_token()
        device_configs = await _get_all_device_configs(token)
        result         = []
        for name, config in device_configs:
            archive = config.get("curalinkDevice", {}).get("curalinkArchiveDevice", {})
            for rule in archive.get("curalinkExportRule", []):
                result.append({
                    "cn":          rule.get("cn", ""),
                    "description": rule.get("dicomDescription", ""),
                    "deviceName":  name,
                    "exporterID":  rule.get("curalinkExporterID", []),
                    "entity":      rule.get("curalinkEntity", ""),
                    "property":    rule.get("curalinkProperty", []),
                    "schedule":    rule.get("curalinkSchedule", []),
                    "priority":    rule.get("curalinkRulePriority", 0),
                    "status":      "active",
                })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-rules")
async def create_export_rule(request: Request):
    try:
        body           = await request.json()
        token          = await get_token()
        headers        = {"Authorization": f"Bearer {token}"}
        device_configs = await _get_all_device_configs(token)
        target_device  = body.get("deviceName") or (device_configs[0][0] if device_configs else None)
        if not target_device:
            raise HTTPException(status_code=400, detail="No device available")

        config  = next((c for n, c in device_configs if n == target_device), {})
        archive = config.setdefault("curalinkDevice", {}).setdefault("curalinkArchiveDevice", {})
        rules   = archive.setdefault("curalinkExportRule", [])

        rule_cn  = body.get("cn") or f"export-rule-{len(rules) + 1}"
        new_rule: Dict = {"cn": rule_cn}
        if body.get("description"): new_rule["dicomDescription"]  = body["description"]
        if body.get("entity"):      new_rule["curalinkEntity"]     = body["entity"]
        exp_ids = [s.strip() for s in body.get("exporterID", "").split(",") if s.strip()]
        if exp_ids: new_rule["curalinkExporterID"] = exp_ids
        props   = [s.strip() for s in body.get("property", "").split(",") if s.strip()]
        if props: new_rule["curalinkProperty"] = props
        try:
            if body.get("priority") not in (None, ""):
                new_rule["curalinkRulePriority"] = int(body["priority"])
        except (ValueError, TypeError):
            pass

        rules.append(new_rule)
        put = await client.put(
            f"{CURALINK_URL}/curalink4chee-arc/devices/{target_device}",
            json=config, headers={**headers, "Content-Type": "application/json"},
        )
        if put.status_code not in (200, 204):
            raise HTTPException(status_code=put.status_code, detail=put.text)
        return {"success": True, "cn": rule_cn, "device": target_device}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/export-rules/{rule_cn}")
async def delete_export_rule(rule_cn: str, deviceName: Optional[str] = None):
    try:
        token          = await get_token()
        headers        = {"Authorization": f"Bearer {token}"}
        device_configs = await _get_all_device_configs(token)
        for name, config in device_configs:
            if deviceName and name != deviceName:
                continue
            archive   = config.get("curalinkDevice", {}).get("curalinkArchiveDevice", {})
            rules     = archive.get("curalinkExportRule", [])
            new_rules = [r for r in rules if r.get("cn") != rule_cn]
            if len(new_rules) == len(rules):
                continue
            archive["curalinkExportRule"] = new_rules
            put = await client.put(
                f"{CURALINK_URL}/curalink4chee-arc/devices/{name}",
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


# ── Export Tasks ──────────────────────────────────────────────────────────────

_TASK_STATUSES = ["SCHEDULED", "IN PROCESS", "COMPLETED", "WARNING", "FAILED", "CANCELED"]


@router.get("/export-tasks")
async def list_export_tasks():
    """Return aggregate export task counts by status."""
    try:
        token   = await get_token()
        headers = {"Authorization": f"Bearer {token}"}

        async def get_count(status: str) -> int:
            try:
                resp = await client.get(
                    f"{CURALINK_URL}/curalink4chee-arc/monitor/export/count",
                    params={"status": status}, headers=headers, timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("count", 0) if isinstance(data, dict) else int(data)
            except Exception:
                pass
            return 0

        counts = await asyncio.gather(*[get_count(s) for s in _TASK_STATUSES])
        return {s: c for s, c in zip(_TASK_STATUSES, counts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export-tasks/list")
async def list_export_task_items(
    exporterID: Optional[str] = None,
    deviceName: Optional[str] = None,
    status: Optional[str] = None,
    studyInstanceUID: Optional[str] = None,
    batchID: Optional[str] = None,
    createdTime: Optional[str] = None,
    updatedTime: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    orderby: Optional[str] = "-updatedTime",
):
    try:
        token   = await get_token()
        params: Dict = {"limit": limit, "offset": offset}
        if exporterID:       params["exporterID"]       = exporterID
        if deviceName:       params["deviceName"]        = deviceName
        if status:           params["status"]            = status
        if studyInstanceUID: params["StudyInstanceUID"]  = studyInstanceUID
        if batchID:          params["batchID"]           = batchID
        if createdTime:      params["createdTime"]       = createdTime
        if updatedTime:      params["updatedTime"]       = updatedTime
        if orderby:          params["orderby"]           = orderby
        resp = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/monitor/export",
            params=params, headers={"Authorization": f"Bearer {token}"}, timeout=15,
        )
        if resp.status_code == 200:
            return resp.json()
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export-tasks/count")
async def count_export_tasks(
    exporterID: Optional[str] = None,
    deviceName: Optional[str] = None,
    status: Optional[str] = None,
    studyInstanceUID: Optional[str] = None,
    batchID: Optional[str] = None,
    createdTime: Optional[str] = None,
    updatedTime: Optional[str] = None,
):
    try:
        token   = await get_token()
        params: Dict = {}
        if exporterID:       params["exporterID"]      = exporterID
        if deviceName:       params["deviceName"]       = deviceName
        if status:           params["status"]           = status
        if studyInstanceUID: params["StudyInstanceUID"] = studyInstanceUID
        if batchID:          params["batchID"]          = batchID
        if createdTime:      params["createdTime"]      = createdTime
        if updatedTime:      params["updatedTime"]      = updatedTime
        resp = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/monitor/export/count",
            params=params, headers={"Authorization": f"Bearer {token}"}, timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            return {"count": data.get("count", 0) if isinstance(data, dict) else int(data)}
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-tasks/cancel")
async def cancel_export_tasks(request: Request):
    try:
        body    = await request.json()
        token   = await get_token()
        params  = {k: v for k, v in body.items() if v}
        resp    = await client.post(
            f"{CURALINK_URL}/curalink4chee-arc/monitor/export/cancel",
            params=params, headers={"Authorization": f"Bearer {token}"}, timeout=15,
        )
        if resp.status_code in (200, 204):
            return {"success": True, "count": resp.json() if resp.text else 0}
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-tasks/reschedule")
async def reschedule_export_tasks(request: Request):
    try:
        body    = await request.json()
        token   = await get_token()
        params  = {k: v for k, v in body.items() if v}
        resp    = await client.post(
            f"{CURALINK_URL}/curalink4chee-arc/monitor/export/reschedule",
            params=params, headers={"Authorization": f"Bearer {token}"}, timeout=15,
        )
        if resp.status_code in (200, 204):
            return {"success": True, "count": resp.json() if resp.text else 0}
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/export-tasks")
async def delete_export_tasks(
    exporterID: Optional[str] = None,
    deviceName: Optional[str] = None,
    status: Optional[str] = None,
    studyInstanceUID: Optional[str] = None,
    batchID: Optional[str] = None,
    createdTime: Optional[str] = None,
    updatedTime: Optional[str] = None,
):
    try:
        token   = await get_token()
        params: Dict = {}
        if exporterID:       params["exporterID"]      = exporterID
        if deviceName:       params["deviceName"]       = deviceName
        if status:           params["status"]           = status
        if studyInstanceUID: params["StudyInstanceUID"] = studyInstanceUID
        if batchID:          params["batchID"]          = batchID
        if createdTime:      params["createdTime"]      = createdTime
        if updatedTime:      params["updatedTime"]      = updatedTime
        resp = await client.delete(
            f"{CURALINK_URL}/curalink4chee-arc/monitor/export",
            params=params, headers={"Authorization": f"Bearer {token}"}, timeout=15,
        )
        if resp.status_code in (200, 204):
            return {"success": True, "count": resp.json() if resp.text else 0}
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export-tasks/csv")
async def download_export_tasks_csv(
    exporterID: Optional[str] = None,
    deviceName: Optional[str] = None,
    status: Optional[str] = None,
    studyInstanceUID: Optional[str] = None,
    batchID: Optional[str] = None,
    createdTime: Optional[str] = None,
    updatedTime: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
):
    try:
        token   = await get_token()
        params: Dict = {"limit": limit, "offset": offset}
        if exporterID:       params["exporterID"]      = exporterID
        if deviceName:       params["deviceName"]       = deviceName
        if status:           params["status"]           = status
        if studyInstanceUID: params["StudyInstanceUID"] = studyInstanceUID
        if batchID:          params["batchID"]          = batchID
        if createdTime:      params["createdTime"]      = createdTime
        if updatedTime:      params["updatedTime"]      = updatedTime
        resp = await client.get(
            f"{CURALINK_URL}/curalink4chee-arc/monitor/export",
            params=params,
            headers={"Authorization": f"Bearer {token}", "Accept": "text/csv"},
            timeout=30,
        )
        if resp.status_code == 200:
            return StreamingResponse(
                io.BytesIO(resp.content),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=export-tasks.csv"},
            )
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
