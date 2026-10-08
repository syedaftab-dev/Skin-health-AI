import os
from django.conf import settings
from django.urls import path, re_path, include
from django.views.static import serve
from api.views.common_views import serve_react_app

urlpatterns = [
    # Include all API endpoints
    path("", include("api.urls")),

    # Serve uploaded media files
    re_path(
        r"^uploads/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
        name="media_serve",
    ),

    # Frontend dist assets if built
    re_path(
        r"^assets/(?P<path>.*)$",
        serve,
        {
            "document_root": os.path.join(
                settings.BASE_DIR, "frontend", "dist", "assets"
            )
        },
        name="frontend_assets",
    ),

    # React SPA catch-all fallback
    re_path(r"^(?P<full_path>.*)$", serve_react_app, name="frontend_spa"),
]
