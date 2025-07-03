# FlexFit Microservices Platform

A comprehensive fitness application ecosystem built with **microservices architecture**, **service discovery**, **API Gateway**, **AI-powered workout generation**, and **rich markdown content**. The platform includes user management, JWT authentication, workout planning with markdown content, AI-powered personalized workouts, and full CI/CD automation.

## 🏗️ Architecture Overview

The FlexFit platform follows a **Master-Worker microservices pattern** with **Service Registry**, **API Gateway**, and **AI-powered content generation**:

### Core Infrastructure Services:
- **Service Registry (Eureka Server)**: Service discovery and health monitoring
- **API Gateway**: Single entry point, request routing, and load balancing
- **PostgreSQL Database**: Centralized data storage with markdown content support
- **Client Application**: Next.js frontend with shadcn/ui components

### Business Logic Services:
- **User Service**: JWT authentication, user registration, and profile management
- **Workout Plan Service**: Master orchestrator with markdown content generation
- **GenAI Workout Worker**: AI-powered personalized workout generation with rich markdown

### CI/CD & DevOps:
- **GitHub Actions**: Automated development, production, and PR validation pipelines
- **Docker Compose**: Development and production container orchestration
- **Automated Testing**: Unit, integration, and system tests with dynamic authentication

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (V2 - uses `docker compose`, not `docker-compose`)
- Git
- Node.js 18+ (for client development)

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
Create your `.env` file in the project root:
```env
# Database Configuration
POSTGRES_DB=user_service_db
POSTGRES_USER=flexfit
POSTGRES_PASSWORD=flexfit_local

# External API Keys
CHAIR_API_KEY=your_chair_api_key_here

# JWT Configuration (for production)
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# Client Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8082

# Monitoring (optional)
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
```

### 3. Start All Services
```bash
# Start all services (Database + All Microservices + Client)
docker compose up --build -d

# View logs for all services (live stream)
docker compose logs -f

# View logs for specific service
docker compose logs -f service-registry      # Eureka Server
docker compose logs -f api-gateway           # API Gateway
docker compose logs -f user-service          # User Service  
docker compose logs -f workout-plan-service  # Workout Service
docker compose logs -f genai-workout-worker  # AI Worker
docker compose logs -f client                # Next.js Client

# Stop all services
docker compose down
```

### 4. Access the Application
- **Client Application**: http://localhost:3000 (Next.js with shadcn/ui)
- **Service Registry**: http://localhost:8761 (Eureka Dashboard)
- **API Gateway**: http://localhost:8000 (Single entry point)
- **User Service**: http://localhost:8081/swagger-ui/index.html
- **Workout Plan Service**: http://localhost:8082/swagger-ui/index.html

## 🐳 Docker Services

### Service Overview
| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Client (Next.js)** | `3000` | ✅ Healthy | React frontend with shadcn/ui |
| **Service Registry** | `8761` | ✅ Healthy | Eureka Server - Service discovery |
| **API Gateway** | `8000` | ✅ Healthy | Spring Cloud Gateway - Request routing |
| **PostgreSQL** | `5432` | ✅ Healthy | Database server with markdown support |
| **User Service** | `8081` | ✅ Healthy | JWT auth & user management API |
| **Workout Plan Service** | `8082` | ✅ Running | Workout planning with markdown content |
| **GenAI Workout Worker** | `8083` | ✅ Healthy | AI workout generation with markdown |

### Container Details
- **Client**: Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui components
- **Service Registry**: Spring Boot 3.5.0 with Netflix Eureka Server
- **API Gateway**: Spring Boot 3.5.0 with Spring Cloud Gateway
- **Database**: PostgreSQL 16 with persistent storage, health checks, and markdown content support
- **User Service**: Spring Boot 3.5.0 with JWT authentication and Eclipse Temurin JDK 21
- **Workout Plan Service**: Spring Boot 3.5.0 with markdown content generation
- **GenAI Worker**: Python 3.11 with FastAPI, LangChain, and rich markdown generation
- **Network**: `flexfit-network` for inter-service communication
- **Service Discovery**: Automatic service registration and discovery via Eureka
- **Health Checks**: All services include comprehensive health monitoring

## 🔐 Authentication & Security

