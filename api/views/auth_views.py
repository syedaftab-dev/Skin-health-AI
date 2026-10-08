from datetime import datetime, timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.database import get_db
from api.auth.jwt import hash_password, verify_password, create_access_token
from api.auth.decorators import parse_json, jwt_required


@csrf_exempt
def register_patient(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    phone = data.get("phone", "")

    if not email or not password or not name:
        return JsonResponse({"detail": "Missing required fields"}, status=400)

    db = get_db()
    existing = db.users.find_one({"email": email})
    if existing:
        return JsonResponse({"detail": "Email already registered"}, status=400)

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "password_hash": hash_password(password),
        "name": name,
        "phone": phone,
        "role": "patient",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    patient_doc = {
        "user_id": user_id,
        "date_of_birth": data.get("date_of_birth"),
        "default_location_pincode": data.get("default_location_pincode"),
        "default_city": data.get("default_city"),
    }
    db.patients.insert_one(patient_doc)

    token = create_access_token({"sub": user_id, "role": "patient"})
    return JsonResponse({
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "name": name, "email": email, "role": "patient"},
    }, status=200)


@csrf_exempt
def register_doctor(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    phone = data.get("phone", "")
    license_number = data.get("license_number")

    if not email or not password or not name or not license_number:
        return JsonResponse({"detail": "Missing required fields"}, status=400)

    db = get_db()
    if db.users.find_one({"email": email}):
        return JsonResponse({"detail": "Email already registered"}, status=400)

    if db.doctors.find_one({"license_number": license_number}):
        return JsonResponse({"detail": "License number already registered"}, status=400)

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "password_hash": hash_password(password),
        "name": name,
        "phone": phone,
        "role": "doctor",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    doctor_doc = {
        "user_id": user_id,
        "license_number": license_number,
        "specialization": data.get("specialization", ""),
        "experience_years": int(data.get("experience_years", 0)),
        "consultation_fee": float(data.get("consultation_fee", 0)),
        "clinic_name": data.get("clinic_name", ""),
        "clinic_address": data.get("clinic_address", ""),
        "clinic_pincode": data.get("clinic_pincode", ""),
        "clinic_latitude": data.get("clinic_latitude"),
        "clinic_longitude": data.get("clinic_longitude"),
        "profile_photo_url": None,
        "bio": data.get("bio", ""),
        "is_approved": False,
        "rating": 0,
        "created_at": now,
    }
    db.doctors.insert_one(doctor_doc)

    token = create_access_token({"sub": user_id, "role": "doctor"})
    return JsonResponse({
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": "doctor",
            "is_approved": False,
        },
    }, status=200)


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"detail": "Email and password required"}, status=400)

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        return JsonResponse({"detail": "Invalid email or password"}, status=401)

    if not user.get("is_active", True):
        return JsonResponse({"detail": "Account is blocked"}, status=403)

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "role": user["role"]})

    user_response = {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }

    if user["role"] == "doctor":
        doctor = db.doctors.find_one({"user_id": user_id})
        if doctor:
            user_response["is_approved"] = doctor.get("is_approved", False)

    return JsonResponse({"access_token": token, "user": user_response}, status=200)


@csrf_exempt
@jwt_required
def get_profile(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

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
        patient = db.patients.find_one({"user_id": user_id})
        if patient:
            profile["date_of_birth"] = patient.get("date_of_birth")
            profile["default_city"] = patient.get("default_city")
            profile["default_location_pincode"] = patient.get("default_location_pincode")
    elif role == "doctor":
        doctor = db.doctors.find_one({"user_id": user_id})
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

    return JsonResponse(profile, status=200)
