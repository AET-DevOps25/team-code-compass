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