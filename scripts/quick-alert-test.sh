#!/bin/bash

# Quick Alert Test - One-liner for fast testing
echo "🧪 Quick Alert Test..."

# Send a critical test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "QuickTest",
      "severity": "critical",
      "job": "test-service"
    },
    "annotations": {
      "summary": "🧪 Quick Alert Test",
      "description": "This is a quick test alert. If you receive this email, your alerts are working!"
    }
  }]' && echo "✅ Alert sent! Check your email in 2-3 minutes." || echo "❌ Failed - is Alertmanager running?" 