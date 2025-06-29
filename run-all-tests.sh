#!/bin/bash

# Test Suite Runner for Team Code Compass
# Runs Unit Tests, Integration Tests, and System Tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="test-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
UNIT_LOG="$LOG_DIR/unit_tests_$TIMESTAMP.log"
INTEGRATION_LOG="$LOG_DIR/integration_tests_$TIMESTAMP.log"
SYSTEM_LOG="$LOG_DIR/system_tests_$TIMESTAMP.log"
SUMMARY_LOG="$LOG_DIR/test_summary_$TIMESTAMP.log"

# Test counters
UNIT_TESTS_PASSED=0
UNIT_TESTS_FAILED=0
INTEGRATION_TESTS_PASSED=0
INTEGRATION_TESTS_FAILED=0
SYSTEM_TESTS_PASSED=0
SYSTEM_TESTS_FAILED=0

# Create log directory
mkdir -p $LOG_DIR

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check if services are running
    print_info "Checking if services are running..."
    
    if ! curl -s http://localhost:8081/health > /dev/null 2>&1; then
        print_error "User Service (port 8081) is not running"
        echo "Please start services with: docker compose up -d"
        exit 1
    fi
    
    if ! curl -s http://localhost:8082/health > /dev/null 2>&1; then
        print_error "Workout Plan Service (port 8082) is not running"
        echo "Please start services with: docker compose up -d"
        exit 1
    fi
    
    if ! curl -s http://localhost:8083/health > /dev/null 2>&1; then
        print_error "GenAI Service (port 8083) is not running"
        echo "Please start services with: docker compose up -d"
        exit 1
    fi
    
    print_success "All services are running"
    
    # Check Java for unit tests
    if ! command -v java &> /dev/null; then
        print_warning "Java not found - Unit tests may not run"
    else
        print_success "Java found: $(java -version 2>&1 | head -n 1)"
    fi
    
    # Check Maven for unit tests
    if ! command -v mvn &> /dev/null; then
        print_warning "Maven not found - Unit tests may not run"
    else
        print_success "Maven found: $(mvn -version 2>&1 | head -n 1)"
    fi
    
    # Check Python for integration/system tests
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 not found - Integration/System tests may not run"
    else
        print_success "Python3 found: $(python3 --version)"
    fi
    
    echo ""
}

run_unit_tests() {
    print_header "RUNNING UNIT TESTS"
    
    # Java Unit Tests for User Service
    print_info "Running User Service Unit Tests..."
    if cd server/user-service && mvn test -q >> "../../$UNIT_LOG" 2>&1; then
        print_success "User Service unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_error "User Service unit tests failed"
        UNIT_TESTS_FAILED=$((UNIT_TESTS_FAILED + 1))
        echo "Check log: $UNIT_LOG"
    fi
    cd - > /dev/null
    
    # Java Unit Tests for Workout Plan Service
    print_info "Running Workout Plan Service Unit Tests..."
    if cd server/workout-plan-service && mvn test -q >> "../../$UNIT_LOG" 2>&1; then
        print_success "Workout Plan Service unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_error "Workout Plan Service unit tests failed"
        UNIT_TESTS_FAILED=$((UNIT_TESTS_FAILED + 1))
        echo "Check log: $UNIT_LOG"
    fi
    cd - > /dev/null
    
    # Python Unit Tests for GenAI Service
    print_info "Running GenAI Service Unit Tests..."
    if cd genai && python3 -m pytest test_workout_worker.py -v >> "../$UNIT_LOG" 2>&1; then
        print_success "GenAI Service unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_error "GenAI Service unit tests failed"
        UNIT_TESTS_FAILED=$((UNIT_TESTS_FAILED + 1))
        echo "Check log: $UNIT_LOG"
    fi
    cd - > /dev/null
    
    echo ""
}

run_integration_tests() {
    print_header "RUNNING INTEGRATION TESTS"
    
    print_info "Running Service Integration Tests..."
    if python3 -m pytest tests/integration/test_user_workout_integration.py -v >> "$INTEGRATION_LOG" 2>&1; then
        print_success "Integration tests passed"
        INTEGRATION_TESTS_PASSED=$((INTEGRATION_TESTS_PASSED + 1))
    else
        print_error "Integration tests failed"
        INTEGRATION_TESTS_FAILED=$((INTEGRATION_TESTS_FAILED + 1))
        echo "Check log: $INTEGRATION_LOG"
    fi
    
    echo ""
}

run_system_tests() {
    print_header "RUNNING SYSTEM TESTS"
    
    print_info "Running End-to-End System Tests..."
    if python3 -m pytest tests/system/test_end_to_end_system.py -v >> "$SYSTEM_LOG" 2>&1; then
        print_success "System tests passed"
        SYSTEM_TESTS_PASSED=$((SYSTEM_TESTS_PASSED + 1))
    else
        print_error "System tests failed"
        SYSTEM_TESTS_FAILED=$((SYSTEM_TESTS_FAILED + 1))
        echo "Check log: $SYSTEM_LOG"
    fi
    
    echo ""
}

