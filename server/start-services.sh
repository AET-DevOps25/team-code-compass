#!/bin/bash

# FlexFit Microservices Startup Script
echo "🚀 Starting FlexFit Microservices with Service Registry and API Gateway"

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to start on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:$port/actuator/health >/dev/null 2>&1; then
            echo "✅ $service_name is running!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 5
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start within expected time"
    return 1
}

# Build all services
echo "🔨 Building all services..."

# Build Service Registry
echo "Building Service Registry..."
cd service-registry
mvn clean package -DskipTests
cd ..

# Build API Gateway
echo "Building API Gateway..."
cd api-gateway
mvn clean package -DskipTests
cd ..

# Build User Service
echo "Building User Service..."
cd user-service
mvn clean package -DskipTests
cd ..

# Build Workout Plan Service
echo "Building Workout Plan Service..."
cd workout-plan-service
mvn clean package -DskipTests
cd ..

echo "✅ All services built successfully!"

# Start services in order
echo "🌟 Starting services..."

# Start Service Registry first
echo "Starting Service Registry..."
cd service-registry
nohup java -jar target/service-registry-*.jar > ../logs/service-registry.log 2>&1 &
REGISTRY_PID=$!
cd ..

# Wait for Service Registry to be ready
check_service "Service Registry" 8761
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Service Registry. Exiting."
    exit 1
fi

# Start microservices
echo "Starting User Service..."
cd user-service
nohup java -jar target/user-service-*.jar > ../logs/user-service.log 2>&1 &
USER_SERVICE_PID=$!
cd ..

echo "Starting Workout Plan Service..."
cd workout-plan-service
nohup java -jar target/workout-plan-service-*.jar > ../logs/workout-plan-service.log 2>&1 &
WORKOUT_SERVICE_PID=$!
cd ..

# Wait a bit for services to register
sleep 10

# Start API Gateway last
echo "Starting API Gateway..."
cd api-gateway
nohup java -jar target/api-gateway-*.jar > ../logs/api-gateway.log 2>&1 &
GATEWAY_PID=$!
cd ..

# Wait for API Gateway to be ready
check_service "API Gateway" 8000
if [ $? -ne 0 ]; then
    echo "❌ Failed to start API Gateway. Check logs."
    exit 1
fi

echo "🎉 All services are running!"
echo ""
echo "📋 Service URLs:"
echo "   🔍 Service Registry (Eureka): http://localhost:8761"
echo "   🌐 API Gateway: http://localhost:8000"
echo "   👤 User Service: http://localhost:8081"
echo "   💪 Workout Plan Service: http://localhost:8082"
echo ""
echo "🧪 Test URLs via API Gateway:"
echo "   👤 User Service Health: curl http://localhost:8000/api/users/health"
echo "   💪 Workout Plan Service Health: curl http://localhost:8000/api/workout-plans/health"
echo ""
echo "📊 Process IDs:"
echo "   Registry: $REGISTRY_PID"
echo "   API Gateway: $GATEWAY_PID"
echo "   User Service: $USER_SERVICE_PID"
echo "   Workout Service: $WORKOUT_SERVICE_PID"
echo ""
echo "🛑 To stop all services, run: ./stop-services.sh" 