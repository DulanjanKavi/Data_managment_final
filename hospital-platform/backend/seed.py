"""
Run once to populate demo data:
    python seed.py
"""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME     = os.getenv("DB_NAME", "cnh_hospital")


def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


DOCTORS = [
    {
        "_id": "doc-001",
        "resourceType": "Practitioner",
        "identifier": [{"system": "urn:lk:health:slmc", "value": "SLMC-12345"}],
        "name": [{"given": ["Priya"], "family": "Wickramasinghe", "prefix": ["Dr."], "text": "Priya Wickramasinghe"}],
        "specialty": "Cardiology",
        "email": "dr.priya@cnhospital.lk",
        "password": hash_pw("doctor123"),
        "phone": "+94771234567",
        "qualification": "MBBS, MD (Cardiology)",
        "active": True,
        "gender": "female",
        "hospitalId": "cnh-001",
    },
    {
        "_id": "doc-002",
        "resourceType": "Practitioner",
        "identifier": [{"system": "urn:lk:health:slmc", "value": "SLMC-67890"}],
        "name": [{"given": ["Ravi"], "family": "Fernando", "prefix": ["Dr."], "text": "Ravi Fernando"}],
        "specialty": "General Medicine",
        "email": "dr.ravi@cnhospital.lk",
        "password": hash_pw("doctor123"),
        "phone": "+94779876543",
        "qualification": "MBBS, MRCP",
        "active": True,
        "gender": "male",
        "hospitalId": "cnh-001",
    },
    {
        "_id": "doc-003",
        "resourceType": "Practitioner",
        "identifier": [{"system": "urn:lk:health:slmc", "value": "SLMC-11111"}],
        "name": [{"given": ["Nimal"], "family": "Perera", "prefix": ["Dr."], "text": "Nimal Perera"}],
        "specialty": "Pediatrics",
        "email": "dr.nimal@cnhospital.lk",
        "password": hash_pw("doctor123"),
        "phone": "+94775556666",
        "qualification": "MBBS, DCH",
        "active": True,
        "gender": "male",
        "hospitalId": "cnh-001",
    },
]

SCHEDULES = [
    {
        "_id": "doc-001",
        "doctorId": "doc-001",
        "weekly": {
            "Monday":    ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30"],
            "Tuesday":   ["09:00", "09:30", "10:00"],
            "Wednesday": [],
            "Thursday":  ["14:00", "14:30", "15:00", "15:30"],
            "Friday":    ["09:00", "09:30", "10:00", "10:30"],
            "Saturday":  ["09:00", "09:30"],
            "Sunday":    [],
        },
        "overrides": {},
    },
    {
        "_id": "doc-002",
        "doctorId": "doc-002",
        "weekly": {
            "Monday":    ["08:00", "08:30", "09:00", "09:30", "10:00"],
            "Tuesday":   ["08:00", "08:30", "09:00"],
            "Wednesday": ["14:00", "14:30", "15:00"],
            "Thursday":  ["08:00", "08:30", "09:00", "09:30"],
            "Friday":    ["14:00", "14:30", "15:00", "15:30", "16:00"],
            "Saturday":  [],
            "Sunday":    [],
        },
        "overrides": {},
    },
    {
        "_id": "doc-003",
        "doctorId": "doc-003",
        "weekly": {
            "Monday":    ["10:00", "10:30", "11:00"],
            "Tuesday":   ["10:00", "10:30", "11:00", "11:30"],
            "Wednesday": ["10:00", "10:30"],
            "Thursday":  ["10:00", "10:30", "11:00"],
            "Friday":    ["10:00", "10:30"],
            "Saturday":  ["09:00", "09:30", "10:00"],
            "Sunday":    [],
        },
        "overrides": {},
    },
]

DEMO_PATIENT = {
    "_id": "pat-demo",
    "resourceType": "Patient",
    "identifier": [{"system": "urn:lk:health:nic", "value": "199012345678V"}],
    "name": [{"text": "Amara Silva", "given": ["Amara"], "family": "Silva"}],
    "email": "patient@demo.lk",
    "password": hash_pw("pass123"),
    "telecom": [{"system": "phone", "value": "+94771234567"}],
    "birthDate": "1990-05-14",
    "gender": "female",
    "registeredAt": "2024-01-15T00:00:00Z",
}


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    print("\n🏥  Seeding Colombo National Hospital database...")
    print("─────────────────────────────────────────────────")

    # Practitioners
    for doc in DOCTORS:
        existing = await db.practitioners.find_one({"_id": doc["_id"]})
        if not existing:
            await db.practitioners.insert_one(doc)
            print(f"  ✅ Doctor seeded    : {doc['name'][0]['text']}")
        else:
            print(f"  ⏭  Doctor exists   : {doc['name'][0]['text']}")

    # Schedules
    for sch in SCHEDULES:
        existing = await db.schedules.find_one({"_id": sch["_id"]})
        if not existing:
            await db.schedules.insert_one(sch)
            print(f"  ✅ Schedule seeded  : {sch['doctorId']}")
        else:
            print(f"  ⏭  Schedule exists : {sch['doctorId']}")

    # Demo patient
    existing = await db.patients.find_one({"_id": DEMO_PATIENT["_id"]})
    if not existing:
        await db.patients.insert_one(DEMO_PATIENT)
        print(f"  ✅ Patient seeded   : patient@demo.lk")
    else:
        print(f"  ⏭  Patient exists  : patient@demo.lk")

    client.close()

    print("\n🎉  Seed complete!")
    print("─────────────────────────────────────────────────")
    print("  Demo credentials:")
    print("  Patient : patient@demo.lk          / pass123")
    print("  Doctor  : dr.priya@cnhospital.lk   / doctor123")
    print("  Doctor  : dr.ravi@cnhospital.lk    / doctor123")
    print("  Doctor  : dr.nimal@cnhospital.lk   / doctor123")
    print("  Admin   : admin@cnhospital.lk       / admin123")
    print("─────────────────────────────────────────────────\n")


if __name__ == "__main__":
    asyncio.run(seed())