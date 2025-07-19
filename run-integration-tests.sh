#!/bin/bash

# FlexFit Integration Tests Runner
# Tests service communication, database integration, and end-to-end workflows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔗 FlexFit Integration Tests Runner${NC}"
echo "====================================="

# Configuration
BASE_URL="http://localhost:8080"
USER_SERVICE_URL="http://localhost:8081"
WORKOUT_SERVICE_URL="http://localhost:8082"
GENAI_WORKER_URL="http://localhost:8000"
EUREKA_URL="http://localhost:8761"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=()

# Function to wait for services to be ready
wait_for_services() {
    echo -e "\n${YELLOW}🚀 Starting services and waiting for readiness...${NC}"
    
    # Start services if not running
    if ! docker compose ps --services --filter status=running | grep -q "user-service"; then
        echo "Starting services..."
        docker compose up -d
        sleep 30
    fi
    
    # Wait for health checks
    local services=("db:5432" "service-registry:8761" "user-service:8081" "workout-plan-service:8082" "api-gateway:8080" "genai-workout-worker:8000")
    
    for service in "${services[@]}"; do
        local name="${service%:*}"
        local port="${service#*:}"
        local attempts=0
        local max_attempts=30
        
        echo -n "Waiting for $name..."
        while [ $attempts -lt $max_attempts ]; do
            if curl -s http://localhost:$port/health > /dev/null 2>&1 || \
               curl -s http://localhost:$port/actuator/health > /dev/null 2>&1; then
                echo -e " ${GREEN}✓${NC}"
                break
            fi
            echo -n "."
            sleep 2
            attempts=$((attempts + 1))
        done
        
        if [ $attempts -eq $max_attempts ]; then
            echo -e " ${RED}✗ (timeout)${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ All services are ready${NC}"
}

# Function to run integration test
run_integration_test() {
    local test_name=$1
    local test_function=$2
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "----------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if $test_function; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        FAILED_TESTS+=("$test_name")
        return 1
    fi
}

# Test 1: Service Discovery Integration
test_service_discovery() {
    echo "Testing Eureka service registry..."
    
    # Check if services are registered with Eureka
    local eureka_response=$(curl -s "$EUREKA_URL/eureka/apps" -H "Accept: application/json")
    
    if echo "$eureka_response" | grep -q "USER-SERVICE" && \
       echo "$eureka_response" | grep -q "WORKOUT-PLAN-SERVICE" && \
       echo "$eureka_response" | grep -q "API-GATEWAY"; then
        echo "✓ All services registered with Eureka"
        return 0
    else
        echo "✗ Services not properly registered with Eureka"
        return 1
    fi
}

# Test 2: Database Integration
test_database_integration() {
    echo "Testing database connectivity and schema..."
    
    # Test database connection via user service
    local health_response=$(curl -s "$USER_SERVICE_URL/actuator/health")
    
    if echo "$health_response" | grep -q '"status":"UP"' && \
       echo "$health_response" | grep -q '"db"'; then
        echo "✓ Database connection healthy"
        return 0
    else
        echo "✗ Database connection issues"
        return 1
    fi
}

# Test 3: API Gateway Routing
test_api_gateway_routing() {
    echo "Testing API Gateway routing to microservices..."
    
    # Test routing to user service
    local user_route_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/users/health" || echo "000")
    
    # Test routing to workout service  
    local workout_route_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/workout-plan-service/actuator/health" || echo "000")
    
    if [ "$user_route_response" != "000" ] && [ "$workout_route_response" != "000" ]; then
        echo "✓ API Gateway routing working"
        echo "  - User service route: $user_route_response"
        echo "  - Workout service route: $workout_route_response"
        return 0
    else
        echo "✗ API Gateway routing issues"
        return 1
    fi
}

