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
    allow_origins=["http://localhost:5173"],  #Resact app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend URLsa
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "")
DCM4CHEE_URL = os.getenv("DCM4CHEE_URL", "")
USERNAME = os.getenv("DCM4CHEE_USERNAME", "admin")
PASSWORD = os.getenv("DCM4CHEE_PASSWORD", "admin")

# Disable SSL verification for self-signed certificates
client = httpx.AsyncClient(verify=False)

async def get_token() -> str:
    """Get authentication token from Keycloak"""
    url = f"{KEYCLOAK_URL}/realms/dcm4che/protocol/openid-connect/token"
    
    data = {
        "grant_type": "password",
        "client_id": "dcm4chee-arc-ui",
        "username": USERNAME,
        "password": PASSWORD
    }
    
    response = await client.post(url, data=data)
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    return response.json()["access_token"]

@app.get("/api/patients")
async def search_patients(request: Request):
    """Search patients endpoint"""
    try:
        token = await get_token()
        
        # Forward query params
        query_params = str(request.url.query)
        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/patients?{query_params}"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/dicom+json"
        }
        
        response = await client.get(url, headers=headers)
        
        # Handle 204 No Content
        if response.status_code == 204:
            return []
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/studies")
async def search_studies(request: Request):
    """Search studies endpoint"""
    try:
        token = await get_token()
        
        query_params = str(request.url.query)
        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies?{query_params}"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/dicom+json"
        }
        
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
    """Get studies for specific patient"""
    try:
        token = await get_token()
        
        url = f"{DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/patients/{patient_id}/studies"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/dicom+json"
        }
        
        response = await client.get(url, headers=headers)
        
        if response.status_code == 204:
            return []
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)