from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth import hash_password, require_role
from models import DoctorCreate
from datetime import datetime
import uuid

router = APIRouter()


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = doc.pop("_id", None)
    doc.pop("password", None)
    return doc


# ── Dashboard stats ───────────────────────────────────────
@router.get("/stats")
async def stats(current_user: dict = Depends(require_role("admin"))):
    db    = get_db()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return {
        "activeDoctors":    await db.practitioners.count_documents({"active": True}),
        "totalPatients":    await db.patients.count_documents({}),
        "todayAppointments":await db.appointments.count_documents({"date": today, "status": {"$ne": "cancelled"}}),
        "activeBookings":   await db.appointments.count_documents({"status": "booked"}),
        "totalAppointments":await db.appointments.count_documents({}),
        "completedVisits":  await db.appointments.count_documents({"status": "completed"}),
    }


# ── List all doctors ──────────────────────────────────────
@router.get("/doctors")
async def list_doctors(current_user: dict = Depends(require_role("admin"))):
    db = get_db()
    out = []
    async for doc in db.practitioners.find({}):
        out.append(_clean(doc))
    return out


# ── Add a new doctor ──────────────────────────────────────
@router.post("/doctors")
async def add_doctor(
    data: DoctorCreate,
    current_user: dict = Depends(require_role("admin")),
):
    db = get_db()

    if await db.practitioners.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")
    if await db.practitioners.find_one({"identifier.value": data.slmc}):
        raise HTTPException(400, "SLMC number already registered")

    parts  = data.name.strip().split(" ", 1)
    doc_id = f"doc-{uuid.uuid4().hex[:8]}"

    doctor = {
        "_id":          doc_id,
        "resourceType": "Practitioner",
        "identifier":   [{"system": "urn:lk:health:slmc", "value": data.slmc}],
        "name": [{
            "given":  [parts[0]],
            "family": parts[1] if len(parts) > 1 else parts[0],
            "prefix": ["Dr."],
            "text":   data.name,
        }],
        "specialty":     data.specialty,
        "email":         data.email,
        "password":      hash_password(data.password),
        "phone":         data.phone,
        "qualification": data.qualification,
        "active":        True,
        "gender":        data.gender,
        "hospitalId":    "cnh-001",
        "createdAt":     datetime.utcnow().isoformat() + "Z",
    }
    await db.practitioners.insert_one(doctor)

    # Create empty schedule for the new doctor
    await db.schedules.update_one(
        {"_id": doc_id},
        {"$setOnInsert": {
            "_id":      doc_id,
            "doctorId": doc_id,
            "weekly":   {d: [] for d in ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},
            "overrides": {},
        }},
        upsert=True,
    )

    return _clean(doctor)


# ── Toggle doctor active / inactive ──────────────────────
@router.patch("/doctors/{doc_id}/toggle")
async def toggle_doctor(
    doc_id: str,
    current_user: dict = Depends(require_role("admin")),
):
    db  = get_db()
    doc = await db.practitioners.find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(404, "Doctor not found")

    new_status = not doc.get("active", True)
    await db.practitioners.update_one({"_id": doc_id}, {"$set": {"active": new_status}})
    return {"id": doc_id, "active": new_status}


# ── List all patients ─────────────────────────────────────
@router.get("/patients")
async def list_patients(current_user: dict = Depends(require_role("admin"))):
    db = get_db()
    out = []
    async for p in db.patients.find({}):
        out.append(_clean(p))
    return out


# ── List all appointments ─────────────────────────────────
@router.get("/appointments")
async def list_all_appointments(current_user: dict = Depends(require_role("admin"))):
    db = get_db()
    out = []
    async for a in db.appointments.find({}).sort("date", -1):
        out.append(_clean(a))
    return out
