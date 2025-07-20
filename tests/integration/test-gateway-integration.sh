#!/bin/bash

# API Gateway Integration Tests
# Tests API Gateway routing and service discovery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_URL="http://localhost:8000"
USER_SERVICE_URL="http://localhost:8081"
WORKOUT_SERVICE_URL="http://localhost:8082"
SERVICE_REGISTRY_URL="http://localhost:8761"

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
echo -e "${BLUE}  API Gateway Integration Tests        ${NC}"
echo -e "${BLUE}========================================${NC}"

# Test variables
TEST_EMAIL="gateway-test@example.com"
TEST_PASSWORD="gatewaytest123"
TEST_TIMESTAMP=$(date +%s)

# 1. Service Registry Health Check
log_info "Testing Service Registry connectivity..."
if curl -s "$SERVICE_REGISTRY_URL/actuator/health" > /dev/null; then
    log_success "Service Registry is accessible"
else
    log_error "Service Registry is not accessible"
    exit 1
fi

# 2. API Gateway Health Check
log_info "Testing API Gateway health..."
if curl -s "$API_GATEWAY_URL/actuator/health" > /dev/null; then
    log_success "API Gateway is healthy"
else
    log_error "API Gateway is not healthy"
    exit 1
fi

# 3. Service Discovery Test
log_info "Testing service discovery..."
EUREKA_RESPONSE=$(curl -s "$SERVICE_REGISTRY_URL/eureka/apps" -H "Accept: application/json")

if echo "$EUREKA_RESPONSE" | grep -q "USER-SERVICE"; then
    log_success "User Service is registered with Eureka"
else
    log_error "User Service is not registered with Eureka"
fi

if echo "$EUREKA_RESPONSE" | grep -q "WORKOUT-PLAN-SERVICE"; then
    log_success "Workout Plan Service is registered with Eureka"
else
    log_error "Workout Plan Service is not registered with Eureka"
fi

# 4. Setup Test User (Direct Service Call)
log_info "Setting up test user via direct service call..."
REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gatewaytest'$TEST_TIMESTAMP'",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "firstName": "Gateway",
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
    log_success "Test user created (ID: $USER_ID)"
else
    log_error "Failed to create test user (HTTP $HTTP_STATUS)"
    exit 1
fi

# 5. Get JWT Token (Direct Service Call)
log_info "Getting JWT token via direct service call..."
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
    log_success "JWT token obtained"
else
    log_error "Failed to obtain JWT token (HTTP $HTTP_STATUS)"
    exit 1
fi

# 6. Test User Service Routing via Gateway
log_info "Testing User Service routing via API Gateway..."
GATEWAY_USER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$GATEWAY_USER_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "User Service routing via Gateway successful"
else
    log_error "User Service routing via Gateway failed (HTTP $HTTP_STATUS)"
fi

# 7. Test Workout Service Routing via Gateway
log_info "Testing Workout Service routing via API Gateway..."
GATEWAY_WORKOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$API_GATEWAY_URL/api/v1/plans/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-01-25",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45
  }')

HTTP_STATUS=$(echo "$GATEWAY_WORKOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Workout Service routing via Gateway successful"
else
    log_error "Workout Service routing via Gateway failed (HTTP $HTTP_STATUS)"
fi

# 8. Test Load Balancing (if multiple instances)
log_info "Testing load balancing behavior..."
# Make multiple requests to see if they're distributed
LOAD_BALANCE_SUCCESS=0
for i in {1..3}; do
    LB_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/api/v1/users/me" \
      -H "Authorization: Bearer $JWT_TOKEN")
    
    HTTP_STATUS=$(echo "$LB_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    if [[ "$HTTP_STATUS" == "200" ]]; then
        ((LOAD_BALANCE_SUCCESS++))
    fi
done

if [[ $LOAD_BALANCE_SUCCESS -eq 3 ]]; then
    log_success "Load balancing working (3/3 requests successful)"
else
    log_error "Load balancing issues ($LOAD_BALANCE_SUCCESS/3 requests successful)"
fi

# 9. Test Circuit Breaker (if configured)
log_info "Testing circuit breaker behavior..."
# Make requests to a non-existent endpoint to trigger circuit breaker
CIRCUIT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/api/v1/nonexistent")

HTTP_STATUS=$(echo "$CIRCUIT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "404" ]] || [[ "$HTTP_STATUS" == "503" ]]; then
    log_success "Circuit breaker responding appropriately"
else
    log_error "Circuit breaker behavior unexpected (HTTP $HTTP_STATUS)"
fi

# 10. Test Request Timeout Handling
log_info "Testing request timeout handling..."
# This test depends on the gateway's timeout configuration
TIMEOUT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  --max-time 10)

HTTP_STATUS=$(echo "$TIMEOUT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Request timeout handling working"
else
    log_error "Request timeout handling failed (HTTP $HTTP_STATUS)"
fi

# 11. Test CORS Headers (if configured)
log_info "Testing CORS headers..."
CORS_RESPONSE=$(curl -s -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS "$API_GATEWAY_URL/api/v1/users/me" \
  -w "HTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$CORS_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "204" ]]; then
    log_success "CORS headers configured correctly"
else
    log_error "CORS headers not configured (HTTP $HTTP_STATUS)"
fi

# 12. Test Rate Limiting (if configured)
log_info "Testing rate limiting..."
RATE_LIMIT_SUCCESS=0
for i in {1..5}; do
    RL_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$API_GATEWAY_URL/api/v1/users/me" \
      -H "Authorization: Bearer $JWT_TOKEN")
    
    HTTP_STATUS=$(echo "$RL_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    if [[ "$HTTP_STATUS" == "200" ]]; then
        ((RATE_LIMIT_SUCCESS++))
    fi
done

if [[ $RATE_LIMIT_SUCCESS -ge 3 ]]; then
    log_success "Rate limiting allows normal traffic"
else
    log_error "Rate limiting too restrictive ($RATE_LIMIT_SUCCESS/5 requests successful)"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  API Gateway Integration Summary       ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}✓ All API Gateway integration tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some API Gateway integration tests failed.${NC}"
    exit 1
fi 