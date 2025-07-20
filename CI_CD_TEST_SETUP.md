# CI/CD Unit Test Setup Guide

## 🎯 Overview

This guide provides the **minimal environment requirements** to run all unit tests in CI/CD pipelines. The tests are designed to work with **mocked dependencies** and require **no external services** (databases, AI models, containers, etc.).

## 📋 Test Suite Summary

| Test Suite | Framework | Dependencies | Mock Level |
|------------|-----------|--------------|------------|
| **User Service** | JUnit 5 + Spring Boot | Java 17, Maven | Database mocked |
| **Workout Plan Service** | JUnit 5 + Spring Boot | Java 17, Maven | RestTemplates mocked |
| **API Gateway** | JUnit 5 + Spring Cloud | Java 17, Maven | Gateway filters mocked |
| **Service Registry** | JUnit 5 + Eureka | Java 17, Maven | Service discovery mocked |
| **GenAI Cloud Worker** | Pytest + FastAPI | Python 3.8+, pip | LLM APIs mocked |
| **GenAI Local Worker** | Pytest + FastAPI | Python 3.8+, pip | Local LLMs mocked |
| **Frontend Integration** | Node.js Assert | Node.js 16+ | UI components logic tested |

## 🔧 CI/CD Environment Requirements

### **Required Software Versions**
```bash
# Java (for Spring Boot services)
java --version    # Should be Java 17+
mvn --version     # Should be Maven 3.6+

# Python (for GenAI workers)
python3 --version # Should be Python 3.8+
pip3 --version    # Should be pip 20+

# Node.js (for frontend tests)
node --version    # Should be Node.js 16+
npm --version     # Should be npm 8+
```

### **Required Environment Variables**

#### ✅ **NO Environment Variables Required!**
All tests use **mocked dependencies** and **hardcoded test data**. No external services, API keys, or database connections needed.

#### 🔄 **Optional Environment Variables (for test configuration)**
```bash
# Test execution mode (optional)
export TEST_MODE=ci              # Enables CI-friendly output
export MAVEN_OPTS="-Xmx1024m"    # Maven memory settings  
export NODE_ENV=test             # Node.js test environment
```

## 🚀 Running Tests in CI/CD

### **Method 1: Use the Test Runner Script (Recommended)**
```bash
# Grant execute permissions
chmod +x run-unit-tests.sh

# Run all test suites
./run-unit-tests.sh

# Expected output:
# Total Test Suites: 7
# Passed: 7
# Failed: 0
# 🎉 All unit tests passed successfully!
```

### **Method 2: Run Individual Test Suites**
```bash
# Java Spring Boot Services
cd server/user-service && ./mvnw test -Dspring.profiles.active=test
cd server/workout-plan-service && ./mvnw test -Dspring.profiles.active=test  
cd server/api-gateway && ./mvnw test -Dspring.profiles.active=test
cd server/service-registry && ./mvnw test

# Python GenAI Workers (requires pytest installation)
cd genai && pip3 install pytest httpx && python3 -m pytest test_workout_worker.py -v
cd genai && pip3 install pytest httpx && python3 -m pytest test_workout_worker_local.py -v

# Frontend Integration Tests
cd client && node tests/ai-preference-integration.test.js
```

## 📦 Dependency Installation for CI/CD

### **Java Dependencies (Auto-managed by Maven)**
```bash
# Maven handles all dependencies automatically via pom.xml
# No manual installation required
```

### **Python Dependencies (Install in CI/CD)**
```bash
cd genai
pip3 install pytest>=7.0.0 pytest-asyncio>=0.21.0 httpx>=0.24.0
# Note: LLM dependencies (gpt4all, requests) are mocked in tests
```

### **Node.js Dependencies (Built-in)**
```bash
# Uses Node.js built-in 'assert' module
# No npm install required for tests
```

## 🐳 Docker-based CI/CD (Alternative)

### **Use Pre-built Test Container**
```dockerfile
# Dockerfile.ci-tests
FROM openjdk:17-jdk-slim

# Install Python and Node.js
RUN apt-get update && apt-get install -y python3 python3-pip nodejs npm

# Copy source code
COPY . /app
WORKDIR /app

# Install Python test dependencies
RUN cd genai && pip3 install pytest httpx

# Run tests
CMD ["./run-unit-tests.sh"]
```

### **Docker Compose for CI/CD**
```yaml
# docker-compose.ci.yml
version: '3.8'
services:
  ci-tests:
    build:
      context: .
      dockerfile: Dockerfile.ci-tests
    environment:
      - TEST_MODE=ci
    volumes:
      - ./test-results:/app/test-results
```

## 🧪 Test Coverage and Validation

### **What Gets Tested**
- ✅ **AI Preference Routing Logic** (cloud vs local)
- ✅ **RestTemplate Configuration** (dual GenAI workers)
- ✅ **Request/Response Data Structures**
- ✅ **Error Handling and Fallbacks**
- ✅ **API Endpoint Selection Logic**
- ✅ **Service Layer Business Logic**
- ✅ **Frontend Integration Logic**

### **What Gets Mocked**
- 🚫 **Database Connections** (H2 in-memory for Spring)
- 🚫 **External APIs** (OpenAI, Claude, Ollama)
- 🚫 **LLM Models** (GPT4All, local models)
- 🚫 **Docker Containers**
- 🚫 **Network Calls**
- 🚫 **File System Operations**

## 📊 CI/CD Pipeline Integration

### **GitHub Actions Example**
```yaml
name: Unit Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
          
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.8'
          
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          
      - name: Install Python test dependencies
        run: cd genai && pip install pytest httpx
        
      - name: Run all unit tests
        run: ./run-unit-tests.sh
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### **Jenkins Pipeline Example**
```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                // Install required software
                sh 'apt-get update && apt-get install -y openjdk-17-jdk python3 python3-pip nodejs npm'
                sh 'cd genai && pip3 install pytest httpx'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh './run-unit-tests.sh'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/*.xml'
                }
            }
        }
    }
}
```

## ⚡ Performance Optimization

### **Fast Test Execution Tips**
```bash
# Parallel Maven execution
export MAVEN_OPTS="-Dmaven.test.parallel=parallel"

# Skip integration tests (unit tests only)
./mvnw test -DskipITs=true

# Specific test class execution
./mvnw test -Dtest=WorkoutPlanServiceTest

# Python pytest parallel execution
python3 -m pytest -n auto test_workout_worker_local.py
```

## ✅ Validation Checklist

Before deploying to CI/CD, verify:

- [ ] All tests pass locally with `./run-unit-tests.sh`
- [ ] No external dependencies required (databases, APIs, containers)
- [ ] Test execution completes in under 5 minutes
- [ ] Java 17, Python 3.8+, and Node.js 16+ are available
- [ ] Maven, pip, and npm commands work
- [ ] Test results are properly captured and reported

## 🆘 Troubleshooting

### **Common Issues and Solutions**

| Issue | Solution |
|-------|----------|
| "java: command not found" | Install OpenJDK 17: `apt-get install openjdk-17-jdk` |
| "python3: command not found" | Install Python: `apt-get install python3 python3-pip` |
| "pytest: command not found" | Install pytest: `pip3 install pytest` |
| Maven tests fail with OutOfMemory | Set `MAVEN_OPTS="-Xmx2048m"` |
| Python tests fail with import errors | Install missing deps: `pip3 install httpx fastapi` |
| Node.js tests fail | Ensure Node.js 16+: `curl -fsSL https://deb.nodesource.com/setup_16.x \| bash -` |

### **Contact Information**
For CI/CD setup assistance, refer to the main repository documentation or create an issue with the "ci/cd" label. 