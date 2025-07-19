# FlexFit API Documentation

Complete guide for using the FlexFit microservices APIs with curl commands.

## 🚀 Quick Start

1. **Start the services**:
   ```bash
   docker compose up -d
   ```

2. **Wait for services to be ready** (30-60 seconds)

3. **API Gateway is available at**: `http://localhost:8080`

## 📋 Table of Contents

- [Authentication Flow](#authentication-flow)
- [User Management](#user-management)
- [Workout Generation](#workout-generation)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Testing Scripts](#testing-scripts)

## 🔐 Authentication Flow

### 1. Register New User

```bash
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "heightCm": 175,
    "weightKg": 75.0
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "dateOfBirth": "1990-05-15",
  "heightCm": 175,
  "weightKg": 75.0,
  "gender": "MALE",
  "preferences": {
    "experienceLevel": null,
    "fitnessGoals": null,
    "preferredSportTypes": null,
    "availableEquipment": null,
    "workoutDurationRange": null,
    "intensityPreference": null,
    "healthNotes": null,
    "dislikedExercises": null
  },
  "createdAt": null
}
```

### 2. Login and Get Token

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### 3. Store Token for Future Requests

```bash
# Extract token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}' | jq -r '.token')

# Extract user ID
USER_ID=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}' | jq -r '.user.id')
```

## 👤 User Management

### Get User Profile

```bash
curl -X GET http://localhost:8080/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Update User Preferences

```bash
curl -X PUT http://localhost:8080/api/v1/users/$USER_ID/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "experienceLevel": "INTERMEDIATE",
    "fitnessGoals": ["WEIGHT_LOSS", "MUSCLE_GAIN"],
    "preferredSportTypes": ["STRENGTH", "HIIT"],
    "availableEquipment": ["DUMBBELLS_PAIR_MEDIUM", "YOGA_MAT"],
    "workoutDurationRange": "45-60 minutes",
    "intensityPreference": "MODERATE",
    "healthNotes": "No knee injuries",
    "dislikedExercises": ["Burpees"]
  }'
```

## 🏋️ Workout Generation

### Generate Single Day Workout

```bash
curl -X POST http://localhost:8080/workout-plan-service/api/v1/plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-01-28",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45,
    "textPrompt": "Upper body strength workout focusing on chest and shoulders"
  }' | jq '.'
```

### Generate Weekly Workout Plan

```bash
curl -X POST http://localhost:8080/workout-plan-service/api/v1/plans/generate-weekly-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "dayDate": "2025-01-28",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 50,
    "textPrompt": "Create a balanced weekly plan with strength, cardio, and rest days"
  }' \
  --max-time 120 | jq '.'
```

**Weekly Response Format**:
```json
[
  {
    "dayDate": "2025-01-28",
    "focusSportTypeForTheDay": "STRENGTH",
    "scheduledExercises": [
      {
        "sequenceOrder": 1,
        "exerciseName": "Push-ups",
        "description": "Classic upper body exercise",
        "applicableSportTypes": ["STRENGTH"],
        "muscleGroupsPrimary": ["Chest", "Shoulders"],
        "muscleGroupsSecondary": ["Triceps"],
        "equipmentNeeded": ["NO_EQUIPMENT"],
        "difficulty": "Intermediate",
        "prescribedSetsRepsDuration": "3 sets x 12 reps",
        "voiceScriptCueText": "Keep core tight, full range of motion"
      }
    ],
    "markdownContent": "# STRENGTH - Upper Push\nDate: 2025-01-28\n\n## Workout Overview\n..."
  }
]
```

## 🔧 API Reference

### Base URLs

- **API Gateway**: `http://localhost:8080`
- **User Service Direct**: `http://localhost:8081`
- **Workout Plan Service Direct**: `http://localhost:8082`
- **GenAI Worker Direct**: `http://localhost:8000`
- **Service Registry**: `http://localhost:8761`

### Swagger Documentation

- **User Service**: http://localhost:8080/user-service/swagger-ui/index.html
- **Workout Plan Service**: http://localhost:8080/workout-plan-service/swagger-ui/index.html

### Required Headers

All authenticated requests require:
```bash
-H "Authorization: Bearer $TOKEN"
-H "Content-Type: application/json"
```

### Sport Types (Enums)

- `STRENGTH`
- `HIIT` 
- `YOGA_MOBILITY`
- `RUNNING_INTERVALS`
- `REST`

### Equipment Types (Enums)

- `NO_EQUIPMENT`
- `DUMBBELLS_PAIR_MEDIUM`
- `BARBELL_WITH_PLATES`
- `BENCH_FLAT`
- `BENCH_ADJUSTABLE`
- `YOGA_MAT`
- `PULL_UP_BAR`

### Experience Levels (Enums)

- `BEGINNER`
- `INTERMEDIATE`
- `ADVANCED`

### Fitness Goals (Enums)

- `WEIGHT_LOSS`
- `MUSCLE_GAIN`
- `ENDURANCE`
- `FLEXIBILITY`
- `STRENGTH`

## ❌ Error Handling

