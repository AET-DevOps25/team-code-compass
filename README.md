# FlexFit Microservices Platform

A comprehensive fitness application ecosystem built with **microservices architecture**, **service discovery**, and **API Gateway** pattern. The platform includes user management, workout planning, AI-powered workout generation, and centralized service orchestration, all containerized with Docker.

## 🏗️ Architecture Overview

The FlexFit platform follows a **Master-Worker microservices pattern** with **Service Registry** and **API Gateway**:

### Core Infrastructure Services:
- **Service Registry (Eureka Server)**: Service discovery and health monitoring
- **API Gateway**: Single entry point, request routing, and load balancing
- **PostgreSQL Database**: Centralized data storage for all services

### Business Logic Services:
- **User Service**: User registration, authentication, and profile management
- **Workout Plan Service**: Master orchestrator for workout planning and AI integration  
- **GenAI Workout Worker**: AI-powered personalized workout generation worker

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (V2 - uses `docker compose`, not `docker-compose`)
- Git

### 📝 Important: Docker Command Syntax
```bash
# ✅ CORRECT - Use this (Docker Compose V2)
docker compose up --build -d

# ❌ WRONG - This won't work (Docker Compose V1 - deprecated)  
docker-compose up --build -d
```

**Command Flags Explained:**
- `--build`: Rebuilds images before starting (important for code changes)
- `-d`: **Detached mode** - runs in background, gives you terminal back
- Without `-d`: **Foreground mode** - shows live logs, blocks terminal

### 1. Clone and Setup
```bash
git clone <your-repository-url>
cd team-code-compass
```

### 2. Environment Configuration
Create/verify your `.env` file in the project root:
```env
POSTGRES_DB=user_service_db
POSTGRES_USER=flexfit
POSTGRES_PASSWORD=flexfit_local
CHAIR_API_KEY=your_chair_api_key_here
```

### 3. Start All Services
```bash
# Start all services (Database + All Microservices)
# -d flag runs in background (detached mode)
docker compose up --build -d

# View logs for all services (live stream)
docker compose logs -f

# View logs for specific service
docker compose logs -f service-registry      # Eureka Server
docker compose logs -f api-gateway           # API Gateway
docker compose logs -f user-service          # User Service  
docker compose logs -f workout-plan-service  # Workout Service
docker compose logs -f genai-workout-worker  # AI Worker

# Stop all services
docker compose down
```

## 🐳 Docker Services

### Service Overview
| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Service Registry** | `8761` | ✅ Healthy | Eureka Server - Service discovery |
| **API Gateway** | `8000` | ✅ Healthy | Spring Cloud Gateway - Request routing |
| **PostgreSQL** | `5432` | ✅ Healthy | Database server |
| **User Service** | `8081` | ✅ Healthy | User management API |
| **Workout Plan Service** | `8082` | ✅ Running | Workout planning API |
| **GenAI Workout Worker** | `8083` | ✅ Healthy | AI workout generation |

### Container Details
- **Service Registry**: Spring Boot 3.5.0 with Netflix Eureka Server
- **API Gateway**: Spring Boot 3.5.0 with Spring Cloud Gateway
- **Database**: `postgres:16` with persistent storage and health checks
- **User Service**: Spring Boot 3.5.0 with Eclipse Temurin JDK 21 + Eureka Client
- **Workout Plan Service**: Spring Boot 3.5.0 with Eclipse Temurin JDK 21 + Eureka Client
- **GenAI Worker**: Python 3.11 with FastAPI and LangChain
- **Network**: `flexfit-network` for inter-service communication
- **Service Discovery**: Automatic service registration and discovery via Eureka
- **Health Checks**: All services include comprehensive health monitoring

### Useful Docker Commands
```bash
# Rebuild and start all services
docker compose up --build -d

# View running containers
docker compose ps

# Access database directly
docker exec -it flexfit-postgres psql -U flexfit -d user_service_db

# Check individual service logs
docker compose logs user-service
docker compose logs workout-plan-service
docker compose logs genai-workout-worker
docker compose logs postgres

# Restart specific service
docker compose restart workout-plan-service
```

## 📚 API Documentation

### 🔗 Service Endpoints

