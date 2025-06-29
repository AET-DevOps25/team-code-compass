#!/bin/bash

# FlexFit Server Services Test Suite
# Tests: User Service, Workout Plan Service, Authentication, and Integration

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
    echo -e "\n${YELLOW}Test $TOTAL_TESTS: $1${NC}"
}

check_service_health() {
    local service_name=$1
    local url=$2
    
    if curl -s "$url/health" > /dev/null; then
        log_success "$service_name is healthy"
        return 0
    else
        log_error "$service_name is not responding"
        return 1
    fi
}

# Test variables
TEST_USER_EMAIL="testuser@example.com"
TEST_USER_PASSWORD="password123"
NEW_USER_EMAIL="newuser@example.com"
NEW_USER_PASSWORD="newpassword123"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  FlexFit Server Services Test Suite  ${NC}"
echo -e "${BLUE}======================================${NC}"

# 1. Health Checks
run_test "Service Health Checks"
check_service_health "User Service" "$USER_SERVICE_URL"
check_service_health "Workout Plan Service" "$WORKOUT_SERVICE_URL"

# 2. User Registration Tests
run_test "User Registration - New User"
REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "'$TEST_USER_EMAIL'",
    "password": "'$TEST_USER_PASSWORD'",
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1988-01-01",
    "age": 35,
    "gender": "MALE",
    "height": 180,
    "weight": 75
  }')

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "201" ]]; then
    USER_ID=$(echo "$REGISTER_BODY" | jq -r '.id')
    log_success "User registration successful (ID: $USER_ID)"
else
    log_error "User registration failed (HTTP $HTTP_STATUS)"
fi

# 3. Duplicate Registration Test
run_test "User Registration - Duplicate User (Should Fail)"
DUPLICATE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "'$TEST_USER_EMAIL'",
    "password": "differentpassword",
    "firstName": "Duplicate",
    "lastName": "User",
    "dateOfBirth": "1988-01-01",
    "age": 35,
    "gender": "MALE"
  }')

HTTP_STATUS=$(echo "$DUPLICATE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "409" ]]; then
    log_success "Duplicate registration properly rejected (HTTP 409)"
else
    log_error "Duplicate registration should have failed with HTTP 409, got HTTP $HTTP_STATUS"
fi

# 4. Authentication Tests
run_test "Authentication - Valid Login"
LOGIN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_USER_EMAIL'",
    "password": "'$TEST_USER_PASSWORD'"
  }')

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    JWT_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token')
    log_success "Login successful, JWT token obtained"
else
    log_error "Login failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# 5. Invalid Login Tests
run_test "Authentication - Invalid Password"
INVALID_LOGIN=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_USER_EMAIL'",
    "password": "wrongpassword"
  }')

HTTP_STATUS=$(echo "$INVALID_LOGIN" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "400" ]] || [[ "$HTTP_STATUS" == "401" ]]; then
    log_success "Invalid password properly rejected"
else
    log_error "Invalid password should have been rejected"
fi

run_test "Authentication - Non-existent User"
NONEXISTENT_LOGIN=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password123"
  }')

HTTP_STATUS=$(echo "$NONEXISTENT_LOGIN" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "400" ]] || [[ "$HTTP_STATUS" == "401" ]]; then
    log_success "Non-existent user properly rejected"
else
    log_error "Non-existent user should have been rejected"
fi

# 6. Protected Endpoint Tests
run_test "Protected Endpoint - Valid Token"
PROTECTED_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$PROTECTED_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Protected endpoint accessible with valid token"
else
    log_error "Protected endpoint should be accessible with valid token"
fi

run_test "Protected Endpoint - No Token"
NO_TOKEN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me")

HTTP_STATUS=$(echo "$NO_TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "401" ]] || [[ "$HTTP_STATUS" == "403" ]]; then
    log_success "Protected endpoint properly rejects requests without token"
else
    log_error "Protected endpoint should reject requests without token"
fi

run_test "Protected Endpoint - Invalid Token"
INVALID_TOKEN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer invalid_token_here")

HTTP_STATUS=$(echo "$INVALID_TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "401" ]] || [[ "$HTTP_STATUS" == "403" ]]; then
    log_success "Protected endpoint properly rejects invalid tokens"
else
    log_error "Protected endpoint should reject invalid tokens"
fi

# 7. Workout Plan Generation Tests
run_test "Workout Plan Generation - Valid Request"
WORKOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-06-29",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45
  }')

HTTP_STATUS=$(echo "$WORKOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
WORKOUT_BODY=$(echo "$WORKOUT_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    WORKOUT_ID=$(echo "$WORKOUT_BODY" | jq -r '.id')
    EXERCISE_COUNT=$(echo "$WORKOUT_BODY" | jq '.scheduledExercises | length')
    log_success "Workout plan generated successfully (ID: $WORKOUT_ID, $EXERCISE_COUNT exercises)"
else
    log_error "Workout plan generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $WORKOUT_BODY"
fi

# 8. Workout Plan Generation - Different Sport Type
run_test "Workout Plan Generation - HIIT Type"
HIIT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-06-30",
    "focusSportType": "HIIT",
    "targetDurationMinutes": 30
  }')

HTTP_STATUS=$(echo "$HIIT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "HIIT workout plan generated successfully"
else
    log_error "HIIT workout plan generation failed (HTTP $HTTP_STATUS)"
fi

# 9. Workout Plan Generation - Unauthorized
run_test "Workout Plan Generation - No Authorization"
UNAUTH_WORKOUT=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-06-29",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45
  }')

HTTP_STATUS=$(echo "$UNAUTH_WORKOUT" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "401" ]] || [[ "$HTTP_STATUS" == "403" ]]; then
    log_success "Workout generation properly requires authorization"
else
    log_error "Workout generation should require authorization"
fi

# 10. User Profile Retrieval
run_test "User Profile Retrieval"
PROFILE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$PROFILE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "User profile retrieval successful"
else
    log_error "User profile retrieval failed (HTTP $HTTP_STATUS)"
fi

# 11. Register Second User for Additional Testing
run_test "Second User Registration"
SECOND_REGISTER=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "'$NEW_USER_EMAIL'",
    "password": "'$NEW_USER_PASSWORD'",
    "firstName": "New",
    "lastName": "User",
    "dateOfBirth": "1990-05-15",
    "age": 33,
    "gender": "FEMALE",
    "height": 165,
    "weight": 60
  }')

HTTP_STATUS=$(echo "$SECOND_REGISTER" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "201" ]]; then
    log_success "Second user registration successful"
else
    log_error "Second user registration failed (HTTP $HTTP_STATUS)"
fi

# 12. Second User Login
run_test "Second User Login"
SECOND_LOGIN=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$NEW_USER_EMAIL'",
    "password": "'$NEW_USER_PASSWORD'"
  }')

HTTP_STATUS=$(echo "$SECOND_LOGIN" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Second user login successful"
else
    log_error "Second user login failed (HTTP $HTTP_STATUS)"
fi

# Test Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}           TEST SUMMARY               ${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Server services are working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi 