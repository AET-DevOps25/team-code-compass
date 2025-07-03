#!/bin/bash

# Stress Testing Script
# Tests system performance under high load conditions

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
STRESS_LEVELS=(20 50 100 200)  # Progressive stress levels
REQUESTS_PER_LEVEL=50
RAMP_UP_TIME=5  # seconds between levels

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Stress Testing                        ${NC}"
echo -e "${BLUE}========================================${NC}"

# Setup Test User
log_info "Setting up test user for stress testing..."
TEST_EMAIL="stresstest@example.com"
TEST_PASSWORD="stresstest123"

REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "stresstest",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "firstName": "Stress",
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

# Get JWT Token
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

# Stress Test Function
run_stress_level() {
    local concurrent_requests=$1
    local level_name=$2
    local results_file="/tmp/stress_test_level_$level_name.txt"
    
    log_info "Running stress test level: $level_name ($concurrent_requests concurrent requests)"
    
    local successful=0
    local failed=0
    local start_time=$(date +%s.%N)
    
    # Generate background load
    PIDS=()
    for i in $(seq 1 $concurrent_requests); do
        {
            local request_start=$(date +%s.%N)
            
            # Randomly choose request type
            case $((RANDOM % 4)) in
                0)
                    # Profile request
                    RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
                      -H "Authorization: Bearer $JWT_TOKEN" --max-time 10)
                    ;;
                1)
                    # Workout generation request
                    RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
                      -H "Content-Type: application/json" \
                      -H "Authorization: Bearer $JWT_TOKEN" \
                      --max-time 30 \
                      -d '{
                        "userId": "'$USER_ID'",
                        "dayDate": "2025-01-'$((25 + RANDOM % 5))'",
                        "focusSportType": "STRENGTH",
                        "targetDurationMinutes": 30
                      }')
                    ;;
                2)
                    # Workout retrieval request
                    RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$USER_ID/date/2025-01-25" \
                      -H "Authorization: Bearer $JWT_TOKEN" --max-time 10)
                    ;;
                3)
                    # Health check request
                    RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/health" --max-time 5)
                    ;;
            esac
            
            local request_end=$(date +%s.%N)
            local request_time=$(echo "$request_end - $request_start" | bc)
            
            HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
            
            if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
                echo "SUCCESS:$request_time" >> "$results_file"
            else
                echo "FAILED:$HTTP_STATUS:$request_time" >> "$results_file"
            fi
        } &
        PIDS+=($!)
        
        # Small delay to simulate realistic load pattern
        sleep 0.01
    done
    
    # Wait for all requests to complete
    for pid in "${PIDS[@]}"; do
        wait $pid 2>/dev/null || true  # Ignore errors for stress testing
    done
    
    local end_time=$(date +%s.%N)
    local total_time=$(echo "$end_time - $start_time" | bc)
    
    # Analyze results
    if [[ -f "$results_file" ]]; then
        successful=$(grep -c "SUCCESS:" "$results_file" 2>/dev/null || echo "0")
        failed=$(grep -c "FAILED:" "$results_file" 2>/dev/null || echo "0")
        
        # Calculate response time statistics
        local avg_response_time="0"
        if [[ $successful -gt 0 ]]; then
            local total_response_time=$(grep "SUCCESS:" "$results_file" | cut -d: -f2 | paste -sd+ | bc)
            avg_response_time=$(echo "scale=3; $total_response_time / $successful" | bc)
        fi
        
        rm -f "$results_file"
    fi
    
    local success_rate=0
    local total_requests=$((successful + failed))
    if [[ $total_requests -gt 0 ]]; then
        success_rate=$((successful * 100 / total_requests))
    fi
    
    local requests_per_second=$(echo "scale=2; $total_requests / $total_time" | bc)
    
    echo "Level $level_name Results:"
    echo "  Concurrent Requests: $concurrent_requests"
    echo "  Total Requests: $total_requests"
    echo "  Successful: $successful"
    echo "  Failed: $failed"
    echo "  Success Rate: ${success_rate}%"
    echo "  Total Time: ${total_time}s"
    echo "  Requests/sec: $requests_per_second"
    echo "  Avg Response Time: ${avg_response_time}s"
    
    # Store results for summary
    echo "$level_name:$concurrent_requests:$total_requests:$successful:$failed:$success_rate:$requests_per_second:$avg_response_time:$total_time" >> "/tmp/stress_test_summary.txt"
    
    # Evaluate level performance
    if [[ $success_rate -ge 80 ]]; then
        log_success "Level $level_name: System handled $concurrent_requests concurrent requests well"
        return 0
    elif [[ $success_rate -ge 50 ]]; then
        log_warning "Level $level_name: System degraded but functional under $concurrent_requests concurrent requests"
        return 1
    else
        log_error "Level $level_name: System failed under $concurrent_requests concurrent requests"
        return 2
    fi
}

