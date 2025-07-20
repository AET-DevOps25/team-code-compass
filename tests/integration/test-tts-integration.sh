#!/bin/bash

# TTS Service Integration Tests
# Tests TTS service integration with other services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TTS_SERVICE_URL="http://localhost:8083"
API_GATEWAY_URL="http://localhost:8080"
SERVICE_REGISTRY_URL="http://localhost:8761"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TTS Service Integration Tests       ${NC}"
echo -e "${BLUE}========================================${NC}"

# Test variables
TEST_TEXT="This is a test workout plan for integration testing."
TEST_TIMESTAMP=$(date +%s)

# 1. TTS Service Health Check
log_info "Testing TTS Service health..."
if curl -s "$TTS_SERVICE_URL/api/tts/health" > /dev/null; then
    log_success "TTS Service is healthy"
else
    log_error "TTS Service is not healthy"
    exit 1
fi

# 2. TTS Service Registration with Eureka
log_info "Testing TTS Service registration with Eureka..."
EUREKA_RESPONSE=$(curl -s "$SERVICE_REGISTRY_URL/eureka/apps" -H "Accept: application/json")

if echo "$EUREKA_RESPONSE" | grep -q "TTS-SERVICE"; then
    log_success "TTS Service is registered with Eureka"
else
    log_error "TTS Service is not registered with Eureka"
fi

# 3. TTS Service Metrics Endpoint
log_info "Testing TTS Service metrics endpoint..."
if curl -s "$TTS_SERVICE_URL/actuator/prometheus" | grep -q "tts_"; then
    log_success "TTS Service metrics endpoint is working"
else
    log_error "TTS Service metrics endpoint is not working"
fi

# 4. Available Voices Endpoint
log_info "Testing available voices endpoint..."
VOICES_RESPONSE=$(curl -s "$TTS_SERVICE_URL/api/tts/voices")

if echo "$VOICES_RESPONSE" | grep -q "en-US"; then
    log_success "Available voices endpoint is working"
else
    log_error "Available voices endpoint is not working"
fi

# 5. Text-to-Speech Synthesis (Mock Test)
log_info "Testing text-to-speech synthesis..."
SYNTHESIS_RESPONSE=$(curl -s -X POST "$TTS_SERVICE_URL/api/tts/synthesize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "'$TEST_TEXT'",
    "voiceName": "en-US-Neural2-F",
    "languageCode": "en-US",
    "audioEncoding": "MP3"
  }')

if echo "$SYNTHESIS_RESPONSE" | grep -q "audio"; then
    log_success "Text-to-speech synthesis is working"
else
    log_error "Text-to-speech synthesis is not working"
fi

# 6. Audio Generation Endpoint
log_info "Testing audio generation endpoint..."
GENERATION_RESPONSE=$(curl -s -X POST "$TTS_SERVICE_URL/api/tts/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "'$TEST_TEXT'",
    "voiceName": "en-US-Neural2-F",
    "languageCode": "en-US",
    "audioEncoding": "MP3"
  }')

if echo "$GENERATION_RESPONSE" | grep -q "audioUrl"; then
    log_success "Audio generation endpoint is working"
else
    log_error "Audio generation endpoint is not working"
fi

# 7. API Gateway Routing to TTS Service
log_info "Testing API Gateway routing to TTS Service..."
GATEWAY_RESPONSE=$(curl -s "$API_GATEWAY_URL/api/tts/health")

if echo "$GATEWAY_RESPONSE" | grep -q "TTS Service"; then
    log_success "API Gateway routing to TTS Service is working"
else
    log_error "API Gateway routing to TTS Service is not working"
fi

# 8. Error Handling Test
log_info "Testing error handling..."
ERROR_RESPONSE=$(curl -s -X POST "$TTS_SERVICE_URL/api/tts/synthesize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "",
    "voiceName": "en-US-Neural2-F",
    "languageCode": "en-US",
    "audioEncoding": "MP3"
  }')

if echo "$ERROR_RESPONSE" | grep -q "error"; then
    log_success "Error handling is working"
else
    log_error "Error handling is not working"
fi

# 9. Performance Test (Response Time)
log_info "Testing TTS Service response time..."
START_TIME=$(date +%s.%N)
curl -s "$TTS_SERVICE_URL/api/tts/health" > /dev/null
END_TIME=$(date +%s.%N)

RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc -l)
if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    log_success "TTS Service response time is acceptable ($RESPONSE_TIME seconds)"
else
    log_error "TTS Service response time is too slow ($RESPONSE_TIME seconds)"
fi

# 10. Metrics Collection Test
log_info "Testing metrics collection..."
METRICS_BEFORE=$(curl -s "$TTS_SERVICE_URL/actuator/prometheus" | grep "tts_health_check_requests_total" | grep -o "[0-9]*\.[0-9]*" || echo "0")

# Make a request to increment metrics
curl -s "$TTS_SERVICE_URL/api/tts/health" > /dev/null

METRICS_AFTER=$(curl -s "$TTS_SERVICE_URL/actuator/prometheus" | grep "tts_health_check_requests_total" | grep -o "[0-9]*\.[0-9]*" || echo "0")

if (( $(echo "$METRICS_AFTER > $METRICS_BEFORE" | bc -l) )); then
    log_success "Metrics collection is working"
else
    log_error "Metrics collection is not working"
fi

# Summary
echo -e "\n${BLUE}📊 TTS Integration Test Summary${NC}"
echo "================================"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All TTS integration tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some TTS integration tests failed${NC}"
    exit 1
fi 