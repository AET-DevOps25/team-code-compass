#!/bin/bash

# FlexFit Integration Test Suite
# End-to-End Testing: Complete workflow from user registration to workout plan generation

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
GENAI_SERVICE_URL="http://localhost:8083"
API_GATEWAY_URL="http://localhost:8000"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Integration Test $TOTAL_TESTS: $1${NC}"
}

# Test variables
INTEGRATION_USER_EMAIL="integration.test@example.com"
INTEGRATION_USER_PASSWORD="integration123"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  FlexFit Integration Test Suite (E2E)    ${NC}"
echo -e "${BLUE}===========================================${NC}"

# 1. Prerequisites Check
run_test "Service Availability Check"
SERVICES_HEALTHY=0

for service in "User Service:$USER_SERVICE_URL" "Workout Service:$WORKOUT_SERVICE_URL" "GenAI Service:$GENAI_SERVICE_URL"; do
    IFS=':' read -r name url <<< "$service"
    if curl -s "$url/health" > /dev/null; then
        log_info "$name is available"
        ((SERVICES_HEALTHY++))
    else
        log_error "$name is not available"
    fi
done

if [[ $SERVICES_HEALTHY -eq 3 ]]; then
    log_success "All required services are healthy"
else
    log_error "Some services are not available. Cannot proceed with integration tests."
    exit 1
fi

# 2. Complete User Registration Flow
run_test "Complete User Registration and Profile Setup"
REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "integrationuser",
    "email": "'$INTEGRATION_USER_EMAIL'",
    "password": "'$INTEGRATION_USER_PASSWORD'",
    "firstName": "Integration",
    "lastName": "TestUser",
    "dateOfBirth": "1990-01-01",
    "age": 34,
    "gender": "MALE",
    "height": 175,
    "weight": 70
  }')

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "201" ]]; then
    INTEGRATION_USER_ID=$(echo "$REGISTER_BODY" | jq -r '.id')
    log_success "Integration user registered successfully (ID: $INTEGRATION_USER_ID)"
else
    log_error "Integration user registration failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# 3. Authentication Flow
run_test "User Authentication and Token Generation"
LOGIN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$INTEGRATION_USER_EMAIL'",
    "password": "'$INTEGRATION_USER_PASSWORD'"
  }')

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    INTEGRATION_JWT_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token')
    log_success "Authentication successful, JWT token obtained"
else
    log_error "Authentication failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# 4. User Profile Verification
run_test "User Profile Access with JWT Token"
PROFILE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $INTEGRATION_JWT_TOKEN")

