#!/bin/bash

# FlexFit Local GenAI Worker Test Suite
# Tests: Health checks, local AI workout generation, and response validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_GENAI_SERVICE_URL="http://localhost:8084"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Test $TOTAL_TESTS: $1${NC}"
}

validate_exercise_structure() {
    local response=$1
    local exercise_count
    
    # Check if response has daily_workout field
    if ! echo "$response" | jq -e '.daily_workout' > /dev/null; then
        log_error "Response missing 'daily_workout' field"
        return 1
    fi
    
    # Check if scheduled_exercises exists and is an array
    if ! echo "$response" | jq -e '.daily_workout.scheduled_exercises' > /dev/null; then
        log_error "Response missing 'scheduled_exercises' field"
        return 1
    fi
    
    exercise_count=$(echo "$response" | jq '.daily_workout.scheduled_exercises | length')
    log_success "Exercise structure validation passed ($exercise_count exercises)"
    return 0
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  FlexFit Local GenAI Worker Test Suite ${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Health Check
run_test "Local GenAI Worker Health Check"
HEALTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" "$LOCAL_GENAI_SERVICE_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    if echo "$HEALTH_BODY" | jq -e '.status' > /dev/null && [[ $(echo "$HEALTH_BODY" | jq -r '.status') == "healthy" ]]; then
        log_success "Local GenAI worker is healthy"
        MODEL_TYPE=$(echo "$HEALTH_BODY" | jq -r '.model_type // "unknown"')
        LLM_TYPE=$(echo "$HEALTH_BODY" | jq -r '.llm_type // "unknown"')
        log_info "Model Type: $MODEL_TYPE, LLM Type: $LLM_TYPE"
    else
        log_error "Local GenAI worker health check returned unexpected response: $HEALTH_BODY"
    fi
else
    log_error "Local GenAI worker health check failed (HTTP $HTTP_STATUS)"
fi

# 2. Basic Local AI Workout Generation - STRENGTH
run_test "Local AI Workout Generation - STRENGTH Sport Type"
STRENGTH_REQUEST='{
    "user_profile": {
        "age": 30,
        "gender": "MALE",
        "height_cm": 175,
        "weight_kg": 70
    },
    "user_preferences": {
        "experienceLevel": "INTERMEDIATE",
        "fitnessGoals": ["MUSCLE_GAIN"],
        "preferredSportTypes": ["STRENGTH"],
        "availableEquipment": ["NO_EQUIPMENT"],
        "workoutDurationRange": "30-45 minutes",
        "intensityPreference": "MODERATE",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-01-20",
        "focus_sport_type_for_the_day": "STRENGTH",
        "target_total_duration_minutes": 40
    },
    "text_prompt": "Generate a local AI bodyweight strength workout"
}'

STRENGTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$LOCAL_GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d "$STRENGTH_REQUEST")

HTTP_STATUS=$(echo "$STRENGTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
STRENGTH_BODY=$(echo "$STRENGTH_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    if validate_exercise_structure "$STRENGTH_BODY"; then
        # Check if markdown content mentions local AI
        MARKDOWN_CONTENT=$(echo "$STRENGTH_BODY" | jq -r '.daily_workout.markdown_content')
        if echo "$MARKDOWN_CONTENT" | grep -i "local ai" > /dev/null; then
            log_success "Local AI STRENGTH workout generation successful with local AI branding"
        else
            log_warning "STRENGTH workout generated but doesn't clearly indicate local AI processing"
        fi
    fi
else
    log_error "Local AI STRENGTH workout generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $STRENGTH_BODY"
fi

# 3. Local AI HIIT Workout Generation
run_test "Local AI Workout Generation - HIIT Sport Type"
HIIT_REQUEST='{
    "user_profile": {
        "age": 25,
        "gender": "FEMALE",
        "height_cm": 160,
        "weight_kg": 55
    },
    "user_preferences": {
        "experienceLevel": "BEGINNER",
        "fitnessGoals": ["WEIGHT_LOSS"],
        "preferredSportTypes": ["HIIT"],
        "availableEquipment": ["NO_EQUIPMENT"],
        "workoutDurationRange": "20-30 minutes",
        "intensityPreference": "HIGH",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-01-20",
        "focus_sport_type_for_the_day": "HIIT",
        "target_total_duration_minutes": 25
    },
    "text_prompt": "Create a local AI HIIT workout for beginners"
}'

HIIT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$LOCAL_GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d "$HIIT_REQUEST")

