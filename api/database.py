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
            # Check if URI uses TLS / SRV (like MongoDB Atlas)
            is_cloud = "mongodb+srv://" in MONGODB_URI or "ssl=true" in MONGODB_URI.lower() or "tls=true" in MONGODB_URI.lower()
            if is_cloud:
                client = MongoClient(
                    MONGODB_URI,
                    tls=True,
                    tlsAllowInvalidCertificates=True,
                    tlsCAFile=certifi.where(),
                    maxPoolSize=50,
                    minPoolSize=5,
                    maxIdleTimeMS=30000,
                    serverSelectionTimeoutMS=10000,
                    connectTimeoutMS=10000,
                    retryWrites=True,
                    w="majority",
                )
            else:
                client = MongoClient(
                    MONGODB_URI,
                    maxPoolSize=50,
                    minPoolSize=5,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000,
                )
            db = client[DB_NAME]
            print(f"Connected to MongoDB: {DB_NAME}")
        except Exception as e:
            print(f"Warning: Failed to initialize MongoDB client: {e}")
            # Fallback direct connection
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
            db = client[DB_NAME]
    return db


def init_indexes():
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
    except Exception as e:
        print(f"Warning during index creation: {e}")


def connect_db():
    return get_db()


def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")
