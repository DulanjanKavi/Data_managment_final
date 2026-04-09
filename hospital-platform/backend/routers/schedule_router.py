from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth import require_role
from models import WeeklyUpdate, OverrideUpdate

router = APIRouter()


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# ── Get doctor's own schedule ─────────────────────────────
@router.get("/")
async def get_schedule(current_user: dict = Depends(require_role("doctor"))):
    db  = get_db()
    sch = await db.schedules.find_one({"_id": current_user["sub"]})
    if not sch:
        return {"doctorId": current_user["sub"], "weekly": {}, "overrides": {}}
    return _clean(sch)


# ── Replace the whole weekly template ─────────────────────
@router.put("/weekly")
async def update_weekly(
    data: WeeklyUpdate,
    current_user: dict = Depends(require_role("doctor")),
):
    db  = get_db()
    uid = current_user["sub"]
    await db.schedules.update_one(
        {"_id": uid},
        {"$set": {"weekly": data.weekly, "doctorId": uid}},
        upsert=True,
    )
    return {"message": "Weekly schedule updated"}


# ── Add or replace a date override ────────────────────────
@router.put("/override")
async def set_override(
    data: OverrideUpdate,
    current_user: dict = Depends(require_role("doctor")),
):
    db  = get_db()
    uid = current_user["sub"]
    await db.schedules.update_one(
        {"_id": uid},
        {"$set": {f"overrides.{data.date}": data.slots, "doctorId": uid}},
        upsert=True,
    )
    return {"message": f"Override set for {data.date}"}


# ── Remove a date override ─────────────────────────────────
@router.delete("/override/{date}")
async def delete_override(
    date: str,
    current_user: dict = Depends(require_role("doctor")),
):
    db  = get_db()
    uid = current_user["sub"]
    await db.schedules.update_one(
        {"_id": uid},
        {"$unset": {f"overrides.{date}": ""}},
    )
    return {"message": f"Override removed for {date}"}