generate_summary() {
    print_header "TEST SUMMARY"
    
    local total_passed=$((UNIT_TESTS_PASSED + INTEGRATION_TESTS_PASSED + SYSTEM_TESTS_PASSED))
    local total_failed=$((UNIT_TESTS_FAILED + INTEGRATION_TESTS_FAILED + SYSTEM_TESTS_FAILED))
    local total_tests=$((total_passed + total_failed))
    
    # Write summary to log file
    {
        echo "Test Execution Summary - $(date)"
        echo "======================================"
        echo ""
        echo "UNIT TESTS:"
        echo "  Passed: $UNIT_TESTS_PASSED"
        echo "  Failed: $UNIT_TESTS_FAILED"
        echo ""
        echo "INTEGRATION TESTS:"
        echo "  Passed: $INTEGRATION_TESTS_PASSED"
        echo "  Failed: $INTEGRATION_TESTS_FAILED"
        echo ""
        echo "SYSTEM TESTS:"
        echo "  Passed: $SYSTEM_TESTS_PASSED"
        echo "  Failed: $SYSTEM_TESTS_FAILED"
        echo ""
        echo "OVERALL:"
        echo "  Total Tests: $total_tests"
        echo "  Passed: $total_passed"
        echo "  Failed: $total_failed"
        if [ $total_tests -gt 0 ]; then
            echo "  Success Rate: $(( (total_passed * 100) / total_tests ))%"
        fi
    } > "$SUMMARY_LOG"
    
    # Display summary
    echo "UNIT TESTS:"
    echo "  Passed: $UNIT_TESTS_PASSED"
    echo "  Failed: $UNIT_TESTS_FAILED"
    echo ""
    echo "INTEGRATION TESTS:"
    echo "  Passed: $INTEGRATION_TESTS_PASSED"
    echo "  Failed: $INTEGRATION_TESTS_FAILED"
    echo ""
    echo "SYSTEM TESTS:"
    echo "  Passed: $SYSTEM_TESTS_PASSED"
    echo "  Failed: $SYSTEM_TESTS_FAILED"
    echo ""
    echo "OVERALL:"
    echo "  Total Tests: $total_tests"
    echo "  Passed: $total_passed"
    echo "  Failed: $total_failed"
    
    if [ $total_tests -gt 0 ]; then
        local success_rate=$(( (total_passed * 100) / total_tests ))
        echo "  Success Rate: ${success_rate}%"
        
        if [ $success_rate -ge 90 ]; then
            print_success "Excellent test coverage!"
        elif [ $success_rate -ge 75 ]; then
            print_warning "Good test coverage, some improvements needed"
        else
            print_error "Poor test coverage, significant improvements needed"
        fi
    fi
    
    echo ""
    echo "Detailed logs available in:"
    echo "  Unit Tests: $UNIT_LOG"
    echo "  Integration Tests: $INTEGRATION_LOG"
    echo "  System Tests: $SYSTEM_LOG"
    echo "  Summary: $SUMMARY_LOG"
    
    # Return appropriate exit code
    if [ $total_failed -gt 0 ]; then
        return 1
    else
        return 0
    fi
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --unit-only       Run only unit tests"
    echo "  --integration-only Run only integration tests"
    echo "  --system-only     Run only system tests"
    echo "  --skip-unit       Skip unit tests"
    echo "  --skip-integration Skip integration tests"
    echo "  --skip-system     Skip system tests"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 --unit-only       # Run only unit tests"
    echo "  $0 --skip-unit       # Run integration and system tests only"
}

# Parse command line arguments
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_SYSTEM=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-only)
            RUN_UNIT=true
            RUN_INTEGRATION=false
            RUN_SYSTEM=false
            shift
            ;;
        --integration-only)
            RUN_UNIT=false
            RUN_INTEGRATION=true
            RUN_SYSTEM=false
            shift
            ;;
        --system-only)
            RUN_UNIT=false
            RUN_INTEGRATION=false
            RUN_SYSTEM=true
            shift
            ;;
        --skip-unit)
            RUN_UNIT=false
            shift
            ;;
        --skip-integration)
            RUN_INTEGRATION=false
            shift
            ;;
        --skip-system)
            RUN_SYSTEM=false
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
print_header "TEAM CODE COMPASS - COMPREHENSIVE TEST SUITE"
echo "Timestamp: $(date)"
echo "Test Configuration:"
echo "  Unit Tests: $RUN_UNIT"
echo "  Integration Tests: $RUN_INTEGRATION"
echo "  System Tests: $RUN_SYSTEM"
echo ""

# Check prerequisites
check_prerequisites

# Run tests based on configuration
if [ "$RUN_UNIT" = true ]; then
    run_unit_tests
fi

if [ "$RUN_INTEGRATION" = true ]; then
    run_integration_tests
fi

if [ "$RUN_SYSTEM" = true ]; then
    run_system_tests
fi

# Generate and display summary
if generate_summary; then
    print_success "All tests completed successfully!"
    exit 0
else
    print_error "Some tests failed. Check logs for details."
    exit 1
fi 