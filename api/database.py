import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "skinai")

# Connection pooling optimization
client: AsyncIOMotorClient = None
db = None

import certifi

async def connect_db():
    global client, db
    if client is None:
        # Create client with connection pooling and SSL CA file for cloud environments
        client = AsyncIOMotorClient(
            MONGODB_URI,
            tlsCAFile=certifi.where(),
            maxPoolSize=50,  # Connection pool size
            minPoolSize=5,   # Minimum connections
            maxIdleTimeMS=30000,  # Close idle connections after 30 seconds
            serverSelectionTimeoutMS=5000,  # Give a bit more time for cloud handshakes
            connectTimeoutMS=5000,
            retryWrites=True,  # Retry failed writes
            w="majority"  # Write concern
        )
        db = client[DB_NAME]
        
        # Create indexes (only once)
        await db.users.create_index("email", unique=True)
        await db.doctors.create_index("user_id", unique=True)
        await db.doctors.create_index("clinic_pincode")
        await db.doctors.create_index([("clinic_latitude", 1), ("clinic_longitude", 1)])
        await db.patients.create_index("user_id", unique=True)
        await db.predictions.create_index("patient_id")
        await db.predictions.create_index("created_at")
        await db.appointments.create_index("patient_id")
        await db.appointments.create_index("doctor_id")
        await db.appointments.create_index("appointment_date")
        await db.doctor_availability.create_index("doctor_id")
        await db.blocked_slots.create_index("doctor_id")
        await db.consultations.create_index("appointment_id", unique=True)
        
        print(f"Connected to MongoDB with connection pooling: {DB_NAME}")
    return db


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_db():
    return db
