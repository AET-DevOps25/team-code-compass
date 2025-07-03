# FlexFit Testing Guide

This document describes the comprehensive testing strategy for the FlexFit application, organized into a systematic hierarchy of test types.

## 📋 Test Structure Overview

Our testing approach follows a systematic pyramid structure:

```
                    🎯 Performance Tests
                   ⚡ Load, Stress, Concurrency
                  
                🌐 System Tests
               End-to-End Workflows
              
            🔗 Integration Tests
           Service-to-Service Communication
          
        🧪 Unit Tests
       Individual Component Testing
```

## 🧪 Unit Tests

**Purpose**: Test individual components in isolation without external dependencies.

**Location**: Each service has its own unit tests in `src/test/java/`

**Current Status**:
- ✅ User Service: `AuthServiceTest`, `UserServiceTest` 
- ✅ Workout Plan Service: `WorkoutPlanServiceTest`
- ⚠️ API Gateway: Basic tests (may not have comprehensive coverage)
- ⚠️ Service Registry: Basic tests (may not have comprehensive coverage)
- ⚠️ GenAI Service: Python tests (requires pytest environment)

**Running Unit Tests**:
```bash
# All unit tests
./run-tests-ci.sh --unit-only

# Individual services
cd server/user-service && ./mvnw test
cd server/workout-plan-service && ./mvnw test
cd genai && python -m pytest test_workout_worker.py -v
```

## 🔗 Integration Tests

**Purpose**: Test interactions between services and external systems.

**Location**: `tests/integration/`

**Test Categories**:

### Authentication Integration (`test-auth-integration.sh`)
- JWT token generation and validation
- Cross-service authentication
- Token expiration handling
- Invalid token rejection

### Database Integration (`test-database-integration.sh`)
- Data persistence across services
- Transaction handling
- Data consistency checks
- Cross-service data integrity

### API Gateway Integration (`test-gateway-integration.sh`)
- Service discovery and routing
- Load balancing
- Circuit breaker functionality
- CORS and rate limiting

### Service Communication (`test_user_workout_integration.py`)
- User-Workout service interaction
- Data flow between services
- Error propagation

**Running Integration Tests**:
```bash
# All integration tests (requires running services)
./test-all.sh --integration-only

# Individual integration tests
./tests/integration/test-auth-integration.sh
./tests/integration/test-database-integration.sh
./tests/integration/test-gateway-integration.sh
python -m pytest tests/integration/test_user_workout_integration.py -v
```

## 🌐 System Tests

**Purpose**: Test complete user workflows and end-to-end scenarios.

**Location**: `tests/system/`

**Test Categories**:

### End-to-End System Tests (`test_end_to_end_system.py`)
- Complete application workflows
- Multi-service interactions
- Data consistency across the entire system

### User Journey Tests (`test-user-journey.sh`)
- New user registration and first workout
- Returning user with multiple workouts
- User preferences and customization
- Error handling and recovery

### Workout Generation System Tests (`test-workout-integration.sh`)
- Complete workout generation flow
- GenAI service integration
- Markdown content generation and persistence
- Multiple sport type support

**Running System Tests**:
```bash
# All system tests (requires full system running)
./test-all.sh --system-only

# Individual system tests
./tests/system/test-user-journey.sh
./test-workout-integration.sh
python -m pytest tests/system/test_end_to_end_system.py -v
```

## ⚡ Performance Tests

**Purpose**: Test system performance under various load conditions.

**Location**: `tests/performance/`

**Test Categories**:

### Load Testing (`test-load.sh`)
- Normal operational load simulation
- Multiple concurrent users
- Response time measurement
- Throughput analysis

### Stress Testing (`test-stress.sh`)
- Progressive load increase
- System breaking point identification
- Recovery capability testing
- Resource utilization monitoring

### Concurrent Users Testing (`test-concurrent-users.sh`)
- Realistic user behavior simulation
- Session-based testing
- User journey completion rates
- System stability under concurrent load

**Running Performance Tests**:
```bash
# All performance tests (requires optimized system)
./test-all.sh --performance-only

# Individual performance tests
./tests/performance/test-load.sh
./tests/performance/test-stress.sh
./tests/performance/test-concurrent-users.sh
```

## 🎯 Comprehensive Test Suite

**Purpose**: Run all test categories in a systematic order.

**Main Test Runner**: `test-all.sh`

**Usage**:
```bash
# Run all tests
./test-all.sh --full

# Run specific test categories
./test-all.sh --unit-only
./test-all.sh --integration-only
./test-all.sh --system-only
./test-all.sh --performance-only

# Quick test suite (unit + integration)
./test-all.sh --quick

# Skip specific categories
./test-all.sh --skip-performance
./test-all.sh --skip-system
```

