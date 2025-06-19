#!/bin/bash

# FlexFit Microservices Stop Script
echo "🛑 Stopping FlexFit Microservices..."

# Function to stop service by port
stop_service_by_port() {
    local service_name=$1
    local port=$2
    
    echo "Stopping $service_name (port $port)..."
    
    # Find and kill process using the port
    PID=$(lsof -t -i:$port)
    if [ ! -z "$PID" ]; then
        kill -15 $PID
        sleep 5
        
        # Force kill if still running
        if kill -0 $PID 2>/dev/null; then
            echo "Force killing $service_name..."
            kill -9 $PID
            sleep 2
        fi
        echo "✅ $service_name stopped"
    else
        echo "ℹ️  $service_name was not running"
    fi
}

# Stop services
stop_service_by_port "API Gateway" 8000
stop_service_by_port "Workout Plan Service" 8082
stop_service_by_port "User Service" 8081
stop_service_by_port "Service Registry" 8761

echo "🧹 Cleanup complete!"
echo "📁 Logs are preserved in the logs/ directory" 