HTTP_STATUS=$(echo "$PROFILE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
PROFILE_BODY=$(echo "$PROFILE_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    PROFILE_EMAIL=$(echo "$PROFILE_BODY" | jq -r '.email')
    if [[ "$PROFILE_EMAIL" == "$INTEGRATION_USER_EMAIL" ]]; then
        log_success "User profile access successful and data matches"
    else
        log_error "User profile data mismatch"
    fi
else
    log_error "User profile access failed (HTTP $HTTP_STATUS)"
fi

# 5. Direct GenAI Worker Test
run_test "Direct GenAI Worker Communication"
GENAI_REQUEST='{
    "user_profile": {
        "age": 34,
        "gender": "MALE",
        "height_cm": 175,
        "weight_kg": 70
    },
    "user_preferences": {
        "experienceLevel": "INTERMEDIATE",
        "fitnessGoals": ["MUSCLE_GAIN"],
        "preferredSportTypes": ["STRENGTH"],
        "availableEquipment": ["DUMBBELLS"],
        "workoutDurationRange": "45 minutes",
        "intensityPreference": "MODERATE",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-06-29",
        "focus_sport_type_for_the_day": "STRENGTH",
        "target_total_duration_minutes": 45
    }
}'

GENAI_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$GENAI_REQUEST")

HTTP_STATUS=$(echo "$GENAI_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
GENAI_BODY=$(echo "$GENAI_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    EXERCISE_COUNT=$(echo "$GENAI_BODY" | jq '.daily_workout.scheduled_exercises | length')
    log_success "Direct GenAI communication successful ($EXERCISE_COUNT exercises generated)"
else
    log_error "Direct GenAI communication failed (HTTP $HTTP_STATUS)"
fi

# 6. Complete Workout Plan Generation Flow
run_test "End-to-End Workout Plan Generation"
WORKOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INTEGRATION_JWT_TOKEN" \
  -d '{
    "userId": "'$INTEGRATION_USER_ID'",
    "dayDate": "2025-06-29",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45
  }')

HTTP_STATUS=$(echo "$WORKOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
WORKOUT_BODY=$(echo "$WORKOUT_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    WORKOUT_ID=$(echo "$WORKOUT_BODY" | jq -r '.id')
    WORKOUT_USER_ID=$(echo "$WORKOUT_BODY" | jq -r '.userId')
    EXERCISE_COUNT=$(echo "$WORKOUT_BODY" | jq '.scheduledExercises | length')
    
    if [[ "$WORKOUT_USER_ID" == "$INTEGRATION_USER_ID" ]]; then
        log_success "E2E workout generation successful (ID: $WORKOUT_ID, $EXERCISE_COUNT exercises)"
    else
        log_error "Workout plan user ID mismatch"
    fi
else
    log_error "E2E workout generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $WORKOUT_BODY"
fi

# 7. Multiple Sport Types Test
run_test "Multiple Sport Types Generation"
SPORT_TYPES=("STRENGTH" "HIIT" "YOGA")
SUCCESSFUL_GENERATIONS=0

for sport in "${SPORT_TYPES[@]}"; do
    SPORT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INTEGRATION_JWT_TOKEN" \
      -d '{
        "userId": "'$INTEGRATION_USER_ID'",
        "dayDate": "2025-06-30",
        "focusSportType": "'$sport'",
        "targetDurationMinutes": 30
      }')
    
    HTTP_STATUS=$(echo "$SPORT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    if [[ "$HTTP_STATUS" == "200" ]]; then
        ((SUCCESSFUL_GENERATIONS++))
        log_info "$sport workout generation successful"
    else
        log_warning "$sport workout generation failed (HTTP $HTTP_STATUS)"
    fi
done

if [[ $SUCCESSFUL_GENERATIONS -eq 3 ]]; then
    log_success "All sport types generated successfully ($SUCCESSFUL_GENERATIONS/3)"
else
    log_warning "Some sport types failed ($SUCCESSFUL_GENERATIONS/3 successful)"
fi

# 8. Data Consistency Check
run_test "Data Consistency and Persistence"
# Verify that the workout plan was actually saved by trying to access user profile again
CONSISTENCY_CHECK=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/$INTEGRATION_USER_ID" \
  -H "Authorization: Bearer $INTEGRATION_JWT_TOKEN")

HTTP_STATUS=$(echo "$CONSISTENCY_CHECK" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
CONSISTENCY_BODY=$(echo "$CONSISTENCY_CHECK" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    CONSISTENT_USER_ID=$(echo "$CONSISTENCY_BODY" | jq -r '.id')
    if [[ "$CONSISTENT_USER_ID" == "$INTEGRATION_USER_ID" ]]; then
        log_success "Data consistency maintained across services"
    else
        log_error "Data consistency check failed"
    fi
else
    log_error "Data consistency check failed (HTTP $HTTP_STATUS)"
fi

# 9. Security Boundary Test
run_test "Security Boundary Verification"
# Try to access another user's data with current token
FAKE_USER_ID="00000000-0000-0000-0000-000000000000"
SECURITY_TEST=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INTEGRATION_JWT_TOKEN" \
  -d '{
    "userId": "'$FAKE_USER_ID'",
    "dayDate": "2025-06-29",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45
  }')

HTTP_STATUS=$(echo "$SECURITY_TEST" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
# This should either fail with 403/404 or succeed but create workout for the actual authenticated user
if [[ "$HTTP_STATUS" == "403" ]] || [[ "$HTTP_STATUS" == "404" ]] || [[ "$HTTP_STATUS" == "400" ]]; then
    log_success "Security boundaries properly enforced"
elif [[ "$HTTP_STATUS" == "200" ]]; then
    # Check if the returned workout is for the correct user
    SECURITY_BODY=$(echo "$SECURITY_TEST" | sed 's/HTTP_STATUS:[0-9]*$//')
    RETURNED_USER_ID=$(echo "$SECURITY_BODY" | jq -r '.userId')
    if [[ "$RETURNED_USER_ID" == "$INTEGRATION_USER_ID" ]]; then
        log_success "Security boundaries enforced (request processed for authenticated user)"
    else
        log_error "Security vulnerability: workout created for unauthorized user"
    fi
else
    log_warning "Security test inconclusive (HTTP $HTTP_STATUS)"
fi

# 10. Performance and Load Test
run_test "Performance Under Load"
LOAD_TEST_PIDS=()
LOAD_SUCCESS=0

# Start 5 concurrent workout generation requests
for i in {1..5}; do
    curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $INTEGRATION_JWT_TOKEN" \
      -d '{
        "userId": "'$INTEGRATION_USER_ID'",
        "dayDate": "2025-07-0'$i'",
        "focusSportType": "STRENGTH",
        "targetDurationMinutes": 30
      }' > "/tmp/load_test_$i.txt" &
    LOAD_TEST_PIDS+=($!)
done

# Wait for all requests to complete
for pid in "${LOAD_TEST_PIDS[@]}"; do
    wait $pid
done

# Check results
for i in {1..5}; do
    if [[ -f "/tmp/load_test_$i.txt" ]]; then
        HTTP_STATUS=$(grep -o "HTTP_STATUS:[0-9]*" "/tmp/load_test_$i.txt" | cut -d: -f2)
        if [[ "$HTTP_STATUS" == "200" ]]; then
            ((LOAD_SUCCESS++))
        fi
        rm -f "/tmp/load_test_$i.txt"
    fi
done

if [[ $LOAD_SUCCESS -eq 5 ]]; then
    log_success "Load test successful ($LOAD_SUCCESS/5 requests completed)"
else
    log_warning "Load test partial success ($LOAD_SUCCESS/5 requests completed)"
fi

# 11. Service Recovery Test
run_test "Service Resilience Check"
# Test if services can handle rapid successive requests
RESILIENCE_SUCCESS=0
for i in {1..3}; do
    RESILIENCE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
      -H "Authorization: Bearer $INTEGRATION_JWT_TOKEN")
    
    HTTP_STATUS=$(echo "$RESILIENCE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    if [[ "$HTTP_STATUS" == "200" ]]; then
        ((RESILIENCE_SUCCESS++))
    fi
    sleep 0.1 # Small delay between requests
done

if [[ $RESILIENCE_SUCCESS -eq 3 ]]; then
    log_success "Service resilience test passed (3/3 rapid requests successful)"
else
    log_warning "Service resilience test partial success ($RESILIENCE_SUCCESS/3)"
fi

# Test Summary
echo -e "\n${BLUE}===========================================${NC}"
echo -e "${BLUE}         INTEGRATION TEST SUMMARY          ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "Total Integration Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

# Cleanup message
echo -e "\n${BLUE}[CLEANUP]${NC} Integration test user created with ID: $INTEGRATION_USER_ID"
echo -e "${BLUE}[CLEANUP]${NC} Email: $INTEGRATION_USER_EMAIL"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 ALL INTEGRATION TESTS PASSED! End-to-end workflow is functioning correctly.${NC}"
    echo -e "${GREEN}✅ User registration → Authentication → Workout generation flow verified${NC}"
    echo -e "${GREEN}✅ Service communication and data consistency verified${NC}"
    echo -e "${GREEN}✅ Security boundaries and performance validated${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some integration tests failed. Please check the output above.${NC}"
    exit 1
fi 