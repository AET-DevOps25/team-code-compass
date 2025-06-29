#!/bin/bash

# FlexFit GenAI Worker Test Suite
# Tests: Health checks, workout generation, different sport types, and response validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GENAI_SERVICE_URL="http://localhost:8083"

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
    if [[ $exercise_count -eq 0 ]]; then
        log_error "No exercises in response"
        return 1
    fi
    
    # Validate first exercise structure
    local first_exercise=$(echo "$response" | jq '.daily_workout.scheduled_exercises[0]')
    
    required_fields=("sequence_order" "exercise_name" "description" "applicable_sport_types" 
                    "muscle_groups_primary" "muscle_groups_secondary" "equipment_needed" 
                    "difficulty" "prescribed_sets_reps_duration" "voice_script_cue_text" "video_url")
    
    for field in "${required_fields[@]}"; do
        if ! echo "$first_exercise" | jq -e ".$field" > /dev/null; then
            log_error "First exercise missing required field: $field"
            return 1
        fi
    done
    
    log_success "Exercise structure validation passed ($exercise_count exercises)"
    return 0
}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}    FlexFit GenAI Worker Test Suite   ${NC}"
echo -e "${BLUE}======================================${NC}"

# 1. Health Check
run_test "GenAI Worker Health Check"
HEALTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" "$GENAI_SERVICE_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    if echo "$HEALTH_BODY" | jq -e '.status' > /dev/null && [[ $(echo "$HEALTH_BODY" | jq -r '.status') == "healthy" ]]; then
        log_success "GenAI worker is healthy"
    else
        log_error "GenAI worker health check returned unexpected response: $HEALTH_BODY"
    fi
else
    log_error "GenAI worker health check failed (HTTP $HTTP_STATUS)"
fi

# 2. Basic Workout Generation - STRENGTH
run_test "Workout Generation - STRENGTH Sport Type"
STRENGTH_REQUEST='{
    "user_profile": {
        "age": 35,
        "gender": "MALE",
        "height_cm": 180,
        "weight_kg": 75
    },
    "user_preferences": {
        "experienceLevel": "INTERMEDIATE",
        "fitnessGoals": ["WEIGHT_LOSS", "MUSCLE_GAIN"],
        "preferredSportTypes": ["STRENGTH"],
        "availableEquipment": ["DUMBBELLS", "RESISTANCE_BANDS"],
        "workoutDurationRange": "30-45 minutes",
        "intensityPreference": "MODERATE",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-06-29",
        "focus_sport_type_for_the_day": "STRENGTH",
        "target_total_duration_minutes": 45
    }
}'

STRENGTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$STRENGTH_REQUEST")

