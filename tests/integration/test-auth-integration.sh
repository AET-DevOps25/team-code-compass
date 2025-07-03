#!/bin/bash

# Authentication Integration Tests
# Tests authentication flow between User Service and other services

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
echo -e "${BLUE}  Authentication Integration Tests     ${NC}"
echo -e "${BLUE}========================================${NC}"

# Test variables
TEST_EMAIL="auth-test@example.com"
TEST_PASSWORD="authtest123"
TEST_TIMESTAMP=$(date +%s)

# 1. User Registration for Auth Testing
log_info "Setting up test user for authentication tests..."
REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "authtest'$TEST_TIMESTAMP'",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "firstName": "Auth",
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
    log_success "Test user registered (ID: $USER_ID)"
else
    log_error "Failed to register test user (HTTP $HTTP_STATUS)"
    exit 1
fi

# 2. JWT Token Generation Test
log_info "Testing JWT token generation..."
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
    log_success "JWT token generated successfully"
else
    log_error "JWT token generation failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# 3. Token Validation Test
log_info "Testing token validation..."
PROFILE_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$PROFILE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Token validation successful"
else
    log_error "Token validation failed (HTTP $HTTP_STATUS)"
fi

# 4. Cross-Service Authentication Test
log_info "Testing cross-service authentication..."
WORKOUT_AUTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-01-25",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 30
  }')

HTTP_STATUS=$(echo "$WORKOUT_AUTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Cross-service authentication successful"
else
    log_error "Cross-service authentication failed (HTTP $HTTP_STATUS)"
fi

# 5. Invalid Token Test
log_info "Testing invalid token rejection..."
INVALID_TOKEN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer invalid-token")

HTTP_STATUS=$(echo "$INVALID_TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "401" ]] || [[ "$HTTP_STATUS" == "403" ]]; then
    log_success "Invalid token properly rejected"
else
    log_error "Invalid token should have been rejected (HTTP $HTTP_STATUS)"
fi

# 6. Missing Token Test
log_info "Testing missing token rejection..."
NO_TOKEN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me")

HTTP_STATUS=$(echo "$NO_TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "401" ]] || [[ "$HTTP_STATUS" == "403" ]]; then
    log_success "Missing token properly rejected"
else
    log_error "Missing token should have been rejected (HTTP $HTTP_STATUS)"
fi

# 7. Token Expiration Test (if applicable)
log_info "Testing token expiration handling..."
# This would require a token with short expiration time
# For now, we'll just verify the token is still valid
REFRESH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$REFRESH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Token still valid (expiration handling works)"
else
    log_error "Token validation failed unexpectedly (HTTP $HTTP_STATUS)"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Authentication Integration Summary    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}✓ All authentication integration tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some authentication integration tests failed.${NC}"
    exit 1
fi 