## 🚀 CI/CD Integration

**Simple CI Runner**: `run-tests-ci.sh`

This script is designed for CI/CD environments where complex dependencies may not be available:

```bash
# Safe for CI environments (no external dependencies)
./run-tests-ci.sh --unit-only

# Requires running services
./run-tests-ci.sh --integration

# All available tests
./run-tests-ci.sh --all
```

## 📊 Test Results and Reporting

**Test Results Directory**: `test-results/`

Structure:
```
test-results/
├── unit/           # Unit test logs
├── integration/    # Integration test logs
├── system/         # System test logs
├── performance/    # Performance test logs
└── test-report-TIMESTAMP.html  # Comprehensive HTML report
```

**HTML Report**: Generated automatically by `test-all.sh`, includes:
- Test summary by category
- Pass/fail statistics
- Success rate analysis
- Links to detailed logs

## 🛠️ Prerequisites

### For Unit Tests
- Java 17+
- Maven 3.6+
- Python 3.9+ (for GenAI service)

### For Integration Tests
- All unit test prerequisites
- Docker and Docker Compose
- Running FlexFit services
- PostgreSQL database

### For System Tests
- All integration test prerequisites
- Full system deployment
- Network connectivity between all services

### For Performance Tests
- All system test prerequisites
- Optimized system configuration
- Sufficient system resources
- `bc` calculator (for Linux systems)

## 🔧 Configuration

### Environment Variables
- `CHAIR_API_KEY`: Required for GenAI service tests
- Database connection strings (for integration/system tests)

### Test Profiles
- `application-test.yml`: Test-specific configuration
- H2 in-memory database for unit tests
- PostgreSQL for integration/system tests

## 📈 Test Coverage Goals

| Test Type | Current Status | Target Coverage |
|-----------|---------------|-----------------|
| Unit Tests | 🟡 Partial | 80%+ |
| Integration Tests | 🟢 Good | 90%+ |
| System Tests | 🟢 Excellent | 95%+ |
| Performance Tests | 🟢 Comprehensive | Baseline established |

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running for integration/system tests
   - Check database credentials in configuration
   - Use H2 in-memory database for unit tests

2. **Service Unavailable Errors**
   - Start all services with `docker compose up -d`
   - Wait for services to fully initialize (60-120 seconds)
   - Check service health endpoints

3. **Python Environment Issues**
   - Install required Python packages: `pip install pytest requests fastapi uvicorn`
   - Ensure Python 3.9+ is available
   - Set `CHAIR_API_KEY` environment variable

4. **Performance Test Failures**
   - Ensure system has sufficient resources
   - Close unnecessary applications
   - Check network connectivity

### Test Debugging

1. **Enable Verbose Logging**
   ```bash
   # For integration tests
   export DEBUG=true
   ./tests/integration/test-auth-integration.sh
   
   # For system tests
   python -m pytest tests/system/ -v -s
   ```

2. **Check Individual Service Logs**
   ```bash
   docker compose logs user-service
   docker compose logs workout-plan-service
   docker compose logs genai-service
   ```

3. **Manual Service Testing**
   ```bash
   curl http://localhost:8081/health
   curl http://localhost:8082/health
   curl http://localhost:8083/health
   ```

## 🔄 Continuous Integration

### GitHub Actions Integration

The CI/CD pipeline (`/.github/workflows/ci-cd.yml`) uses this testing structure:

1. **Unit Tests**: Run on every commit
2. **Integration Tests**: Run on pull requests
3. **System Tests**: Run on main branch
4. **Performance Tests**: Run on releases

### Local Development Workflow

1. **Before Committing**:
   ```bash
   ./run-tests-ci.sh --unit-only
   ```

2. **Before Pull Request**:
   ```bash
   ./test-all.sh --quick
   ```

3. **Before Release**:
   ```bash
   ./test-all.sh --full
   ```

## 📚 Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Data Cleanup**: Tests should clean up any data they create
3. **Realistic Data**: Use realistic test data that mirrors production scenarios
4. **Error Scenarios**: Test both success and failure paths
5. **Performance Baselines**: Establish and maintain performance benchmarks
6. **Documentation**: Keep test documentation up-to-date with code changes

## 🎯 Future Improvements

1. **Enhanced Unit Test Coverage**: Add more comprehensive unit tests for all services
2. **Contract Testing**: Implement consumer-driven contract tests
3. **Security Testing**: Add security-focused test scenarios
4. **Accessibility Testing**: Include accessibility compliance tests
5. **Mobile Testing**: Add mobile-specific test scenarios
6. **Chaos Engineering**: Implement chaos testing for resilience validation

---

For questions or issues with testing, please refer to the troubleshooting section or contact the development team. 