#!/bin/bash

# Load Testing Script
# Tests system performance under normal load conditions

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
CONCURRENT_USERS=10
REQUESTS_PER_USER=20
TOTAL_REQUESTS=$((CONCURRENT_USERS * REQUESTS_PER_USER))

# Test counters
SUCCESSFUL_REQUESTS=0
FAILED_REQUESTS=0
TOTAL_TIME=0

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Load Testing                          ${NC}"
echo -e "${BLUE}========================================${NC}"

# Setup Test Users
log_info "Setting up test users for load testing..."
TEST_USERS=()
JWT_TOKENS=()

for i in $(seq 1 $CONCURRENT_USERS); do
    TEST_EMAIL="loadtest$i@example.com"
    TEST_PASSWORD="loadtest123"
    
    # Register user
    REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "loadtest'$i'",
        "email": "'$TEST_EMAIL'",
        "password": "'$TEST_PASSWORD'",
        "firstName": "Load",
        "lastName": "Test'$i'",
        "dateOfBirth": "1990-01-01",
        "gender": "MALE",
        "heightCm": 180,
        "weightKg": 75
      }')
    
    HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    if [[ "$HTTP_STATUS" == "201" ]]; then
        USER_ID=$(echo "$REGISTER_BODY" | jq -r '.id')
        TEST_USERS+=("$USER_ID")
        
        # Login to get JWT token
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
            JWT_TOKENS+=("$JWT_TOKEN")
        fi
    fi
done

log_info "Created ${#TEST_USERS[@]} test users for load testing"

# Load Test Function
run_load_test() {
    local user_index=$1
    local user_id="${TEST_USERS[$user_index]}"
    local jwt_token="${JWT_TOKENS[$user_index]}"
    local results_file="/tmp/load_test_user_$user_index.txt"
    
    echo "Starting load test for user $((user_index + 1))" > "$results_file"
    
    local user_successful=0
    local user_failed=0
    local start_time=$(date +%s.%N)
    
    for j in $(seq 1 $REQUESTS_PER_USER); do
        local request_start=$(date +%s.%N)
        
        # Alternate between different types of requests
        case $((j % 4)) in
            0)
                # Profile request
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
                  -H "Authorization: Bearer $jwt_token")
                ;;
            1)
                # Workout generation request
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
                  -H "Content-Type: application/json" \
                  -H "Authorization: Bearer $jwt_token" \
                  -d '{
                    "userId": "'$user_id'",
                    "dayDate": "2025-01-'$((25 + j % 5))'",
                    "focusSportType": "STRENGTH",
                    "targetDurationMinutes": 30
                  }')
                ;;
            2)
                # Workout retrieval request
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$user_id/date/2025-01-25" \
                  -H "Authorization: Bearer $jwt_token")
                ;;
            3)
                # Health check request
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/health")
                ;;
        esac
        
        local request_end=$(date +%s.%N)
        local request_time=$(echo "$request_end - $request_start" | bc)
        
        HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
        
        if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
            ((user_successful++))
            echo "Request $j: SUCCESS (${request_time}s)" >> "$results_file"
        else
            ((user_failed++))
            echo "Request $j: FAILED (HTTP $HTTP_STATUS, ${request_time}s)" >> "$results_file"
        fi
    done
    
    local end_time=$(date +%s.%N)
    local total_user_time=$(echo "$end_time - $start_time" | bc)
    
    echo "User $((user_index + 1)) completed: $user_successful successful, $user_failed failed in ${total_user_time}s" >> "$results_file"
    echo "$user_successful:$user_failed:$total_user_time" > "/tmp/load_test_result_$user_index.txt"
}

# Run Load Test
log_info "Starting load test with $CONCURRENT_USERS concurrent users, $REQUESTS_PER_USER requests each..."
START_TIME=$(date +%s.%N)

# Start all users concurrently
PIDS=()
for i in $(seq 0 $((CONCURRENT_USERS - 1))); do
    run_load_test $i &
    PIDS+=($!)
done

# Wait for all users to complete
for pid in "${PIDS[@]}"; do
    wait $pid
done

END_TIME=$(date +%s.%N)
TOTAL_TEST_TIME=$(echo "$END_TIME - $START_TIME" | bc)

# Collect Results
log_info "Collecting load test results..."
for i in $(seq 0 $((CONCURRENT_USERS - 1))); do
    if [[ -f "/tmp/load_test_result_$i.txt" ]]; then
        IFS=':' read -r successful failed user_time < "/tmp/load_test_result_$i.txt"
        SUCCESSFUL_REQUESTS=$((SUCCESSFUL_REQUESTS + successful))
        FAILED_REQUESTS=$((FAILED_REQUESTS + failed))
        rm -f "/tmp/load_test_result_$i.txt"
        rm -f "/tmp/load_test_user_$i.txt"
    fi
done

# Calculate Metrics
SUCCESS_RATE=$((SUCCESSFUL_REQUESTS * 100 / TOTAL_REQUESTS))
REQUESTS_PER_SECOND=$(echo "scale=2; $TOTAL_REQUESTS / $TOTAL_TEST_TIME" | bc)
AVG_RESPONSE_TIME=$(echo "scale=3; $TOTAL_TEST_TIME / $TOTAL_REQUESTS" | bc)

# Results
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Load Test Results                     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Concurrent Users:      $CONCURRENT_USERS"
echo -e "Requests per User:     $REQUESTS_PER_USER"
echo -e "Total Requests:        $TOTAL_REQUESTS"
echo -e "Successful Requests:   ${GREEN}$SUCCESSFUL_REQUESTS${NC}"
echo -e "Failed Requests:       ${RED}$FAILED_REQUESTS${NC}"
echo -e "Success Rate:          ${SUCCESS_RATE}%"
echo -e "Total Test Time:       ${TOTAL_TEST_TIME}s"
echo -e "Requests per Second:   $REQUESTS_PER_SECOND"
echo -e "Avg Response Time:     ${AVG_RESPONSE_TIME}s"

# Performance Evaluation
echo -e "\n${BLUE}Performance Evaluation:${NC}"
if [[ $SUCCESS_RATE -ge 95 ]]; then
    log_success "Excellent success rate (≥95%)"
elif [[ $SUCCESS_RATE -ge 90 ]]; then
    echo -e "${YELLOW}[WARN]${NC} Good success rate (≥90%)"
else
    log_error "Poor success rate (<90%)"
fi

if (( $(echo "$REQUESTS_PER_SECOND >= 50" | bc -l) )); then
    log_success "Excellent throughput (≥50 req/s)"
elif (( $(echo "$REQUESTS_PER_SECOND >= 20" | bc -l) )); then
    echo -e "${YELLOW}[WARN]${NC} Good throughput (≥20 req/s)"
else
    log_error "Poor throughput (<20 req/s)"
fi

if (( $(echo "$AVG_RESPONSE_TIME <= 1.0" | bc -l) )); then
    log_success "Excellent response time (≤1s)"
elif (( $(echo "$AVG_RESPONSE_TIME <= 3.0" | bc -l) )); then
    echo -e "${YELLOW}[WARN]${NC} Acceptable response time (≤3s)"
else
    log_error "Poor response time (>3s)"
fi

# Exit with appropriate code
if [[ $SUCCESS_RATE -ge 90 ]] && (( $(echo "$REQUESTS_PER_SECOND >= 20" | bc -l) )) && (( $(echo "$AVG_RESPONSE_TIME <= 3.0" | bc -l) )); then
    echo -e "\n${GREEN}✓ Load test passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Load test failed - performance below acceptable thresholds.${NC}"
    exit 1
fi 