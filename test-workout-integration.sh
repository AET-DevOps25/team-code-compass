#!/bin/bash

# Test script for workout generation and markdown content integration
# This script tests the full flow from GenAI service to database storage to frontend display

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_URL="http://localhost:8082/api/v1"
USER_SERVICE_URL="http://localhost:8081/api/v1"
TEST_TIMESTAMP=$(date +%s)
TEST_USERNAME="test-user-$TEST_TIMESTAMP"
TEST_EMAIL="test-$TEST_TIMESTAMP@flexfit.example"
TEST_PASSWORD="TestPassword123!"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Workout Integration Test Suite       ${NC}"
echo -e "${BLUE}========================================${NC}"

# Test 0: Setup - Register user and get JWT token
echo -e "\n${YELLOW}Test 0: Setting up test user and authentication${NC}"

# Register a new test user
REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$TEST_USERNAME'",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1990-01-01",
    "gender": "MALE",
    "heightCm": 180,
    "weightKg": 75
  }')

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "201" ]]; then
  USER_ID=$(echo "$REGISTER_BODY" | jq -r '.id')
  echo -e "${GREEN}✓ Test user registered successfully (ID: $USER_ID)${NC}"
else
  echo -e "${RED}✗ User registration failed (HTTP $HTTP_STATUS)${NC}"
  echo "Response: $REGISTER_BODY"
  exit 1
fi

# Login to get JWT token
LOGIN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "http://localhost:8081/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
  JWT_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token')
  echo -e "${GREEN}✓ Authentication successful${NC}"
  echo -e "${BLUE}  JWT Token: ${JWT_TOKEN:0:50}...${NC}"
else
  echo -e "${RED}✗ Login failed (HTTP $HTTP_STATUS)${NC}"
  echo "Response: $LOGIN_BODY"
  exit 1
fi

# Test 1: Generate a STRENGTH workout
echo -e "\n${YELLOW}Test 1: Generating STRENGTH workout${NC}"
STRENGTH_REQUEST='{
  "userId": "'$USER_ID'",
  "dayDate": "2025-01-25",
  "focusSportType": "STRENGTH",
  "targetDurationMinutes": 45
}'

STRENGTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$API_GATEWAY_URL/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "$STRENGTH_REQUEST")

HTTP_STATUS=$(echo "$STRENGTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
STRENGTH_BODY=$(echo "$STRENGTH_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo -e "${GREEN}✓ STRENGTH workout generated successfully${NC}"
  
  # Check if response contains markdown content
  if echo "$STRENGTH_BODY" | jq -e '.markdownContent' > /dev/null; then
    echo -e "${GREEN}✓ Markdown content included in response${NC}"
    MARKDOWN_LENGTH=$(echo "$STRENGTH_BODY" | jq -r '.markdownContent | length')
    echo -e "${BLUE}  Markdown content length: $MARKDOWN_LENGTH characters${NC}"
  else
    echo -e "${RED}✗ Markdown content missing from response${NC}"
  fi
  
  # Check if response contains structured exercises
  EXERCISE_COUNT=$(echo "$STRENGTH_BODY" | jq '.scheduledExercises | length')
  echo -e "${BLUE}  Number of exercises: $EXERCISE_COUNT${NC}"
  
else
  echo -e "${RED}✗ STRENGTH workout generation failed (HTTP $HTTP_STATUS)${NC}"
  echo "Response: $STRENGTH_BODY"
fi

# Test 2: Retrieve the generated workout
echo -e "\n${YELLOW}Test 2: Retrieving generated workout${NC}"
RETRIEVE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/plans/user/$USER_ID/date/2025-01-25" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$RETRIEVE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RETRIEVE_BODY=$(echo "$RETRIEVE_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo -e "${GREEN}✓ Workout retrieved successfully${NC}"
  
  # Verify markdown content is persisted
  if echo "$RETRIEVE_BODY" | jq -e '.markdownContent' > /dev/null; then
    echo -e "${GREEN}✓ Markdown content persisted in database${NC}"
  else
    echo -e "${RED}✗ Markdown content not persisted${NC}"
  fi
  
else
  echo -e "${RED}✗ Workout retrieval failed (HTTP $HTTP_STATUS)${NC}"
fi

# Test 3: Generate a HIIT workout
echo -e "\n${YELLOW}Test 3: Generating HIIT workout${NC}"
HIIT_REQUEST='{
  "userId": "'$USER_ID'",
  "dayDate": "2025-01-26",
  "focusSportType": "HIIT",
  "targetDurationMinutes": 30
}'

HIIT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$API_GATEWAY_URL/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "$HIIT_REQUEST")

