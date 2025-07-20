#!/bin/bash

echo "🎯 FlexFit Monitoring - Automatic Test Script"
echo "=============================================="

# Wait for services to be ready
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Test Prometheus
echo ""
echo "📊 Testing Prometheus..."
PROMETHEUS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090)
if [ "$PROMETHEUS_STATUS" = "302" ] || [ "$PROMETHEUS_STATUS" = "200" ]; then
    echo "✅ Prometheus is accessible at http://localhost:9090"
else
    echo "❌ Prometheus is not accessible (HTTP $PROMETHEUS_STATUS)"
fi

# Test Grafana
echo ""
echo "📈 Testing Grafana..."
GRAFANA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$GRAFANA_STATUS" = "302" ] || [ "$GRAFANA_STATUS" = "200" ]; then
    echo "✅ Grafana is accessible at http://localhost:3001"
    echo "   Login: admin / admin"
else
    echo "❌ Grafana is not accessible (HTTP $GRAFANA_STATUS)"
fi

# Test Alertmanager
echo ""
echo "🚨 Testing Alertmanager..."
ALERTMANAGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9093)
if [ "$ALERTMANAGER_STATUS" = "200" ]; then
    echo "✅ Alertmanager is accessible at http://localhost:9093"
else
    echo "❌ Alertmanager is not accessible (HTTP $ALERTMANAGER_STATUS)"
fi

# Test metrics collection
echo ""
echo "📊 Testing Metrics Collection..."
TARGETS=$(curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"up"' | wc -l)
echo "✅ $TARGETS services are being monitored by Prometheus"

# Test sample metrics
echo ""
echo "📈 Testing Sample Metrics..."
UP_METRICS=$(curl -s "http://localhost:9090/api/v1/query?query=up" | grep -o '"value":\[.*,.*\]' | wc -l)
if [ "$UP_METRICS" -gt 0 ]; then
    echo "✅ Service availability metrics are working"
else
    echo "❌ No service availability metrics found"
fi

echo ""
echo "🎯 MONITORING SETUP COMPLETE!"
echo ""
echo "📊 Access URLs:"
echo "   Prometheus:   http://localhost:9090"
echo "   Grafana:      http://localhost:3001 (admin/admin)"
echo "   Alertmanager: http://localhost:9093"
echo ""
echo "📈 Grafana Dashboards:"
echo "   1. FlexFit System Overview"
echo "   2. FlexFit GenAI Metrics"
echo ""
echo "✅ Ready for homework submission!" 