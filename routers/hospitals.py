from fastapi import APIRouter, HTTPException
from app_state import fetch_hospitals_cached

router = APIRouter()


@router.get("/hospitals")
async def list_hospitals():
    return await fetch_hospitals_cached()


@router.get("/hospitals/{hospital_id}")
async def get_hospital(hospital_id: int):
    hospitals = await fetch_hospitals_cached()
    for h in hospitals:
        if h["id"] == hospital_id:
            return h
    raise HTTPException(status_code=404, detail="Hospital not found")