### JWT Authentication Flow
1. **User Registration**: `POST /api/v1/users/register`
2. **User Login**: `POST /auth/login` → Returns JWT token
3. **Protected Endpoints**: Include `Authorization: Bearer <token>` header
4. **Token Validation**: Automatic validation on all protected endpoints

### Example Authentication
```bash
# Register a new user
curl -X POST http://localhost:8081/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "heightCm": 180,
    "weightKg": 75.0
  }'

# Login to get JWT token
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Use token for protected endpoints
curl -X GET http://localhost:8082/api/v1/plans/user/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Markdown Content System

### Rich Workout Content
The platform generates and stores rich markdown content for workouts, including:

- **Exercise Tables**: Detailed sets, reps, and weight recommendations
- **Progress Tracking**: Personal records and progression notes
- **Warm-up & Cool-down**: Comprehensive preparation and recovery routines
- **Technique Tips**: Form cues and safety guidelines
- **Workout Variations**: Alternative exercises and modifications

### Markdown Features by Workout Type

#### STRENGTH Workouts
```markdown
# Strength Training Session

## Exercise Table
| Exercise | Sets | Reps | Weight | Rest |
|----------|------|------|--------|------|
| Bench Press | 4 | 8-10 | 135 lbs | 2-3 min |
| Squats | 4 | 10-12 | 185 lbs | 2-3 min |

## Warm-up Routine
- 5 minutes light cardio
- Dynamic stretching
- Activation exercises

## Progress Tracking
- Previous PR: 225 lbs
- Today's goal: 230 lbs
- Notes: Focus on form
```

#### HIIT Workouts
```markdown
# HIIT Cardio Session

## Interval Structure
| Phase | Duration | Intensity | Exercise |
|-------|----------|-----------|----------|
| Work | 30s | 90% | Burpees |
| Rest | 15s | 40% | Walking |

## Heart Rate Zones
- **Work Phase**: 85-95% Max HR
- **Recovery**: 60-70% Max HR
```

#### YOGA Workouts
```markdown
# Yoga Flow Session

## Pose Sequence
1. **Mountain Pose** (2 min)
   - Focus on breath
   - Ground through feet

2. **Sun Salutation A** (5 rounds)
   - Inhale: Upward Salute
   - Exhale: Forward Fold

## Mindfulness Elements
- Breath awareness
- Present moment focus
- Body scan meditation
```

## 📚 API Documentation

### 🔗 Service Endpoints

#### Client Application (Port 3000)
- **Application**: http://localhost:3000
- **Features**: User registration, login, workout generation, markdown display

#### Service Registry - Eureka Server (Port 8761)
- **Eureka Dashboard**: http://localhost:8761
- **Registered Services**: http://localhost:8761/eureka/apps
- **Health Check**: http://localhost:8761/actuator/health

#### API Gateway (Port 8000) - **Single Entry Point**
- **Health Check**: http://localhost:8000/actuator/health
- **Gateway Routes**: http://localhost:8000/actuator/gateway/routes
- **User Service via Gateway**: http://localhost:8000/api/users/**
- **Workout Service via Gateway**: http://localhost:8000/api/workout-plans/**

#### User Service (Port 8081) - **JWT Authentication**
- **Swagger UI**: http://localhost:8081/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8081/v3/api-docs
- **Health Check**: http://localhost:8081/actuator/health
- **Login Endpoint**: http://localhost:8081/auth/login

#### Workout Plan Service (Port 8082) - **Markdown Content**
- **Swagger UI**: http://localhost:8082/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8082/v3/api-docs
- **Health Check**: http://localhost:8082/actuator/health

#### GenAI Workout Worker (Port 8083) - **AI Content Generation**
- **Health Check**: http://localhost:8083/health
- **Generate Endpoint**: http://localhost:8083/generate

### 📋 Available API Endpoints

#### Authentication APIs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | Login and get JWT token | ❌ |
| `POST` | `/api/v1/users/register` | Register a new user | ❌ |

#### User Service APIs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/users/me` | Get current user profile | ✅ |
| `GET` | `/api/v1/users/{id}` | Get user by ID | ✅ |
| `GET` | `/api/v1/users/{id}/preferences` | Get user preferences | ✅ |
| `GET` | `/actuator/health` | Service health status | ❌ |

