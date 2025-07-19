#!/bin/bash

# FlexFit Unit Tests Runner
# Runs unit tests for all microservices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 FlexFit Unit Tests Runner${NC}"
echo "=================================="

# Get the base directory
BASE_DIR="$(pwd)"

# Function to run tests and capture results
run_test_suite() {
    local service=$1
    local test_dir=$2
    local test_command=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Directory: $test_dir"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    # Check if directory exists
    if [ ! -d "$test_dir" ]; then
        echo -e "${RED}❌ Directory $test_dir does not exist${NC}"
        return 1
    fi
    
    # Change to test directory and run command
    if cd "$test_dir" && eval "$test_command"; then
        echo -e "${GREEN}✅ $service unit tests PASSED${NC}"
        cd "$BASE_DIR"  # Return to base directory
        return 0
    else
        echo -e "${RED}❌ $service unit tests FAILED${NC}"
        cd "$BASE_DIR"  # Return to base directory even on failure
        return 1
    fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_SERVICES=()

# 1. User Service Unit Tests
echo -e "\n${BLUE}1. User Service Unit Tests${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_test_suite "User Service" \
    "server/user-service" \
    "./mvnw test -Dspring.profiles.active=test -Dmaven.test.failure.ignore=true" \
    "User Service (Spring Boot + JUnit 5)"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_SERVICES+=("User Service")
fi

# 2. Workout Plan Service Unit Tests  
echo -e "\n${BLUE}2. Workout Plan Service Unit Tests${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_test_suite "Workout Plan Service" \
    "server/workout-plan-service" \
    "./mvnw test -Dspring.profiles.active=test -Dmaven.test.failure.ignore=true" \
    "Workout Plan Service (Spring Boot + JUnit 5)"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_SERVICES+=("Workout Plan Service")
fi

# 3. API Gateway Unit Tests
echo -e "\n${BLUE}3. API Gateway Unit Tests${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_test_suite "API Gateway" \
    "server/api-gateway" \
    "./mvnw test -Dspring.profiles.active=test -Dmaven.test.failure.ignore=true" \
    "API Gateway (Spring Cloud Gateway + JUnit 5)"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_SERVICES+=("API Gateway")
fi

# 4. Service Registry Unit Tests
echo -e "\n${BLUE}4. Service Registry Unit Tests${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_test_suite "Service Registry" \
    "server/service-registry" \
    "./mvnw test -Dmaven.test.failure.ignore=true" \
    "Service Registry (Eureka Server + JUnit 5)"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_SERVICES+=("Service Registry")
fi

# 5. GenAI Worker Unit Tests
echo -e "\n${BLUE}5. GenAI Worker Unit Tests${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_test_suite "GenAI Worker" \
    "genai" \
    "python3 -m pytest test_workout_worker.py -v --tb=short" \
    "GenAI Worker (FastAPI + Pytest)"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_SERVICES+=("GenAI Worker")
fi

# 6. Frontend Unit Tests (if Next.js tests exist)
if [ -f "client/package.json" ] && grep -q '"test"' client/package.json; then
    echo -e "\n${BLUE}6. Frontend Unit Tests${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if run_test_suite "Frontend" \
        "client" \
        "npm test -- --watchAll=false --coverage=false" \
        "Frontend (Next.js + Jest)"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_SERVICES+=("Frontend")
    fi
fi

# Summary
echo -e "\n${BLUE}📊 Unit Test Summary${NC}"
echo "=================================="
echo "Total Test Suites: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All unit tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Failed services:${NC}"
    for service in "${FAILED_SERVICES[@]}"; do
        echo -e "  • ${RED}$service${NC}"
    done
    echo -e "\n${YELLOW}💡 Run individual service tests for detailed error information:${NC}"
    echo -e "  ${GREEN}cd server/user-service && ./mvnw test${NC}"
    echo -e "  ${GREEN}cd server/workout-plan-service && ./mvnw test${NC}"
    echo -e "  ${GREEN}cd genai && python3 -m pytest test_workout_worker.py -v${NC}"
    exit 1
fi 