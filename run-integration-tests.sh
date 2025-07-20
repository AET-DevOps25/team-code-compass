#!/bin/bash

# FlexFit Integration Tests Runner
# Starts all required services and runs comprehensive integration tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🧪 FlexFit Integration Tests Runner${NC}"
echo "========================================"

# Get the base directory
BASE_DIR="$(pwd)"

# Configuration
<<<<<<< HEAD
BASE_URL="http://localhost:8080"
USER_SERVICE_URL="http://localhost:8081"
WORKOUT_SERVICE_URL="http://localhost:8082"
TTS_SERVICE_URL="http://localhost:8083"
GENAI_WORKER_URL="http://localhost:8000"
EUREKA_URL="http://localhost:8761"
=======
SERVICES_STARTUP_TIMEOUT=60
TEST_TIMEOUT=300
DOCKER_COMPOSE_FILE="docker-compose.yml"
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b

# Function to check if Docker is running
check_docker() {
    echo -e "\n${YELLOW}🐳 Checking Docker availability...${NC}"
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to start services
start_services() {
    echo -e "\n${YELLOW}🚀 Starting all services...${NC}"
    
    # Start services with Docker Compose
    echo "Starting services with docker compose..."
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d --build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start services with docker compose${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Services started successfully${NC}"
}

# Function to wait for services to be ready
wait_for_services() {
    echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    local services=(
        "http://localhost:8080/actuator/health|API Gateway"
        "http://localhost:8081/actuator/health|User Service"
        "http://localhost:8082/actuator/health|Workout Plan Service"
        "http://localhost:8083/health|GenAI Cloud Worker"
        "http://localhost:8084/health|GenAI Local Worker"
    )
    
    local max_attempts=30
    local attempt=1
    
    for service in "${services[@]}"; do
        IFS='|' read -ra ADDR <<< "$service"
        local url="${ADDR[0]}"
        local name="${ADDR[1]}"
        
        echo -e "Checking ${name}..."
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f -s "$url" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ ${name} is ready${NC}"
                break
            else
                if [ $attempt -eq $max_attempts ]; then
                    echo -e "${RED}❌ ${name} failed to start after ${max_attempts} attempts${NC}"
                    echo -e "${YELLOW}💡 Check service logs: docker logs <service-name>${NC}"
                    return 1
                fi
                echo -e "   Attempt ${attempt}/${max_attempts}... waiting 5s"
                sleep 5
                ((attempt++))
            fi
        done
        attempt=1
    done
    
    echo -e "${GREEN}🎉 All services are ready!${NC}"
}

# Function to run integration tests
run_integration_tests() {
    echo -e "\n${PURPLE}🧪 Running Integration Tests...${NC}"
    
    local test_results=()
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Test 1: Authentication Integration Tests
    echo -e "\n${BLUE}1. Authentication Integration Tests${NC}"
    echo "Testing user registration and login via direct service and API Gateway..."
    
    if timeout $TEST_TIMEOUT node integration-tests/auth-integration.test.js; then
        echo -e "${GREEN}✅ Authentication integration tests PASSED${NC}"
        test_results+=("✅ Authentication Integration")
        ((passed_tests++))
    else
        echo -e "${RED}❌ Authentication integration tests FAILED${NC}"
        test_results+=("❌ Authentication Integration")
        ((failed_tests++))
    fi
    ((total_tests++))
    
    # Test 2: Workout Generation Integration Tests
    echo -e "\n${BLUE}2. Workout Generation Integration Tests${NC}"
    echo "Testing full workout generation flow with AI preference routing..."
    
    if timeout $TEST_TIMEOUT node integration-tests/workout-integration.test.js; then
        echo -e "${GREEN}✅ Workout generation integration tests PASSED${NC}"
        test_results+=("✅ Workout Generation Integration")
        ((passed_tests++))
    else
        echo -e "${RED}❌ Workout generation integration tests FAILED${NC}"
        test_results+=("❌ Workout Generation Integration")
        ((failed_tests++))
    fi
    ((total_tests++))
    
    # Test 3: API Gateway Routing Tests
    echo -e "\n${BLUE}3. API Gateway Routing Tests${NC}"
    echo "Testing API Gateway service routing and load balancing..."
    
    if timeout $TEST_TIMEOUT node integration-tests/api-gateway-routing.test.js; then
        echo -e "${GREEN}✅ API Gateway routing tests PASSED${NC}"
        test_results+=("✅ API Gateway Routing")
        ((passed_tests++))
    else
        echo -e "${RED}❌ API Gateway routing tests FAILED (or test file not found)${NC}"
        test_results+=("❌ API Gateway Routing")
        ((failed_tests++))
    fi
<<<<<<< HEAD
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

# Test 7: TTS Service Integration
test_tts_service_integration() {
    echo "Testing TTS service integration..."
    
    # Test health endpoint
    local health_response=$(curl -s "$TTS_SERVICE_URL/api/tts/health")
    
    if echo "$health_response" | grep -q "TTS Service"; then
        echo "✓ TTS service health check passed"
    else
        echo "✗ TTS service health check failed"
        return 1
    fi
    
    # Test available voices endpoint
    echo "  Testing available voices endpoint..."
    local voices_response=$(curl -s "$TTS_SERVICE_URL/api/tts/voices")
    
    if echo "$voices_response" | grep -q "en-US"; then
        echo "✓ Available voices endpoint working"
    else
        echo "✗ Available voices endpoint failed"
        return 1
    fi
    
    # Test metrics endpoint
    echo "  Testing metrics endpoint..."
    local metrics_response=$(curl -s "$TTS_SERVICE_URL/actuator/prometheus")
    
    if echo "$metrics_response" | grep -q "tts_"; then
        echo "✓ TTS metrics endpoint working"
        return 0
    else
        echo "✗ TTS metrics endpoint failed"
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
    run_integration_test "TTS Service Integration" test_tts_service_integration
    run_integration_test "End-to-End Workflow" test_end_to_end_workflow
    run_integration_test "Data Persistence" test_data_persistence
=======
    ((total_tests++))
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b
    
    # Summary
    echo -e "\n${PURPLE}📊 Integration Test Summary${NC}"
    echo "================================"
    echo "Total Test Suites: $total_tests"
    echo -e "Passed: ${GREEN}$passed_tests${NC}"
    echo -e "Failed: ${RED}$failed_tests${NC}"
    
    echo -e "\n${PURPLE}📋 Test Results:${NC}"
    for result in "${test_results[@]}"; do
        echo "  $result"
    done
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All integration tests passed successfully!${NC}"
        return 0
    else
        echo -e "\n${RED}❌ Some integration tests failed${NC}"
        return 1
    fi
}

# Function to stop services
stop_services() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    
    docker compose -f "$DOCKER_COMPOSE_FILE" down
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Services stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop some services${NC}"
    fi
}

# Function to collect service logs
collect_logs() {
    echo -e "\n${YELLOW}📋 Collecting service logs...${NC}"
    
    local log_dir="integration-test-logs"
    mkdir -p "$log_dir"
    
    local services=(
        "flexfit-api-gateway"
        "flexfit-user-service"
        "flexfit-workout-plan-service"
        "flexfit-genai-worker-cloud"
        "flexfit-genai-worker-local"
    )
    
    for service in "${services[@]}"; do
        echo "Collecting logs for $service..."
        docker logs "$service" > "$log_dir/$service.log" 2>&1 || echo "Failed to collect logs for $service"
    done
    
    echo -e "${GREEN}✅ Logs collected in $log_dir/${NC}"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --start-only      Start services only (don't run tests)"
    echo "  --test-only       Run tests only (assume services are running)"
    echo "  --stop-only       Stop services only"
    echo "  --logs            Collect service logs"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                Run full integration test suite"
    echo "  $0 --start-only   Start all services and wait"
    echo "  $0 --test-only    Run tests against running services"
    echo "  $0 --logs         Collect logs from all services"
}

# Main execution logic
main() {
    local start_services=true
    local run_tests=true
    local stop_services_after=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --start-only)
                run_tests=false
                stop_services_after=false
                shift
                ;;
            --test-only)
                start_services=false
                stop_services_after=false
                shift
                ;;
            --stop-only)
                start_services=false
                run_tests=false
                stop_services_after=true
                shift
                ;;
            --logs)
                collect_logs
                exit 0
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Check Docker availability
    if [ "$start_services" = true ] || [ "$stop_services_after" = true ]; then
        check_docker
    fi
    
    # Create integration-tests directory if it doesn't exist
    mkdir -p integration-tests
    
    local test_success=true
    
    # Trap to ensure cleanup on exit
    trap 'if [ "$stop_services_after" = true ]; then stop_services; fi' EXIT
    
    # Start services if requested
    if [ "$start_services" = true ]; then
        start_services
        wait_for_services
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to start services${NC}"
            collect_logs
            exit 1
        fi
    fi
    
    # Run tests if requested
    if [ "$run_tests" = true ]; then
        # Always check service health before running tests
        if [ "$start_services" = false ]; then
            echo -e "\n${YELLOW}🏥 Checking if services are ready for testing...${NC}"
            wait_for_services
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ Services are not ready for testing${NC}"
                exit 1
            fi
        fi
        
        run_integration_tests
        test_success=$?
    fi
    
    # Stop services if requested and not trapped
    if [ "$stop_services_after" = true ] && [ "$run_tests" = true ]; then
        trap - EXIT  # Remove trap since we're handling it manually
        stop_services
    fi
    
    # Final result
    if [ "$run_tests" = true ]; then
        if [ $test_success -eq 0 ]; then
            echo -e "\n${GREEN}🎉 Integration test suite completed successfully!${NC}"
            exit 0
        else
            echo -e "\n${RED}❌ Integration test suite failed${NC}"
            echo -e "${YELLOW}💡 Run with --logs to collect service logs for debugging${NC}"
            exit 1
        fi
    else
        echo -e "\n${GREEN}✅ Services are running and ready for testing${NC}"
        echo -e "${YELLOW}💡 Run integration tests with: $0 --test-only${NC}"
        echo -e "${YELLOW}💡 Stop services with: $0 --stop-only${NC}"
    fi
}

# Run main function with all arguments
main "$@" 