HTTP_STATUS=$(echo "$STRENGTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
STRENGTH_BODY=$(echo "$STRENGTH_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    if validate_exercise_structure "$STRENGTH_BODY"; then
        # Check if exercises are appropriate for STRENGTH
        SPORT_TYPES=$(echo "$STRENGTH_BODY" | jq -r '.daily_workout.scheduled_exercises[0].applicable_sport_types[]')
        if echo "$SPORT_TYPES" | grep -q "STRENGTH"; then
            log_success "STRENGTH workout generation successful with appropriate exercises"
        else
            log_warning "STRENGTH workout generated but exercises may not be tagged properly"
        fi
    fi
else
    log_error "STRENGTH workout generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $STRENGTH_BODY"
fi

# 3. HIIT Workout Generation
run_test "Workout Generation - HIIT Sport Type"
HIIT_REQUEST='{
    "user_profile": {
        "age": 28,
        "gender": "FEMALE",
        "height_cm": 165,
        "weight_kg": 60
    },
    "user_preferences": {
        "experienceLevel": "BEGINNER",
        "fitnessGoals": ["WEIGHT_LOSS", "CARDIOVASCULAR_HEALTH"],
        "preferredSportTypes": ["HIIT"],
        "availableEquipment": ["NO_EQUIPMENT"],
        "workoutDurationRange": "20-30 minutes",
        "intensityPreference": "HIGH",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-06-29",
        "focus_sport_type_for_the_day": "HIIT",
        "target_total_duration_minutes": 30
    }
}'

HIIT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$HIIT_REQUEST")

HTTP_STATUS=$(echo "$HIIT_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
HIIT_BODY=$(echo "$HIIT_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    if validate_exercise_structure "$HIIT_BODY"; then
        log_success "HIIT workout generation successful"
    fi
else
    log_error "HIIT workout generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $HIIT_BODY"
fi

# 4. YOGA Workout Generation
run_test "Workout Generation - YOGA Sport Type"
YOGA_REQUEST='{
    "user_profile": {
        "age": 40,
        "gender": "FEMALE",
        "height_cm": 170,
        "weight_kg": 65
    },
    "user_preferences": {
        "experienceLevel": "INTERMEDIATE",
        "fitnessGoals": ["FLEXIBILITY", "STRESS_RELIEF"],
        "preferredSportTypes": ["YOGA"],
        "availableEquipment": ["YOGA_MAT"],
        "workoutDurationRange": "45-60 minutes",
        "intensityPreference": "LOW",
        "healthNotes": "Lower back sensitivity",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-06-29",
        "focus_sport_type_for_the_day": "YOGA",
        "target_total_duration_minutes": 50
    }
}'

YOGA_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$YOGA_REQUEST")

HTTP_STATUS=$(echo "$YOGA_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
YOGA_BODY=$(echo "$YOGA_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [[ "$HTTP_STATUS" == "200" ]]; then
    if validate_exercise_structure "$YOGA_BODY"; then
        log_success "YOGA workout generation successful"
    fi
else
    log_error "YOGA workout generation failed (HTTP $HTTP_STATUS)"
    echo "Response: $YOGA_BODY"
fi

# 5. Invalid Request - Missing Required Fields
run_test "Invalid Request - Missing user_profile"
INVALID_REQUEST='{
    "daily_focus": {
        "day_date": "2025-06-29",
        "focus_sport_type_for_the_day": "STRENGTH",
        "target_total_duration_minutes": 45
    }
}'

INVALID_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$INVALID_REQUEST")

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "400" ]] || [[ "$HTTP_STATUS" == "422" ]]; then
    log_success "Invalid request properly rejected (HTTP $HTTP_STATUS)"
else
    log_error "Invalid request should have been rejected, got HTTP $HTTP_STATUS"
fi

# 6. Empty Request
run_test "Empty Request"
EMPTY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d '{}')

HTTP_STATUS=$(echo "$EMPTY_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "400" ]] || [[ "$HTTP_STATUS" == "422" ]]; then
    log_success "Empty request properly rejected (HTTP $HTTP_STATUS)"
else
    log_error "Empty request should have been rejected, got HTTP $HTTP_STATUS"
fi

# 7. Malformed JSON
run_test "Malformed JSON Request"
MALFORMED_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d '{"invalid": json}')

HTTP_STATUS=$(echo "$MALFORMED_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "400" ]]; then
    log_success "Malformed JSON properly rejected (HTTP $HTTP_STATUS)"
else
    log_error "Malformed JSON should have been rejected, got HTTP $HTTP_STATUS"
fi

# 8. Different Age Groups
run_test "Workout Generation - Senior User (65+ years)"
SENIOR_REQUEST='{
    "user_profile": {
        "age": 68,
        "gender": "MALE",
        "height_cm": 175,
        "weight_kg": 80
    },
    "user_preferences": {
        "experienceLevel": "BEGINNER",
        "fitnessGoals": ["GENERAL_FITNESS", "FLEXIBILITY"],
        "preferredSportTypes": ["STRENGTH"],
        "availableEquipment": ["RESISTANCE_BANDS"],
        "workoutDurationRange": "20-30 minutes",
        "intensityPreference": "LOW",
        "healthNotes": "Knee issues, avoid high impact",
        "dislikedExercises": ["jumping", "running"]
    },
    "daily_focus": {
        "day_date": "2025-06-29",
        "focus_sport_type_for_the_day": "STRENGTH",
        "target_total_duration_minutes": 25
    }
}'