#### Workout Plan Service APIs (with Markdown Content)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/plans/generate` | Generate workout with markdown | ✅ |
| `GET` | `/api/v1/plans/user/{userId}/date/{date}` | Get workout by date | ✅ |
| `GET` | `/api/v1/plans/user/{userId}/range` | Get workouts by date range | ✅ |
| `GET` | `/api/v1/plans/{id}` | Get workout plan by ID | ✅ |
| `GET` | `/api/v1/daily-workouts` | Get daily workouts | ✅ |

#### GenAI Workout Worker APIs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check | ❌ |
| `POST` | `/generate` | Generate AI workout with markdown | ✅ |

### 📝 Example API Calls with Markdown Content

#### Generate Workout with Markdown Content
```bash
curl -X POST http://localhost:8082/api/v1/plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "dayDate": "2025-01-25",
    "focusSportType": "STRENGTH",
    "targetDurationMinutes": 45
  }'

# Response includes:
# - scheduledExercises: Structured exercise data
# - markdownContent: Rich markdown content for display
# - Generated workout is automatically saved to database
```

#### Retrieve Workout by Date
```bash
curl -X GET http://localhost:8082/api/v1/plans/user/{userId}/date/2025-01-25 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Returns workout with markdown content for the specified date
```

#### Get Workouts by Date Range
```bash
curl -X GET "http://localhost:8082/api/v1/plans/user/{userId}/range?startDate=2025-01-25&endDate=2025-01-27" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Returns array of workouts with markdown content for the date range
```

## 🧪 Testing & Quality Assurance

### Automated Testing Suite
We have comprehensive testing with **dynamic authentication** (no more static tokens!):

#### Run Integration Tests
```bash
# Run comprehensive integration test with dynamic authentication
./test-workout-integration.sh

# Features tested:
# ✅ Dynamic user registration and JWT authentication
# ✅ Workout generation with markdown content
# ✅ Database persistence of markdown content
# ✅ API retrieval of workout data
# ✅ Multiple sport type support (STRENGTH, HIIT, YOGA)
# ✅ Date range queries
# ✅ Authentication and authorization
# ✅ Invalid token rejection
```

#### Test Results Example
```bash
========================================
  Workout Integration Test Suite       
========================================

Test 0: Setting up test user and authentication
✓ Test user registered successfully (ID: abc123)
✓ Authentication successful

Test 1: Generating STRENGTH workout
✓ STRENGTH workout generated successfully
✓ Markdown content included in response
  Markdown content length: 2847 characters
  Number of exercises: 5

Test 2: Retrieving generated workout
✓ Workout retrieved successfully
✓ Markdown content persisted in database

Test 3: Generating HIIT workout
✓ HIIT workout generated successfully
✓ HIIT-specific content found in markdown

Test 4: Generating YOGA workout
✓ YOGA workout generated successfully
✓ YOGA-specific content found in markdown

Test 5: Retrieving workouts by date range
✓ Retrieved 3 workouts from date range
✓ All workouts have markdown content

Test 6: Testing authentication and authorization
✓ Invalid token properly rejected
✓ Missing token properly rejected
```

