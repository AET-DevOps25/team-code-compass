# FlexFit API Gateway & Swagger Documentation

## Overview
This document provides all the endpoints and Swagger UI access methods for the FlexFit microservices architecture.

## Port Configuration
- **API Gateway**: External port `8080` → Internal port `8000`
- **User Service**: Direct access on port `8081`
- **Workout Plan Service**: Direct access on port `8082`
- **Service Registry**: Port `8761`

## Swagger UI Access

### Option 1: Direct Service Access
- **User Service Swagger**: http://localhost:8081/swagger-ui/index.html
- **Workout Plan Service Swagger**: http://localhost:8082/swagger-ui/index.html

### Option 2: Via API Gateway (Recommended)
- **User Service Swagger**: http://localhost:8080/user-service/swagger-ui/index.html
- **Workout Plan Service Swagger**: http://localhost:8080/workout-plan-service/swagger-ui/index.html

### Option 3: Via Gateway Documentation Routes
- **User Service Docs**: http://localhost:8080/docs/users/swagger-ui/index.html
- **Workout Plan Service Docs**: http://localhost:8080/docs/workout-plans/swagger-ui/index.html

## API Endpoints

### User Service Endpoints (`/api/v1/users`)
**Base URL**: `http://localhost:8080/api/v1/users` (via Gateway)
**Direct URL**: `http://localhost:8081/api/v1/users`

- `POST /api/v1/users/register` - Register new user
- `GET /api/v1/users/profile` - Get user profile (requires auth)
- `PUT /api/v1/users/profile` - Update user profile (requires auth)
- `GET /api/v1/users/preferences` - Get user preferences (requires auth)
- `PUT /api/v1/users/preferences` - Update user preferences (requires auth)

### Authentication Endpoints (`/auth`)
**Base URL**: `http://localhost:8080/auth` (via Gateway)
**Direct URL**: `http://localhost:8081/auth`

- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token

### Workout Plan Service Endpoints (`/api/v1/plans`)
**Base URL**: `http://localhost:8080/api/v1/plans` (via Gateway)
**Direct URL**: `http://localhost:8082/api/v1/plans`

- `POST /api/v1/plans/generate` - Generate daily workout plan (requires auth)
- `POST /api/v1/plans/generate-weekly-plan` - Generate weekly workout plan (requires auth)
- `GET /api/v1/plans/user/{userId}/date/{date}` - Get workout by date (requires auth)
- `GET /api/v1/plans/user/{userId}/range` - Get workouts by date range (requires auth)

## Authentication Setup

### 1. Register a User
```bash
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Login to Get Token
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Use Token in Swagger UI
1. Copy the JWT token from the login response
2. In Swagger UI, click the "Authorize" button
3. Enter: `Bearer YOUR_JWT_TOKEN_HERE`
4. Click "Authorize" and "Close"

## How to Use Generate Endpoint in Swagger

### Step 1: Get Authentication Token
1. Go to User Service Swagger: http://localhost:8080/user-service/swagger-ui/index.html
2. Find the `/auth/login` endpoint
3. Click "Try it out"
4. Enter your credentials:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
5. Click "Execute"
6. Copy the JWT token from the response

### Step 2: Set Up User Preferences
1. In User Service Swagger, find `/api/v1/users/preferences` PUT endpoint
2. Click "Authorize" and enter: `Bearer YOUR_JWT_TOKEN`
3. Set up your preferences:
   ```json
   {
     "fitnessGoal": "WEIGHT_LOSS",
     "experienceLevel": "BEGINNER",
     "availableEquipment": ["DUMBBELLS", "RESISTANCE_BANDS"],
     "preferredWorkoutDuration": 30,
     "workoutDaysPerWeek": 3,
     "intensityPreference": "MODERATE"
   }
   ```

### Step 3: Generate Workout Plan
1. Go to Workout Plan Service Swagger: http://localhost:8080/workout-plan-service/swagger-ui/index.html
2. Click "Authorize" and enter: `Bearer YOUR_JWT_TOKEN`
3. Find the `/api/v1/plans/generate` POST endpoint
4. Click "Try it out"
5. Enter the request body:
   ```json
   {
     "userId": "YOUR_USER_ID_FROM_LOGIN_RESPONSE",
     "workoutDate": "2024-01-20",
     "preferredDuration": 30,
     "targetMuscleGroups": ["CHEST", "TRICEPS"],
     "availableEquipment": ["DUMBBELLS"]
   }
   ```
6. Click "Execute"

## Troubleshooting

### Swagger UI Not Loading
- Check that services are running: `docker-compose ps`
- Try direct service access instead of gateway
- Check browser console for errors

### Authentication Issues
- Ensure JWT token is valid and not expired
- Use the correct Bearer token format: `Bearer YOUR_TOKEN`
- Check that user preferences are set before generating workouts

### Port Issues
- Ensure no other services are using ports 8080, 8081, 8082
- Check docker-compose logs: `docker-compose logs api-gateway`

## Service Health Checks
- **API Gateway**: http://localhost:8080/actuator/health
- **User Service**: http://localhost:8081/actuator/health
- **Workout Plan Service**: http://localhost:8082/actuator/health
- **Service Registry**: http://localhost:8761/actuator/health

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Check Service Status
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f workout-plan-service
```

### Restart Services
```bash
docker-compose restart api-gateway
docker-compose restart user-service
docker-compose restart workout-plan-service
```