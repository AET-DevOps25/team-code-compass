#!/bin/bash

# Concurrent Users Testing Script
# Tests system performance with realistic concurrent user scenarios

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
CONCURRENT_USERS=25
TEST_DURATION=60  # seconds
USER_THINK_TIME=2  # seconds between user actions

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
echo -e "${BLUE}  Concurrent Users Testing              ${NC}"
echo -e "${BLUE}========================================${NC}"

# Setup Test Users
log_info "Setting up $CONCURRENT_USERS test users..."
TEST_USERS=()
JWT_TOKENS=()

for i in $(seq 1 $CONCURRENT_USERS); do
    TEST_EMAIL="concurrenttest$i@example.com"
    TEST_PASSWORD="concurrent123"
    
    # Register user
    REGISTER_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$USER_SERVICE_URL/api/v1/users/register" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "concurrenttest'$i'",
        "email": "'$TEST_EMAIL'",
        "password": "'$TEST_PASSWORD'",
        "firstName": "Concurrent",
        "lastName": "Test'$i'",
        "dateOfBirth": "1990-01-01",
        "gender": "MALE",
        "heightCm": '$((170 + RANDOM % 20))',
        "weightKg": '$((65 + RANDOM % 20))'
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
    
    # Progress indicator
    if [[ $((i % 5)) -eq 0 ]]; then
        echo -n "."
    fi
done

echo ""
log_info "Created ${#TEST_USERS[@]} test users successfully"

# Simulate Realistic User Behavior
simulate_user_session() {
    local user_index=$1
    local user_id="${TEST_USERS[$user_index]}"
    local jwt_token="${JWT_TOKENS[$user_index]}"
    local session_file="/tmp/user_session_$user_index.txt"
    local end_time=$(($(date +%s) + TEST_DURATION))
    
    echo "User $((user_index + 1)) session started" > "$session_file"
    
    local actions_completed=0
    local successful_actions=0
    local failed_actions=0
    
    while [[ $(date +%s) -lt $end_time ]]; do
        local action_start=$(date +%s.%N)
        
        # Realistic user workflow
        case $((actions_completed % 8)) in
            0)
                # User checks profile
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
                  -H "Authorization: Bearer $jwt_token" --max-time 10)
                ACTION="profile_check"
                ;;
            1)
                # User generates a workout
                SPORT_TYPES=("STRENGTH" "HIIT" "YOGA_MOBILITY")
                SPORT_TYPE="${SPORT_TYPES[$((RANDOM % 3))]}"
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
                  -H "Content-Type: application/json" \
                  -H "Authorization: Bearer $jwt_token" \
                  --max-time 30 \
                  -d '{
                    "userId": "'$user_id'",
                    "dayDate": "2025-01-'$((25 + RANDOM % 5))'",
                    "focusSportType": "'$SPORT_TYPE'",
                    "targetDurationMinutes": '$((30 + RANDOM % 30))'
                  }')
                ACTION="workout_generation"
                ;;
            2)
                # User views workout history
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$user_id/range?startDate=2025-01-25&endDate=2025-01-30" \
                  -H "Authorization: Bearer $jwt_token" --max-time 10)
                ACTION="workout_history"
                ;;
            3)
                # User checks specific workout
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$user_id/date/2025-01-25" \
                  -H "Authorization: Bearer $jwt_token" --max-time 10)
                ACTION="workout_detail"
                ;;
            4)
                # User generates another workout (different type)
                SPORT_TYPES=("STRENGTH" "HIIT" "YOGA_MOBILITY")
                SPORT_TYPE="${SPORT_TYPES[$((RANDOM % 3))]}"
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
                  -H "Content-Type: application/json" \
                  -H "Authorization: Bearer $jwt_token" \
                  --max-time 30 \
                  -d '{
                    "userId": "'$user_id'",
                    "dayDate": "2025-01-'$((26 + RANDOM % 4))'",
                    "focusSportType": "'$SPORT_TYPE'",
                    "targetDurationMinutes": '$((30 + RANDOM % 30))'
                  }')
                ACTION="workout_generation_2"
                ;;
            5)
                # User checks profile again
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$USER_SERVICE_URL/api/v1/users/me" \
                  -H "Authorization: Bearer $jwt_token" --max-time 10)
                ACTION="profile_recheck"
                ;;
            6)
                # User browses workout history again
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "$WORKOUT_SERVICE_URL/api/v1/plans/user/$user_id/range?startDate=2025-01-20&endDate=2025-01-31" \
                  -H "Authorization: Bearer $jwt_token" --max-time 10)
                ACTION="extended_history"
                ;;
            7)
                # User generates final workout
                SPORT_TYPES=("STRENGTH" "HIIT" "YOGA_MOBILITY")
                SPORT_TYPE="${SPORT_TYPES[$((RANDOM % 3))]}"
                RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$WORKOUT_SERVICE_URL/api/v1/plans/generate" \
                  -H "Content-Type: application/json" \
                  -H "Authorization: Bearer $jwt_token" \
                  --max-time 30 \
                  -d '{
                    "userId": "'$user_id'",
                    "dayDate": "2025-02-0'$((1 + RANDOM % 9))'",
                    "focusSportType": "'$SPORT_TYPE'",
                    "targetDurationMinutes": '$((45 + RANDOM % 30))'
                  }')
                ACTION="final_workout"
                ;;
        esac
        
        local action_end=$(date +%s.%N)
        local action_time=$(echo "$action_end - $action_start" | bc)
        
        HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
        
        if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
            ((successful_actions++))
            echo "Action $((actions_completed + 1)) ($ACTION): SUCCESS (${action_time}s)" >> "$session_file"
        else
            ((failed_actions++))
            echo "Action $((actions_completed + 1)) ($ACTION): FAILED (HTTP $HTTP_STATUS, ${action_time}s)" >> "$session_file"
        fi
        
        ((actions_completed++))
        
        # Realistic user think time
        sleep $USER_THINK_TIME
    done
    
    echo "User $((user_index + 1)) completed: $actions_completed actions, $successful_actions successful, $failed_actions failed" >> "$session_file"
    echo "$actions_completed:$successful_actions:$failed_actions" > "/tmp/user_result_$user_index.txt"
}

