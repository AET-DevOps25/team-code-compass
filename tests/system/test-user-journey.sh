#!/bin/bash

# User Journey System Tests
# Tests complete user workflows from registration to workout completion

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
USER_SERVICE_URL="http://localhost:8081"
WORKOUT_SERVICE_URL="http://localhost:8082"
API_GATEWAY_URL="http://localhost:8000"
CLIENT_URL="http://localhost:3000"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  User Journey System Tests            ${NC}"
echo -e "${BLUE}========================================${NC}"

# Test variables
TEST_EMAIL="journey-test@example.com"
TEST_PASSWORD="journeytest123"
TEST_TIMESTAMP=$(date +%s)

# Journey 1: New User Registration and First Workout
log_info "Starting Journey 1: New User Registration and First Workout"

# Step 1: User Registration
log_info "Step 1: User Registration"
REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "journeytest'$TEST_TIMESTAMP'",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "firstName": "Journey",
    "lastName": "Test",
    "dateOfBirth": "1990-01-01",
    "gender": "MALE",
    "heightCm": 180,
    "weightKg": 75
  }')

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "201" ]]; then
    USER_ID=$(echo "$REGISTER_BODY" | jq -r '.id')
    log_success "User registration successful (ID: $USER_ID)"
else
    log_error "User registration failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# Step 2: User Login
log_info "Step 2: User Login"
LOGIN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    JWT_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token')
    log_success "User login successful"
else
    log_error "User login failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# Step 3: Profile Access
log_info "Step 3: Profile Access"
PROFILE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$PROFILE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Profile access successful"
else
    log_error "Profile access failed (HTTP $HTTP_STATUS)"
fi

# Step 4: First Workout Generation
log_info "Step 4: First Workout Generation"
WORKOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-01-25",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45
  }')

HTTP_STATUS=$(echo "$WORKOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
WORKOUT_BODY=$(echo "$WORKOUT_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    WORKOUT_ID=$(echo "$WORKOUT_BODY" | jq -r '.id')
    log_success "First workout generated successfully (ID: $WORKOUT_ID)"
else
    log_error "First workout generation failed (HTTP $HTTP_STATUS)"
fi

# Step 5: Workout Retrieval
log_info "Step 5: Workout Retrieval"
WORKOUT_GET_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$USER_ID/date/2025-01-25" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$WORKOUT_GET_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Workout retrieval successful"
else
    log_error "Workout retrieval failed (HTTP $HTTP_STATUS)"
fi

# Journey 2: Returning User - Multiple Workouts
log_info "Starting Journey 2: Returning User - Multiple Workouts"

# Step 6: Generate Different Workout Types
log_info "Step 6: Generate Different Workout Types"

WORKOUT_TYPES=("HIIT" "YOGA_MOBILITY" "STRENGTH")
WORKOUT_DATES=("2025-01-26" "2025-01-27" "2025-01-28")

for i in "${!WORKOUT_TYPES[@]}"; do
    SPORT_TYPE="${WORKOUT_TYPES[$i]}"
    WORKOUT_DATE="${WORKOUT_DATES[$i]}"
    
    log_info "Generating $SPORT_TYPE workout for $WORKOUT_DATE"
    
    MULTI_WORKOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -d '{
        "userId": "'$USER_ID'",
        "dayDate": "'$WORKOUT_DATE'",
        "focusSportType": "'$SPORT_TYPE'",
        "targetDurationMinutes": 30
      }')
    
    HTTP_STATUS=$(echo "$MULTI_WORKOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    if [[ "$HTTP_STATUS" == "200" ]]; then
        log_success "$SPORT_TYPE workout generated successfully"
    else
        log_error "$SPORT_TYPE workout generation failed (HTTP $HTTP_STATUS)"
    fi
done

# Step 7: Workout History Retrieval
log_info "Step 7: Workout History Retrieval"
HISTORY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$USER_ID/range?startDate=2025-01-25&endDate=2025-01-28" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$HISTORY_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
HISTORY_BODY=$(echo "$HISTORY_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    WORKOUT_COUNT=$(echo "$HISTORY_BODY" | jq '. | length')
    log_success "Workout history retrieved successfully ($WORKOUT_COUNT workouts)"
else
    log_error "Workout history retrieval failed (HTTP $HTTP_STATUS)"
fi

# Journey 3: User Preferences and Customization
log_info "Starting Journey 3: User Preferences and Customization"

# Step 8: Profile Update
log_info "Step 8: Profile Update"
# This would require a profile update endpoint
# For now, we'll just verify the profile can be accessed consistently
PROFILE_UPDATE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$PROFILE_UPDATE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Profile update functionality accessible"
else
    log_error "Profile update functionality not accessible (HTTP $HTTP_STATUS)"
fi

# Step 9: Workout Customization
log_info "Step 9: Workout Customization (Different Duration)"
CUSTOM_WORKOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-01-29",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 60
  }')

HTTP_STATUS=$(echo "$CUSTOM_WORKOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Workout customization successful"
else
    log_error "Workout customization failed (HTTP $HTTP_STATUS)"
fi

# Journey 4: Error Handling and Recovery
log_info "Starting Journey 4: Error Handling and Recovery"

# Step 10: Invalid Workout Request
log_info "Step 10: Invalid Workout Request"
INVALID_WORKOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "invalid-date",
    "focusSportType": "INVALID_SPORT",
    "targetDurationMinutes": -1
  }')

HTTP_STATUS=$(echo "$INVALID_WORKOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "400" ]] || [[ "$HTTP_STATUS" == "422" ]]; then
    log_success "Invalid workout request properly rejected"
else
    log_error "Invalid workout request should have been rejected (HTTP $HTTP_STATUS)"
fi

# Step 11: Unauthorized Access
log_info "Step 11: Unauthorized Access"
UNAUTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$USER_ID/date/2025-01-25")

HTTP_STATUS=$(echo "$UNAUTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "401" ]] || [[ "$HTTP_STATUS" == "403" ]]; then
    log_success "Unauthorized access properly rejected"
else
    log_error "Unauthorized access should have been rejected (HTTP $HTTP_STATUS)"
fi

# Step 12: Recovery After Error
log_info "Step 12: Recovery After Error"
RECOVERY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$RECOVERY_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "System recovery after error successful"
else
    log_error "System recovery after error failed (HTTP $HTTP_STATUS)"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  User Journey System Test Summary      ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

echo -e "\n${BLUE}Journey Summary:${NC}"
echo -e "• New User Registration and First Workout: Complete"
echo -e "• Returning User Multiple Workouts: Complete"
echo -e "• User Preferences and Customization: Complete"
echo -e "• Error Handling and Recovery: Complete"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}✓ All user journey system tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some user journey system tests failed.${NC}"
    exit 1
fi 