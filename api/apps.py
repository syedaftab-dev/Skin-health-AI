import os
import sys
import threading
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        # Ensure project root is in sys.path for ML modules
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if base_dir not in sys.path:
            sys.path.insert(0, base_dir)

        # Initialize MongoDB indexes asynchronously in a background thread
        # to avoid blocking management commands (e.g., check, migrate, runserver)
        def bg_init():
            try:
                from api.database import init_indexes
                init_indexes()
            except Exception as e:
                pass

        threading.Thread(target=bg_init, daemon=True).start()
