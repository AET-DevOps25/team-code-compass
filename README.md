# 🏋️ FlexFit - AI-Powered Fitness Platform

A comprehensive microservices-based fitness application featuring AI-powered workout generation, real-time progress tracking, and adaptive training recommendations.

## 📖 Project Documentation

- **[Problem Statement](docs/problem_statement.md)**
- **[System Overview](docs/system_overview.md)**
- **[CI/CD Pipeline Guide](docs/CI_CD_GUIDE.md)**

## 📋 Table of Contentsß

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
- Docker & Docker Compose V2
- Git

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

```bash
# 1. Clone and configure environment  
git clone https://github.com/AET-DevOps25/team-code-compass.git && cd team-code-compass && cp env.example .env

# 2. Start with production images (disable override file)
docker compose -f docker-compose.yml up -d

# 3. Verify deployment
curl http://localhost:8080/actuator/health && echo "✅ FlexFit production ready!"
```



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
```

## 📚 API Documentation

### 🔗 Swagger/OpenAPI Interfaces

| Service | Swagger UI | OpenAPI Spec | Health Check |
|---------|------------|--------------|--------------|
| **User Service** | http://localhost:8081/swagger-ui | http://localhost:8081/v3/api-docs | http://localhost:8081/actuator/health |
| **Workout Service** | http://localhost:8082/swagger-ui | http://localhost:8082/v3/api-docs | http://localhost:8082/actuator/health |
| **GenAI Worker** | http://localhost:8083/docs | http://localhost:8083/openapi.json | http://localhost:8083/health |

### 📋 Key API Endpoints

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

#### GenAI Worker APIs
| Method | Endpoint | Description | Example |
|--------|----------|-------------|---------|
| `POST` | `/generate` | Generate workout | AI-powered creation |
| `POST` | `/exercises/search` | Search exercises with RAG | Vector similarity |
| `GET` | `/health` | Health check | Service status |
| `GET` | `/metrics` | Prometheus metrics | Performance data |

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

**Option 2: Local Development (Build from Source)**
```bash
# Build from local source code (uses docker-compose.override.yml)
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

# View resource usage
docker stats
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

---

<div align="center">

**🏋️ FlexFit - Transforming Fitness Through AI 🤖**

[![CI/CD](../../actions/workflows/ci-cd.yml/badge.svg)](../../actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div> 