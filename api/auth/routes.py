from fastapi import APIRouter, HTTPException, status
from api.database import get_db
from api.auth.jwt import hash_password, verify_password, create_access_token
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class PatientRegister(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    date_of_birth: Optional[str] = None
    default_city: Optional[str] = None
    default_location_pincode: Optional[str] = None


class DoctorRegister(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    license_number: str
    specialization: str
    experience_years: int
    consultation_fee: float = 0
    clinic_name: str
    clinic_address: str
    clinic_pincode: str
    clinic_latitude: Optional[float] = None
    clinic_longitude: Optional[float] = None
    bio: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register/patient", response_model=TokenResponse)
async def register_patient(data: PatientRegister):
    db = get_db()

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": data.email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "phone": data.phone,
        "role": "patient",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    patient_doc = {
        "user_id": user_id,
        "date_of_birth": data.date_of_birth,
        "default_location_pincode": data.default_location_pincode,
        "default_city": data.default_city,
    }
    await db.patients.insert_one(patient_doc)

    token = create_access_token({"sub": user_id, "role": "patient"})
    return TokenResponse(
        access_token=token,
        user={"id": user_id, "name": data.name, "email": data.email, "role": "patient"},
    )


@router.post("/register/doctor", response_model=TokenResponse)
async def register_doctor(data: DoctorRegister):
    db = get_db()

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_license = await db.doctors.find_one({"license_number": data.license_number})
    if existing_license:
        raise HTTPException(status_code=400, detail="License number already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": data.email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "phone": data.phone,
        "role": "doctor",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    doctor_doc = {
        "user_id": user_id,
        "license_number": data.license_number,
        "specialization": data.specialization,
        "experience_years": data.experience_years,
        "consultation_fee": data.consultation_fee,
        "clinic_name": data.clinic_name,
        "clinic_address": data.clinic_address,
        "clinic_pincode": data.clinic_pincode,
        "clinic_latitude": data.clinic_latitude,
        "clinic_longitude": data.clinic_longitude,
        "profile_photo_url": None,
        "bio": data.bio,
        "is_approved": False,
        "rating": 0,
        "created_at": now,
    }
    await db.doctors.insert_one(doctor_doc)

    token = create_access_token({"sub": user_id, "role": "doctor"})
    return TokenResponse(
        access_token=token,
        user={
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "role": "doctor",
            "is_approved": False,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is blocked")

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "role": user["role"]})

    user_response = {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }

    if user["role"] == "doctor":
        doctor = await db.doctors.find_one({"user_id": user_id})
        if doctor:
            user_response["is_approved"] = doctor.get("is_approved", False)

    return TokenResponse(access_token=token, user=user_response)


@router.get("/me")
async def get_me(user=None):
    from api.auth.dependencies import get_current_user
    from fastapi import Depends
    # This is handled by the dependency injection in main.py
    pass


# Separate endpoint with proper dependency
from fastapi import Depends
from api.auth.dependencies import get_current_user


@router.get("/me/profile")
async def get_profile(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    role = user["role"]

    profile = {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": role,
    }

    if role == "patient":
        patient = await db.patients.find_one({"user_id": user_id})
        if patient:
            profile["date_of_birth"] = patient.get("date_of_birth")
            profile["default_city"] = patient.get("default_city")
            profile["default_location_pincode"] = patient.get("default_location_pincode")
    elif role == "doctor":
        doctor = await db.doctors.find_one({"user_id": user_id})
        if doctor:
            profile["license_number"] = doctor.get("license_number")
            profile["specialization"] = doctor.get("specialization")
            profile["experience_years"] = doctor.get("experience_years")
            profile["consultation_fee"] = doctor.get("consultation_fee")
            profile["clinic_name"] = doctor.get("clinic_name")
            profile["clinic_address"] = doctor.get("clinic_address")
            profile["clinic_pincode"] = doctor.get("clinic_pincode")
            profile["is_approved"] = doctor.get("is_approved", False)
            profile["bio"] = doctor.get("bio")

    return profile