# Run Progressive Stress Tests
log_info "Starting progressive stress testing..."
echo "" > "/tmp/stress_test_summary.txt"

OVERALL_RESULT=0
MAX_SUCCESSFUL_LEVEL=0

for level in "${STRESS_LEVELS[@]}"; do
    echo -e "\n${YELLOW}--- Stress Level: $level concurrent requests ---${NC}"
    
    if run_stress_level $level $level; then
        MAX_SUCCESSFUL_LEVEL=$level
    else
        OVERALL_RESULT=1
    fi
    
    # Brief pause between levels to let system recover
    log_info "Waiting ${RAMP_UP_TIME}s before next level..."
    sleep $RAMP_UP_TIME
done

# System Recovery Test
log_info "Testing system recovery after stress..."
sleep 10

RECOVERY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$RECOVERY_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "System recovered successfully after stress testing"
else
    log_error "System did not recover properly after stress testing"
    OVERALL_RESULT=1
fi

# Generate Summary Report
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Stress Test Summary                   ${NC}"
echo -e "${BLUE}========================================${NC}"

if [[ -f "/tmp/stress_test_summary.txt" ]]; then
    echo -e "${BLUE}Level\tConcurrent\tTotal\tSuccess\tFailed\tRate\tReq/s\tAvgTime${NC}"
    echo -e "${BLUE}-----\t----------\t-----\t-------\t------\t----\t-----\t-------${NC}"
    
    while IFS=':' read -r level concurrent total successful failed rate rps avg_time duration; do
        if [[ -n "$level" ]]; then
            printf "%-5s\t%-10s\t%-5s\t%-7s\t%-6s\t%-4s%%\t%-5s\t%-7ss\n" \
                "$level" "$concurrent" "$total" "$successful" "$failed" "$rate" "$rps" "$avg_time"
        fi
    done < "/tmp/stress_test_summary.txt"
    
    rm -f "/tmp/stress_test_summary.txt"
fi

echo -e "\n${BLUE}Performance Analysis:${NC}"
echo -e "Maximum Successful Level: ${GREEN}$MAX_SUCCESSFUL_LEVEL concurrent requests${NC}"

if [[ $MAX_SUCCESSFUL_LEVEL -ge 100 ]]; then
    log_success "Excellent stress tolerance (≥100 concurrent requests)"
elif [[ $MAX_SUCCESSFUL_LEVEL -ge 50 ]]; then
    log_success "Good stress tolerance (≥50 concurrent requests)"
elif [[ $MAX_SUCCESSFUL_LEVEL -ge 20 ]]; then
    log_warning "Moderate stress tolerance (≥20 concurrent requests)"
else
    log_error "Poor stress tolerance (<20 concurrent requests)"
fi

# Memory and CPU Usage Check (if available)
if command -v free &> /dev/null; then
    echo -e "\n${BLUE}System Resources After Stress Test:${NC}"
    free -h
fi

if command -v top &> /dev/null; then
    echo -e "\n${BLUE}Top Processes:${NC}"
    top -b -n1 | head -10
fi

# Final Result
if [[ $OVERALL_RESULT -eq 0 ]]; then
    echo -e "\n${GREEN}✓ Stress test completed successfully!${NC}"
    echo -e "${GREEN}✓ System demonstrated good resilience under stress.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠ Stress test completed with warnings.${NC}"
    echo -e "${YELLOW}⚠ System showed some degradation under high stress.${NC}"
    exit 1
fi 