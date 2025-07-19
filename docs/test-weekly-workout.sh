#!/bin/bash

# Test script for weekly workout generation
# This script assumes you have already registered a user and obtained an auth token

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}FlexFit Weekly Workout Generation Test${NC}"
echo "========================================="

# Base URL - adjust if needed
BASE_URL="http://localhost:8080"

# Check if auth token is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <auth_token>"
    echo "Please provide the auth token obtained from login"
    exit 1
fi

AUTH_TOKEN=$1

echo -e "\n${GREEN}1. Testing Health Endpoints${NC}"
echo "Testing workout-plan-service health..."
curl -s "$BASE_URL/workout-plan-service/api/v1/plans/health" | jq .

echo -e "\n${GREEN}2. Creating Weekly Workout Plan Request${NC}"

# Get today's date
TODAY=$(date +%Y-%m-%d)

# Create request JSON
cat > weekly-workout-request.json << EOF
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "dayDate": "$TODAY",
  "focusSportType": "STRENGTH",
  "targetDurationMinutes": 60,
  "textPrompt": "Focus on upper/lower split with compound movements. I have access to dumbbells and a barbell."
}
EOF

echo "Request payload:"
cat weekly-workout-request.json | jq .

echo -e "\n${GREEN}3. Calling Weekly Workout Generation Endpoint${NC}"
echo "Endpoint: POST $BASE_URL/workout-plan-service/api/v1/plans/generate-weekly-plan"

RESPONSE=$(curl -s -X POST \
  "$BASE_URL/workout-plan-service/api/v1/plans/generate-weekly-plan" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d @weekly-workout-request.json)

echo "Response:"
echo "$RESPONSE" | jq .

# Save response to file
echo "$RESPONSE" > weekly-workout-response.json

echo -e "\n${GREEN}4. Summary${NC}"
if [ ! -z "$RESPONSE" ] && [ "$RESPONSE" != "null" ]; then
    WORKOUT_COUNT=$(echo "$RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
    if [ "$WORKOUT_COUNT" -gt 0 ]; then
        echo "✅ Successfully generated $WORKOUT_COUNT workouts!"
        echo "Response saved to: weekly-workout-response.json"
        
        echo -e "\n${GREEN}5. Workout Overview${NC}"
        echo "$RESPONSE" | jq -r '.[] | "Day: \(.dayDate) - Sport: \(.focusSportTypeForTheDay) - Exercises: \(.scheduledExercises | length)"'
    else
        echo "❌ No workouts generated. Check the response for errors."
    fi
else
    echo "❌ Failed to get response. Please check if services are running."
fi

# Cleanup
rm -f weekly-workout-request.json

echo -e "\n${YELLOW}Testing Complete!${NC}"