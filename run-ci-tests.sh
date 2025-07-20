#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting CI Tests"
echo "Java Version:"
java -version
echo ""

# Set Maven options for CI environment
export MAVEN_OPTS="-Xmx1024m -Xms512m -XX:MaxMetaspaceSize=256m -Djava.awt.headless=true -Dfile.encoding=UTF-8"
echo "Maven Options: $MAVEN_OPTS"
echo ""

# Function to run tests with retry logic
run_service_tests() {
    local service_name=$1
    local service_path=$2
    
    echo "🧪 Testing $service_name..."
    cd "$service_path"
    
    # First attempt
    if ./mvnw test -e -fae; then
        echo "✅ $service_name tests passed"
        cd - > /dev/null
        return 0
    else
        echo "❌ $service_name tests failed on first attempt"
        
        # Second attempt with more verbose output
        echo "🔄 Retrying $service_name tests with verbose output..."
        if ./mvnw test -X -e; then
            echo "✅ $service_name tests passed on retry"
            cd - > /dev/null
            return 0
        else
            echo "💥 $service_name tests failed on both attempts"
            
            # Show any dump files
            echo "🔍 Looking for dump files..."
            find . -name "*.dump*" -type f 2>/dev/null | head -5 | while read dump; do
                echo "Found dump: $dump"
                ls -la "$dump" 2>/dev/null || true
            done
            
            cd - > /dev/null
            return 1
        fi
    fi
}

# Run tests for each service
echo "🏁 Running service tests..."

# Test user-service
if ! run_service_tests "user-service" "server/user-service"; then
    echo "💥 User service tests failed"
    exit 1
fi

# Test workout-plan-service
if ! run_service_tests "workout-plan-service" "server/workout-plan-service"; then
    echo "💥 Workout plan service tests failed"
    exit 1
fi

echo ""
echo "🎉 All tests completed successfully!" 