# Test 4: Authentication Integration
test_authentication_integration() {
    echo "Testing authentication flow integration..."
    
    local timestamp=$(date +%s)
    local test_email="integrationtest$timestamp@example.com"
    local test_username="integrationuser$timestamp"
    
    # Register user
    local register_response=$(curl -s -X POST "$BASE_URL/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$test_username\",
            \"email\": \"$test_email\",
            \"password\": \"testpass123\",
            \"dateOfBirth\": \"1990-01-01\",
            \"gender\": \"MALE\",
            \"heightCm\": 180,
            \"weightKg\": 75.0
        }")
    
    if ! echo "$register_response" | grep -q '"id"'; then
        echo "✗ User registration failed"
        return 1
    fi
    
    local user_id=$(echo "$register_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "✓ User registered: $user_id"
    
    # Login user
    local login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$test_email\",
            \"password\": \"testpass123\"
        }")
    
    if ! echo "$login_response" | grep -q '"token"'; then
        echo "✗ User login failed"
        return 1
    fi
    
    local token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "✓ User logged in, token obtained"
    
    # Test authenticated request
    local profile_response=$(curl -s -X GET "$BASE_URL/api/v1/users/$user_id" \
        -H "Authorization: Bearer $token")
    
    if echo "$profile_response" | grep -q "$test_username"; then
        echo "✓ Authenticated request successful"
        return 0
    else
        echo "✗ Authenticated request failed"
        return 1
    fi
}

# Test 5: Workout Service Integration
test_workout_service_integration() {
    echo "Testing workout service integration with user service..."
    
    local timestamp=$(date +%s)
    local test_email="workouttest$timestamp@example.com"
    
    # Register and login user
    local register_response=$(curl -s -X POST "$BASE_URL/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"workoutuser$timestamp\",
            \"email\": \"$test_email\",
            \"password\": \"testpass123\",
            \"dateOfBirth\": \"1990-01-01\",
            \"gender\": \"MALE\",
            \"heightCm\": 180,
            \"weightKg\": 75.0
        }")
    
    local user_id=$(echo "$register_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    local login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$test_email\", \"password\": \"testpass123\"}")
    
    local token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    # Test workout generation with mock mode
    echo "  Testing workout generation..."
    local workout_response=$(curl -s -X POST "$BASE_URL/workout-plan-service/api/v1/plans/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"userId\": \"$user_id\",
            \"dayDate\": \"2025-01-25\",
            \"focusSportType\": \"STRENGTH\",
            \"targetDurationMinutes\": 30,
            \"textPrompt\": \"Integration test workout\"
        }")
    
    if echo "$workout_response" | grep -q '"id"' && \
       echo "$workout_response" | grep -q '"exerciseName"'; then
        echo "✓ Workout generation successful"
        local exercise_count=$(echo "$workout_response" | grep -o '"exerciseName":' | wc -l)
        echo "  - Generated $exercise_count exercises"
        return 0
    else
        echo "✗ Workout generation failed"
        echo "Response: $workout_response"
        return 1
    fi
}

# Test 6: GenAI Worker Integration
test_genai_worker_integration() {
    echo "Testing GenAI worker integration..."
    
    # Test health endpoint
    local health_response=$(curl -s "$GENAI_WORKER_URL/health")
    
    if echo "$health_response" | grep -q '"status".*"ok"'; then
        echo "✓ GenAI worker health check passed"
    else
        echo "✗ GenAI worker health check failed"
        return 1
    fi
    
    # Test mock generation (faster than real API)
    echo "  Testing mock workout generation..."
    local mock_response=$(curl -s -X POST "$GENAI_WORKER_URL/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test" \
        -d '{
            "user_profile": {"age": 30, "gender": "MALE"},
            "user_preferences": {"experienceLevel": "INTERMEDIATE"},
            "text_prompt": "Integration test",
            "focus_sport_type": "STRENGTH"
        }')
    
    if echo "$mock_response" | grep -q '"focus_sport_type_for_the_day"' && \
       echo "$mock_response" | grep -q '"scheduled_exercises"'; then
        echo "✓ GenAI worker generation successful"
        return 0
    else
        echo "✗ GenAI worker generation failed"
        return 1
    fi
}

