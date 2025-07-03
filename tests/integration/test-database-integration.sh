#!/bin/bash

# Database Integration Tests
# Tests database connectivity and data persistence across services

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
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="flexfit_db"

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
echo -e "${BLUE}  Database Integration Tests           ${NC}"
echo -e "${BLUE}========================================${NC}"

# Test variables
TEST_EMAIL="db-test@example.com"
TEST_PASSWORD="dbtest123"
TEST_TIMESTAMP=$(date +%s)

# 1. Database Connectivity Test
log_info "Testing database connectivity..."
if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    log_success "Database is accessible"
else
    log_error "Database is not accessible"
    exit 1
fi

# 2. User Data Persistence Test
log_info "Testing user data persistence..."
REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dbtest'$TEST_TIMESTAMP'",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "firstName": "Database",
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
    log_success "User data persisted successfully (ID: $USER_ID)"
else
    log_error "User data persistence failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# 3. User Authentication and Token Generation
log_info "Authenticating user for further tests..."
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
    log_success "User authentication successful"
else
    log_error "User authentication failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# 4. Data Retrieval Test
log_info "Testing data retrieval..."
PROFILE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$PROFILE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
PROFILE_BODY=$(echo "$PROFILE_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    RETRIEVED_EMAIL=$(echo "$PROFILE_BODY" | jq -r '.email')
    if [[ "$RETRIEVED_EMAIL" == "$TEST_EMAIL" ]]; then
        log_success "Data retrieval successful and consistent"
    else
        log_error "Data retrieval inconsistent (expected: $TEST_EMAIL, got: $RETRIEVED_EMAIL)"
    fi
else
    log_error "Data retrieval failed (HTTP $HTTP_STATUS)"
fi

# 5. Workout Data Persistence Test
log_info "Testing workout data persistence..."
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
    log_success "Workout data persisted successfully (ID: $WORKOUT_ID)"
else
    log_error "Workout data persistence failed (HTTP $HTTP_STATUS)"
fi

# 6. Workout Data Retrieval Test
log_info "Testing workout data retrieval..."
WORKOUT_GET_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$USER_ID/date/2025-01-25" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$WORKOUT_GET_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
WORKOUT_GET_BODY=$(echo "$WORKOUT_GET_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    RETRIEVED_WORKOUT_ID=$(echo "$WORKOUT_GET_BODY" | jq -r '.id')
    if [[ "$RETRIEVED_WORKOUT_ID" == "$WORKOUT_ID" ]]; then
        log_success "Workout data retrieval successful and consistent"
    else
        log_error "Workout data retrieval inconsistent"
    fi
else
    log_error "Workout data retrieval failed (HTTP $HTTP_STATUS)"
fi

# 7. Cross-Service Data Consistency Test
log_info "Testing cross-service data consistency..."
# Verify that the user ID in the workout matches the user we created
WORKOUT_USER_ID=$(echo "$WORKOUT_GET_BODY" | jq -r '.userId')
if [[ "$WORKOUT_USER_ID" == "$USER_ID" ]]; then
    log_success "Cross-service data consistency maintained"
else
    log_error "Cross-service data consistency failed"
fi

# 8. Data Integrity Test
log_info "Testing data integrity..."
# Check if the workout contains expected fields
if echo "$WORKOUT_GET_BODY" | jq -e '.scheduledExercises' > /dev/null && \
   echo "$WORKOUT_GET_BODY" | jq -e '.dayDate' > /dev/null && \
   echo "$WORKOUT_GET_BODY" | jq -e '.focusSportType' > /dev/null; then
    log_success "Data integrity maintained"
else
    log_error "Data integrity compromised"
fi

# 9. Transaction Rollback Test (if applicable)
log_info "Testing transaction handling..."
# Try to create a workout with invalid data
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
    log_success "Invalid data properly rejected"
else
    log_error "Invalid data should have been rejected (HTTP $HTTP_STATUS)"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Database Integration Summary          ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}✓ All database integration tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some database integration tests failed.${NC}"
    exit 1
fi 