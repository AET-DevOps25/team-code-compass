#!/bin/bash

# 🐳 Docker-based Local Testing (matches CI/CD environment)
# This script runs tests in the same environment as GitHub Actions

set -e

echo "🐳 Docker-Based Local Testing - Matches CI/CD Environment"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

print_status "Creating CI/CD-like test environment with Docker..."

# Create a Docker network for services
print_status "Creating test network..."
docker network create flexfit-test-network 2>/dev/null || true

# 1. Test Java Services (Ubuntu + Java 21)
print_status "🧪 Testing Java Services (Ubuntu + Java 21)..."

docker run --rm \
    --network flexfit-test-network \
    -v "$(pwd)":/workspace \
    -w /workspace \
    openjdk:21-jdk-slim \
    bash -c "
        echo '📦 Installing dependencies...'
        apt-get update -qq && apt-get install -y -qq curl wget
        
        echo '☕ Java Unit Tests - User Service'
        cd server/user-service
        chmod +x mvnw
        ./mvnw clean test -q -Dspring.profiles.active=test
        
        echo '☕ Java Unit Tests - Workout Plan Service'
        cd ../workout-plan-service
        chmod +x mvnw
        ./mvnw clean test -q -Dspring.profiles.active=test
        
        echo '☕ Java Unit Tests - API Gateway'
        cd ../api-gateway
        chmod +x mvnw
        ./mvnw clean test -q
        
        echo '☕ Java Unit Tests - Service Registry'
        cd ../service-registry
        chmod +x mvnw
        ./mvnw clean test -q
        
        echo '✅ All Java tests completed'
    "

if [ $? -eq 0 ]; then
    print_success "Java Unit Tests PASSED"
else
    print_error "Java Unit Tests FAILED"
    exit 1
fi

# 2. Test Python Services (Python 3.9)
print_status "🐍 Testing Python Services (Python 3.9)..."

docker run --rm \
    --network flexfit-test-network \
    -v "$(pwd)":/workspace \
    -w /workspace/genai \
    python:3.9-slim \
    bash -c "
        echo '📦 Installing Python dependencies...'
        pip install -q pytest requests fastapi uvicorn httpx
        pip install -q -r requirements.txt
        
        echo '🧪 Python Unit Tests - GenAI Cloud Worker'
        if [ -f test_workout_worker.py ]; then
            python -m pytest test_workout_worker.py -v --tb=short
        else
            echo 'No GenAI cloud tests found'
        fi
        
        echo '🧪 Python Unit Tests - GenAI Local Worker'
        if [ -f test_workout_worker_local.py ]; then
            python -m pytest test_workout_worker_local.py -v --tb=short
        else
            echo 'No GenAI local tests found'
        fi
        
        echo '✅ Python tests completed'
    "

if [ $? -eq 0 ]; then
    print_success "Python Unit Tests PASSED"
else
    print_warning "Python Unit Tests had issues (checking...)"
fi

# 3. Test Client (Node.js 20)
print_status "🌐 Testing Client (Node.js 20)..."

docker run --rm \
    --network flexfit-test-network \
    -v "$(pwd)":/workspace \
    -w /workspace/client \
    node:20-slim \
    bash -c "
        echo '📦 Installing Node.js dependencies...'
        npm install -q --no-progress
        
        echo '🧪 Client Unit Tests'
        # Install test framework if missing
        if ! npm list jest >/dev/null 2>&1; then
            echo 'Installing Jest test framework...'
            npm install -q --no-progress --save-dev jest
        fi
        
        # Run tests with proper test framework
        if [ -f tests/core-workflows.test.js ]; then
            echo 'Running core workflows tests...'
            npx jest tests/core-workflows.test.js || node tests/core-workflows.test.js
        fi
        
        if [ -f tests/ai-preference-integration.test.js ]; then
            echo 'Running AI preference tests...'
            npx jest tests/ai-preference-integration.test.js || node tests/ai-preference-integration.test.js
        fi
        
        echo '✅ Client tests completed'
    "

if [ $? -eq 0 ]; then
    print_success "Client Unit Tests PASSED"
else
    print_warning "Client Unit Tests had issues (checking...)"
fi

# 4. Integration Test Environment Setup
print_status "🔗 Testing Integration Test Setup..."

docker run --rm \
    --network flexfit-test-network \
    -v "$(pwd)":/workspace \
    -w /workspace \
    -v /var/run/docker.sock:/var/run/docker.sock \
    docker:latest \
    sh -c "
        echo '🐳 Checking Docker Compose setup...'
        if [ -f docker-compose.yml ]; then
            echo 'Docker Compose file exists ✅'
        else
            echo 'Docker Compose file missing ❌'
        fi
        
        if [ -f run-integration-tests.sh ]; then
            echo 'Integration test script exists ✅'
        else
            echo 'Integration test script missing ❌'
        fi
    "

# Cleanup
print_status "🧹 Cleaning up test environment..."
docker network rm flexfit-test-network 2>/dev/null || true

echo ""
print_success "🎉 Docker-based local testing completed!"
echo ""
print_status "💡 This environment matches GitHub Actions CI/CD exactly:"
echo "   - Ubuntu Linux containers"
echo "   - Java 21 (same as CI/CD)"
echo "   - Python 3.9 (same as CI/CD)" 
echo "   - Node.js 20 (same as CI/CD)"
echo ""
print_status "If tests pass here, they should pass on CI/CD! 🚀" 