SENIOR_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$SENIOR_REQUEST")

HTTP_STATUS=$(echo "$SENIOR_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    SENIOR_BODY=$(echo "$SENIOR_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')
    if validate_exercise_structure "$SENIOR_BODY"; then
        log_success "Senior user workout generation successful"
    fi
else
    log_error "Senior user workout generation failed (HTTP $HTTP_STATUS)"
fi

# 9. Young Adult User
run_test "Workout Generation - Young Adult (20 years)"
YOUNG_REQUEST='{
    "user_profile": {
        "age": 20,
        "gender": "MALE",
        "height_cm": 185,
        "weight_kg": 70
    },
    "user_preferences": {
        "experienceLevel": "ADVANCED",
        "fitnessGoals": ["MUSCLE_GAIN", "STRENGTH"],
        "preferredSportTypes": ["STRENGTH"],
        "availableEquipment": ["DUMBBELLS", "BARBELL", "RESISTANCE_BANDS"],
        "workoutDurationRange": "60-90 minutes",
        "intensityPreference": "HIGH",
        "healthNotes": "No injuries",
        "dislikedExercises": []
    },
    "daily_focus": {
        "day_date": "2025-06-29",
        "focus_sport_type_for_the_day": "STRENGTH",
        "target_total_duration_minutes": 75
    }
}'

YOUNG_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$YOUNG_REQUEST")

HTTP_STATUS=$(echo "$YOUNG_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
if [[ "$HTTP_STATUS" == "200" ]]; then
    YOUNG_BODY=$(echo "$YOUNG_RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')
    if validate_exercise_structure "$YOUNG_BODY"; then
        log_success "Young adult workout generation successful"
    fi
else
    log_error "Young adult workout generation failed (HTTP $HTTP_STATUS)"
fi

# 10. Response Time Test
run_test "Response Time Performance"
START_TIME=$(date +%s%N)
PERF_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
    -H "Content-Type: application/json" \
    -d "$STRENGTH_REQUEST")
END_TIME=$(date +%s%N)

HTTP_STATUS=$(echo "$PERF_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_TIME=$((($END_TIME - $START_TIME) / 1000000)) # Convert to milliseconds

if [[ "$HTTP_STATUS" == "200" ]]; then
    if [[ $RESPONSE_TIME -lt 5000 ]]; then # Less than 5 seconds
        log_success "Response time acceptable: ${RESPONSE_TIME}ms"
    else
        log_warning "Response time slow: ${RESPONSE_TIME}ms"
    fi
else
    log_error "Performance test failed (HTTP $HTTP_STATUS)"
fi

# 11. Concurrent Request Test
run_test "Concurrent Request Handling"
CONCURRENT_PIDS=()

# Start 3 concurrent requests
for i in {1..3}; do
    curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$GENAI_SERVICE_URL/generate" \
        -H "Content-Type: application/json" \
        -d "$STRENGTH_REQUEST" > "/tmp/concurrent_test_$i.txt" &
    CONCURRENT_PIDS+=($!)
done

# Wait for all requests to complete
for pid in "${CONCURRENT_PIDS[@]}"; do
    wait $pid
done

# Check results
CONCURRENT_SUCCESS=0
for i in {1..3}; do
    if [[ -f "/tmp/concurrent_test_$i.txt" ]]; then
        HTTP_STATUS=$(grep -o "HTTP_STATUS:[0-9]*" "/tmp/concurrent_test_$i.txt" | cut -d: -f2)
        if [[ "$HTTP_STATUS" == "200" ]]; then
            ((CONCURRENT_SUCCESS++))
        fi
        rm -f "/tmp/concurrent_test_$i.txt"
    fi
done

if [[ $CONCURRENT_SUCCESS -eq 3 ]]; then
    log_success "All concurrent requests successful ($CONCURRENT_SUCCESS/3)"
else
    log_error "Some concurrent requests failed ($CONCURRENT_SUCCESS/3 successful)"
fi

# Test Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}           TEST SUMMARY               ${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! GenAI worker is functioning correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi 