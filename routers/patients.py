from urllib.parse import parse_qs

from fastapi import APIRouter, HTTPException, Request

from app_state import (
    CURALINK_URL, DEFAULT_WEBAPP, client,
    get_token, get_webapp_path, clean_query_params,
)

router = APIRouter()


@router.get("/patients")
async def search_patients(request: Request, webAppService: str = DEFAULT_WEBAPP):
    try:
        token        = await get_token()
        query_params = clean_query_params(str(request.url.query))
        dcm_path     = get_webapp_path(webAppService)
        headers      = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}

        # If caller specified a limit, honour it (single request)
        if "limit" in parse_qs(query_params):
            url = f"{CURALINK_URL}{dcm_path}/patients"
            if query_params:
                url += f"?{query_params}"
            response = await client.get(url, headers=headers)
            if response.status_code == 204:
                return []
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()

        # No limit — paginate to retrieve all
        base_params  = f"?{query_params}&" if query_params else "?"
        page_size    = 1000
        all_patients: list = []
        offset       = 0
        while True:
            url      = f"{CURALINK_URL}{dcm_path}/patients{base_params}limit={page_size}&offset={offset}"
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


@router.get("/patients/{patient_id}/studies")
async def get_patient_studies(patient_id: str, webAppService: str = DEFAULT_WEBAPP):
    try:
        token    = await get_token()
        dcm_path = get_webapp_path(webAppService)
        headers  = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}
        response = await client.get(
            f"{CURALINK_URL}{dcm_path}/patients/{patient_id}/studies",
            headers=headers,
        )
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
