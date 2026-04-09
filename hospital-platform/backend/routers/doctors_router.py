from fastapi import APIRouter, Depends, Query
from database import get_db
from auth import get_current_user
from datetime import date as date_type

router = APIRouter()


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = doc.pop("_id", None)
    doc.pop("password", None)
    return doc


# ── List all active doctors ───────────────────────────────
@router.get("/")
async def list_doctors(current_user: dict = Depends(get_current_user)):
    db = get_db()
    doctors = []
    async for doc in db.practitioners.find({"active": True}):
        doctors.append(_clean(doc))
    return doctors


# ── Get available slots — no auth required ────────────────
@router.get("/{doctor_id}/slots")
async def get_slots(
    doctor_id: str,
    date: str = Query(...),
):
    db = get_db()
    schedule = await db.schedules.find_one({"_id": doctor_id})
    if not schedule:
        return []

    # Get day name safely
    year, month, day = date.split("-")
    d = date_type(int(year), int(month), int(day))
    day_name = d.strftime("%A")

    # Date override takes priority over weekly template
    if date in schedule.get("overrides", {}):
        all_slots = schedule["overrides"][date]
    else:
        all_slots = schedule.get("weekly", {}).get(day_name, [])

    # Remove already booked slots
    booked = set()
    async for appt in db.appointments.find({
        "doctorId": doctor_id,
        "date":     date,
        "status":   {"$ne": "cancelled"},
    }):
        booked.add(appt["time"])

    return [s for s in all_slots if s not in booked]