#!/bin/bash

# FlexFit Complete Test Suite Runner
# Runs unit tests, integration tests, and generates reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="$SCRIPT_DIR/test-reports"

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Display usage
usage() {
    echo "FlexFit Test Suite Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --unit         Run unit tests only"
    echo "  -i, --integration  Run integration tests only"
    echo "  -a, --all          Run all tests (default)"
    echo "  -c, --coverage     Generate coverage reports"
    echo "  -f, --fast         Skip slow tests"
    echo "  -v, --verbose      Verbose output"
    echo "  -r, --report       Generate test reports"
    echo "  --clean            Clean test environment first"
    echo "  --setup            Setup test environment"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run all tests"
    echo "  $0 -u              # Run only unit tests"
    echo "  $0 -i              # Run only integration tests"
    echo "  $0 -a -c -r        # Run all tests with coverage and reports"
    echo "  $0 --clean -a      # Clean environment and run all tests"
}

# Parse command line arguments
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_ALL=false
GENERATE_COVERAGE=false
FAST_MODE=false
VERBOSE=false
GENERATE_REPORTS=false
CLEAN_ENVIRONMENT=false
SETUP_ENVIRONMENT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--unit)
            RUN_UNIT=true
            shift
            ;;
        -i|--integration)
            RUN_INTEGRATION=true
            shift
            ;;
        -a|--all)
            RUN_ALL=true
            shift
            ;;
        -c|--coverage)
            GENERATE_COVERAGE=true
            shift
            ;;
        -f|--fast)
            FAST_MODE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -r|--report)
            GENERATE_REPORTS=true
            shift
            ;;
        --clean)
            CLEAN_ENVIRONMENT=true
            shift
            ;;
        --setup)
            SETUP_ENVIRONMENT=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Default to running all tests if no specific option is provided
if [[ "$RUN_UNIT" == false && "$RUN_INTEGRATION" == false ]]; then
    RUN_ALL=true
fi

echo -e "${BLUE}🚀 FlexFit Complete Test Suite Runner${NC}"
echo "======================================="

