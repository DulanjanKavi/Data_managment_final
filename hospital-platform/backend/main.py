from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import connect_db, close_db
from routers.auth_router        import router as auth_router
from routers.doctors_router     import router as doctors_router
from routers.appointments_router import router as appointments_router
from routers.schedule_router    import router as schedule_router
from routers.admin_router       import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Colombo National Hospital API",
    description="HL7 FHIR R4 compliant hospital management system — Sri Lanka",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,         prefix="/api/auth",         tags=["Authentication"])
app.include_router(doctors_router,      prefix="/api/doctors",      tags=["Doctors"])
app.include_router(appointments_router, prefix="/api/appointments",  tags=["Appointments"])
app.include_router(schedule_router,     prefix="/api/schedule",     tags=["Schedule"])
app.include_router(admin_router,        prefix="/api/admin",        tags=["Admin"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "CNH Hospital Platform",
        "version": "1.0.0",
        "fhir":    "R4",
        "status":  "operational",
    }
