from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth import get_current_user
from models import AppointmentCreate, AppointmentUpdate
from datetime import datetime
import uuid

router = APIRouter()


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = doc.pop("_id", None)
    return doc


# ── Create appointment (patient only) ────────────────────
@router.post("/")
async def create_appointment(
    data: AppointmentCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "patient":
        raise HTTPException(403, "Only patients can book appointments")

    db = get_db()

    # Check doctor exists and is active
    doctor = await db.practitioners.find_one({"_id": data.doctorId, "active": True})
    if not doctor:
        raise HTTPException(404, "Doctor not found or inactive")

    # Check slot is still available
    schedule = await db.schedules.find_one({"_id": data.doctorId})
    if schedule:
        day_name = datetime.strptime(data.date, "%Y-%m-%d").strftime("%A")
        if data.date in schedule.get("overrides", {}):
            available = schedule["overrides"][data.date]
        else:
            available = schedule.get("weekly", {}).get(day_name, [])

        if data.time not in available:
            raise HTTPException(400, "This time slot is not in the doctor's schedule")

    # Check no existing booking for same slot
    clash = await db.appointments.find_one({
        "doctorId": data.doctorId,
        "date":     data.date,
        "time":     data.time,
        "status":   {"$ne": "cancelled"},
    })
    if clash:
        raise HTTPException(409, "This slot has just been booked. Please choose another.")

    appt_id = f"appt-{uuid.uuid4().hex[:10]}"
    appt = {
        "_id":        appt_id,
        "resourceType": "Appointment",
        "status":     "booked",
        "serviceType": [{
            "coding": [{
                "system":  "http://snomed.info/sct",
                "display": doctor.get("specialty", "General"),
            }]
        }],
        "patientId":  current_user["sub"],
        "doctorId":   data.doctorId,
        "date":       data.date,
        "time":       data.time,
        "reason":     data.reason,
        "createdAt":  datetime.utcnow().isoformat() + "Z",
    }
    await db.appointments.insert_one(appt)
    return _clean(appt)


# ── List appointments (role-filtered) ────────────────────
@router.get("/")
async def list_appointments(current_user: dict = Depends(get_current_user)):
    db  = get_db()
    role = current_user["role"]
    uid  = current_user["sub"]

    query = {}
    if role == "patient":
        query["patientId"] = uid
    elif role == "doctor":
        query["doctorId"] = uid
    # admin gets everything (no filter)

    appts = []
    async for a in db.appointments.find(query).sort("date", -1):
        appts.append(_clean(a))
    return appts


# ── Update appointment status ─────────────────────────────
@router.patch("/{appt_id}")
async def update_appointment(
    appt_id: str,
    data: AppointmentUpdate,
    current_user: dict = Depends(get_current_user),
):
    db   = get_db()
    role = current_user["role"]
    uid  = current_user["sub"]

    appt = await db.appointments.find_one({"_id": appt_id})
    if not appt:
        raise HTTPException(404, "Appointment not found")

    # Permission checks
    if role == "patient":
        if appt["patientId"] != uid:
            raise HTTPException(403, "Not your appointment")
        if data.status != "cancelled":
            raise HTTPException(403, "Patients can only cancel appointments")

    elif role == "doctor":
        if appt["doctorId"] != uid:
            raise HTTPException(403, "Not your appointment")
        if data.status not in ("completed", "confirmed", "cancelled"):
            raise HTTPException(400, "Invalid status")

    await db.appointments.update_one(
        {"_id": appt_id},
        {"$set": {"status": data.status, "updatedAt": datetime.utcnow().isoformat() + "Z"}},
    )
    updated = await db.appointments.find_one({"_id": appt_id})
    return _clean(updated)


    # ── Get patient info for doctor (limited fields) ──────────
@router.get("/patients/mine")
async def get_my_patients(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ("doctor", "admin"):
        raise HTTPException(403, "Not allowed")

    db  = get_db()
    uid = current_user["sub"]

    # Find all unique patient IDs from this doctor's appointments
    patient_ids = set()
    async for appt in db.appointments.find({"doctorId": uid}):
        patient_ids.add(appt["patientId"])

    # Fetch those patients
    patients = []
    for pid in patient_ids:
        pat = await db.patients.find_one({"_id": pid})
        if pat:
            patients.append({
                "id":         pat["_id"],
                "name":       pat.get("name", []),
                "telecom":    pat.get("telecom", []),
                "birthDate":  pat.get("birthDate"),
                "gender":     pat.get("gender"),
                "identifier": pat.get("identifier", []),
            })
    return patients
