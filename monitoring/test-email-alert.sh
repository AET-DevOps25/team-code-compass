#!/bin/bash

# Test Email Alert Script for FlexFit Monitoring
echo "🧪 Testing FlexFit Email Alerts..."

# Check if Alertmanager is running
echo "📡 Checking if Alertmanager is accessible..."
if ! curl -s http://localhost:9093/-/healthy > /dev/null; then
    echo "❌ Alertmanager is not running or not accessible at http://localhost:9093"
    echo "💡 Try: docker compose up -d"
    exit 1
fi
echo "✅ Alertmanager is running!"

# Send test critical alert
echo "🚨 Sending CRITICAL test alert..."
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "EmailTestCritical",
      "severity": "critical",
      "job": "test"
    },
    "annotations": {
      "summary": "🧪 Critical Email Test for FlexFit",
      "description": "This is a CRITICAL test alert. If you receive this email with red styling, your critical alerts are working!"
    }
  }]'

echo -e "\n⚠️ Sending WARNING test alert..."
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "EmailTestWarning", 
      "severity": "warning",
      "job": "test"
    },
    "annotations": {
      "summary": "🧪 Warning Email Test for FlexFit",
      "description": "This is a WARNING test alert. If you receive this email with orange styling, your warning alerts are working!"
    }
  }]'

echo -e "\n📧 Test alerts sent! Check your email inbox in the next few minutes."
echo "🔍 You can check Alertmanager logs with: docker logs flexfit-alertmanager"
echo "🌐 You can view alerts at: http://localhost:9093"

# Show current alerts
echo -e "\n📋 Current active alerts:"
curl -s http://localhost:9093/api/v1/alerts | jq '.data[] | {alertname: .labels.alertname, severity: .labels.severity, status: .status.state}' 2>/dev/null || echo "Install jq for pretty JSON output" 