#### Service Registry - Eureka Server (Port 8761)
- **Eureka Dashboard**: http://localhost:8761
- **Registered Services**: http://localhost:8761/eureka/apps
- **Health Check**: http://localhost:8761/actuator/health

#### API Gateway (Port 8000) - **Single Entry Point**
- **Health Check**: http://localhost:8000/actuator/health
- **Gateway Routes**: http://localhost:8000/actuator/gateway/routes
- **User Service via Gateway**: http://localhost:8000/api/users/**
- **Workout Service via Gateway**: http://localhost:8000/api/workout-plans/**

#### User Service (Port 8081) - **Direct Access**
- **Swagger UI**: http://localhost:8081/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8081/v3/api-docs
- **Health Check**: http://localhost:8081/actuator/health
- **Root**: http://localhost:8081/

#### Workout Plan Service (Port 8082) - **Direct Access**
- **Swagger UI**: http://localhost:8082/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8082/v3/api-docs
- **Root**: http://localhost:8082/

#### GenAI Workout Worker (Port 8083)
- **Health Check**: http://localhost:8083/health
- **Generate Endpoint**: http://localhost:8083/generate

### 📋 Available API Endpoints

#### User Service APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information and service status |
| `GET` | `/api` | List of available API endpoints |
| `POST` | `/api/v1/users/register` | Register a new user |
| `GET` | `/api/v1/users/me` | Get current user profile |
| `GET` | `/api/v1/users/{id}` | Get user by ID |
| `GET` | `/actuator/health` | Service health status |

#### Workout Plan Service APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service information |
| `POST` | `/api/v1/workout-plans/generate` | Generate workout plan |
| `GET` | `/api/v1/workout-plans/{id}` | Get workout plan by ID |
| `GET` | `/api/v1/daily-workouts` | Get daily workouts |

#### GenAI Workout Worker APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/generate` | Generate AI-powered workout |

### 📝 Example API Calls

#### Register User
```bash
curl -X POST http://localhost:8081/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "heightCm": 180,
    "weightKg": 75.0
  }'
```

#### Generate AI Workout
```bash
curl -X POST http://localhost:8083/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "user_profile": {"age": 30, "fitness_level": "intermediate"},
    "user_preferences": {"sport_type": "strength", "duration": 45},
    "daily_focus": {"target_muscle_groups": ["chest", "triceps"]}
  }'
```

#### Health Checks
```bash
# Check infrastructure services
curl http://localhost:8761/actuator/health  # Service Registry
curl http://localhost:8000/actuator/health  # API Gateway

# Check business services (direct access)
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Workout Plan Service
curl http://localhost:8083/health           # GenAI Worker

# Check services via API Gateway (recommended)
curl http://localhost:8000/api/users/health
curl http://localhost:8000/api/workout-plans/health
```

## 🛠️ Development

### Local Development (without Docker)
1. Start PostgreSQL and GenAI worker with Docker:
   ```bash
   docker compose up postgres genai-workout-worker -d
   ```

2. Run Java services locally:
   ```bash
   # Terminal 1 - User Service
   cd server/user-service
   ./mvnw spring-boot:run

   # Terminal 2 - Workout Plan Service  
   cd server/workout-plan-service
   ./mvnw spring-boot:run
   ```

### Project Structure
```
team-code-compass/
├── docker-compose.yml              # Multi-service orchestration
├── .env                            # Environment variables
├── README.md                       # This documentation
├── server/
│   ├── user-service/              # Spring Boot user management
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/
│   └── workout-plan-service/      # Spring Boot workout planning
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/
└── genai/
    ├── Dockerfile                 # Python FastAPI service
    ├── requirements.txt
    └── workout-worker.py
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_DB` | Database name | `user_service_db` | ✅ |
| `POSTGRES_USER` | Database user | `flexfit` | ✅ |
| `POSTGRES_PASSWORD` | Database password | `flexfit_local` | ✅ |
| `CHAIR_API_KEY` | TUM OpenWebUI API key | - | ✅ |

### Application Profiles
- **`default`**: Local development
- **`docker`**: Container environment with optimized settings

