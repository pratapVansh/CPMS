#!/bin/bash

#########################################
# CPMS Rollback Script
# Rolls back to a previous Docker image tag
# Usage: ./rollback.sh [image-tag]
# Example: ./rollback.sh abc123def456
#########################################

set -e

IMAGE_TAG=${1}

if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: ./rollback.sh [image-tag]"
  echo ""
  echo "Available image tags:"
  docker images | grep cpms-api | awk '{print $2}'
  exit 1
fi

echo "========================================="
echo "CPMS Rollback Script"
echo "Rolling back to: $IMAGE_TAG"
echo "========================================="

# Confirm rollback
read -p "Are you sure you want to rollback to '$IMAGE_TAG'? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled."
  exit 0
fi

# Export the tag
export IMAGE_TAG=$IMAGE_TAG

# Pull the specific tag
echo "📥 Pulling image tag: $IMAGE_TAG..."
docker compose -f docker-compose.prod.yml pull

# Deploy the old version
echo "🚀 Deploying..."
docker compose -f docker-compose.prod.yml up -d --no-deps

# Wait and check health
echo "⏳ Waiting for services..."
sleep 10

# Check status
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

# Health check
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/health || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
  echo "✅ Rollback successful!"
else
  echo "❌ Rollback failed! Health check returned: $HEALTH_STATUS"
  docker compose -f docker-compose.prod.yml logs api --tail 30
  exit 1
fi

echo ""
echo "========================================="
echo "✅ Rollback Complete!"
echo "========================================="
