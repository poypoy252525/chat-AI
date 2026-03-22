#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Change to the directory where the script is located (optional but safer)
# cd "$(dirname "$0")"

echo "🚀 Starting Deployment..."

# 1. Pull the latest code
echo "📥 Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# 2. Backend Setup
echo "⚙️ Setting up Backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# 3. Frontend Setup
echo "⚛️ Building Frontend..."
cd ../frontend
npm ci            # Cleaner and faster than 'npm install'
npm run build

# 4. Restart Services (Crucial!)
# You likely need to restart Gunicorn/Uvicorn and maybe Nginx
echo "🔄 Restarting services..."
# sudo systemctl restart gunicorn   # Replace with your actual service name
# sudo systemctl restart nginx      # If Nginx needs a reload

echo "✅ Deployment finished successfully!"
