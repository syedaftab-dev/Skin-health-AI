import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL") or "mongodb://localhost:27017"
DB_NAME = os.getenv("DB_NAME", "skinai")

client: MongoClient = None
db = None


def get_db():
    global client, db
    if db is None:
        try:
            # Handle MongoDB Atlas SRV URI cleanly without conflicting SSL flags
            if MONGODB_URI.startswith("mongodb+srv://"):
                client = MongoClient(
                    MONGODB_URI,
                    tlsCAFile=certifi.where(),
                    maxPoolSize=25,
                    minPoolSize=1,
                    serverSelectionTimeoutMS=8000,
                    connectTimeoutMS=8000,
                )
            else:
                client = MongoClient(
                    MONGODB_URI,
                    maxPoolSize=25,
                    minPoolSize=1,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000,
                )
            db = client[DB_NAME]
            print(f"Connected to MongoDB: {DB_NAME}")
        except Exception as e:
            print(f"Warning: Primary MongoDB connection failed: {e}")
            try:
                client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
                db = client[DB_NAME]
            except Exception as ex:
                print(f"Fallback connection also failed: {ex}")
                raise
    return db


def init_indexes():
    """Create indexes safely without raising unhandled errors."""
    try:
        database = get_db()
        database.users.create_index("email", unique=True)
        database.doctors.create_index("user_id", unique=True)
        database.doctors.create_index("clinic_pincode")
        database.doctors.create_index([("clinic_latitude", 1), ("clinic_longitude", 1)])
        database.patients.create_index("user_id", unique=True)
        database.predictions.create_index("patient_id")
        database.predictions.create_index("created_at")
        database.appointments.create_index("patient_id")
        database.appointments.create_index("doctor_id")
        database.appointments.create_index("appointment_date")
        database.doctor_availability.create_index("doctor_id")
        database.blocked_slots.create_index("doctor_id")
        database.consultations.create_index("appointment_id", unique=True)
        print("MongoDB indexes initialized successfully.")
    except Exception as e:
        print(f"Notice during index creation (non-fatal): {e}")


def connect_db():
    return get_db()


def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")
