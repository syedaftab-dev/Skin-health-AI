#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== Building React Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Installing Python Dependencies ==="
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "=== Running Django Migrations ==="
python manage.py migrate

echo "=== Build Completed Successfully ==="