# Run Concurrent User Simulation
log_info "Starting concurrent user simulation for ${TEST_DURATION}s..."
START_TIME=$(date +%s)

# Start all user sessions concurrently
PIDS=()
for i in $(seq 0 $((CONCURRENT_USERS - 1))); do
    simulate_user_session $i &
    PIDS+=($!)
    
    # Stagger user starts slightly to simulate realistic arrival pattern
    sleep 0.1
done

# Progress indicator
while [[ ${#PIDS[@]} -gt 0 ]]; do
    RUNNING_PIDS=()
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            RUNNING_PIDS+=("$pid")
        fi
    done
    PIDS=("${RUNNING_PIDS[@]}")
    
    if [[ ${#PIDS[@]} -gt 0 ]]; then
        echo -n "."
        sleep 5
    fi
done

echo ""
END_TIME=$(date +%s)
ACTUAL_TEST_TIME=$((END_TIME - START_TIME))

# Collect Results
log_info "Collecting concurrent user test results..."
TOTAL_ACTIONS=0
TOTAL_SUCCESSFUL=0
TOTAL_FAILED=0

for i in $(seq 0 $((CONCURRENT_USERS - 1))); do
    if [[ -f "/tmp/user_result_$i.txt" ]]; then
        IFS=':' read -r actions successful failed < "/tmp/user_result_$i.txt"
        TOTAL_ACTIONS=$((TOTAL_ACTIONS + actions))
        TOTAL_SUCCESSFUL=$((TOTAL_SUCCESSFUL + successful))
        TOTAL_FAILED=$((TOTAL_FAILED + failed))
        rm -f "/tmp/user_result_$i.txt"
        rm -f "/tmp/user_session_$i.txt"
    fi
done

# Calculate Metrics
SUCCESS_RATE=0
if [[ $TOTAL_ACTIONS -gt 0 ]]; then
    SUCCESS_RATE=$((TOTAL_SUCCESSFUL * 100 / TOTAL_ACTIONS))
fi

ACTIONS_PER_SECOND=$(echo "scale=2; $TOTAL_ACTIONS / $ACTUAL_TEST_TIME" | bc)
ACTIONS_PER_USER=$(echo "scale=1; $TOTAL_ACTIONS / $CONCURRENT_USERS" | bc)
AVG_USER_SESSION_TIME=$(echo "scale=1; $ACTUAL_TEST_TIME" | bc)

# Results
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Concurrent Users Test Results         ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Concurrent Users:          $CONCURRENT_USERS"
echo -e "Test Duration:             ${ACTUAL_TEST_TIME}s (planned: ${TEST_DURATION}s)"
echo -e "Total User Actions:        $TOTAL_ACTIONS"
echo -e "Successful Actions:        ${GREEN}$TOTAL_SUCCESSFUL${NC}"
echo -e "Failed Actions:            ${RED}$TOTAL_FAILED${NC}"
echo -e "Success Rate:              ${SUCCESS_RATE}%"
echo -e "Actions per Second:        $ACTIONS_PER_SECOND"
echo -e "Actions per User:          $ACTIONS_PER_USER"
echo -e "User Think Time:           ${USER_THINK_TIME}s"

# Performance Evaluation
echo -e "\n${BLUE}Performance Evaluation:${NC}"

if [[ $SUCCESS_RATE -ge 95 ]]; then
    log_success "Excellent success rate under concurrent load (≥95%)"
elif [[ $SUCCESS_RATE -ge 90 ]]; then
    log_warning "Good success rate under concurrent load (≥90%)"
else
    log_error "Poor success rate under concurrent load (<90%)"
fi

if (( $(echo "$ACTIONS_PER_SECOND >= 10" | bc -l) )); then
    log_success "Excellent throughput with concurrent users (≥10 actions/s)"
elif (( $(echo "$ACTIONS_PER_SECOND >= 5" | bc -l) )); then
    log_warning "Good throughput with concurrent users (≥5 actions/s)"
else
    log_error "Poor throughput with concurrent users (<5 actions/s)"
fi

if (( $(echo "$ACTIONS_PER_USER >= 10" | bc -l) )); then
    log_success "Users completed many actions (≥10 per user)"
elif (( $(echo "$ACTIONS_PER_USER >= 5" | bc -l) )); then
    log_warning "Users completed moderate actions (≥5 per user)"
else
    log_error "Users completed few actions (<5 per user)"
fi

# System Health Check After Test
log_info "Checking system health after concurrent user test..."
HEALTH_CHECKS=0
HEALTH_PASSED=0

# Check User Service
if curl -s "$USER_SERVICE_URL/health" > /dev/null; then
    ((HEALTH_PASSED++))
fi
((HEALTH_CHECKS++))

# Check Workout Service
if curl -s "$WORKOUT_SERVICE_URL/health" > /dev/null; then
    ((HEALTH_PASSED++))
fi
((HEALTH_CHECKS++))

if [[ $HEALTH_PASSED -eq $HEALTH_CHECKS ]]; then
    log_success "All services healthy after concurrent user test"
else
    log_error "Some services unhealthy after concurrent user test ($HEALTH_PASSED/$HEALTH_CHECKS)"
fi

# Final Evaluation
OVERALL_SCORE=0
if [[ $SUCCESS_RATE -ge 90 ]]; then
    ((OVERALL_SCORE++))
fi
if (( $(echo "$ACTIONS_PER_SECOND >= 5" | bc -l) )); then
    ((OVERALL_SCORE++))
fi
if [[ $HEALTH_PASSED -eq $HEALTH_CHECKS ]]; then
    ((OVERALL_SCORE++))
fi

echo -e "\n${BLUE}Overall Assessment:${NC}"
if [[ $OVERALL_SCORE -eq 3 ]]; then
    log_success "Excellent concurrent user performance!"
    echo -e "${GREEN}✓ System handles concurrent users very well${NC}"
    exit 0
elif [[ $OVERALL_SCORE -eq 2 ]]; then
    log_warning "Good concurrent user performance with minor issues"
    echo -e "${YELLOW}⚠ System handles concurrent users adequately${NC}"
    exit 0
else
    log_error "Poor concurrent user performance"
    echo -e "${RED}✗ System struggles with concurrent users${NC}"
    exit 1
fi 