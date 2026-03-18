#!/bin/bash
set -e

echo "========================================="
echo "  Agent Flow AI - Production Deployment"
echo "========================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v "docker compose" >/dev/null 2>&1 || { echo "Docker Compose is required"; exit 1; }

# Check for .env
if [ ! -f .env ]; then
  echo "⚠️  Missing .env file. Copy .env.example and configure it first."
  exit 1
fi

# Validate required env vars
source .env
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-your-key-here" ]; then
  echo "⚠️  Please set a valid OPENAI_API_KEY in .env"
  exit 1
fi

echo ""
echo "🚀 Building and starting all services..."
echo ""

docker compose up --build -d

echo ""
echo "========================================="
echo "  Services Running"
echo "========================================="
echo ""
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  n8n:         http://localhost:5678"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3002"
echo ""
echo "  Health:      http://localhost:3001/health"
echo "  Metrics:     http://localhost:3001/health/metrics"
echo ""
echo "To view logs:  docker compose logs -f"
echo "To stop:       docker compose down"
echo ""
