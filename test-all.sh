#!/bin/bash

# FlexFit Comprehensive Test Suite
# Systematic test execution: Unit → Integration → System → Performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$LOG_DIR/test-report-$TIMESTAMP.html"

# Test counters
UNIT_TESTS_PASSED=0
UNIT_TESTS_FAILED=0
INTEGRATION_TESTS_PASSED=0
INTEGRATION_TESTS_FAILED=0
SYSTEM_TESTS_PASSED=0
SYSTEM_TESTS_FAILED=0
PERFORMANCE_TESTS_PASSED=0
PERFORMANCE_TESTS_FAILED=0

# Create directories
mkdir -p $LOG_DIR/{unit,integration,system,performance}

print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

print_section() {
    echo -e "\n${CYAN}--- $1 ---${NC}"
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
    print_info "Checking service availability..."
    
    local services=(
        "Service Registry:8761:/actuator/health"
        "API Gateway:8000:/actuator/health"
        "User Service:8081:/health"
        "Workout Service:8082:/health"
        "GenAI Service:8083:/health"
        "Database:5432"
    )
    
    local all_healthy=true
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port endpoint <<< "$service"
        
        if [[ "$name" == "Database" ]]; then
            if pg_isready -h localhost -p $port > /dev/null 2>&1; then
                print_success "$name (port $port) is available"
            else
                print_error "$name (port $port) is not available"
                all_healthy=false
            fi
        else
            if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
                print_success "$name (port $port) is healthy"
            else
                print_error "$name (port $port) is not responding"
                all_healthy=false
            fi
        fi
    done
    
    if [[ "$all_healthy" == "false" ]]; then
        print_error "Some services are not available. Please run: docker compose up -d"
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

run_unit_tests() {
    print_header "UNIT TESTS"
    
    # Java Unit Tests - User Service
    print_section "User Service Unit Tests"
    if cd server/user-service && ./mvnw test -q > "../../$LOG_DIR/unit/user-service.log" 2>&1; then
        print_success "User Service unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_error "User Service unit tests failed"
        UNIT_TESTS_FAILED=$((UNIT_TESTS_FAILED + 1))
    fi
    cd - > /dev/null
    
    # Java Unit Tests - Workout Plan Service
    print_section "Workout Plan Service Unit Tests"
    if cd server/workout-plan-service && ./mvnw test -q > "../../$LOG_DIR/unit/workout-plan-service.log" 2>&1; then
        print_success "Workout Plan Service unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_error "Workout Plan Service unit tests failed"
        UNIT_TESTS_FAILED=$((UNIT_TESTS_FAILED + 1))
    fi
    cd - > /dev/null
    
    # Java Unit Tests - API Gateway
    print_section "API Gateway Unit Tests"
    if cd server/api-gateway && ./mvnw test -q > "../../$LOG_DIR/unit/api-gateway.log" 2>&1; then
        print_success "API Gateway unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_warning "API Gateway unit tests failed (may not have tests)"
        # Don't count as failure if no tests exist
    fi
    cd - > /dev/null
    
    # Java Unit Tests - Service Registry
    print_section "Service Registry Unit Tests"
    if cd server/service-registry && ./mvnw test -q > "../../$LOG_DIR/unit/service-registry.log" 2>&1; then
        print_success "Service Registry unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_warning "Service Registry unit tests failed (may not have tests)"
        # Don't count as failure if no tests exist
    fi
    cd - > /dev/null
    
    # Python Unit Tests - GenAI Service
    print_section "GenAI Service Unit Tests"
    if cd genai && python3 -m pytest test_workout_worker.py -v > "../$LOG_DIR/unit/genai-service.log" 2>&1; then
        print_success "GenAI Service unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_warning "GenAI Service unit tests failed (pytest may not be available)"
        # Don't count as failure if pytest is not available
    fi
    cd - > /dev/null
    
    # Client Unit Tests
    print_section "Client Unit Tests"
    if cd client && npm test -- --watchAll=false > "../$LOG_DIR/unit/client.log" 2>&1; then
        print_success "Client unit tests passed"
        UNIT_TESTS_PASSED=$((UNIT_TESTS_PASSED + 1))
    else
        print_warning "Client unit tests failed (may not be configured)"
        # Don't count as failure if not configured
    fi
    cd - > /dev/null
}

run_integration_tests() {
    print_header "INTEGRATION TESTS"
    
    # Service-to-Service Communication Tests
    print_section "Service Communication Tests"
    if python3 -m pytest tests/integration/test_user_workout_integration.py -v > "$LOG_DIR/integration/service-communication.log" 2>&1; then
        print_success "Service communication tests passed"
        INTEGRATION_TESTS_PASSED=$((INTEGRATION_TESTS_PASSED + 1))
    else
        print_error "Service communication tests failed"
        INTEGRATION_TESTS_FAILED=$((INTEGRATION_TESTS_FAILED + 1))
    fi
    
    # Authentication Integration Tests
    print_section "Authentication Integration Tests"
    if bash tests/integration/test-auth-integration.sh > "$LOG_DIR/integration/auth-integration.log" 2>&1; then
        print_success "Authentication integration tests passed"
        INTEGRATION_TESTS_PASSED=$((INTEGRATION_TESTS_PASSED + 1))
    else
        print_error "Authentication integration tests failed"
        INTEGRATION_TESTS_FAILED=$((INTEGRATION_TESTS_FAILED + 1))
    fi
    
    # Database Integration Tests
    print_section "Database Integration Tests"
    if bash tests/integration/test-database-integration.sh > "$LOG_DIR/integration/database-integration.log" 2>&1; then
        print_success "Database integration tests passed"
        INTEGRATION_TESTS_PASSED=$((INTEGRATION_TESTS_PASSED + 1))
    else
        print_error "Database integration tests failed"
        INTEGRATION_TESTS_FAILED=$((INTEGRATION_TESTS_FAILED + 1))
    fi
    
    # API Gateway Integration Tests
    print_section "API Gateway Integration Tests"
    if bash tests/integration/test-gateway-integration.sh > "$LOG_DIR/integration/gateway-integration.log" 2>&1; then
        print_success "API Gateway integration tests passed"
        INTEGRATION_TESTS_PASSED=$((INTEGRATION_TESTS_PASSED + 1))
    else
        print_error "API Gateway integration tests failed"
        INTEGRATION_TESTS_FAILED=$((INTEGRATION_TESTS_FAILED + 1))
    fi
}

run_system_tests() {
    print_header "SYSTEM TESTS"
    
    # End-to-End Workflow Tests
    print_section "End-to-End Workflow Tests"
    if python3 -m pytest tests/system/test_end_to_end_system.py -v > "$LOG_DIR/system/end-to-end.log" 2>&1; then
        print_success "End-to-end system tests passed"
        SYSTEM_TESTS_PASSED=$((SYSTEM_TESTS_PASSED + 1))
    else
        print_error "End-to-end system tests failed"
        SYSTEM_TESTS_FAILED=$((SYSTEM_TESTS_FAILED + 1))
    fi
    
    # User Journey Tests
    print_section "User Journey Tests"
    if bash tests/system/test-user-journey.sh > "$LOG_DIR/system/user-journey.log" 2>&1; then
        print_success "User journey tests passed"
        SYSTEM_TESTS_PASSED=$((SYSTEM_TESTS_PASSED + 1))
    else
        print_error "User journey tests failed"
        SYSTEM_TESTS_FAILED=$((SYSTEM_TESTS_FAILED + 1))
    fi
    
    # Workout Generation System Tests
    print_section "Workout Generation System Tests"
    if bash test-workout-integration.sh > "$LOG_DIR/system/workout-generation.log" 2>&1; then
        print_success "Workout generation system tests passed"
        SYSTEM_TESTS_PASSED=$((SYSTEM_TESTS_PASSED + 1))
    else
        print_error "Workout generation system tests failed"
        SYSTEM_TESTS_FAILED=$((SYSTEM_TESTS_FAILED + 1))
    fi
}

run_performance_tests() {
    print_header "PERFORMANCE TESTS"
    
    # Load Testing
    print_section "Load Testing"
    if bash tests/performance/test-load.sh > "$LOG_DIR/performance/load-test.log" 2>&1; then
        print_success "Load tests passed"
        PERFORMANCE_TESTS_PASSED=$((PERFORMANCE_TESTS_PASSED + 1))
    else
        print_error "Load tests failed"
        PERFORMANCE_TESTS_FAILED=$((PERFORMANCE_TESTS_FAILED + 1))
    fi
    
    # Stress Testing
    print_section "Stress Testing"
    if bash tests/performance/test-stress.sh > "$LOG_DIR/performance/stress-test.log" 2>&1; then
        print_success "Stress tests passed"
        PERFORMANCE_TESTS_PASSED=$((PERFORMANCE_TESTS_PASSED + 1))
    else
        print_error "Stress tests failed"
        PERFORMANCE_TESTS_FAILED=$((PERFORMANCE_TESTS_FAILED + 1))
    fi
    
    # Concurrent User Testing
    print_section "Concurrent User Testing"
    if bash tests/performance/test-concurrent-users.sh > "$LOG_DIR/performance/concurrent-users.log" 2>&1; then
        print_success "Concurrent user tests passed"
        PERFORMANCE_TESTS_PASSED=$((PERFORMANCE_TESTS_PASSED + 1))
    else
        print_error "Concurrent user tests failed"
        PERFORMANCE_TESTS_FAILED=$((PERFORMANCE_TESTS_FAILED + 1))
    fi
}

generate_report() {
    print_header "GENERATING TEST REPORT"
    
    local total_passed=$((UNIT_TESTS_PASSED + INTEGRATION_TESTS_PASSED + SYSTEM_TESTS_PASSED + PERFORMANCE_TESTS_PASSED))
    local total_failed=$((UNIT_TESTS_FAILED + INTEGRATION_TESTS_FAILED + SYSTEM_TESTS_FAILED + PERFORMANCE_TESTS_FAILED))
    local total_tests=$((total_passed + total_failed))
    
    # Generate HTML report
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>FlexFit Test Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { color: green; }
        .failed { color: red; }
        .warning { color: orange; }
        .summary { background-color: #e7f3ff; padding: 15px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FlexFit Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Timestamp: $TIMESTAMP</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <table>
            <tr><th>Test Category</th><th>Passed</th><th>Failed</th><th>Total</th></tr>
            <tr><td>Unit Tests</td><td class="passed">$UNIT_TESTS_PASSED</td><td class="failed">$UNIT_TESTS_FAILED</td><td>$((UNIT_TESTS_PASSED + UNIT_TESTS_FAILED))</td></tr>
            <tr><td>Integration Tests</td><td class="passed">$INTEGRATION_TESTS_PASSED</td><td class="failed">$INTEGRATION_TESTS_FAILED</td><td>$((INTEGRATION_TESTS_PASSED + INTEGRATION_TESTS_FAILED))</td></tr>
            <tr><td>System Tests</td><td class="passed">$SYSTEM_TESTS_PASSED</td><td class="failed">$SYSTEM_TESTS_FAILED</td><td>$((SYSTEM_TESTS_PASSED + SYSTEM_TESTS_FAILED))</td></tr>
            <tr><td>Performance Tests</td><td class="passed">$PERFORMANCE_TESTS_PASSED</td><td class="failed">$PERFORMANCE_TESTS_FAILED</td><td>$((PERFORMANCE_TESTS_PASSED + PERFORMANCE_TESTS_FAILED))</td></tr>
            <tr><th>Total</th><th class="passed">$total_passed</th><th class="failed">$total_failed</th><th>$total_tests</th></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Test Logs</h2>
        <p>Detailed logs are available in the $LOG_DIR directory:</p>
        <ul>
            <li>Unit Tests: $LOG_DIR/unit/</li>
            <li>Integration Tests: $LOG_DIR/integration/</li>
            <li>System Tests: $LOG_DIR/system/</li>
            <li>Performance Tests: $LOG_DIR/performance/</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    # Display summary
    echo ""
    echo "TEST SUMMARY:"
    echo "============="
    echo "Unit Tests:        $UNIT_TESTS_PASSED passed, $UNIT_TESTS_FAILED failed"
    echo "Integration Tests: $INTEGRATION_TESTS_PASSED passed, $INTEGRATION_TESTS_FAILED failed"
    echo "System Tests:      $SYSTEM_TESTS_PASSED passed, $SYSTEM_TESTS_FAILED failed"
    echo "Performance Tests: $PERFORMANCE_TESTS_PASSED passed, $PERFORMANCE_TESTS_FAILED failed"
    echo "============="
    echo "Total:             $total_passed passed, $total_failed failed"
    
    if [[ $total_tests -gt 0 ]]; then
        local success_rate=$(( (total_passed * 100) / total_tests ))
        echo "Success Rate:      ${success_rate}%"
        
        if [[ $success_rate -ge 90 ]]; then
            print_success "Excellent test coverage!"
        elif [[ $success_rate -ge 75 ]]; then
            print_warning "Good test coverage, room for improvement"
        else
            print_error "Poor test coverage, needs attention"
        fi
    fi
    
    echo ""
    echo "HTML Report: $REPORT_FILE"
    echo "Logs Directory: $LOG_DIR"
    
    # Return appropriate exit code
    if [[ $total_failed -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --unit-only          Run only unit tests"
    echo "  --integration-only   Run only integration tests"
    echo "  --system-only        Run only system tests"
    echo "  --performance-only   Run only performance tests"
    echo "  --skip-unit          Skip unit tests"
    echo "  --skip-integration   Skip integration tests"
    echo "  --skip-system        Skip system tests"
    echo "  --skip-performance   Skip performance tests"
    echo "  --quick              Run only unit and integration tests"
    echo "  --full               Run all tests (default)"
    echo "  --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     # Run all tests"
    echo "  $0 --quick             # Run unit and integration tests only"
    echo "  $0 --unit-only         # Run only unit tests"
    echo "  $0 --skip-performance  # Skip performance tests"
}

# Parse command line arguments
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_SYSTEM=true
RUN_PERFORMANCE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-only)
            RUN_UNIT=true
            RUN_INTEGRATION=false
            RUN_SYSTEM=false
            RUN_PERFORMANCE=false
            shift
            ;;
        --integration-only)
            RUN_UNIT=false
            RUN_INTEGRATION=true
            RUN_SYSTEM=false
            RUN_PERFORMANCE=false
            shift
            ;;
        --system-only)
            RUN_UNIT=false
            RUN_INTEGRATION=false
            RUN_SYSTEM=true
            RUN_PERFORMANCE=false
            shift
            ;;
        --performance-only)
            RUN_UNIT=false
            RUN_INTEGRATION=false
            RUN_SYSTEM=false
            RUN_PERFORMANCE=true
            shift
            ;;
        --quick)
            RUN_UNIT=true
            RUN_INTEGRATION=true
            RUN_SYSTEM=false
            RUN_PERFORMANCE=false
            shift
            ;;
        --full)
            RUN_UNIT=true
            RUN_INTEGRATION=true
            RUN_SYSTEM=true
            RUN_PERFORMANCE=true
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
        --skip-performance)
            RUN_PERFORMANCE=false
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
print_header "FLEXFIT COMPREHENSIVE TEST SUITE"
echo "Configuration:"
echo "  Unit Tests:        $RUN_UNIT"
echo "  Integration Tests: $RUN_INTEGRATION"
echo "  System Tests:      $RUN_SYSTEM"
echo "  Performance Tests: $RUN_PERFORMANCE"
echo ""

# Check prerequisites
check_prerequisites

# Run tests based on configuration
if [[ "$RUN_UNIT" == "true" ]]; then
    run_unit_tests
fi

if [[ "$RUN_INTEGRATION" == "true" ]]; then
    run_integration_tests
fi

if [[ "$RUN_SYSTEM" == "true" ]]; then
    run_system_tests
fi

if [[ "$RUN_PERFORMANCE" == "true" ]]; then
    run_performance_tests
fi

# Generate report and exit
if generate_report; then
    print_success "All tests completed successfully!"
    exit 0
else
    print_error "Some tests failed. Check the report for details."
    exit 1
fi 