### Common Error Responses

**401 Unauthorized**:
```json
{
  "timestamp": "2025-01-19T10:30:00.000+00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "JWT token is missing or invalid",
  "path": "/api/v1/users/123"
}
```

**400 Bad Request**:
```json
{
  "timestamp": "2025-01-19T10:30:00.000+00:00",
  "status": 400,
  "error": "Bad Request", 
  "message": "Validation failed",
  "path": "/api/v1/users/register"
}
```

**500 Internal Server Error**:
```json
{
  "timestamp": "2025-01-19T10:30:00.000+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/api/v1/plans/generate"
}
```

## 🧪 Testing Scripts

### Complete Test Flow

Save this as `test-api-flow.sh`:

```bash
#!/bin/bash
set -e

echo "=== FlexFit API Test Flow ==="

# 1. Register user
echo "1. Registering user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_'$(date +%s)'",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123",
    "dateOfBirth": "1990-01-01",
    "gender": "MALE",
    "heightCm": 175,
    "weightKg": 75.0
  }')

USER_ID=$(echo $USER_RESPONSE | jq -r '.id')
EMAIL=$(echo $USER_RESPONSE | jq -r '.email')

echo "✅ User created: $USER_ID"

# 2. Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"password123\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "✅ Token obtained: ${TOKEN:0:20}..."

# 3. Get user profile
echo "3. Getting user profile..."
curl -s -X GET http://localhost:8080/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.username, .email'

# 4. Generate daily workout
echo "4. Generating daily workout..."
curl -s -X POST http://localhost:8080/workout-plan-service/api/v1/plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"dayDate\": \"2025-01-28\",
    \"focusSportType\": \"STRENGTH\",
    \"targetDurationMinutes\": 45,
    \"textPrompt\": \"Upper body workout\"
  }" | jq '{focusSportType: .focusSportTypeForTheDay, exercises: (.scheduledExercises | length)}'

# 5. Generate weekly workout
echo "5. Generating weekly workout plan..."
WEEKLY_RESPONSE=$(curl -s -X POST http://localhost:8080/workout-plan-service/api/v1/plans/generate-weekly-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"dayDate\": \"2025-01-28\",
    \"focusSportType\": \"STRENGTH\",
    \"targetDurationMinutes\": 50,
    \"textPrompt\": \"Balanced weekly plan\"
  }" \
  --max-time 120)

echo $WEEKLY_RESPONSE | jq 'if type == "array" then {success: true, days: length, types: [.[] | .focusSportTypeForTheDay] | unique} else {error: (.error // .message // "Unknown error")} end'

echo "✅ API test flow completed successfully!"
```

### Quick Health Check

```bash
#!/bin/bash
echo "=== Service Health Check ==="

services=("db:5432" "service-registry:8761" "user-service:8081" "workout-plan-service:8082" "api-gateway:8080" "genai-workout-worker:8000")

for service in "${services[@]}"; do
  name="${service%:*}"
  port="${service#*:}"
  if curl -s http://localhost:$port/health > /dev/null 2>&1 || curl -s http://localhost:$port/actuator/health > /dev/null 2>&1; then
    echo "✅ $name ($port) - OK"
  else
    echo "❌ $name ($port) - Down"
  fi
done
```

## 🐳 Docker Commands

### Service Management

```bash
# Start all services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Restart specific service
docker compose restart [service-name]

# Stop all services
docker compose down

# Rebuild and restart
docker compose up --build -d
```

### Common Service Names

- `db` - PostgreSQL database
- `service-registry` - Eureka service registry
- `api-gateway` - Spring Cloud Gateway
- `user-service` - User management service
- `workout-plan-service` - Workout generation service
- `genai-workout-worker` - AI workout generation worker
- `frontend` - Next.js frontend

## 🔍 Troubleshooting

### Service Not Responding

1. **Check if service is running**:
   ```bash
   docker compose ps
   ```

2. **Check service logs**:
   ```bash
   docker compose logs [service-name]
   ```

3. **Restart service**:
   ```bash
   docker compose restart [service-name]
   ```

### Authentication Issues

1. **Invalid token**: Re-login to get fresh token
2. **Token format**: Ensure `Bearer ` prefix in Authorization header
3. **User not found**: Verify user ID from login response

### Workout Generation Timeouts

1. **Increase timeout**: Use `--max-time 120` or higher
2. **Check GenAI worker**: `docker compose logs genai-workout-worker`
3. **Enable mock mode** for testing: Set `MOCK_MODE=true` in environment

### Database Connection Issues

1. **Check database status**: `docker compose logs db`
2. **Verify ports**: PostgreSQL on 5432
3. **Reset database**: `docker compose down && docker compose up -d db`

## 📊 Performance Tips

- **Use jq for JSON parsing**: `| jq '.'`
- **Store tokens in variables**: `TOKEN=$(...)`
- **Use appropriate timeouts**: `--max-time 120`
- **Enable mock mode for testing**: Faster response times
- **Batch operations**: Group related API calls

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Support**: Check logs with `docker compose logs [service-name]` 