# Function to log messages
log_info() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to clean test environment
clean_environment() {
    log_info "Cleaning test environment..."
    
    # Stop all containers
    docker compose down 2>/dev/null || true
    
    # Remove test volumes
    docker volume prune -f 2>/dev/null || true
    
    # Clean Maven build artifacts
    find server -name "target" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Clean Python cache
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    
    # Clean test reports
    rm -rf "$REPORTS_DIR"/* 2>/dev/null || true
    
    log_success "Environment cleaned"
}

# Function to setup test environment
setup_environment() {
    log_info "Setting up test environment..."
    
    # Check required tools
    local missing_tools=()
    
    command -v docker >/dev/null || missing_tools+=("docker")
    command -v docker-compose >/dev/null || command -v docker compose >/dev/null || missing_tools+=("docker-compose")
    command -v java >/dev/null || missing_tools+=("java")
    command -v mvn >/dev/null || missing_tools+=("maven")
    command -v python3 >/dev/null || missing_tools+=("python3")
    command -v jq >/dev/null || missing_tools+=("jq")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again"
        exit 1
    fi
    
    # Check Python dependencies
    if ! python3 -c "import pytest" 2>/dev/null; then
        log_info "Installing Python test dependencies..."
        pip3 install pytest pytest-cov requests fastapi httpx
    fi
    
    # Ensure GenAI requirements are installed
    if [[ -f "genai/requirements.txt" ]]; then
        log_info "Installing GenAI dependencies..."
        pip3 install -r genai/requirements.txt
    fi
    
    log_success "Environment setup complete"
}

# Function to run unit tests
run_unit_tests() {
    echo -e "\n${BLUE}🧪 Running Unit Tests${NC}"
    echo "====================="
    
    local unit_exit_code=0
    
    if [[ -f "run-unit-tests.sh" ]]; then
        if [[ "$VERBOSE" == true ]]; then
            bash run-unit-tests.sh
        else
            bash run-unit-tests.sh 2>&1 | tee "$REPORTS_DIR/unit-tests.log"
        fi
        unit_exit_code=$?
    else
        log_error "Unit test runner script not found"
        unit_exit_code=1
    fi
    
    if [[ $unit_exit_code -eq 0 ]]; then
        log_success "Unit tests completed successfully"
    else
        log_error "Unit tests failed"
    fi
    
    return $unit_exit_code
}

# Function to run integration tests
run_integration_tests() {
    echo -e "\n${BLUE}🔗 Running Integration Tests${NC}"
    echo "=============================="
    
    local integration_exit_code=0
    
    if [[ -f "run-integration-tests.sh" ]]; then
        if [[ "$VERBOSE" == true ]]; then
            bash run-integration-tests.sh
        else
            bash run-integration-tests.sh 2>&1 | tee "$REPORTS_DIR/integration-tests.log"
        fi
        integration_exit_code=$?
    else
        log_error "Integration test runner script not found"
        integration_exit_code=1
    fi
    
    if [[ $integration_exit_code -eq 0 ]]; then
        log_success "Integration tests completed successfully"
    else
        log_error "Integration tests failed"
    fi
    
    return $integration_exit_code
}

# Function to generate coverage reports
generate_coverage() {
    echo -e "\n${BLUE}📊 Generating Coverage Reports${NC}"
    echo "================================"
    
    # Java coverage with JaCoCo
    log_info "Generating Java coverage reports..."
    
    # User Service Coverage
    if [[ -d "server/user-service" ]]; then
        cd server/user-service
        ./mvnw jacoco:report 2>/dev/null || true
        if [[ -f "target/site/jacoco/index.html" ]]; then
            cp -r target/site/jacoco "$SCRIPT_DIR/$REPORTS_DIR/user-service-coverage" 2>/dev/null || true
        fi
        cd "$SCRIPT_DIR"
    fi
    
    # Workout Plan Service Coverage
    if [[ -d "server/workout-plan-service" ]]; then
        cd server/workout-plan-service
        ./mvnw jacoco:report 2>/dev/null || true
        if [[ -f "target/site/jacoco/index.html" ]]; then
            cp -r target/site/jacoco "$SCRIPT_DIR/$REPORTS_DIR/workout-plan-service-coverage" 2>/dev/null || true
        fi
        cd "$SCRIPT_DIR"
    fi
    
    # Python coverage
    log_info "Generating Python coverage reports..."
    
    if [[ -d "genai" && -f "genai/test_workout_worker.py" ]]; then
        cd genai
        python3 -m pytest --cov=workout_worker --cov-report=html test_workout_worker.py 2>/dev/null || true
        if [[ -d "htmlcov" ]]; then
            cp -r htmlcov "$SCRIPT_DIR/$REPORTS_DIR/genai-coverage" 2>/dev/null || true
        fi
        cd "$SCRIPT_DIR"
    fi
    
    log_success "Coverage reports generated in $REPORTS_DIR"
}

# Function to generate test reports
generate_test_reports() {
    echo -e "\n${BLUE}📋 Generating Test Reports${NC}"
    echo "=========================="
    
    local report_file="$REPORTS_DIR/test-summary.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>FlexFit Test Summary Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { color: #2196F3; }
        .success { color: #4CAF50; }
        .error { color: #f44336; }
        .warning { color: #ff9800; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1 class="header">FlexFit Test Summary Report</h1>
    <p>Generated on: $(date)</p>
    
    <div class="section">
        <h2>Test Execution Summary</h2>
        <table>
            <tr><th>Test Suite</th><th>Status</th><th>Notes</th></tr>
EOF
    
    # Add test results to report
    if [[ -f "$REPORTS_DIR/unit-tests.log" ]]; then
        if grep -q "All unit tests passed" "$REPORTS_DIR/unit-tests.log"; then
            echo "            <tr><td>Unit Tests</td><td class=\"success\">✅ PASSED</td><td>All unit tests completed successfully</td></tr>" >> "$report_file"
        else
            echo "            <tr><td>Unit Tests</td><td class=\"error\">❌ FAILED</td><td>Check unit-tests.log for details</td></tr>" >> "$report_file"
        fi
    fi
    
    if [[ -f "$REPORTS_DIR/integration-tests.log" ]]; then
        if grep -q "All integration tests passed" "$REPORTS_DIR/integration-tests.log"; then
            echo "            <tr><td>Integration Tests</td><td class=\"success\">✅ PASSED</td><td>All integration tests completed successfully</td></tr>" >> "$report_file"
        else
            echo "            <tr><td>Integration Tests</td><td class=\"error\">❌ FAILED</td><td>Check integration-tests.log for details</td></tr>" >> "$report_file"
        fi
    fi
    
    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Coverage Reports</h2>
        <ul>
EOF
    
    # Add coverage report links
    if [[ -d "$REPORTS_DIR/user-service-coverage" ]]; then
        echo "            <li><a href=\"user-service-coverage/index.html\">User Service Coverage</a></li>" >> "$report_file"
    fi
    
    if [[ -d "$REPORTS_DIR/workout-plan-service-coverage" ]]; then
        echo "            <li><a href=\"workout-plan-service-coverage/index.html\">Workout Plan Service Coverage</a></li>" >> "$report_file"
    fi
    
    if [[ -d "$REPORTS_DIR/genai-coverage" ]]; then
        echo "            <li><a href=\"genai-coverage/index.html\">GenAI Worker Coverage</a></li>" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
        </ul>
    </div>
    
    <div class="section">
        <h2>Test Logs</h2>
        <ul>
EOF
    
    # Add log file links
    if [[ -f "$REPORTS_DIR/unit-tests.log" ]]; then
        echo "            <li><a href=\"unit-tests.log\">Unit Tests Log</a></li>" >> "$report_file"
    fi
    
    if [[ -f "$REPORTS_DIR/integration-tests.log" ]]; then
        echo "            <li><a href=\"integration-tests.log\">Integration Tests Log</a></li>" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
        </ul>
    </div>
    
    <div class="section">
        <h2>System Information</h2>
        <table>
            <tr><th>Component</th><th>Version/Status</th></tr>
            <tr><td>Docker</td><td>$(docker --version 2>/dev/null || echo "Not available")</td></tr>
            <tr><td>Java</td><td>$(java -version 2>&1 | head -n1 || echo "Not available")</td></tr>
            <tr><td>Python</td><td>$(python3 --version 2>/dev/null || echo "Not available")</td></tr>
            <tr><td>Node.js</td><td>$(node --version 2>/dev/null || echo "Not available")</td></tr>
        </table>
    </div>
</body>
</html>
EOF
    
    log_success "Test report generated: $report_file"
    log_info "Open in browser: file://$report_file"
}

# Main execution
main() {
    local overall_exit_code=0
    local tests_run=0
    local tests_passed=0
    
    # Parse environment setup
    if [[ "$CLEAN_ENVIRONMENT" == true ]]; then
        clean_environment
    fi
    
    if [[ "$SETUP_ENVIRONMENT" == true ]]; then
        setup_environment
    fi
    
    # Start timestamp
    local start_time=$(date +%s)
    
    # Run tests based on options
    if [[ "$RUN_UNIT" == true ]] || [[ "$RUN_ALL" == true ]]; then
        tests_run=$((tests_run + 1))
        if run_unit_tests; then
            tests_passed=$((tests_passed + 1))
        else
            overall_exit_code=1
        fi
    fi
    
    if [[ "$RUN_INTEGRATION" == true ]] || [[ "$RUN_ALL" == true ]]; then
        tests_run=$((tests_run + 1))
        if run_integration_tests; then
            tests_passed=$((tests_passed + 1))
        else
            overall_exit_code=1
        fi
    fi
    
    # Generate coverage reports
    if [[ "$GENERATE_COVERAGE" == true ]]; then
        generate_coverage
    fi
    
    # Generate test reports
    if [[ "$GENERATE_REPORTS" == true ]]; then
        generate_test_reports
    fi
    
    # End timestamp and duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Final summary
    echo -e "\n${BLUE}📊 Final Test Summary${NC}"
    echo "====================="
    echo "Total test suites run: $tests_run"
    echo -e "Test suites passed: ${GREEN}$tests_passed${NC}"
    echo -e "Test suites failed: ${RED}$((tests_run - tests_passed))${NC}"
    echo "Total execution time: ${duration}s"
    
    if [[ $overall_exit_code -eq 0 ]]; then
        echo -e "\n${GREEN}🎉 All test suites completed successfully!${NC}"
        
        if [[ "$GENERATE_REPORTS" == true ]]; then
            echo -e "${BLUE}📋 Reports available in: $REPORTS_DIR${NC}"
        fi
    else
        echo -e "\n${RED}❌ Some test suites failed${NC}"
        echo -e "${YELLOW}💡 Check individual test logs for detailed error information${NC}"
        
        if [[ -d "$REPORTS_DIR" ]]; then
            echo -e "${BLUE}📋 Logs available in: $REPORTS_DIR${NC}"
        fi
    fi
    
    exit $overall_exit_code
}

# Execute main function
main "$@" 