### Service Communication
Services communicate through the `flexfit-network` Docker network with **Service Discovery**:
- **Service Registry (Eureka)**: `service-registry:8761` - Central service discovery
- **API Gateway**: `api-gateway:8000` - Routes to registered services  
- **User Service → Database**: `postgres:5432`
- **Workout Plan Service → Database**: `postgres:5432`
- **Workout Plan Service → GenAI Worker**: `flexfit-genai-workout-worker:8083`
- **All services register with Eureka** for automatic discovery and load balancing

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 5432, 8000, 8081, 8082, 8083, and 8761 are available
2. **Database connection**: Verify `.env` file exists and has correct credentials
3. **Container startup**: Check logs with `docker compose logs <service-name>`
4. **Missing API key**: Ensure `CHAIR_API_KEY` is set in `.env` file
5. **Service registration**: Services may take 30-60s to register with Eureka after startup
6. **Command not found**: Use `docker compose` (not `docker-compose`) - V2 syntax

### Service Status Check
```bash
# Check if all services are running
docker compose ps

# Test infrastructure services first
curl http://localhost:8761/actuator/health  # Service Registry (Eureka)
curl http://localhost:8000/actuator/health  # API Gateway

# Test business services (direct access)
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Workout Plan Service
curl http://localhost:8083/health           # GenAI Worker

# Test via API Gateway (recommended approach)
curl http://localhost:8000/api/users/health
curl http://localhost:8000/api/workout-plans/health

# View registered services in Eureka
curl http://localhost:8761/eureka/apps -H "Accept: application/json"

# Test database connectivity
docker exec flexfit-postgres pg_isready -U flexfit

# Check service logs for errors
docker compose logs --tail=50 service-registry
docker compose logs --tail=50 api-gateway
docker compose logs --tail=50 user-service
docker compose logs --tail=50 workout-plan-service
docker compose logs --tail=50 genai-workout-worker
```

### Build Issues Resolution
If you encounter build issues:
```bash
# Clean rebuild all services
docker compose down
docker system prune -f
docker compose up --build -d

# Check for compilation errors
docker compose logs workout-plan-service | grep ERROR
```

## 📊 Features

### ✅ Implemented Features
- **User Management**: Registration, authentication, profile management
- **Workout Planning**: Exercise scheduling, workout plan generation
- **AI Integration**: LangChain-powered personalized workout generation
- **Database**: PostgreSQL with automatic table creation
- **Containerization**: Full Docker Compose orchestration
- **API Documentation**: Swagger UI for all REST services
- **Health Monitoring**: Comprehensive health checks
- **Security**: Development-mode security configuration
- **Multi-stage Builds**: Optimized Docker images

### 🔧 Technical Stack
- **Backend**: Spring Boot 3.5.0, Java 21
- **AI/ML**: Python 3.11, FastAPI, LangChain
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose
- **Documentation**: OpenAPI 3.0, Swagger UI
- **Build Tools**: Maven, pip

## 🚧 Future Enhancements

- [ ] JWT authentication with OAuth2 integration
- [ ] User preferences and fitness goals management
- [ ] Advanced workout analytics and progress tracking
- [ ] Production security configuration
- [ ] API rate limiting and caching
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline integration
- [ ] Kubernetes deployment manifests
- [ ] Monitoring and logging with ELK stack

## 🎯 Getting Started Checklist

1. ✅ Clone the repository
2. ✅ Create `.env` file with required variables
3. ✅ Run `docker compose up --build -d` (note: `--build` flag and `-d` for background)
4. ✅ Wait for services to start (30-60 seconds for full registration)
5. ✅ Verify all services are healthy: `docker compose ps`
6. ✅ Check Service Registry: http://localhost:8761 (view registered services)
7. ✅ Test API Gateway: http://localhost:8000/actuator/health
8. ✅ Access Swagger UIs:
   - User Service: http://localhost:8081/swagger-ui/index.html
   - Workout Plan Service: http://localhost:8082/swagger-ui/index.html
9. ✅ Test GenAI Worker: http://localhost:8083/health
10. ✅ Test API Gateway routing:
    - `curl http://localhost:8000/api/users/health`
    - `curl http://localhost:8000/api/workout-plans/health`

---

**Happy Coding! 🎯** 

*FlexFit Platform - Empowering fitness through intelligent microservices* 💪 