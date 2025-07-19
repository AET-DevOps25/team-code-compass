# FlexFit Testing Framework

Comprehensive testing suite for the FlexFit microservices application with CLI-based test runners.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [CLI Test Runners](#cli-test-runners)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites

```bash
# Required tools
docker --version          # Docker Engine
docker compose --version  # Docker Compose
java -version             # Java 17+
mvn --version             # Apache Maven
python3 --version         # Python 3.11+
jq --version              # JSON processor

# Python dependencies
pip3 install pytest pytest-cov requests fastapi httpx
```

### Run All Tests

```bash
# Make scripts executable
chmod +x *.sh

# Run complete test suite
./run-all-tests.sh
```

## 🧪 Test Types

### 1. Unit Tests
- **User Service**: Spring Boot + JUnit 5 + Mockito
- **Workout Plan Service**: Spring Boot + JUnit 5 + Mockito
- **API Gateway**: Spring Cloud Gateway + JUnit 5
- **Service Registry**: Eureka Server + JUnit 5
- **GenAI Worker**: FastAPI + Pytest
- **Frontend**: Next.js + Jest (if configured)

### 2. Integration Tests
- Service Discovery (Eureka)
- Database Integration (PostgreSQL)
- API Gateway Routing
- Authentication Flow
- Service-to-Service Communication
- GenAI Worker Integration
- End-to-End Workflows
- Data Persistence

### 3. System Tests
- Complete user journeys
- Performance testing
- Load testing
- Error recovery

## 🖥️ CLI Test Runners

### Main Test Runner

```bash
# Run all tests with full reports
./run-all-tests.sh -a -c -r

# Available options:
./run-all-tests.sh [OPTIONS]

Options:
  -u, --unit         Run unit tests only
  -i, --integration  Run integration tests only
  -a, --all          Run all tests (default)
  -c, --coverage     Generate coverage reports
  -f, --fast         Skip slow tests
  -v, --verbose      Verbose output
  -r, --report       Generate test reports
  --clean            Clean test environment first
  --setup            Setup test environment
  -h, --help         Show help message
```

### Individual Test Runners

#### Unit Tests Only
```bash
./run-unit-tests.sh

# What it tests:
# ✅ User Service business logic
# ✅ Workout Plan Service algorithms
# ✅ API Gateway configuration
# ✅ GenAI Worker mock responses
# ✅ Data models and validation
```

#### Integration Tests Only
```bash
./run-integration-tests.sh

# What it tests:
# ✅ Service discovery with Eureka
# ✅ Database connectivity and transactions
# ✅ API Gateway routing to services
# ✅ Authentication and JWT handling
# ✅ Workout generation workflow
# ✅ GenAI worker communication
# ✅ End-to-end user scenarios
# ✅ Data persistence across restarts
```

#### API Endpoint Testing
```bash
./test-endpoints.sh

# Manual endpoint testing:
# ✅ User registration and login
# ✅ Profile management
# ✅ Daily workout generation
# ✅ Weekly workout generation
# ✅ Authentication workflows
```

### Example Usage Scenarios

```bash
# Development workflow
./run-all-tests.sh -u -v          # Quick unit test feedback

# Pre-commit checks
./run-all-tests.sh --clean -a -c  # Full clean test run

# CI/CD pipeline
./run-all-tests.sh -a -r          # All tests with reports

# Debug specific issues
./run-integration-tests.sh        # Focus on integration issues

# Performance validation
./run-all-tests.sh -f             # Skip slow tests for faster feedback
```

## 📊 Test Coverage

### Coverage Reports

The test framework generates comprehensive coverage reports:

```bash
# Generate coverage for all services
./run-all-tests.sh -c

# Coverage files generated:
test-reports/
├── user-service-coverage/           # Java JaCoCo reports
├── workout-plan-service-coverage/   # Java JaCoCo reports
├── genai-coverage/                  # Python coverage reports
└── test-summary.html               # Consolidated report
```

### Coverage Targets

| Service | Target Coverage | Current Status |
|---------|----------------|----------------|
| User Service | >80% | ✅ Tracked |
| Workout Plan Service | >80% | ✅ Tracked |
| API Gateway | >70% | ✅ Tracked |
| GenAI Worker | >85% | ✅ Tracked |

### Viewing Coverage Reports

```bash
# Open main summary report
open test-reports/test-summary.html

# Individual service reports
open test-reports/user-service-coverage/index.html
open test-reports/workout-plan-service-coverage/index.html
open test-reports/genai-coverage/index.html
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: FlexFit Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y jq
          pip3 install pytest pytest-cov requests fastapi httpx
          
      - name: Run tests
        run: |
          chmod +x *.sh
          ./run-all-tests.sh --setup -a -c -r
          
      - name: Upload test reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports
          path: test-reports/
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'chmod +x *.sh'
                sh './run-all-tests.sh --setup'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh './run-unit-tests.sh'
            }
            post {
                always {
                    publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh './run-integration-tests.sh'
            }
        }
        
        stage('Coverage') {
            steps {
                sh './run-all-tests.sh -c'
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'test-reports',
                    reportFiles: 'test-summary.html',
                    reportName: 'Test Coverage Report'
                ])
            }
        }
    }
}
```

## 🐛 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker status
docker compose ps

# View service logs
docker compose logs [service-name]

# Restart services
docker compose restart

# Clean start
./run-all-tests.sh --clean --setup -a
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :8080
netstat -tulpn | grep :5432

# Kill processes using required ports
sudo lsof -t -i:8080 | xargs kill -9
```

#### Test Database Issues
```bash
# Reset test database
docker compose down
docker volume prune -f
docker compose up -d db

# Wait for database to be ready
./run-integration-tests.sh  # Will wait for services
```

#### Memory Issues During Testing
```bash
# Increase Docker memory limits
# Docker Desktop: Settings → Resources → Memory: 8GB+

# Clean up Docker resources
docker system prune -a
docker volume prune -f
```

#### Maven Test Failures
```bash
# Clean and rebuild
cd server/user-service
./mvnw clean install -DskipTests
./mvnw test

# Run specific test class
./mvnw test -Dtest=UserServiceTest
```

#### Python Test Issues
```bash
# Ensure dependencies are installed
cd genai
pip3 install -r requirements.txt
pip3 install pytest pytest-cov

# Run tests directly
python3 -m pytest test_workout_worker.py -v

# Debug mode
python3 -m pytest test_workout_worker.py -v -s --tb=long
```

### Environment Variables

```bash
# Set test environment variables
export MOCK_MODE=true                # Use mock GenAI responses
export CHAIR_API_KEY=test-key        # Test API key
export MODEL_NAME=test-model         # Test model name
export POSTGRES_HOST=localhost       # Database host
export POSTGRES_PORT=5432           # Database port
```

### Test Data Cleanup

```bash
# Manual cleanup script
./run-all-tests.sh --clean

# Or manually:
docker compose down
docker volume prune -f
rm -rf server/*/target/
rm -rf genai/__pycache__/
rm -rf test-reports/
```

### Performance Tuning

```bash
# Fast testing (skip slow tests)
./run-all-tests.sh -f

# Parallel test execution
./run-unit-tests.sh          # Units tests run in parallel by default

# Disable verbose logging
export SPRING_LOGGING_LEVEL_ROOT=WARN
```

## 📈 Metrics and Monitoring

### Test Execution Metrics

The test framework tracks:
- ✅ Test execution time
- ✅ Success/failure rates
- ✅ Code coverage percentages
- ✅ Service health status
- ✅ Database connectivity
- ✅ API response times

### Continuous Monitoring

```bash
# Health check script for monitoring
./test-endpoints.sh  # Returns exit codes for monitoring

# Check specific service health
curl -f http://localhost:8080/actuator/health
curl -f http://localhost:8081/actuator/health
curl -f http://localhost:8082/actuator/health
curl -f http://localhost:8000/health
```

## 🎯 Best Practices

### Writing New Tests

1. **Unit Tests**: Focus on individual component logic
2. **Integration Tests**: Test service interactions
3. **Use appropriate test data**: Realistic but deterministic
4. **Mock external dependencies**: Use mock mode for GenAI
5. **Clean up after tests**: Ensure test isolation
6. **Meaningful assertions**: Test business logic, not implementation

### Running Tests Locally

```bash
# Before committing code
./run-all-tests.sh --clean -u -v      # Quick feedback

# Before pushing to main
./run-all-tests.sh --clean -a -c -r   # Full validation

# For debugging
./run-integration-tests.sh            # Focus on specific issues
```

### Test Naming Conventions

- Unit Tests: `*Test.java` (Java), `test_*.py` (Python)
- Integration Tests: `*IntegrationTest.java`, `test_*_integration.py`
- Test methods: `should_*_when_*` or `test_*_*`

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Support**: Check individual test runner help with `./[script] --help` 