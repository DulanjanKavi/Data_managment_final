from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME     = os.getenv("DB_NAME", "cnh_hospital")

_client = None
_db     = None


async def connect_db():
    global _client, _db
    _client = AsyncIOMotorClient(MONGODB_URL)
    _db = _client[DB_NAME]
    # Unique indexes
    await _db.patients.create_index([("email", ASCENDING)], unique=True)
    await _db.practitioners.create_index([("email", ASCENDING)], unique=True)
    await _db.practitioners.create_index([("identifier.value", ASCENDING)], unique=True)
    await _db.appointments.create_index([("patientId", ASCENDING)])
    await _db.appointments.create_index([("doctorId", ASCENDING)])
    await _db.appointments.create_index([("date", ASCENDING)])
    await _db.schedules.create_index([("doctorId", ASCENDING)], unique=True)
    print(f"✅  Connected to MongoDB → {DB_NAME}")


async def close_db():
    global _client
    if _client:
        _client.close()


def get_db():
    return _db