### Manual Testing
```bash
# Test all service health checks
curl http://localhost:8761/actuator/health  # Service Registry
curl http://localhost:8000/actuator/health  # API Gateway
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Workout Plan Service
curl http://localhost:8083/health           # GenAI Worker

# Test service registration
curl http://localhost:8761/eureka/apps -H "Accept: application/json"
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Development CI/CD (`development-ci.yml`)
**Triggers**: Push/PR to `development` branch
- **Code Quality**: Linting, formatting, security scans
- **Unit Tests**: Parallel matrix testing for all services
- **Integration Tests**: 82+ test scenarios with dynamic authentication
- **Build & Package**: Docker images and artifacts
- **Auto-Deploy**: Development environment deployment
- **Health Checks**: Post-deployment validation
- **Notifications**: Slack/email notifications

#### 2. Production CD (`production-cd.yml`)
**Triggers**: Manual workflow dispatch
- **Input Parameters**: Environment, version, test options
- **Pre-deployment Validation**: Security and compliance scans
- **Comprehensive Testing**: Optional full test suite
- **Manual Approval Gate**: Production deployment approval
- **Blue-Green Deployment**: Zero-downtime deployment
- **Health Monitoring**: Post-deployment health checks
- **Rollback Capability**: Automatic rollback on failure

#### 3. PR Validation (`pr-validation.yml`)
**Triggers**: Pull request creation/update
- **PR Information Validation**: Title convention, description
- **Code Quality Checks**: Java checkstyle, Python linting
- **Security Scans**: Dependency vulnerabilities
- **Unit Tests**: Parallel matrix execution
- **Build Verification**: All services build successfully
- **Automated PR Comments**: Test results and coverage
- **Auto-merge**: Dependabot PRs (optional)

### Branch Strategy
- **`main`**: Production-ready code
- **`development`**: Integration and testing
- **`feature/*`**: Feature development branches
- **`hotfix/*`**: Production hotfixes

### Deployment Environments
- **Development**: Auto-deployed from `development` branch
- **Staging**: Manual deployment for testing
- **Production**: Manual deployment with approval gates

## 🛠️ Development

### Local Development Setup

#### Full Stack Development
```bash
# Start all services
docker compose up --build -d

# Develop client locally (with hot reload)
cd client
npm install
npm run dev
# Client runs on http://localhost:3000 with API proxy to backend services
```

#### Backend-Only Development
```bash
# Start infrastructure services
docker compose up postgres service-registry api-gateway -d

# Run services locally for development
cd server/user-service
./mvnw spring-boot:run

cd server/workout-plan-service
./mvnw spring-boot:run

cd genai
python -m uvicorn workout-worker:app --reload --port 8083
```

#### Client-Only Development
```bash
# Start backend services
docker compose up --build -d postgres service-registry api-gateway user-service workout-plan-service genai-workout-worker

# Develop client locally
cd client
npm install
npm run dev
```

### Project Structure
```
team-code-compass/
├── .github/workflows/           # CI/CD pipeline definitions
│   ├── development-ci.yml       # Development CI/CD pipeline
│   ├── production-cd.yml        # Production deployment pipeline
│   └── pr-validation.yml        # PR validation pipeline
├── client/                      # Next.js frontend application
│   ├── app/                     # Next.js 13+ app directory
│   ├── components/              # React components
│   ├── src/                     # Source code
│   │   ├── lib/                 # Utility functions (cn, utils)
│   │   ├── services/            # API service layer
│   │   └── types/               # TypeScript type definitions
│   ├── package.json             # Node.js dependencies
│   └── Dockerfile               # Client container definition
├── server/                      # Backend microservices
│   ├── service-registry/        # Eureka server
│   ├── api-gateway/             # Spring Cloud Gateway
│   ├── user-service/            # User management with JWT
│   └── workout-plan-service/    # Workout planning with markdown
├── genai/                       # AI workout generation service
│   ├── workout-worker.py        # FastAPI service with markdown generation
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # GenAI container definition
├── docs/                        # Documentation
│   ├── CICD.md                  # CI/CD pipeline documentation
│   └── system_overview.md       # System architecture
├── tests/                       # Test suites
│   ├── integration/             # Integration tests
│   └── system/                  # System tests
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── test-workout-integration.sh  # Comprehensive integration test
├── env.example                  # Environment variable template
└── README.md                    # This documentation
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_DB` | Database name | `user_service_db` | ✅ |
| `POSTGRES_USER` | Database user | `flexfit` | ✅ |
| `POSTGRES_PASSWORD` | Database password | `flexfit_local` | ✅ |
| `CHAIR_API_KEY` | TUM OpenWebUI API key | - | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ (prod) |
| `JWT_EXPIRATION` | JWT expiration time (ms) | `86400000` | ❌ |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL for client | `http://localhost:8082` | ✅ |

### Application Profiles
- **`default`**: Local development with H2 database
- **`docker`**: Container environment with PostgreSQL
- **`prod`**: Production environment with security hardening

### Service Communication
Services communicate through the `flexfit-network` Docker network with **Service Discovery**:
- **Service Registry (Eureka)**: `service-registry:8761` - Central service discovery
- **API Gateway**: `api-gateway:8000` - Routes to registered services  
- **Database**: `postgres:5432` - Shared PostgreSQL instance
- **Inter-service Communication**: Automatic service discovery via Eureka
- **Client → API Gateway**: `http://localhost:8000` (production proxy)
- **Client → Direct Services**: `http://localhost:808X` (development)

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5432, 8000, 8081, 8082, 8083, and 8761 are available
2. **Database connection**: Verify `.env` file exists and has correct credentials
3. **Container startup**: Check logs with `docker compose logs <service-name>`
4. **Missing API key**: Ensure `CHAIR_API_KEY` is set in `.env` file
5. **Service registration**: Services may take 30-60s to register with Eureka after startup
6. **Command not found**: Use `docker compose` (not `docker-compose`) - V2 syntax
7. **Client build issues**: Ensure `client/src/lib/utils.ts` exists and TypeScript paths are correct
8. **JWT token issues**: Check token expiration and format
9. **Markdown content missing**: Verify GenAI service is running and generating content

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

# Test client application
curl http://localhost:3000                  # Next.js Client

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
docker compose logs --tail=50 client
```

### Build Issues Resolution
```bash
# Clean rebuild all services
docker compose down
docker system prune -f
docker compose up --build -d

# Check for compilation errors
docker compose logs workout-plan-service | grep ERROR
docker compose logs user-service | grep ERROR

# Test specific service builds
docker compose up --build user-service
docker compose up --build workout-plan-service

# Check client build issues
cd client
npm run build
npx tsc --noEmit
```

### Authentication Issues
```bash
# Test user registration
curl -X POST http://localhost:8081/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'

# Test login
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Verify JWT token format (should be three base64 parts separated by dots)
echo "YOUR_JWT_TOKEN" | cut -d. -f1 | base64 -d
```

## 📊 Features

### ✅ Implemented Features

#### Core Platform
- **Microservices Architecture**: Service registry, API gateway, distributed services
- **Service Discovery**: Automatic service registration and discovery with Eureka
- **Database Integration**: PostgreSQL with automatic schema creation
- **Containerization**: Full Docker Compose orchestration for development and production
- **Health Monitoring**: Comprehensive health checks for all services

#### Authentication & Security
- **JWT Authentication**: Secure token-based authentication system
- **User Management**: Registration, login, profile management
- **Protected Endpoints**: Role-based access control
- **Security Configuration**: Development and production security profiles

#### AI-Powered Workout Generation
- **GenAI Integration**: LangChain-powered personalized workout generation
- **Rich Markdown Content**: Comprehensive workout descriptions with tables, tips, and tracking
- **Multiple Workout Types**: STRENGTH, HIIT, YOGA with type-specific content
- **Exercise Scheduling**: Structured exercise data with sets, reps, and weights
- **Progress Tracking**: Personal records and progression notes

#### Frontend Application
- **Next.js 14**: Modern React framework with TypeScript
- **shadcn/ui Components**: Beautiful, accessible UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first responsive design
- **Markdown Rendering**: Rich workout content display

#### API & Documentation
- **REST APIs**: Comprehensive RESTful API design
- **OpenAPI/Swagger**: Interactive API documentation for all services
- **API Gateway Integration**: Centralized API routing and load balancing
- **CORS Configuration**: Cross-origin resource sharing support

#### Testing & Quality
- **Dynamic Authentication Testing**: No static tokens, real user registration/login flow
- **Integration Testing**: Comprehensive test suite with 82+ scenarios
- **Unit Testing**: Service-level unit tests
- **Health Check Testing**: Automated service health validation
- **API Testing**: End-to-end API workflow testing

#### CI/CD & DevOps
- **GitHub Actions**: Automated CI/CD pipelines
- **Multi-Environment Support**: Development, staging, and production environments
- **Docker Multi-stage Builds**: Optimized container images
- **Automated Testing**: CI pipeline integration with comprehensive test suites
- **Deployment Automation**: Automated deployment with health checks

### 🔧 Technical Stack

#### Backend Services
- **Framework**: Spring Boot 3.5.0 with Java 21
- **Service Discovery**: Netflix Eureka Server
- **API Gateway**: Spring Cloud Gateway
- **Database**: PostgreSQL 16 with JPA/Hibernate
- **Authentication**: JWT with Spring Security
- **Documentation**: OpenAPI 3.0 with Swagger UI
- **Build Tool**: Maven with multi-stage Docker builds

#### AI/ML Service
- **Framework**: Python 3.11 with FastAPI
- **AI Library**: LangChain for workout generation
- **Content Generation**: Rich markdown content creation
- **API Documentation**: FastAPI automatic OpenAPI generation

#### Frontend Application
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: shadcn/ui components with Radix UI
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: React hooks and context
- **Markdown Rendering**: ReactMarkdown with syntax highlighting
- **Build Tool**: Next.js with optimized production builds

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Service Mesh**: Eureka service discovery
- **Database**: PostgreSQL with persistent volumes
- **Networking**: Docker bridge network with service isolation
- **Health Monitoring**: Spring Boot Actuator and custom health checks

## 🚧 Future Enhancements

### Planned Features
- [ ] **Advanced Authentication**: OAuth2 integration with Google/GitHub
- [ ] **User Preferences**: Comprehensive fitness goals and preferences management
- [ ] **Workout Analytics**: Progress tracking with charts and statistics
- [ ] **Social Features**: Workout sharing and community features
- [ ] **Mobile App**: React Native mobile application
- [ ] **Offline Support**: PWA capabilities with offline workout access

### Technical Improvements
- [ ] **Production Security**: Enhanced security configuration for production
- [ ] **API Rate Limiting**: Request throttling and caching strategies
- [ ] **Monitoring Stack**: ELK stack integration for logging and monitoring
- [ ] **Kubernetes**: K8s deployment manifests and Helm charts
- [ ] **Performance Optimization**: Database indexing and query optimization
- [ ] **Backup Strategy**: Automated database backups and disaster recovery

### DevOps Enhancements
- [ ] **Multi-region Deployment**: Geographic distribution for better performance
- [ ] **Blue-Green Deployment**: Zero-downtime deployment strategies
- [ ] **Canary Releases**: Gradual feature rollout capabilities
- [ ] **Infrastructure as Code**: Terraform/CloudFormation templates
- [ ] **Secrets Management**: HashiCorp Vault or AWS Secrets Manager
- [ ] **Compliance**: GDPR, HIPAA compliance features

## 🎯 Getting Started Checklist

### Quick Start (5 minutes)
1. ✅ **Clone Repository**: `git clone <repo-url> && cd team-code-compass`
2. ✅ **Environment Setup**: Copy `env.example` to `.env` and configure
3. ✅ **Start Services**: `docker compose up --build -d`
4. ✅ **Wait for Startup**: Services take 30-60 seconds to fully register
5. ✅ **Verify Health**: `docker compose ps` - all services should be healthy

### Service Verification (2 minutes)
6. ✅ **Check Service Registry**: http://localhost:8761 (view registered services)
7. ✅ **Test API Gateway**: http://localhost:8000/actuator/health
8. ✅ **Access Client**: http://localhost:3000 (Next.js application)
9. ✅ **View API Docs**: 
   - User Service: http://localhost:8081/swagger-ui/index.html
   - Workout Service: http://localhost:8082/swagger-ui/index.html

### Integration Testing (3 minutes)
10. ✅ **Run Integration Test**: `./test-workout-integration.sh`
11. ✅ **Verify Test Results**: All tests should pass with ✅ indicators
12. ✅ **Check Generated Content**: Verify markdown content is generated and persisted

### Manual Testing (5 minutes)
13. ✅ **Register User**: Use client UI or API to create account
14. ✅ **Generate Workout**: Create workout with markdown content
15. ✅ **View Rich Content**: See markdown-rendered workout in client
16. ✅ **Test API Gateway**: Verify routing through gateway works
17. ✅ **Check Persistence**: Retrieve saved workouts by date/range

### Development Setup (Optional)
18. ✅ **Local Development**: Set up local development environment
19. ✅ **Hot Reload**: Configure client hot reload for development
20. ✅ **Database Access**: Connect to PostgreSQL for data inspection

---

**Happy Coding! 🎯** 

*FlexFit Platform - Empowering fitness through intelligent microservices with rich content generation* 💪

## 📞 Support & Contributing

### Getting Help
- **Documentation**: Check `docs/` directory for detailed guides
- **Issues**: Create GitHub issues for bugs and feature requests
- **CI/CD Guide**: See `docs/CICD.md` for pipeline documentation

### Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Quality
- All PRs trigger automated validation pipeline
- Code must pass linting, security scans, and tests
- Maintain test coverage above 80%
- Follow conventional commit messages