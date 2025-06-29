# Testing Documentation

## Overview

This document describes the comprehensive testing strategy for Team Code Compass, including **Unit Tests**, **Integration Tests**, and **System Tests**.

## Test Structure

```
team-code-compass/
├── server/
│   ├── user-service/src/test/java/          # Unit tests for User Service
│   └── workout-plan-service/src/test/java/  # Unit tests for Workout Plan Service
├── genai/
│   └── test_workout_worker.py               # Unit tests for GenAI Service
├── tests/
│   ├── integration/                         # Integration tests
│   │   └── test_user_workout_integration.py
│   └── system/                              # System tests
│       └── test_end_to_end_system.py
├── run-all-tests.sh                         # Master test runner
└── TESTING.md                               # This documentation
```

## Test Types

### 1. Unit Tests

**Purpose**: Test individual components in isolation using mocks and stubs.

**Location**: Under each service's `src/test/java` directory (Java) or service root (Python).

**Coverage**:
- **User Service**: `AuthService`, `UserService`, repositories, and controllers
- **Workout Plan Service**: `WorkoutPlanService`, `WorkoutPlanMapper`, and controllers  
- **GenAI Service**: Workout generation logic, validation, and API endpoints

**Technology Stack**:
- **Java**: JUnit 5, Mockito, Spring Boot Test
- **Python**: pytest, unittest.mock, FastAPI TestClient

**Example Unit Tests**:
```java
// Java - User Service
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private AuthServiceImpl authService;
    
    @Test
    void registerUser_Success() {
        // Given, When, Then...
    }
}
```

```python
# Python - GenAI Service
class TestWorkoutWorkerAPI:
    def test_generate_endpoint_valid_request(self):
        response = client.post("/generate", json=valid_request)
        assert response.status_code == 200
```

### 2. Integration Tests

**Purpose**: Test interaction between services using real HTTP calls.

**Location**: `tests/integration/`

**Coverage**:
- User registration → Authentication → Workout generation flow
- Service-to-service communication (User Service ↔ Workout Plan Service)
- Cross-service data consistency and security boundaries
- Multiple sport types and user scenarios

**Technology Stack**: Python with `requests`, `pytest`

**Example Integration Test**:
```python
def test_workout_plan_generation_flow(self, registered_user):
    headers = {"Authorization": f"Bearer {registered_user['token']}"}
    
    workout_request = {
        "userId": registered_user["id"],
        "dayDate": "2025-06-29",
        "focusSportType": "STRENGTH",
        "targetDurationMinutes": 45
    }
    
    response = requests.post(
        f"{BASE_WORKOUT_URL}/api/v1/plans/generate",
        json=workout_request,
        headers={**headers, "Content-Type": "application/json"}
    )
    
    assert response.status_code == 200
    # Validate complete response structure...
```

### 3. System Tests

**Purpose**: Test complete end-to-end system behavior including all services, database, and external dependencies.

**Location**: `tests/system/`

**Coverage**:
- Complete user journeys from registration to workout completion
- Multi-user system isolation and concurrent usage
- System performance under load
- Data persistence across operations
- Error recovery and security boundaries
- GenAI service integration with the entire system

**Technology Stack**: Python with `requests`, `pytest`, `concurrent.futures`

**Example System Test**:
```python
def test_user_journey_complete_flow(self):
    # Step 1: User Registration
    user = self.create_test_user("_journey")
    
    # Step 2: Generate Multiple Workout Plans
    sport_types = ["STRENGTH", "HIIT", "YOGA"]
    for i, sport_type in enumerate(sport_types):
        # Generate workout and validate...
    
    # Step 3: Verify system-wide data consistency
```

## Running Tests

### Prerequisites

1. **Start all services**:
   ```bash
   docker compose up -d
   ```

2. **Verify services are healthy**:
   ```bash
   curl http://localhost:8081/health  # User Service
   curl http://localhost:8082/health  # Workout Plan Service  
   curl http://localhost:8083/health  # GenAI Service
   ```

### Test Execution Options

#### Run All Tests
```bash
./run-all-tests.sh
```

#### Run Specific Test Types
```bash
./run-all-tests.sh --unit-only           # Only unit tests
./run-all-tests.sh --integration-only    # Only integration tests
./run-all-tests.sh --system-only         # Only system tests
```

#### Skip Specific Test Types
```bash
./run-all-tests.sh --skip-unit          # Skip unit tests
./run-all-tests.sh --skip-integration   # Skip integration tests
./run-all-tests.sh --skip-system        # Skip system tests
```

