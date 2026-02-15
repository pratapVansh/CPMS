#!/bin/bash

#########################################
# CPMS Health Check Script
# Monitors API health and restarts if down
# Usage: Add to crontab for automated monitoring
# */5 * * * * /home/ubuntu/cpms/health-check.sh
#########################################

LOG_FILE="/home/ubuntu/cpms/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# API health endpoint
HEALTH_URL="http://localhost:5000/api/v1/health"

# Check API health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")

if [ "$STATUS" != "200" ]; then
  echo "[$TIMESTAMP] ❌ API is down! Status: $STATUS - Restarting..." >> $LOG_FILE
  
  cd /home/ubuntu/cpms
  docker compose -f docker-compose.prod.yml restart api
  
  # Wait for restart
  sleep 15
  
  # Check again
  NEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")
  
  if [ "$NEW_STATUS" == "200" ]; then
    echo "[$TIMESTAMP] ✅ API restarted successfully!" >> $LOG_FILE
  else
    echo "[$TIMESTAMP] ❌ API restart failed! Status: $NEW_STATUS" >> $LOG_FILE
    # Send alert (add email/slack notification here)
  fi
else
  echo "[$TIMESTAMP] ✅ API is healthy" >> $LOG_FILE
fi

# Keep log file under 1000 lines
tail -n 1000 $LOG_FILE > $LOG_FILE.tmp && mv $LOG_FILE.tmp $LOG_FILE
