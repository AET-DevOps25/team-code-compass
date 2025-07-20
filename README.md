# 🏋️ FlexFit - AI-Powered Fitness Platform

A comprehensive microservices-based fitness application featuring AI-powered workout generation, real-time progress tracking, and adaptive training recommendations.

## 📖 Project Documentation

- **[Problem Statement](docs/problem_statement.md)**
- **[System Overview](docs/system_overview.md)**
- **[CI/CD Pipeline Guide](docs/CI_CD_GUIDE.md)**

## 📋 Table of Contents

### Business Logic Services:
- **User Service**: User registration, authentication, and profile management
- **Workout Plan Service**: Master orchestrator for workout planning and AI integration  
- **GenAI Workout Worker**: AI-powered personalized workout generation worker
- **TTS Service**: Text-to-speech functionality for audio generation and voice synthesis

- [🏗️ Architecture Overview](#️-architecture-overview)
- [👥 Team & Responsibilities](#-team--responsibilities)
- [🚀 Quick Setup (≤3 Commands)](#-quick-setup-3-commands)
- [🧪 Testing Strategy](#-testing-strategy)
- [📊 Monitoring & Observability](#-monitoring--observability)
- [🤖 GenAI Integration](#-genai-integration)
- [📚 API Documentation](#-api-documentation)
- [🚀 CI/CD Pipeline](#-cicd-pipeline)
- [🚢 Deployment Guide](#-deployment-guide)
- [🔧 Development Guide](#-development-guide)
- [🎯 Features](#-features)



### 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS | User interface and experience |
| **API Gateway** | Spring Boot 3, Spring Cloud Gateway | Request routing, load balancing, CORS |
| **Service Registry** | Spring Boot 3, Netflix Eureka | Service discovery and health monitoring |
| **User Service** | Spring Boot 3, JPA, PostgreSQL | User management and authentication |
| **Workout Service** | Spring Boot 3, JPA, PostgreSQL | Workout planning and management |
| **GenAI Worker** | Python 3.11, FastAPI, LangChain | AI-powered workout generation |
| **Database** | PostgreSQL 16 | Persistent data storage |
| **Containerization** | Docker, Docker Compose | Development and deployment |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Monitoring** | Prometheus, Grafana | System observability and metrics |




## 🚀 Quick Setup (≤3 Commands)

### Prerequisites
<<<<<<< HEAD

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Java 17+ (for backend services)
- PostgreSQL (provided via Docker)

### Environment Setup

1. **Copy environment file (includes pre-configured Google Cloud TTS credentials):**
   ```bash
   cp env.example .env
   ```

2. **Configure required environment variables:**
   
   **Step 1:** Open your `.env` file in the project root directory
   ```bash
   nano .env
   # or
   code .env
   # or
   vim .env
   ```
   
   **Step 2:** Update these required variables:
   ```bash
   # Generate a secure JWT secret (minimum 32 characters)
   JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters_long
   
   # Add your TUM Chair API key for GenAI features
   CHAIR_API_KEY=your_chair_api_key_here
   ```
   
   **Step 3:** Save the file and exit the editor

   **✅ Note:** Google Cloud TTS credentials are already pre-configured in `env.example` and will be automatically copied to `.env`

### Running the Application
=======
- Docker & Docker Compose V2
- Git
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b

### ⚙️ Environment Configuration

Edit your `.env` file with required settings:

```bash
# Database Configuration
POSTGRES_USER=flexfit
POSTGRES_PASSWORD=flexfit123

# AI Service Configuration  
CHAIR_API_KEY=your_openai_api_key_here
MODEL_NAME=llama3.3:latest
OPEN_WEBUI_BASE_URL=https://gpu.aet.cit.tum.de

# Docker Image Tags (for production)
IMAGE_TAG=latest

```
### 🏃‍♂️ Local Development Setup (Builds from Source)

```bash
# 1. Clone and configure environment
git clone https://github.com/AET-DevOps25/team-code-compass.git && cd team-code-compass && cp env.example .env

# 2. Start all services (uses docker-compose.override.yml for local builds)
docker compose up --build -d

# 3. Verify deployment
curl http://localhost:8080/actuator/health && echo "✅ FlexFit is ready at http://localhost:3000!"
```

### 🐳 Production Setup (Uses GHCR Images)

<<<<<<< HEAD
**✅ CORS is centrally managed at the API Gateway level** - this ensures consistent cross-origin handling across all microservices:

- **Frontend Origin**: All requests from `http://localhost:3001` (or any origin) are automatically allowed
- **No Duplicate Headers**: Backend services have CORS disabled to prevent conflicts
- **Global Policy**: API Gateway handles all CORS preflight and actual requests
- **Development Friendly**: Configured to allow all origins with `allowedOriginPatterns("*")`

### Supported Routes:
- ✅ Direct routes: `http://localhost:8000/api/v1/users/**`
- ✅ Service discovery routes: `http://localhost:8000/user-service/api/v1/users/**`
- ✅ All HTTP methods: GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH
- ✅ All headers allowed for development

## 🐳 Docker Services

### Service Overview
| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Service Registry** | `8761` | ✅ Healthy | Eureka Server - Service discovery |
| **API Gateway** | `8000` | ✅ Healthy | Spring Cloud Gateway - Request routing + CORS |
| **PostgreSQL** | `5432` | ✅ Healthy | Database server |
| **User Service** | `8081` | ✅ Healthy | User management API |
| **Workout Plan Service** | `8082` | ✅ Running | Workout planning API |
| **TTS Service** | `8083` | ✅ Healthy | Text-to-speech API |
| **GenAI Workout Worker** | `8000` | ✅ Healthy | AI workout generation |

### Container Details
- **Service Registry**: Spring Boot 3.5.0 with Netflix Eureka Server
- **API Gateway**: Spring Boot 3.5.0 with Spring Cloud Gateway + **Reactive CORS Filter**
- **Database**: `postgres:16` with persistent storage and health checks
- **User Service**: Spring Boot 3.5.0 with Eclipse Temurin JDK 21 + Eureka Client
- **Workout Plan Service**: Spring Boot 3.5.0 with Eclipse Temurin JDK 21 + Eureka Client
- **TTS Service**: Spring Boot 3.5.0 with Eclipse Temurin JDK 21 + Eureka Client + Google Cloud TTS
- **GenAI Worker**: Python 3.11 with FastAPI and LangChain
- **Network**: `flexfit-network` for inter-service communication
- **Service Discovery**: Automatic service registration and discovery via Eureka
- **Health Checks**: All services include comprehensive health monitoring

### Useful Docker Commands
=======
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b
```bash
# 1. Clone and configure environment  
git clone https://github.com/AET-DevOps25/team-code-compass.git && cd team-code-compass && cp env.example .env

# 2. Start with production images (disable override file)
docker compose -f docker-compose.yml up -d

# 3. Verify deployment
curl http://localhost:8080/actuator/health && echo "✅ FlexFit production ready!"
```


<<<<<<< HEAD
# Check individual service logs
docker compose logs user-service
docker compose logs workout-plan-service
docker compose logs tts-service
docker compose logs genai-workout-worker
docker compose logs postgres

# Restart specific service
docker compose restart workout-plan-service
docker compose restart tts-service
=======

### 🌐 Service Access Points

| Service | URL | Purpose | Status Check |
|---------|-----|---------|--------------|
| **Frontend** | http://localhost:3000 | Main application interface | `curl http://localhost:3000` |
| **API Gateway** | http://localhost:8080 | API entry point | `curl http://localhost:8080/actuator/health` |
| **Service Registry** | http://localhost:8761 | Service discovery dashboard | `curl http://localhost:8761/actuator/health` |
| **User Service API** | http://localhost:8081/swagger-ui | User management API docs | `curl http://localhost:8081/actuator/health` |
| **Workout Service API** | http://localhost:8082/swagger-ui | Workout planning API docs | `curl http://localhost:8082/actuator/health` |
| **GenAI Worker** | http://localhost:8083/docs | AI service API docs | `curl http://localhost:8083/health` |
| **Database** | localhost:5432 | PostgreSQL database | `docker exec flexfit-db pg_isready -U flexfit` |

## 🧪 Testing Strategy

### 🎯 Test Types and Execution

| Test Type | Framework | Purpose | Command | Duration |
|-----------|-----------|---------|---------|----------|
| **Unit Tests** | JUnit 5 + Pytest | Individual component testing | `./run-unit-tests.sh` | ~3 mins |
| **Integration Tests** | Spring Boot Test + FastAPI Test | Service-to-service testing | `./run-integration-tests.sh` | ~5 mins |
| **System Tests** | E2E Testing | Full workflow validation | `./test-local.sh` | ~8 mins |

### 🔧 Running Tests Locally

```bash
# Run all unit tests (Java + Python + Client)
./run-unit-tests.sh

# Run integration tests (service interactions)
./run-integration-tests.sh

# Run specific service tests
cd server/user-service && ./mvnw test
cd server/workout-plan-service && ./mvnw test
cd genai && python -m pytest test_workout_worker.py -v
cd client && npm test

# Run local system tests
./test-local.sh

# Run monitoring tests
./test-monitoring.sh
```

### 📊 Test Coverage

```bash
# Java services test coverage
cd server/user-service && ./mvnw jacoco:report
cd server/workout-plan-service && ./mvnw jacoco:report

# Python service test coverage
cd genai && python -m pytest --cov=. --cov-report=html

# View coverage reports
open server/user-service/target/site/jacoco/index.html
open server/workout-plan-service/target/site/jacoco/index.html
open genai/htmlcov/index.html
```

### 🚨 Test Environment Setup

```bash
# Start test infrastructure only
docker compose up -d postgres

# Run tests with fresh database
docker compose down -v
docker compose up -d postgres
./run-integration-tests.sh

# Mock external dependencies for unit tests
export MOCK_MODE=true
export CHAIR_API_KEY=mock_key_for_testing
./run-unit-tests.sh
```

## 📊 Monitoring & Observability

### 🔧 Monitoring Setup (≤3 Commands)

```bash
# 1. Start monitoring stack (included in docker-compose.yml)
docker compose up -d prometheus grafana alertmanager

# 2. Import Grafana dashboards
curl -X POST http://admin:admin@localhost:3001/api/dashboards/import -H "Content-Type: application/json" -d @monitoring/grafana/dashboards/flexfit-overview.json

# 3. Verify monitoring
curl http://localhost:9090/targets && curl http://localhost:3001/api/health
```

### 📈 Monitoring Access

| Service | URL | Purpose | Login |
|---------|-----|---------|-------|
| **Prometheus** | http://localhost:9090 | Metrics collection and queries | No auth required |
| **Grafana** | http://localhost:3001 | Dashboards and visualization | admin/admin |
| **Alertmanager** | http://localhost:9093 | Alert management | No auth required |
| **Service Metrics** | http://localhost:8081/actuator/metrics | Spring Boot metrics | No auth required |
| **GenAI Metrics** | http://localhost:8083/metrics | Python service metrics | No auth required |

### 📊 Key Metrics Monitored

| Category | Metrics | Purpose |
|----------|---------|---------|
| **Application** | Response time, error rate, throughput | Performance monitoring |
| **GenAI** | Token usage, model latency, generation success rate | AI service optimization |
| **Infrastructure** | CPU, memory, disk usage | Resource monitoring |
| **Business** | User registrations, workout completions, RPE scores | KPI tracking |

### 🚨 Alerting Rules

```yaml
# Key alerts configured in Prometheus
- High error rate (>5% for 5 minutes)
- High response time (>2s for 5 minutes)  
- GenAI service down
- Database connection failures
- High memory usage (>80%)
```

## 🤖 GenAI Integration

### 🎯 AI Components

| Component | Technology | Purpose | Configuration |
|-----------|------------|---------|---------------|
| **Workout Generation** | OpenAI GPT-4 / Local LLM | Personalized workout creation | `CHAIR_API_KEY` in .env |
| **Exercise RAG** | LangChain + Weaviate | Exercise database retrieval | Vector embeddings |
| **Prompt Engineering** | Custom templates | Structured AI responses | `genai/prompts.txt` |
| **Safety Guardrails** | Rule-based filters | Exercise safety validation | Business logic |

### 🔧 GenAI Configuration

```bash
# Environment setup for GenAI
export CHAIR_API_KEY="your_openai_api_key_here"
export LLM_PROVIDER="openai"  # or "local" for local models
export MODEL_NAME="llama3.3:latest"

# Test GenAI worker
curl -X POST http://localhost:8083/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_profile": {"age": 30, "fitness_level": "intermediate"},
    "preferences": {"sport_type": "strength", "duration": 45},
    "equipment": ["dumbbells", "bench"]
  }'
```

### 📈 GenAI Metrics

```bash
# Monitor AI performance in Prometheus
- genai_requests_total{endpoint="/generate"}
- genai_generation_duration_seconds
- genai_token_usage_total
- genai_error_rate
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b
```

## 📚 API Documentation

### 🔗 Swagger/OpenAPI Interfaces

| Service | Swagger UI | OpenAPI Spec | Health Check |
|---------|------------|--------------|--------------|
| **User Service** | http://localhost:8081/swagger-ui | http://localhost:8081/v3/api-docs | http://localhost:8081/actuator/health |
| **Workout Service** | http://localhost:8082/swagger-ui | http://localhost:8082/v3/api-docs | http://localhost:8082/actuator/health |
| **GenAI Worker** | http://localhost:8083/docs | http://localhost:8083/openapi.json | http://localhost:8083/health |

<<<<<<< HEAD
#### API Gateway (Port 8000) - **Single Entry Point** + **CORS Handler**
- **Health Check**: http://localhost:8000/actuator/health
- **Gateway Routes**: http://localhost:8000/actuator/gateway/routes
- **User Service via Gateway**: http://localhost:8000/api/v1/users/**
- **User Service (Discovery)**: http://localhost:8000/user-service/api/v1/users/**
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

#### TTS Service (Port 8083) - **Direct Access**
- **Swagger UI**: http://localhost:8083/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8083/v3/api-docs
- **Health Check**: http://localhost:8083/api/tts/health
- **Root**: http://localhost:8083/

#### GenAI Workout Worker (Port 8000)
- **Health Check**: http://localhost:8000/health
- **Generate Endpoint**: http://localhost:8000/generate

### 📋 Available API Endpoints
=======
### 📋 Key API Endpoints
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b

#### User Service APIs
| Method | Endpoint | Description | Example |
|--------|----------|-------------|---------|
| `POST` | `/api/v1/users/register` | Register new user | See Swagger UI |
| `POST` | `/api/v1/auth/login` | User authentication | Returns JWT token |
| `GET` | `/api/v1/users/me` | Get current user profile | Requires authentication |
| `PUT` | `/api/v1/users/profile` | Update user profile | Requires authentication |

#### Workout Service APIs
| Method | Endpoint | Description | Example |
|--------|----------|-------------|---------|
| `POST` | `/api/v1/workout-plans/generate` | Generate AI workout plan | Calls GenAI worker |
| `GET` | `/api/v1/workout-plans/{id}` | Get workout plan | Returns plan details |
| `POST` | `/api/v1/workouts/{id}/feedback` | Submit workout feedback | RPE scores |
| `GET` | `/api/v1/workouts/history` | Get workout history | User progress tracking |

<<<<<<< HEAD
#### TTS Service APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tts/health` | Service health status |
| `POST` | `/api/tts/synthesize` | Convert text to speech (audio) |
| `POST` | `/api/tts/generate` | Generate audio with metadata |
| `GET` | `/api/tts/voices` | Get available voices |

#### GenAI Workout Worker APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/generate` | Generate AI-powered workout |
=======
#### GenAI Worker APIs
| Method | Endpoint | Description | Example |
|--------|----------|-------------|---------|
| `POST` | `/generate` | Generate workout | AI-powered creation |
| `POST` | `/exercises/search` | Search exercises with RAG | Vector similarity |
| `GET` | `/health` | Health check | Service status |
| `GET` | `/metrics` | Prometheus metrics | Performance data |
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b

### 📝 API Testing

```bash
# Test User Registration
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securePassword123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Test Workout Generation
curl -X POST http://localhost:8080/api/v1/workout-plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "sportType": "STRENGTH",
    "duration": 45,
    "equipment": ["dumbbells", "bench"]
  }'
```

## 🚀 CI/CD Pipeline

### 🎯 Pipeline Strategy

```
┌─────────────────┬──────────────┬────────────────┬──────────────┐
│ Branch Type     │ Unit Tests   │ Integration    │ Build & Push │
├─────────────────┼──────────────┼────────────────┼──────────────┤
│ Feature/*       │ ✅ Always    │ ✅ Always      │ ❌ Skip      │
│ Pull Requests   │ ✅ Always    │ ✅ Always      │ ❌ Skip      │
│ Main/Dev/Prod   │ ✅ Always    │ ✅ Always      │ ✅ Always    │
└─────────────────┴──────────────┴────────────────┴──────────────┘
```

### 🔧 Pipeline Jobs

| Job | Purpose | Triggers | Duration |
|-----|---------|----------|----------|
| **Setup** | Environment validation | All pushes/PRs | ~1 min |
| **Unit Tests** | Java & Python unit tests | All pushes/PRs | ~3 mins |
| **Integration Tests** | Service integration tests | All pushes/PRs | ~5 mins |
| **Build & Push** | Docker image creation | Stable branches only | ~8 mins |
| **Summary** | Pipeline results | All pushes/PRs | ~30 secs |

### 📊 CI/CD Features

- **✅ Automated Testing**: 80+ test scenarios across all services
- **🐳 Docker Image Building**: Automatic GHCR publishing
- **📈 Test Coverage**: Unit and integration test reporting
- **🔍 Health Checks**: Service startup validation
- **🚀 Zero-Downtime**: Staging deployment automation

### 🛠️ Pipeline Execution Logic

| Branch Pattern | Unit Tests | Integration Tests | Build Images | Deploy |
|----------------|------------|-------------------|--------------|--------|
| `feature/*` | ✅ Run | ✅ Run | ❌ Skip | ❌ Skip |
| `hotfix/*` | ✅ Run | ✅ Run | ❌ Skip | ❌ Skip |
| `pull_request` | ✅ Run | ✅ Run | ❌ Skip | ❌ Skip |
| `main` | ✅ Run | ✅ Run | ✅ Build & Push | ✅ Deploy |
| `development` | ✅ Run | ✅ Run | ✅ Build & Push | ✅ Deploy |
| `production` | ✅ Run | ✅ Run | ✅ Build & Push | ✅ Deploy |

### 📚 For Complete CI/CD Guide

**📖 [See Detailed CI/CD Pipeline Guide](docs/CI_CD_GUIDE.md)** for:
- 🎮 Manual triggers and testing
- 🔍 Pipeline monitoring and verification  
- 🛠️ Troubleshooting and debugging
- 🔐 Secrets management
- ⚡ Quick reference commands

## 🚢 Deployment Guide

### 🐳 GitHub Container Registry (GHCR)

FlexFit uses **GitHub Container Registry** for storing and distributing Docker images.

#### 📦 Available Images

| Service | GHCR Image | Latest Tag |
|---------|------------|------------|
| **Service Registry** | `ghcr.io/aet-devops25/team-code-compass/service-registry` | `:latest` |
| **API Gateway** | `ghcr.io/aet-devops25/team-code-compass/api-gateway` | `:latest` |
| **User Service** | `ghcr.io/aet-devops25/team-code-compass/user-service` | `:latest` |
| **Workout Service** | `ghcr.io/aet-devops25/team-code-compass/workout-plan-service` | `:latest` |
| **GenAI Worker** | `ghcr.io/aet-devops25/team-code-compass/genai-worker` | `:latest` |
| **GenAI Local** | `ghcr.io/aet-devops25/team-code-compass/genai-worker-local` | `:latest` |
| **Frontend** | `ghcr.io/aet-devops25/team-code-compass/frontend` | `:latest` |

#### 🚀 Deployment Options

**Option 1: Production Deployment (GHCR Images)**
```bash
# Use production images from GHCR
docker compose -f docker-compose.yml up -d

# With specific tag
IMAGE_TAG=v1.0.0 docker compose -f docker-compose.yml up -d
```

<<<<<<< HEAD
#### TTS Service Examples
```bash
# Health Check
curl http://localhost:8083/api/tts/health

# Get Available Voices
curl http://localhost:8083/api/tts/voices

# Synthesize Text to Speech
curl -X POST http://localhost:8083/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to your personalized workout plan!",
    "voiceName": "en-US-Neural2-F",
    "languageCode": "en-US",
    "audioEncoding": "MP3"
  }'

# Generate Audio with Metadata
curl -X POST http://localhost:8083/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Today we will focus on upper body strength training.",
    "voiceName": "en-US-Neural2-F",
    "languageCode": "en-US",
    "audioEncoding": "MP3"
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
curl http://localhost:8083/api/tts/health   # TTS Service
curl http://localhost:8000/health           # GenAI Worker

# Test via API Gateway (recommended approach)
curl http://localhost:8000/api/users/health
curl http://localhost:8000/api/workout-plans/health
curl http://localhost:8000/api/tts/health
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
│   ├── workout-plan-service/      # Spring Boot workout planning
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/
│   └── tts-service/               # Spring Boot text-to-speech
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
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Google Cloud TTS credentials (embedded in code) | - | ❌ |

### Application Profiles
- **`default`**: Local development
- **`docker`**: Container environment with optimized settings

### Service Communication
Services communicate through the `flexfit-network` Docker network with **Service Discovery**:
- **Service Registry (Eureka)**: `service-registry:8761` - Central service discovery
- **API Gateway**: `api-gateway:8000` - Routes to registered services + **CORS handling**
- **User Service → Database**: `postgres:5432`
- **Workout Plan Service → Database**: `postgres:5432`
- **TTS Service → Google Cloud TTS**: External API integration
- **Workout Plan Service → GenAI Worker**: `flexfit-genai-workout-worker:8000`
- **All services register with Eureka** for automatic discovery and load balancing

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 5432, 8000, 8080, 8081, 8082, 8083, and 8761 are available
2. **Database connection**: Verify `.env` file exists and has correct credentials
3. **Container startup**: Check logs with `docker compose logs <service-name>`
4. **Missing API key**: Ensure `CHAIR_API_KEY` is set in `.env` file
5. **TTS credentials**: Google Cloud TTS credentials are embedded in the code - no configuration needed
6. **Service registration timing**: Services may take 30-60s to register with Eureka after startup
7. **Command not found**: Use `docker compose` (not `docker-compose`) - V2 syntax
8. **CORS errors**: Use API Gateway routes instead of direct service access for frontend
9. **API Gateway startup**: Gateway automatically waits 45s for service registration - no manual intervention needed

### ⚡ Service Discovery Timing Issue Fix

**Problem**: API Gateway returns `503 Service Unavailable` because services haven't registered with Eureka yet.

**Solution**: API Gateway now has an **internal startup delay** - it automatically waits 45 seconds before starting, allowing all services to register with Eureka.

```bash
# Simply start everything - no manual steps needed
=======
**Option 2: Local Development (Build from Source)**
```bash
# Build from local source code (uses docker-compose.override.yml)
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b
docker compose up --build -d
```

**Option 3: Hybrid Deployment**
```bash
# Use GHCR for some services, build others locally
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### 🏭 Production Environment Setup

```bash
# 1. Create production environment file
cp env.example .env.production

# 2. Configure production settings
export POSTGRES_PASSWORD=secure_production_password
export CHAIR_API_KEY=production_api_key
export IMAGE_TAG=v1.0.0

# 3. Deploy production stack
docker compose -f docker-compose.yml --env-file .env.production up -d

# 4. Verify deployment
curl http://localhost:8080/actuator/health
curl http://localhost:3000
```

### 📈 Scaling Services

```bash
# Scale specific services
docker compose up -d --scale user-service=3 --scale workout-plan-service=2

# Check running instances
docker compose ps

<<<<<<< HEAD
# Test infrastructure services first
curl http://localhost:8761/actuator/health  # Service Registry (Eureka)
curl http://localhost:8000/actuator/health  # API Gateway

# Test business services (direct access)
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Workout Plan Service
curl http://localhost:8083/api/tts/health   # TTS Service
curl http://localhost:8000/health           # GenAI Worker

# Test via API Gateway (recommended approach)
curl http://localhost:8000/api/users/health
curl http://localhost:8000/api/workout-plans/health
curl http://localhost:8000/api/tts/health

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

# Check for CORS issues in API Gateway logs
docker compose logs api-gateway | grep -i cors
=======
# View resource usage
docker stats
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b
```

### 🔄 Rolling Updates

```bash
# Pull latest images
docker compose pull

# Rolling update (zero downtime)
docker compose up -d --no-deps --build user-service
docker compose up -d --no-deps --build workout-plan-service

# Verify health after update
curl http://localhost:8080/actuator/health
```

## 🔧 Development Guide

### 🏃‍♂️ Running Individual Services

```bash
# Frontend only
cd client && npm run dev

# Backend services
cd server/user-service && ./mvnw spring-boot:run
cd server/workout-plan-service && ./mvnw spring-boot:run

# GenAI Worker
cd genai && python workout-worker.py

# Database only
docker compose up -d db
```

### 🧪 Testing

```bash
# Run all tests
./run-unit-tests.sh

# Integration tests
./run-integration-tests.sh

# Specific service tests
cd server/user-service && ./mvnw test
cd genai && python -m pytest
```

### 🐳 Docker Commands

```bash
# Rebuild specific service
docker compose build user-service

# View logs
docker compose logs -f api-gateway

# Reset everything
docker compose down -v && docker compose up --build -d
```

### 🛠️ Development Tips

```bash
# Quick service restart
docker compose restart user-service

# Database access
docker exec -it flexfit-db psql -U flexfit -d flexfit

# View all service logs
docker compose logs -f

# Check service discovery
curl http://localhost:8761/eureka/apps

# Monitor resource usage
docker stats
```

## 🎯 Features

### 🏋️‍♀️ Core Functionality

- **🔐 User Management**: Registration, authentication, profile management
- **🤖 AI Workout Generation**: Personalized workout plans using LangChain
- **📊 Progress Tracking**: Real-time performance monitoring and analytics
- **🎯 Adaptive Training**: AI-driven workout adjustments based on performance
- **📱 Responsive UI**: Modern, mobile-first design with dark/light themes

### 🔧 Technical Features

- **⚡ Microservices Architecture**: Scalable, maintainable service design
- **🌐 API Gateway**: Centralized routing, authentication, and CORS handling
- **🔍 Service Discovery**: Automatic service registration and health monitoring
- **📈 Monitoring & Observability**: Prometheus metrics, Grafana dashboards
- **🚀 CI/CD Pipeline**: Automated testing, building, and deployment
- **🐳 Containerized Deployment**: Docker-based development and production

### 🛡️ Security & Quality

- **🔒 JWT Authentication**: Secure token-based authentication
- **🛡️ Input Validation**: Comprehensive request validation and sanitization
- **🧪 Comprehensive Testing**: Unit, integration, and system test coverage
- **📊 Health Monitoring**: Real-time health checks and alerting
- **🔧 Error Handling**: Graceful error handling and user feedback

## 📞 Support & Contributing

### 🚨 Quick Help

- **🐛 Issues**: Check [GitHub Issues](../../issues) for known problems
- **📖 Docs**: See [docs/](docs/) for detailed documentation
- **💬 Discussions**: Use [GitHub Discussions](../../discussions) for questions

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow our [Git Workflow](WORKFLOW_GUIDE.md)
4. Submit a pull request

### 🔍 Troubleshooting

```bash
# Check all services are running
docker compose ps

# Verify health checks
curl http://localhost:8080/actuator/health
curl http://localhost:8761/actuator/health

# Reset if issues
docker compose down -v
docker system prune -f
docker compose up --build -d
```

<<<<<<< HEAD
## 📊 Features

### ✅ Implemented Features
- **User Management**: Registration, authentication, profile management
- **Workout Planning**: Exercise scheduling, workout plan generation
- **AI Integration**: LangChain-powered personalized workout generation
- **Text-to-Speech**: Google Cloud TTS integration for audio generation
- **Database**: PostgreSQL with automatic table creation
- **Containerization**: Full Docker Compose orchestration
- **API Documentation**: Swagger UI for all REST services
- **Health Monitoring**: Comprehensive health checks
- **Security**: Development-mode security configuration
- **Multi-stage Builds**: Optimized Docker images
- **✅ CORS Support**: Centralized cross-origin handling at API Gateway
- **✅ Service Discovery**: Automatic service registration and discovery

### 🔧 Technical Stack
- **Backend**: Spring Boot 3.5.0, Java 21
- **AI/ML**: Python 3.11, FastAPI, LangChain
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose
- **Documentation**: OpenAPI 3.0, Swagger UI
- **Build Tools**: Maven, pip
- **Service Discovery**: Netflix Eureka
- **API Gateway**: Spring Cloud Gateway

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
- [x] ✅ **CORS configuration** (completed)
- [x] ✅ **Service discovery timing fix** (documented)

## 🎯 Getting Started Checklist

1. ✅ Clone the repository
2. ✅ Create `.env` file with required variables
3. ✅ Run `docker compose up --build -d` (note: `--build` flag and `-d` for background)
4. ✅ **Wait ~60 seconds** for all services to start and register automatically
5. ✅ Verify all services are healthy: `docker compose ps`
6. ✅ Check Service Registry: http://localhost:8761 (view registered services)
7. ✅ Test API Gateway: http://localhost:8000/actuator/health
8. ✅ Access Swagger UIs:
   - User Service: http://localhost:8081/swagger-ui/index.html
   - Workout Plan Service: http://localhost:8082/swagger-ui/index.html
   - TTS Service: http://localhost:8083/swagger-ui/index.html
9. ✅ Test GenAI Worker: http://localhost:8000/health
10. ✅ Test TTS Service: http://localhost:8083/api/tts/health
11. ✅ **Test CORS-enabled routes** (for frontend):
    - `curl -H "Origin: http://localhost:3001" http://localhost:8000/user-service/api/v1/users/register`
    - `curl -H "Origin: http://localhost:3001" http://localhost:8000/api/v1/users/register`
    - `curl -H "Origin: http://localhost:3001" http://localhost:8000/api/tts/health`

### 🌟 Frontend Integration Ready!
Your frontend at `http://localhost:3001` can now make requests to:
- ✅ `http://localhost:8000/user-service/api/v1/users/register`
- ✅ `http://localhost:8000/api/v1/users/**`
- ✅ `http://localhost:8000/api/tts/**`
- ✅ All CORS preflight and actual requests supported
- ✅ No duplicate CORS headers
- ✅ Single, clean CORS policy managed at API Gateway

=======
>>>>>>> 8ee4364d68a838d9dfdbb262658698d1e9f4ec0b
---

<div align="center">

**🏋️ FlexFit - Transforming Fitness Through AI 🤖**

[![CI/CD](../../actions/workflows/ci-cd.yml/badge.svg)](../../actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div> 