#### Individual Test Suite Execution
```bash
# Unit Tests
cd server/user-service && mvn test
cd server/workout-plan-service && mvn test
cd genai && python3 -m pytest test_workout_worker.py -v

# Integration Tests
python3 -m pytest tests/integration/ -v

# System Tests  
python3 -m pytest tests/system/ -v
```

## Test Coverage

### Unit Test Coverage

**User Service** (18 test methods):
- AuthService: Registration, authentication, validation, error handling
- UserService: CRUD operations, profile management, data conversion
- Edge cases: Null inputs, invalid data, boundary conditions

**Workout Plan Service** (15 test methods):
- WorkoutPlanService: Workout generation, external service calls, data persistence
- Service integration: User service communication, GenAI service calls
- Error scenarios: Service failures, invalid requests, database errors

**GenAI Service** (8 test methods):
- API endpoints: Health checks, workout generation, validation
- Workout creation: Different sport types, user demographics
- Error handling: Invalid requests, missing data

### Integration Test Coverage

**Service Integration** (10 test methods):
- User registration and authentication flow
- Workout plan generation with real service communication
- Multi-sport type support and data validation
- Security boundaries and unauthorized access handling
- Concurrent request handling and data isolation

### System Test Coverage

**End-to-End Scenarios** (6 test methods):
- Complete user journey from registration to workout completion
- Multi-user system isolation and concurrent usage
- System performance and load testing
- Data persistence and error recovery
- Security boundaries and GenAI integration

## Test Data Management

### Test User Creation
- Unique usernames and emails using UUID prefixes
- Consistent test data structure across all test types
- Automatic cleanup where possible

### Test Isolation
- Each test creates its own users to avoid conflicts
- Integration and system tests use different user prefixes
- Database transactions are isolated per test where applicable

## Performance Benchmarks

### Expected Response Times
- **User Registration**: < 2 seconds
- **Authentication**: < 1 second  
- **Workout Generation**: < 10 seconds
- **Profile Access**: < 1 second

### Load Testing Results
- **Concurrent Users**: Supports 5+ concurrent workout generations
- **Success Rate**: > 80% under load conditions
- **Average Response Time**: < 10 seconds for workout generation

## Continuous Integration

### Test Automation
The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions workflow
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker compose up -d
      - name: Wait for services
        run: sleep 30
      - name: Run tests
        run: ./run-all-tests.sh
```

### Test Reports
- Detailed logs for each test type in `test-logs/` directory
- Test summary with pass/fail counts and success rates
- Timestamped logs for debugging and audit trails

## Troubleshooting

### Common Issues

1. **Services not running**:
   ```bash
   docker compose up -d
   sleep 30  # Wait for services to start
   ```

2. **Port conflicts**:
   ```bash
   docker compose down
   # Check for processes using ports 8081, 8082, 8083
   lsof -i :8081
   ```

3. **Database connection issues**:
   ```bash
   docker compose logs postgres
   ```

4. **Java/Maven not found**:
   ```bash
   # Install Java 17+ and Maven 3.6+
   sudo apt install openjdk-17-jdk maven  # Ubuntu/Debian
   ```

5. **Python dependencies**:
   ```bash
   pip3 install requests pytest
   ```

### Debug Mode
For detailed debugging, run tests with verbose output:
```bash
./run-all-tests.sh 2>&1 | tee debug.log
```

## Test Maintenance

### Adding New Tests
1. **Unit Tests**: Add to appropriate service's test directory
2. **Integration Tests**: Add to `tests/integration/`
3. **System Tests**: Add to `tests/system/`
4. Update this documentation with new test coverage

### Test Data Updates
- Update test fixtures when API contracts change
- Maintain backward compatibility where possible
- Document breaking changes in test data structure

### Performance Monitoring
- Monitor test execution times
- Update performance benchmarks as system scales
- Optimize slow tests while maintaining coverage

## Best Practices

### Test Design
- **Arrange-Act-Assert** pattern for clarity
- **Independent tests** that don't depend on each other
- **Descriptive test names** that explain the scenario
- **Comprehensive assertions** that validate all important aspects

### Mock Usage
- Mock external dependencies in unit tests
- Use real services in integration/system tests
- Keep mocks simple and focused on the behavior being tested

### Error Testing
- Test both happy path and error scenarios
- Validate error messages and status codes
- Test edge cases and boundary conditions

### Maintenance
- Regular test review and cleanup
- Update tests when requirements change
- Monitor test reliability and fix flaky tests promptly 