HTTP_STATUS=$(echo "$HIIT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
HIIT_BODY=$(echo "$HIIT_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    if validate_exercise_structure "$HIIT_BODY"; then
        log_success "Local AI HIIT workout generation successful"
    fi
else
    log_error "Local AI HIIT workout generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $HIIT_BODY"
fi

# 4. Local AI REST Day Generation
run_test "Local AI Workout Generation - REST Day"
REST_REQUEST='{
    "user_profile": {
        "age": 35,
        "gender": "MALE",
        "height_cm": 180,
        "weight_kg": 75
    },
    "user_preferences": {
        "experienceLevel": "INTERMEDIATE",
        "fitnessGoals": ["GENERAL_FITNESS"],
        "preferredSportTypes": ["REST"],
        "availableEquipment": ["YOGA_MAT"],
        "workoutDurationRange": "15-30 minutes",
        "intensityPreference": "LOW",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-01-20",
        "focus_sport_type_for_the_day": "REST",
        "target_total_duration_minutes": 20
    },
    "text_prompt": "Create a local AI rest day with light recovery activities"
}'

REST_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$LOCAL_GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d "$REST_REQUEST")

HTTP_STATUS=$(echo "$REST_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
REST_BODY=$(echo "$REST_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    # REST days should have empty exercises array
    EXERCISE_COUNT=$(echo "$REST_BODY" | jq '.daily_workout.scheduled_exercises | length')
    if [[ "$EXERCISE_COUNT" == "0" ]]; then
        log_success "Local AI REST day generation successful (no exercises as expected)"
    else
        log_warning "REST day has $EXERCISE_COUNT exercises (should be 0)"
    fi
else
    log_error "Local AI REST day generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $REST_BODY"
fi

# 5. Local AI Weekly Workout Generation
run_test "Local AI Weekly Workout Generation"
WEEKLY_REQUEST='{
    "user_profile": {
        "age": 28,
        "gender": "FEMALE",
        "height_cm": 165,
        "weight_kg": 60
    },
    "user_preferences": {
        "experienceLevel": "INTERMEDIATE",
        "fitnessGoals": ["GENERAL_FITNESS"],
        "preferredSportTypes": ["STRENGTH", "HIIT"],
        "availableEquipment": ["NO_EQUIPMENT"],
        "workoutDurationRange": "30-45 minutes",
        "intensityPreference": "MODERATE",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "text_prompt": "Create a balanced weekly plan with local AI processing"
}'

WEEKLY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$LOCAL_GENAI_SERVICE_URL/generate-weekly" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d "$WEEKLY_REQUEST")

HTTP_STATUS=$(echo "$WEEKLY_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
WEEKLY_BODY=$(echo "$WEEKLY_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    # Check if we have 7 workouts
    WORKOUT_COUNT=$(echo "$WEEKLY_BODY" | jq '.workouts | length')
    if [[ "$WORKOUT_COUNT" == "7" ]]; then
        log_success "Local AI weekly generation successful (7 workouts created)"
    else
        log_warning "Weekly plan has $WORKOUT_COUNT workouts (expected 7)"
    fi
else
    log_error "Local AI weekly workout generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $WEEKLY_BODY"
fi

# 6. Performance Test
run_test "Local AI Response Time Performance"
start_time=$(date +%s.%N)

PERF_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$LOCAL_GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d "$STRENGTH_REQUEST")

end_time=$(date +%s.%N)
duration=$(echo "$end_time - $start_time" | bc -l)
duration_ms=$(echo "$duration * 1000" | bc -l)

HTTP_STATUS=$(echo "$PERF_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [[ "$HTTP_STATUS" == "200" ]]; then
    log_success "Local AI performance test completed in ${duration_ms%.*}ms"
    
    # Performance expectations for local AI (more lenient than cloud)
    if (( $(echo "$duration < 30" | bc -l) )); then
        log_success "Local AI response time excellent (< 30s)"
    elif (( $(echo "$duration < 60" | bc -l) )); then
        log_warning "Local AI response time acceptable (< 60s)"
    else
        log_warning "Local AI response time slow (> 60s) - consider optimizing"
    fi
else
    log_error "Local AI performance test failed (HTTP $HTTP_STATUS)"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}          Test Results Summary          ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 All Local GenAI Worker tests passed!${NC}"
    echo -e "${GREEN}✅ Local AI processing is working correctly${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some Local GenAI Worker tests failed${NC}"
    echo -e "${YELLOW}💡 Check the Local AI worker configuration and model setup${NC}"
    exit 1
fi 