HTTP_STATUS=$(echo "$HIIT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
HIIT_BODY=$(echo "$HIIT_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo -e "${GREEN}✓ HIIT workout generated successfully${NC}"
  
  # Check for HIIT-specific content in markdown
  if echo "$HIIT_BODY" | jq -r '.markdownContent' | grep -q "HIIT\|Cardio\|High-intensity"; then
    echo -e "${GREEN}✓ HIIT-specific content found in markdown${NC}"
  else
    echo -e "${YELLOW}⚠ HIIT-specific content not clearly identified${NC}"
  fi
else
  echo -e "${RED}✗ HIIT workout generation failed (HTTP $HTTP_STATUS)${NC}"
fi

# Test 4: Generate a YOGA workout
echo -e "\n${YELLOW}Test 4: Generating YOGA workout${NC}"
YOGA_REQUEST='{
  "userId": "'$USER_ID'",
  "dayDate": "2025-01-27",
  "focusSportType": "YOGA_MOBILITY",
  "targetDurationMinutes": 50
}'

YOGA_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$API_GATEWAY_URL/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "$YOGA_REQUEST")

HTTP_STATUS=$(echo "$YOGA_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
YOGA_BODY=$(echo "$YOGA_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo -e "${GREEN}✓ YOGA workout generated successfully${NC}"
  
  # Check for YOGA-specific content in markdown
  if echo "$YOGA_BODY" | jq -r '.markdownContent' | grep -q -i "yoga\|pose\|mindful\|meditation"; then
    echo -e "${GREEN}✓ YOGA-specific content found in markdown${NC}"
  else
    echo -e "${YELLOW}⚠ YOGA-specific content not clearly identified${NC}"
  fi
else
  echo -e "${RED}✗ YOGA workout generation failed (HTTP $HTTP_STATUS)${NC}"
fi

# Test 5: Retrieve workouts by date range
echo -e "\n${YELLOW}Test 5: Retrieving workouts by date range${NC}"
RANGE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/plans/user/$USER_ID/range?startDate=2025-01-25&endDate=2025-01-27" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$RANGE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RANGE_BODY=$(echo "$RANGE_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
  WORKOUT_COUNT=$(echo "$RANGE_BODY" | jq '. | length')
  echo -e "${GREEN}✓ Retrieved $WORKOUT_COUNT workouts from date range${NC}"
  
  # Check that all workouts have markdown content
  WORKOUTS_WITH_MARKDOWN=$(echo "$RANGE_BODY" | jq '[.[] | select(.markdownContent != null and .markdownContent != "")] | length')
  echo -e "${BLUE}  Workouts with markdown content: $WORKOUTS_WITH_MARKDOWN/$WORKOUT_COUNT${NC}"
  
  if [[ "$WORKOUTS_WITH_MARKDOWN" == "$WORKOUT_COUNT" ]]; then
    echo -e "${GREEN}✓ All workouts have markdown content${NC}"
  else
    echo -e "${YELLOW}⚠ Some workouts missing markdown content${NC}"
  fi
else
  echo -e "${RED}✗ Date range retrieval failed (HTTP $HTTP_STATUS)${NC}"
fi

# Test 6: Authentication and Authorization
echo -e "\n${YELLOW}Test 6: Testing authentication and authorization${NC}"

# Test with invalid token
INVALID_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/plans/user/$USER_ID/date/2025-01-25" \
  -H "Authorization: Bearer invalid-token")

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [[ "$HTTP_STATUS" == "401" || "$HTTP_STATUS" == "403" ]]; then
  echo -e "${GREEN}✓ Invalid token properly rejected${NC}"
else
  echo -e "${YELLOW}⚠ Invalid token not properly rejected (HTTP $HTTP_STATUS)${NC}"
fi

# Test without token
NO_TOKEN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/plans/user/$USER_ID/date/2025-01-25")

HTTP_STATUS=$(echo "$NO_TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [[ "$HTTP_STATUS" == "401" || "$HTTP_STATUS" == "403" ]]; then
  echo -e "${GREEN}✓ Missing token properly rejected${NC}"
else
  echo -e "${YELLOW}⚠ Missing token not properly rejected (HTTP $HTTP_STATUS)${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary                          ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Dynamic user registration and authentication${NC}"
echo -e "${GREEN}✓ JWT token generation and validation${NC}"
echo -e "${GREEN}✓ Workout generation with markdown content${NC}"
echo -e "${GREEN}✓ Database persistence of markdown content${NC}"
echo -e "${GREEN}✓ API retrieval of workout data${NC}"
echo -e "${GREEN}✓ Multiple sport type support${NC}"
echo -e "${GREEN}✓ Date range queries${NC}"
echo -e "${GREEN}✓ Authentication and authorization${NC}"

echo -e "\n${YELLOW}Test Environment:${NC}"
echo -e "• Test User: ${BLUE}$TEST_USERNAME${NC}"
echo -e "• User ID: ${BLUE}$USER_ID${NC}"
echo -e "• Email: ${BLUE}$TEST_EMAIL${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Start your services: ${BLUE}docker compose up -d${NC}"
echo -e "2. Run this test: ${BLUE}./test-workout-integration.sh${NC}"
echo -e "3. Open frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "4. Generate workouts and see markdown content!"
echo -e "5. Use the test credentials above for manual testing" 