# Test 7: End-to-End Workflow
test_end_to_end_workflow() {
    echo "Testing complete end-to-end user workflow..."
    
    local timestamp=$(date +%s)
    local test_email="e2etest$timestamp@example.com"
    
    echo "  1. User registration..."
    local register_response=$(curl -s -X POST "$BASE_URL/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"e2euser$timestamp\",
            \"email\": \"$test_email\",
            \"password\": \"testpass123\",
            \"dateOfBirth\": \"1990-01-01\",
            \"gender\": \"FEMALE\",
            \"heightCm\": 165,
            \"weightKg\": 60.0
        }")
    
    local user_id=$(echo "$register_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    echo "  2. User login..."
    local login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$test_email\", \"password\": \"testpass123\"}")
    
    local token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    echo "  3. Update user preferences..."
    local preferences_response=$(curl -s -X PUT "$BASE_URL/api/v1/users/$user_id/preferences" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{
            "experienceLevel": "BEGINNER",
            "fitnessGoals": ["WEIGHT_LOSS"],
            "preferredSportTypes": ["STRENGTH"],
            "availableEquipment": ["NO_EQUIPMENT"]
        }')
    
    echo "  4. Generate daily workout..."
    local daily_workout_response=$(curl -s -X POST "$BASE_URL/workout-plan-service/api/v1/plans/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"userId\": \"$user_id\",
            \"dayDate\": \"2025-01-25\",
            \"focusSportType\": \"STRENGTH\",
            \"targetDurationMinutes\": 30,
            \"textPrompt\": \"Beginner strength workout\"
        }")
    
    echo "  5. Verify workout saved to database..."
    local profile_response=$(curl -s -X GET "$BASE_URL/api/v1/users/$user_id" \
        -H "Authorization: Bearer $token")
    
    if echo "$register_response" | grep -q '"id"' && \
       echo "$login_response" | grep -q '"token"' && \
       echo "$daily_workout_response" | grep -q '"exerciseName"' && \
       echo "$profile_response" | grep -q '"preferences"'; then
        echo "✓ Complete end-to-end workflow successful"
        return 0
    else
        echo "✗ End-to-end workflow failed"
        return 1
    fi
}

# Test 8: Database Data Persistence
test_data_persistence() {
    echo "Testing data persistence across service restarts..."
    
    local timestamp=$(date +%s)
    local test_email="persisttest$timestamp@example.com"
    
    # Create user and workout
    local register_response=$(curl -s -X POST "$BASE_URL/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"persistuser$timestamp\",
            \"email\": \"$test_email\",
            \"password\": \"testpass123\",
            \"dateOfBirth\": \"1990-01-01\",
            \"gender\": \"MALE\",
            \"heightCm\": 180,
            \"weightKg\": 75.0
        }")
    
    local user_id=$(echo "$register_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    local login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$test_email\", \"password\": \"testpass123\"}")
    
    local token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    # Generate workout
    curl -s -X POST "$BASE_URL/workout-plan-service/api/v1/plans/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"userId\": \"$user_id\",
            \"dayDate\": \"2025-01-25\",
            \"focusSportType\": \"STRENGTH\",
            \"targetDurationMinutes\": 30,
            \"textPrompt\": \"Persistence test workout\"
        }" > /dev/null
    
    # Restart user service to test persistence
    echo "  Restarting user service..."
    docker compose restart user-service
    sleep 10
    
    # Wait for user service to be ready
    local attempts=0
    while [ $attempts -lt 15 ]; do
        if curl -s "$USER_SERVICE_URL/actuator/health" > /dev/null 2>&1; then
            break
        fi
        sleep 2
        attempts=$((attempts + 1))
    done
    
    # Verify user still exists
    local profile_response=$(curl -s -X GET "$BASE_URL/api/v1/users/$user_id" \
        -H "Authorization: Bearer $token")
    
    if echo "$profile_response" | grep -q "$user_id"; then
        echo "✓ Data persistence verified"
        return 0
    else
        echo "✗ Data persistence failed"
        return 1
    fi
}

# Main execution
main() {
    # Wait for services
    if ! wait_for_services; then
        echo -e "${RED}❌ Services not ready, aborting integration tests${NC}"
        exit 1
    fi
    
    echo -e "\n${BLUE}🧪 Running Integration Tests${NC}"
    echo "============================="
    
    # Run all integration tests
    run_integration_test "Service Discovery Integration" test_service_discovery
    run_integration_test "Database Integration" test_database_integration
    run_integration_test "API Gateway Routing" test_api_gateway_routing
    run_integration_test "Authentication Integration" test_authentication_integration
    run_integration_test "Workout Service Integration" test_workout_service_integration
    run_integration_test "GenAI Worker Integration" test_genai_worker_integration
    run_integration_test "End-to-End Workflow" test_end_to_end_workflow
    run_integration_test "Data Persistence" test_data_persistence
    
    # Summary
    echo -e "\n${BLUE}📊 Integration Test Summary${NC}"
    echo "=============================="
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"
    
    if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All integration tests passed successfully!${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Failed tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  • ${RED}$test${NC}"
        done
        exit 1
    fi
}

# Run main function
main "$@" 