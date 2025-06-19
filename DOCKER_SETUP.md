# FlexFit Docker Setup Guide

This guide explains how to build and run the complete FlexFit application using Docker Compose.

## 🏗️ Architecture Overview

The FlexFit application consists of the following services:

- **client**: React frontend served by nginx (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **user-service**: Spring Boot user management service (port 8081)
- **workout-plan-service**: Spring Boot workout planning service (port 8082)
- **genai-workout-worker**: Python GenAI service for exercise recommendations (port 8000)

## 📋 Prerequisites

- Docker and Docker Compose installed
- Git repository cloned locally

## 🚀 Quick Start

### 1. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
POSTGRES_USER=flexfit_user
POSTGRES_PASSWORD=flexfit_password_2024
POSTGRES_DB=flexfit_db

# GenAI Configuration
CHAIR_API_KEY=your_openai_api_key_here

# Application Environment
NODE_ENV=production
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Or start individual services
docker-compose up -d postgres
docker-compose up -d user-service
docker-compose up -d workout-plan-service
docker-compose up -d genai-workout-worker
docker-compose up -d client
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend APIs**:
  - User Service: http://localhost:8081
  - Workout Plan Service: http://localhost:8082
  - GenAI Worker: http://localhost:8000
- **Database**: localhost:5432

## 🔧 Development Commands

### View Logs
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f client
docker-compose logs -f postgres
docker-compose logs -f user-service
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete database data)
docker-compose down -v
```

### Rebuild Services
```bash
# Rebuild specific service
docker-compose build client
docker-compose up -d client

# Rebuild all services
docker-compose build
docker-compose up -d
```

## 🏥 Health Checks

All services include health checks. You can monitor service health with:

```bash
# Check service status
docker-compose ps

# View health check details
docker inspect flexfit-client --format='{{json .State.Health}}'
```

## 📁 File Structure

```
flexfit/
├── client/                    # React frontend
│   ├── Dockerfile            # Multi-stage build with nginx
│   ├── nginx.conf            # Nginx configuration
│   ├── .dockerignore         # Docker build exclusions
│   └── ...                   # React source files
├── server/
│   ├── user-service/         # Spring Boot user service
│   └── workout-plan-service/ # Spring Boot workout service
├── genai/                    # Python GenAI service
├── docker-compose.yml        # Main orchestration file
└── .env                     # Environment variables
```

## 🔒 Security Features

The nginx configuration includes:
- Security headers (XSS protection, content type sniffing prevention)
- Gzip compression for performance
- Static asset caching
- SPA routing support
- API proxying to backend services

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5432, 8000, 8081, 8082 are available
2. **Database connection**: Wait for postgres health check to pass before starting other services
3. **Build failures**: Check that all required files are present and .dockerignore is configured correctly

### Debugging Commands

```bash
# Check container status
docker-compose ps

# Enter container shell
docker-compose exec client sh
docker-compose exec postgres psql -U flexfit_user -d flexfit_db

# View container resources
docker stats

# Check network connectivity
docker-compose exec client ping postgres
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose up -d --build
```

### Database Backup
```bash
# Backup database
docker-compose exec postgres pg_dump -U flexfit_user flexfit_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U flexfit_user flexfit_db < backup.sql
```

## 📊 Production Considerations

For production deployment, consider:
- Using Docker secrets for sensitive environment variables
- Setting up proper logging with log aggregation
- Implementing monitoring and alerting
- Using a reverse proxy (Traefik, nginx) for SSL termination
- Setting up backup strategies for the database
- Implementing proper resource limits and scaling policies 