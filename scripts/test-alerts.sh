#!/bin/bash

# Enhanced Alert Testing Script for FlexFit
# Tests different alert scenarios including real-world cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ALERTMANAGER_URL="http://localhost:9093"
PROMETHEUS_URL="http://localhost:9090"

echo -e "${BLUE}🧪 FlexFit Alert Testing Suite${NC}"
echo "=================================="

# Function to check if service is running
check_service() {
    local service_name=$1
    local url=$2
    local endpoint=$3
    
    echo -e "${YELLOW}📡 Checking ${service_name}...${NC}"
    if curl -s "${url}${endpoint}" > /dev/null; then
        echo -e "${GREEN}✅ ${service_name} is running at ${url}${NC}"
        return 0
    else
        echo -e "${RED}❌ ${service_name} is not accessible at ${url}${NC}"
        return 1
    fi
}

# Function to send alert
send_alert() {
    local alertname=$1
    local severity=$2
    local summary=$3
    local description=$4
    local service=${5:-"test"}
    local instance=${6:-"localhost:8080"}
    
    echo -e "${PURPLE}📤 Sending ${severity} alert: ${alertname}${NC}"
    
    curl -s -X POST "${ALERTMANAGER_URL}/api/v1/alerts" \
        -H "Content-Type: application/json" \
        -d "[{
            \"labels\": {
                \"alertname\": \"${alertname}\",
                \"severity\": \"${severity}\",
                \"job\": \"${service}\",
                \"instance\": \"${instance}\"
            },
            \"annotations\": {
                \"summary\": \"${summary}\",
                \"description\": \"${description}\"
            }
        }]" && echo -e " ${GREEN}✅ Sent${NC}"
}

# Function to show menu
show_menu() {
    echo -e "\n${BLUE}🎯 Test Alert Scenarios:${NC}"
    echo "1. Quick Email Test (Critical + Warning)"
    echo "2. Service Down Alerts"
    echo "3. Performance Alerts"
    echo "4. Database Alerts"
    echo "5. All Real-World Scenarios"
    echo "6. View Current Alerts"
    echo "7. Clear All Test Alerts"
    echo "8. Check Alertmanager Config"
    echo "9. Exit"
    echo -n "Choose option (1-9): "
}

# Function to view current alerts
view_alerts() {
    echo -e "\n${BLUE}📋 Current Active Alerts:${NC}"
    if command -v jq > /dev/null; then
        curl -s "${ALERTMANAGER_URL}/api/v1/alerts" | jq -r '.data[] | "🔴 \(.labels.alertname) (\(.labels.severity)) - \(.status.state)"'
    else
        echo "Installing jq for better output..."
        curl -s "${ALERTMANAGER_URL}/api/v1/alerts"
    fi
}

# Function to clear test alerts
clear_alerts() {
    echo -e "\n${YELLOW}🧹 Clearing test alerts...${NC}"
    echo "Note: Test alerts will auto-expire in 5 minutes"
    echo "To manually clear, restart Alertmanager:"
    echo "docker restart flexfit-alertmanager"
}

# Function to check config
check_config() {
    echo -e "\n${BLUE}⚙️ Alertmanager Configuration:${NC}"
    curl -s "${ALERTMANAGER_URL}/api/v1/config" | jq '.data.original' 2>/dev/null || curl -s "${ALERTMANAGER_URL}/api/v1/config"
}

# Main execution
main() {
    # Check prerequisites
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    if ! check_service "Alertmanager" "$ALERTMANAGER_URL" "/-/healthy"; then
        echo -e "${RED}💡 Try starting the stack: docker compose up -d${NC}"
        exit 1
    fi
    
    if ! check_service "Prometheus" "$PROMETHEUS_URL" "/-/healthy"; then
        echo -e "${YELLOW}⚠️ Prometheus not running, but Alertmanager tests will still work${NC}"
    fi
    
    # Interactive menu
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1)
                echo -e "\n${GREEN}🧪 Quick Email Test${NC}"
                send_alert "EmailTestCritical" "critical" "🧪 Critical Email Test" "Testing critical email alerts - should have red styling"
                sleep 1
                send_alert "EmailTestWarning" "warning" "🧪 Warning Email Test" "Testing warning email alerts - should have orange styling"
                echo -e "${GREEN}📧 Check your email in the next 2-3 minutes!${NC}"
                ;;
            2)
                echo -e "\n${RED}🚨 Service Down Scenarios${NC}"
                send_alert "ServiceDown" "critical" "🔴 User Service Down" "User service is not responding to health checks" "user-service" "user-service:8081"
                send_alert "APIGatewayDown" "critical" "🔴 API Gateway Unreachable" "API Gateway is not accessible" "api-gateway" "api-gateway:8080"
                send_alert "DatabaseConnectionLost" "critical" "🔴 Database Connection Lost" "PostgreSQL database is unreachable" "postgres" "postgres:5432"
                ;;
            3)
                echo -e "\n${YELLOW}⚡ Performance Alert Scenarios${NC}"
                send_alert "HighLatency" "warning" "⚠️ High Response Time" "API response time is above 2 seconds" "api-gateway" "api-gateway:8080"
                send_alert "HighCPUUsage" "warning" "⚠️ High CPU Usage" "CPU usage is above 80% for 5 minutes" "user-service" "user-service:8081"
                send_alert "HighMemoryUsage" "critical" "🔴 High Memory Usage" "Memory usage is above 90%" "workout-plan-service" "workout-plan-service:8082"
                ;;
            4)
                echo -e "\n${PURPLE}🗄️ Database Alert Scenarios${NC}"
                send_alert "DatabaseSlowQueries" "warning" "⚠️ Slow Database Queries" "Database queries taking longer than 5 seconds" "postgres" "postgres:5432"
                send_alert "DatabaseDiskSpace" "critical" "🔴 Database Disk Space Low" "Database disk usage is above 95%" "postgres" "postgres:5432"
                send_alert "DatabaseConnectionPoolExhausted" "critical" "🔴 Connection Pool Exhausted" "All database connections are in use" "postgres" "postgres:5432"
                ;;
            5)
                echo -e "\n${BLUE}🌍 All Real-World Scenarios${NC}"
                echo "Sending comprehensive test suite..."
                
                # Critical alerts
                send_alert "ServiceDown" "critical" "🔴 Service Outage" "Multiple services are down"
                send_alert "DatabaseDown" "critical" "🔴 Database Outage" "Primary database is unreachable"
                send_alert "DiskSpaceCritical" "critical" "🔴 Disk Space Critical" "Disk usage above 95%"
                
                # Warning alerts
                send_alert "HighLatency" "warning" "⚠️ Performance Degradation" "Response times increasing"
                send_alert "SSL_CertExpiring" "warning" "⚠️ SSL Certificate Expiring" "SSL certificate expires in 7 days"
                send_alert "MemoryUsageHigh" "warning" "⚠️ Memory Usage High" "Memory usage above 75%"
                
                echo -e "${GREEN}📧 Comprehensive test sent! Check email for multiple alerts.${NC}"
                ;;
            6)
                view_alerts
                ;;
            7)
                clear_alerts
                ;;
            8)
                check_config
                ;;
            9)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option. Please choose 1-9.${NC}"
                ;;
        esac
        
        echo -e "\n${YELLOW}Press Enter to continue...${NC}"
        read -r
    done
}

# Check if running as script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 