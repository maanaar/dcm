from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    hospitals, patients, studies, dashboard,
    series, devices, exporters, users,
)

app = FastAPI(title="CuraLink API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hospitals.router,     prefix="/api")
app.include_router(patients.router,      prefix="/api")
app.include_router(studies.router,       prefix="/api")
app.include_router(dashboard.router,     prefix="/api")
app.include_router(series.router,        prefix="/api")
app.include_router(devices.router,       prefix="/api")
app.include_router(exporters.router,     prefix="/api")
app.include_router(users.router,         prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "curalink-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
