#!/bin/bash

#########################################
# CPMS Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production
#          ./deploy.sh dev
#########################################

set -e  # Exit on error

ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"

echo "========================================="
echo "CPMS Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "========================================="

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Environment file '$ENV_FILE' not found!"
  echo "Please create it first with all required variables."
  exit 1
fi

# Load environment variables
echo "📦 Loading environment from $ENV_FILE..."
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running!"
  exit 1
fi

echo "✅ Docker is running"

# Pull latest code
echo ""
echo "📥 Pulling latest code from GitHub..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

if [ "$ENVIRONMENT" == "production" ]; then
  EXPECTED_BRANCH="main"
else
  EXPECTED_BRANCH="dev"
fi

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  echo "⚠️  Warning: You are on branch '$CURRENT_BRANCH' but deploying '$ENVIRONMENT'"
  echo "Expected branch: '$EXPECTED_BRANCH'"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

git pull origin $CURRENT_BRANCH

# Login to GitHub Container Registry
echo ""
echo "🔐 Logging in to GitHub Container Registry..."
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  GITHUB_TOKEN not found in $ENV_FILE"
  echo "Please enter your GitHub Personal Access Token:"
  read -s GITHUB_TOKEN
fi

echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull latest Docker images
echo ""
echo "📥 Pulling latest Docker images..."
docker compose -f docker-compose.prod.yml pull

# Run database migrations (if needed)
echo ""
read -p "Run database migrations? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🔄 Running database migrations..."
  docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
fi

# Deploy with zero downtime
echo ""
echo "🚀 Deploying services..."
docker compose -f docker-compose.prod.yml up -d --no-deps --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

# Health check
echo ""
echo "🏥 Health Check:"
HEALTH_URL="http://localhost:5000/api/v1/health"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
  echo "✅ API is healthy!"
  curl -s $HEALTH_URL | jq '.' || echo ""
else
  echo "❌ API health check failed! Status: $HEALTH_STATUS"
  echo ""
  echo "📋 API Logs:"
  docker compose -f docker-compose.prod.yml logs api --tail 30
  exit 1
fi

# Clean up old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -af

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart API:  docker compose -f docker-compose.prod.yml restart api"
echo "  Stop all:     docker compose -f docker-compose.prod.yml down"
echo ""
