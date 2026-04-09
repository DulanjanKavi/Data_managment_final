from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict


# ── Auth ──────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str                    # patient | doctor | admin


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


# ── Patient ───────────────────────────────────────────────
class PatientRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    nic: str                     # Sri Lanka NIC  e.g. 199012345678V
    phone: Optional[str] = None
    birthDate: Optional[str] = None
    gender: str = "male"


# ── Doctor (admin creates) ────────────────────────────────
class DoctorCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    slmc: str                    # SLMC registration number
    specialty: str
    qualification: Optional[str] = None
    phone: Optional[str] = None
    gender: str = "male"


# ── Appointment ───────────────────────────────────────────
class AppointmentCreate(BaseModel):
    doctorId: str
    date: str                    # YYYY-MM-DD
    time: str                    # HH:MM
    reason: Optional[str] = None


class AppointmentUpdate(BaseModel):
    status: str                  # cancelled | completed | confirmed


# ── Schedule ──────────────────────────────────────────────
class WeeklyUpdate(BaseModel):
    weekly: Dict[str, List[str]] # {"Monday": ["09:00", ...], ...}


class OverrideUpdate(BaseModel):
    date: str                    # YYYY-MM-DD
    slots: List[str]             # [] = fully unavailable that day
