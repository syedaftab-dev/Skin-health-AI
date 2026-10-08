import os
import io
import sys
from PIL import Image
from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)


@csrf_exempt
def root_view(request):
    """Serve React Landing Page if built, else API info."""
    frontend_dist = os.path.join(root_dir, "frontend", "dist")
    index_html = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_html):
        return FileResponse(open(index_html, "rb"))
    return JsonResponse({
        "message": "SkinAI Platform API",
        "framework": "Django",
        "version": "2.0.0",
        "health": "/health",
    }, status=200)


@csrf_exempt
def health_check(request):
    return JsonResponse({
        "status": "ok",
        "framework": "Django",
        "version": "2.0.0",
    }, status=200)


@csrf_exempt
def analyze_skin(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    if "file" not in request.FILES:
        return JsonResponse({"detail": "File must be provided."}, status=400)

    uploaded_file = request.FILES["file"]
    if not uploaded_file.content_type.startswith("image/"):
        return JsonResponse({"detail": "File must be an image."}, status=400)

    # Lazy-load prediction modules only when an image is uploaded
    try:
        from src.predict import predict_image, load_inference_model
        from src.recommend import format_recommendation
        model, device = load_inference_model()
    except Exception as e:
        print(f"Model load notice: {e}")
        model, device = None, None

    contents = uploaded_file.read()

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        return JsonResponse({"detail": f"Invalid image file: {str(e)}"}, status=400)

    try:
        prediction = predict_image(image, model=model, device=device)
        recommendation = format_recommendation(prediction)
    except Exception as e:
        return JsonResponse({"detail": f"Prediction failed: {str(e)}"}, status=500)

    return JsonResponse({
        "prediction": prediction,
        "recommendation": recommendation,
    }, status=200)


@csrf_exempt
def serve_react_app(request, full_path=""):
    """Serve built frontend static files or fallback to index.html for SPA routing."""
    frontend_dist = os.path.join(root_dir, "frontend", "dist")
    if not os.path.exists(frontend_dist):
        return JsonResponse({
            "message": "SkinAI API Running (Django). Frontend build not found.",
            "health": "/health",
        }, status=200)

    path = os.path.join(frontend_dist, full_path)
    if full_path and os.path.isfile(path):
        return FileResponse(open(path, "rb"))

    index_html = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_html):
        return FileResponse(open(index_html, "rb"))

    raise Http404("Page not found")
