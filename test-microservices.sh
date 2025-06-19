#!/bin/bash

echo "🧪 Testing FlexFit Microservices Architecture"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name: "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Test Service Registry
echo -e "\n${YELLOW}1. Service Registry (Eureka)${NC}"
test_endpoint "Service Registry Health" "http://localhost:8761/actuator/health"
test_endpoint "Eureka Dashboard" "http://localhost:8761/"

# Test API Gateway
echo -e "\n${YELLOW}2. API Gateway${NC}"
test_endpoint "API Gateway Health" "http://localhost:8000/actuator/health"

# Test Direct Service Access
echo -e "\n${YELLOW}3. Direct Service Access${NC}"
test_endpoint "User Service Health" "http://localhost:8081/actuator/health"
test_endpoint "Workout Plan Service Health" "http://localhost:8082/actuator/health"

# Test Services via API Gateway
echo -e "\n${YELLOW}4. Services via API Gateway${NC}"
test_endpoint "User Service via Gateway" "http://localhost:8000/api/users/health"
test_endpoint "Workout Plan Service via Gateway" "http://localhost:8000/api/workout-plans/health"

# Test Service Discovery
echo -e "\n${YELLOW}5. Service Registration Check${NC}"
echo "Checking registered services in Eureka..."

EUREKA_RESPONSE=$(curl -s "http://localhost:8761/eureka/apps" -H "Accept: application/json")

if echo "$EUREKA_RESPONSE" | grep -q "USER-SERVICE"; then
    echo -e "${GREEN}✅ user-service is registered${NC}"
else
    echo -e "${RED}❌ user-service is NOT registered${NC}"
fi

if echo "$EUREKA_RESPONSE" | grep -q "WORKOUT-PLAN-SERVICE"; then
    echo -e "${GREEN}✅ workout-plan-service is registered${NC}"
else
    echo -e "${RED}❌ workout-plan-service is NOT registered${NC}"
fi

if echo "$EUREKA_RESPONSE" | grep -q "API-GATEWAY"; then
    echo -e "${GREEN}✅ api-gateway is registered${NC}"
else
    echo -e "${RED}❌ api-gateway is NOT registered${NC}"
fi

echo -e "\n${YELLOW}6. Summary${NC}"
echo "============================================="
echo "🔍 Service Registry (Eureka): http://localhost:8761"
echo "🌐 API Gateway: http://localhost:8000"
echo "👤 User Service: http://localhost:8081"
echo "💪 Workout Plan Service: http://localhost:8082"
echo "🤖 GenAI Worker: http://localhost:8083"
echo ""
echo "🧪 Test API Gateway routing:"
echo "   curl http://localhost:8000/api/users/health"
echo "   curl http://localhost:8000/api/workout-plans/health"
echo ""
echo "📊 View registered services: http://localhost:8761" 