#!/bin/bash
set -e

echo "========================================="
echo "  Agent Flow AI - Development Setup"
echo "========================================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install from https://nodejs.org"; exit 1; }

# Check for .env file
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your OPENAI_API_KEY before continuing."
  exit 1
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Start Redis (if Docker is available)
if command -v docker >/dev/null 2>&1; then
  echo ""
  echo "🔴 Starting Redis..."
  docker run -d --name agent-flow-redis -p 6379:6379 redis:7-alpine 2>/dev/null || echo "Redis already running"
fi

# Create logs directory
mkdir -p backend/logs

echo ""
echo "========================================="
echo "  Starting services..."
echo "========================================="
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Health:   http://localhost:3001/health"
echo ""

# Start backend and frontend concurrently
cd backend && npm run dev &
BACKEND_PID=$!

cd frontend && npm start &
FRONTEND_PID=$!

# Trap to cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo "Press Ctrl+C to stop all services"
wait
