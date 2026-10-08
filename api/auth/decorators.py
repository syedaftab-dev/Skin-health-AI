import json
from functools import wraps
from bson import ObjectId
from django.http import JsonResponse
from api.auth.jwt import decode_access_token
from api.database import get_db


def parse_json(request):
    """Safely parse JSON from request body."""
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except Exception:
        return {}


def get_token_from_request(request):
    """Extract Bearer token from request headers."""
    auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def authenticate_request(request):
    """Authenticate request and return user document, or None with error response."""
    token = get_token_from_request(request)
    if not token:
        return None, JsonResponse({"detail": "Not authenticated"}, status=401)

    payload = decode_access_token(token)
    if payload is None:
        return None, JsonResponse({"detail": "Invalid or expired token"}, status=401)

    user_id = payload.get("sub")
    if not user_id:
        return None, JsonResponse({"detail": "Invalid token payload"}, status=401)

    try:
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None, JsonResponse({"detail": "User not found"}, status=401)

    if user is None:
        return None, JsonResponse({"detail": "User not found"}, status=401)

    if not user.get("is_active", True):
        return None, JsonResponse({"detail": "Account is blocked"}, status=403)

    user["id"] = str(user["_id"])
    request.user_data = user
    return user, None


def jwt_required(view_func):
    """Decorator to require valid JWT token."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user, err = authenticate_request(request)
        if err:
            return err
        return view_func(request, *args, user=user, **kwargs)
    return wrapper


def require_role(*roles):
    """Decorator to require authenticated user with specific role(s)."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user, err = authenticate_request(request)
            if err:
                return err
            if user.get("role") not in roles:
                return JsonResponse({
                    "detail": f"Access denied. Required role: {', '.join(roles)}"
                }, status=403)
            return view_func(request, *args, user=user, **kwargs)
        return wrapper
    return decorator
