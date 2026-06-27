#!/bin/bash
set -e

echo "Stopping existing containers..."
docker compose down

echo "Building and starting all services..."
docker compose up --build -d

echo "Waiting for backend to be ready..."
until curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/login -X POST \
  -H "Content-Type: application/json" -d '{}' 2>/dev/null | grep -qE "^[24]"; do
  sleep 2
done

echo ""
echo "All services running:"
docker compose ps
echo ""
echo "  Frontend → http://localhost:3000"
echo "  Backend  → http://localhost:8080"
