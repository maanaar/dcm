from fastapi import APIRouter, HTTPException, Request

from app_state import (
    CURALINK_URL, DEFAULT_WEBAPP, client,
    get_token, get_webapp_path, clean_query_params,
)

router = APIRouter()


@router.get("/series")
async def search_series(request: Request, webAppService: str = DEFAULT_WEBAPP):
    try:
        token        = await get_token()
        query_params = clean_query_params(str(request.url.query))
        dcm_path     = get_webapp_path(webAppService)
        url          = f"{CURALINK_URL}{dcm_path}/series"
        if query_params:
            url += f"?{query_params}"
        headers  = {"Accept": "application/dicom+json", "Authorization": f"Bearer {token}"}
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
