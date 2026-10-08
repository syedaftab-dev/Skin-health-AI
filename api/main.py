"""SkinAI Platform Django Server Entry Point.

This file serves as a convenient runner compatible with previous commands,
delegating to Django's manage.py utility.
"""
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skinai_backend.settings")
    from django.core.management import execute_from_command_line
    # Default to runserver 0.0.0.0:8000 if no arguments provided
    args = sys.argv if len(sys.argv) > 1 else [sys.argv[0], "runserver", "0.0.0.0:8000"]
    execute_from_command_line(args)
