# FlexFit Microservices Platform

A comprehensive fitness application ecosystem built with microservices architecture. The platform includes user management, workout planning, and AI-powered workout generation services, all containerized with Docker.

## 🏗️ Architecture Overview

The FlexFit platform consists of four main services:

- **User Service**: User registration, authentication, and profile management
- **Workout Plan Service**: Workout planning, scheduling, and exercise management  
- **GenAI Workout Worker**: AI-powered personalized workout generation
- **PostgreSQL Database**: Centralized data storage for all services

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

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
docker compose up -d

# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f user-service
docker compose logs -f workout-plan-service
docker compose logs -f genai-workout-worker

# Stop all services
docker compose down
```

## 🐳 Docker Services

### Service Overview
| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **PostgreSQL** | `5432` | ✅ Healthy | Database server |
| **User Service** | `8081` | ✅ Healthy | User management API |
| **Workout Plan Service** | `8082` | ✅ Running | Workout planning API |
| **GenAI Workout Worker** | `8000` | ✅ Healthy | AI workout generation |

### Container Details
- **Database**: `postgres:16` with persistent storage and health checks
- **User Service**: Spring Boot 3.5.0 with Eclipse Temurin JDK 21
- **Workout Plan Service**: Spring Boot 3.5.0 with Eclipse Temurin JDK 21
- **GenAI Worker**: Python 3.11 with FastAPI and LangChain
- **Network**: `flexfit-network` for inter-service communication
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

#### User Service (Port 8081)
- **Swagger UI**: http://localhost:8081/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8081/v3/api-docs
- **Health Check**: http://localhost:8081/actuator/health
- **Root**: http://localhost:8081/

#### Workout Plan Service (Port 8082)
- **Swagger UI**: http://localhost:8082/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8082/v3/api-docs
- **Root**: http://localhost:8082/

#### GenAI Workout Worker (Port 8000)
- **Health Check**: http://localhost:8000/health
- **Generate Endpoint**: http://localhost:8000/generate

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
curl -X POST http://localhost:8000/generate \
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
# Check all services
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health  
curl http://localhost:8000/health
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
Services communicate through the `flexfit-network` Docker network:
- User Service → Database: `postgres:5432`
- Workout Plan Service → Database: `postgres:5432`
- Workout Plan Service → GenAI Worker: `flexfit-genai-workout-worker:8000`
- Workout Plan Service → User Service: `flexfit-user-service:8081`

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8000, 8081, 8082, and 5432 are available
2. **Database connection**: Verify `.env` file exists and has correct credentials
3. **Container startup**: Check logs with `docker compose logs <service-name>`
4. **Missing API key**: Ensure `CHAIR_API_KEY` is set in `.env` file

### Service Status Check
```bash
# Check if all services are running
docker compose ps

# Test all service connectivity
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Workout Plan Service (may show 404, but service is running)
curl http://localhost:8000/health           # GenAI Worker

# Test database connectivity
docker exec flexfit-postgres pg_isready -U flexfit

# Check service logs for errors
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
3. ✅ Run `docker compose up -d`
4. ✅ Verify all services are healthy: `docker compose ps`
5. ✅ Access Swagger UIs:
   - User Service: http://localhost:8081/swagger-ui/index.html
   - Workout Plan Service: http://localhost:8082/swagger-ui/index.html
6. ✅ Test GenAI Worker: http://localhost:8000/health

---

**Happy Coding! 🎯** 

*FlexFit Platform - Empowering fitness through intelligent microservices* 💪 