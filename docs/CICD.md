# 🚀 CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline setup for the Team Code Compass project, featuring **automatic deployment to development** and **manual deployment to production** with comprehensive testing coverage.

## 📋 Table of Contents

- [Pipeline Overview](#pipeline-overview)
- [Branch Strategy](#branch-strategy)
- [Workflows](#workflows)
- [Environment Configuration](#environment-configuration)
- [Deployment Process](#deployment-process)
- [Testing Strategy](#testing-strategy)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)

## 🏗️ Pipeline Overview

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │   Production    │    │   Monitoring    │
│                 │    │                 │    │                 │
│ ✅ Automatic    │    │ 👥 Manual       │    │ 📊 Grafana      │
│ ✅ Full Testing │    │ ✅ Approval     │    │ 📈 Prometheus   │
│ ✅ Fast Deploy  │    │ ✅ Rollback     │    │ 🔍 Logging      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features
- **82+ Test Scenarios**: Complete coverage across unit, integration, and system tests
- **Automatic Development Deployment**: Push to `development` → automatic deployment
- **Manual Production Deployment**: Workflow dispatch with approval gates
- **Comprehensive Security**: Security scans, dependency checks, compliance validation
- **Monitoring & Observability**: Prometheus, Grafana, health checks
- **Rollback Capability**: Automatic rollback on deployment failures

## 🌿 Branch Strategy

### Branch Structure
```
main (deprecated)
├── development (primary branch)
│   ├── feature/auth-improvements
│   ├── feature/workout-enhancements
│   └── hotfix/security-patch
└── production (production releases)
    ├── release/v1.0.0
    └── release/v1.1.0
```

### Workflow
1. **Feature Development**: `feature/*` branches from `development`
2. **Pull Requests**: `feature/*` → `development` (automatic validation)
3. **Development Deployment**: Push to `development` → automatic deployment
4. **Production Release**: Manual workflow dispatch from `production` branch

## 🔄 Workflows

### 1. Development CI/CD (`development-ci.yml`)
**Trigger**: Automatic on push/PR to `development`

#### Jobs:
1. **🔍 Code Quality & Security**
   - Security scanning
   - Code quality checks
   - Dependency vulnerability scan

2. **🧪 Unit Tests** (Parallel Matrix)
   - User Service (Java/JUnit)
   - Workout Plan Service (Java/JUnit)
   - GenAI Service (Python/pytest)

3. **🔗 Integration & System Tests**
   - Docker Compose setup
   - Service health checks
   - Integration test suite (10 tests)
   - System test suite (6 tests)
   - Complete test runner (82+ scenarios)

4. **📦 Build & Package**
   - Maven builds
   - Docker image creation
   - Artifact upload

5. **🚀 Deploy to Development**
   - Automatic deployment
   - Health checks
   - Notification

#### Execution Time: ~15-20 minutes

### 2. Production CD (`production-cd.yml`)
**Trigger**: Manual workflow dispatch

#### Input Parameters:
- **Environment**: `production` or `staging`
- **Version**: Semantic version (e.g., `v1.2.3`)
- **Run Tests**: Enable/disable full test suite
- **Skip Approval**: Emergency deployment flag

#### Jobs:
1. **🔍 Pre-deployment Validation**
   - Input validation
   - Environment status check

2. **🧪 Comprehensive Testing** (Optional)
   - Full test suite execution
   - Performance benchmarks
   - Production-level health checks

3. **🔐 Security & Compliance**
   - Security scans
   - Compliance validation
   - Dependency checks

4. **🏗️ Build Production Artifacts**
   - Production builds
   - Docker image creation
   - Deployment package creation

5. **👥 Manual Approval Gate**
   - Human approval required
   - Review checklist
   - Deployment confirmation

6. **🚀 Production Deployment**
   - Deployment execution
   - Health checks
   - Smoke tests

7. **📋 Post-deployment Tasks**
   - Monitoring setup
   - Stakeholder notification
   - Deployment record

8. **🔄 Rollback Plan** (On Failure)
   - Automatic rollback
   - Incident notification

#### Execution Time: ~30-45 minutes (excluding approval time)

### 3. Pull Request Validation (`pr-validation.yml`)
**Trigger**: PR to `development` or `production`

#### Jobs:
1. **📋 PR Information & Validation**
   - PR title convention check
   - Description validation

2. **🔍 Code Quality Checks**
   - Java checkstyle
   - Python linting (flake8, black)
   - TODO/FIXME detection

3. **🔐 Security Scan**
   - Security analysis
   - Sensitive data detection

4. **🧪 Unit Tests** (Matrix)
   - All services in parallel

5. **🔗 Integration Tests** (Critical PRs)
   - Full integration suite
   - Service communication validation

6. **🏗️ Build Verification**
   - Compilation checks
   - Docker build validation

7. **📊 PR Summary**
   - Automated PR comment
   - Status overview
   - Recommendations

8. **🤖 Auto-merge** (Optional)
   - Dependabot PRs
   - Minor updates

## ⚙️ Environment Configuration

### Required Environment Variables

#### Development Environment
```bash
# Database
POSTGRES_PASSWORD=dev_password
JWT_SECRET=dev_jwt_secret_key_32_chars_min

# External Services
CHAIR_API_KEY=sk-593e77377c5c4035a73ae486bd57f6ce

# Monitoring
GRAFANA_PASSWORD=dev_grafana_password
```

#### Production Environment
```bash
# Database (Strong passwords required)
POSTGRES_PASSWORD=prod_secure_password_here
JWT_SECRET=prod_jwt_secret_key_minimum_32_characters

# External Services
CHAIR_API_KEY=sk-593e77377c5c4035a73ae486bd57f6ce

# Caching
REDIS_PASSWORD=prod_redis_password

# Monitoring
GRAFANA_PASSWORD=prod_grafana_password

# URLs
APP_BASE_URL=https://team-code-compass.com
API_BASE_URL=https://api.team-code-compass.com
```

### GitHub Secrets Setup

#### Repository Secrets
```bash
# Production Database
POSTGRES_PASSWORD
JWT_SECRET
REDIS_PASSWORD
GRAFANA_PASSWORD

# External APIs
CHAIR_API_KEY

# Notifications
SLACK_WEBHOOK_URL
SMTP_PASSWORD

# Deployment
DOCKER_REGISTRY_TOKEN
KUBE_CONFIG_DATA
```

#### Environment-Specific Secrets
- **development**: Development environment secrets
- **production**: Production environment secrets
- **production-approval**: Manual approval environment

## 🚀 Deployment Process

### Development Deployment (Automatic)

1. **Push to Development**
   ```bash
   git checkout development
   git pull origin development
   git merge feature/my-feature
   git push origin development
   ```

2. **Automatic Pipeline Execution**
   - Code quality checks
   - Full test suite (82+ scenarios)
   - Build & package
   - Deploy to development environment
   - Health checks & notification

3. **Verification**
   - Check deployment status in GitHub Actions
   - Verify services at development URLs
   - Review monitoring dashboards

### Production Deployment (Manual)

1. **Prepare Production Branch**
   ```bash
   git checkout production
   git merge development
   git push origin production
   ```

2. **Trigger Manual Deployment**
   - Go to GitHub Actions → "Production CD Pipeline"
   - Click "Run workflow"
   - Fill in parameters:
     - Environment: `production`
     - Version: `v1.2.3`
     - Run tests: `true`
     - Skip approval: `false`

3. **Review & Approve**
   - Monitor pipeline execution
   - Review test results
   - Approve deployment when ready

4. **Post-Deployment**
   - Verify production services
   - Check monitoring dashboards
   - Confirm stakeholder notifications

### Emergency Deployment

For critical hotfixes:
```bash
# Set skip_approval to true
Environment: production
Version: v1.2.4-hotfix
Run tests: true
Skip approval: true
```

## 🧪 Testing Strategy

### Test Pyramid
```
        🌐 System Tests (6 tests)
       ┌─────────────────────────┐
      🔗 Integration Tests (10 tests)
     ┌─────────────────────────────┐
    🧪 Unit Tests (66+ tests)
   ┌─────────────────────────────────┐
```

### Test Coverage
- **Unit Tests**: 66+ tests across all services
- **Integration Tests**: 10 tests for service communication
- **System Tests**: 6 end-to-end scenarios
- **Total**: 82+ test scenarios

### Test Execution
```bash
# Local testing
./run-all-tests.sh

# Individual test suites
./run-all-tests.sh --unit-only
./run-all-tests.sh --integration-only
./run-all-tests.sh --system-only
```

## 📊 Monitoring & Observability

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Health Checks**: Service availability monitoring
- **Logging**: Centralized log aggregation

### Key Metrics
- **Service Health**: Uptime, response times
- **Business Metrics**: User registrations, workout generations
- **System Metrics**: CPU, memory, database performance
- **Error Rates**: 4xx/5xx responses, exception counts

### Dashboards
- **Service Overview**: All services health status
- **User Activity**: Registration, authentication, usage patterns
- **Performance**: Response times, throughput, resource usage
- **Errors**: Error rates, exception tracking

### Alerts
- **Critical**: Service down, high error rates
- **Warning**: High response times, resource usage
- **Info**: Deployment notifications, scaling events

## 🔧 Troubleshooting

### Common Issues

#### 1. Pipeline Failures

**Unit Test Failures**
```bash
# Check test logs
gh run view <run-id> --log

# Run tests locally
cd server/user-service && ./mvnw test
cd server/workout-plan-service && ./mvnw test
cd genai && python -m pytest test_workout_worker.py -v
```

**Integration Test Failures**
```bash
# Check service logs
docker compose logs user-service
docker compose logs workout-plan-service
docker compose logs genai-workout-worker

# Restart services
docker compose down -v
docker compose up -d --build
```

**Build Failures**
```bash
# Check Maven build
cd server/user-service && ./mvnw clean compile
cd server/workout-plan-service && ./mvnw clean compile

# Check Docker build
docker compose build
```

#### 2. Deployment Issues

**Environment Variables**
```bash
# Verify secrets are set
gh secret list

# Check environment configuration
docker compose config
```

**Service Health**
```bash
# Check service endpoints
curl -f http://localhost:8081/health
curl -f http://localhost:8082/health
curl -f http://localhost:8083/health
```

**Database Connection**
```bash
# Check database connectivity
docker exec -it flexfit-postgres-prod psql -U flexfit_user -d flexfit_prod -c "SELECT 1;"
```

#### 3. Performance Issues

**Slow Tests**
```bash
# Run tests with timing
./run-all-tests.sh --verbose

# Check resource usage
docker stats
```

**High Resource Usage**
```bash
# Check container resources
docker compose top
docker system df
```

### Support & Escalation

#### 1. First Level Support
- Check pipeline logs in GitHub Actions
- Review service health endpoints
- Verify environment configuration

#### 2. Second Level Support
- Analyze monitoring dashboards
- Review application logs
- Check database performance

#### 3. Escalation
- Contact development team
- Create incident ticket
- Initiate rollback if necessary

## 📚 Additional Resources

- [Testing Documentation](TESTING.md)
- [System Overview](system_overview.md)
- [Docker Compose Reference](../docker-compose.yml)
- [Environment Configuration](../env.example)

## 🔄 Continuous Improvement

### Pipeline Optimization
- Monitor execution times
- Optimize test parallelization
- Improve caching strategies
- Enhance error reporting

### Security Enhancements
- Regular security tool updates
- Dependency vulnerability scanning
- Compliance automation
- Secret rotation

### Monitoring Improvements
- Enhanced alerting rules
- Performance baseline tracking
- Capacity planning metrics
- User experience monitoring

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team 