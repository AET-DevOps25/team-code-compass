#!/bin/bash

echo "🧪 FlexFit Local Testing Script"
echo "================================"

echo ""
echo "🔍 Checking Docker Compose Services..."
docker compose ps

echo ""
echo "🏥 Health Checks:"
echo "=================="

# Function to test a service
test_service() {
    local url=$1
    local name=$2
    echo -n "Testing $name... "
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
        return 1
    fi
}

# Test all services
test_service "http://localhost:5432" "PostgreSQL (connection)"
test_service "http://localhost:8761/actuator/health" "Service Registry"
test_service "http://localhost:8080/actuator/health" "API Gateway"
test_service "http://localhost:8081/actuator/health" "User Service"  
test_service "http://localhost:8082/actuator/health" "Workout Plan Service"
test_service "http://localhost:8083/health" "GenAI Worker (Cloud)"
test_service "http://localhost:8084/health" "GenAI Worker (Local)"
test_service "http://localhost:3000" "Frontend"

echo ""
echo "📊 Monitoring Stack:"
echo "===================="
test_service "http://localhost:9090/-/healthy" "Prometheus"
test_service "http://localhost:3001/api/health" "Grafana"
test_service "http://localhost:9093/-/healthy" "Alertmanager"

echo ""
echo "🔗 Quick Integration Test:"
echo "=========================="

# Test user registration
echo -n "Testing user registration... "
RESPONSE=$(curl -s -X POST http://localhost:8080/user-service/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }')

if [[ $RESPONSE == *"id"* ]]; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    echo "Response: $RESPONSE"
fi

echo ""
echo "📋 Service URLs:"
echo "================"
echo "🌐 Frontend:           http://localhost:3000"
echo "🚪 API Gateway:        http://localhost:8080"
echo "👤 User Service:       http://localhost:8081"  
echo "🏋️  Workout Service:    http://localhost:8082"
echo "🤖 GenAI Cloud:        http://localhost:8083"
echo "🤖 GenAI Local:        http://localhost:8084"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Grafana:            http://localhost:3001 (admin/admin)"
echo "🚨 Alertmanager:       http://localhost:9093"

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Visit http://localhost:3000 - Test the frontend"
echo "2. Visit http://localhost:3001 - Check Grafana dashboards"
echo "3. Visit http://localhost:9090 - Check Prometheus metrics"
echo "4. Test user registration and workout creation"

echo ""
echo "✅ Local testing complete!" 