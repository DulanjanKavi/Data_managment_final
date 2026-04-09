from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from auth import hash_password, verify_password, create_token, get_current_user
from models import LoginRequest, PatientRegister, TokenResponse
from datetime import datetime
import os, uuid

router = APIRouter()


def _clean(doc: dict) -> dict:
    """Remove internal fields before sending to client."""
    doc = dict(doc)
    doc["id"] = doc.pop("_id", None)
    doc.pop("password", None)
    return doc


# ── Register (patients only) ──────────────────────────────
@router.post("/register", response_model=TokenResponse)
async def register(data: PatientRegister):
    db = get_db()

    if await db.patients.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")

    parts = data.name.strip().split(" ", 1)
    patient_id = f"pat-{uuid.uuid4().hex[:8]}"

    patient = {
        "_id": patient_id,
        "resourceType": "Patient",
        "identifier": [{"system": "urn:lk:health:nic", "value": data.nic}],
        "name": [{
            "text":   data.name,
            "given":  [parts[0]],
            "family": parts[1] if len(parts) > 1 else parts[0],
        }],
        "email":       data.email,
        "password":    hash_password(data.password),
        "telecom":     [{"system": "phone", "value": data.phone}] if data.phone else [],
        "birthDate":   data.birthDate,
        "gender":      data.gender,
        "registeredAt": datetime.utcnow().isoformat() + "Z",
    }
    await db.patients.insert_one(patient)

    token = create_token({"sub": patient_id, "role": "patient", "email": data.email})
    return {"access_token": token, "token_type": "bearer",
            "role": "patient", "user_id": patient_id}


# ── Login (all roles) ─────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    db = get_db()

    # ── Admin ──
    if data.role == "admin":
        if (data.email != os.getenv("ADMIN_EMAIL", "admin@cnhospital.lk") or
                data.password != os.getenv("ADMIN_PASSWORD", "admin123")):
            raise HTTPException(401, "Invalid credentials")
        token = create_token({"sub": "admin-001", "role": "admin", "email": data.email})
        return {"access_token": token, "token_type": "bearer",
                "role": "admin", "user_id": "admin-001"}

    # ── Patient ──
    if data.role == "patient":
        user = await db.patients.find_one({"email": data.email})
        if not user or not verify_password(data.password, user["password"]):
            raise HTTPException(401, "Invalid email or password")
        token = create_token({"sub": user["_id"], "role": "patient", "email": data.email})
        return {"access_token": token, "token_type": "bearer",
                "role": "patient", "user_id": user["_id"]}

    # ── Doctor ──
    if data.role == "doctor":
        user = await db.practitioners.find_one({"email": data.email})
        if not user or not verify_password(data.password, user["password"]):
            raise HTTPException(401, "Invalid email or password")
        if not user.get("active", True):
            raise HTTPException(403, "Account is inactive. Contact hospital admin.")
        token = create_token({"sub": user["_id"], "role": "doctor", "email": data.email})
        return {"access_token": token, "token_type": "bearer",
                "role": "doctor", "user_id": user["_id"]}

    raise HTTPException(400, "Invalid role")


# ── Get current user profile ──────────────────────────────
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    role     = current_user["role"]
    user_id  = current_user["sub"]

    if role == "admin":
        return {
            "id":    "admin-001",
            "role":  "admin",
            "name":  [{"text": "Hospital Administration"}],
            "email": current_user["email"],
        }

    col  = "patients" if role == "patient" else "practitioners"
    user = await db[col].find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")

    result = _clean(user)
    result["role"] = role
    return result
