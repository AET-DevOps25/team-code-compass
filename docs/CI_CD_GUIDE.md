# 🚀 FlexFit CI/CD Pipeline Guide

Complete guide for triggering, monitoring, and troubleshooting the FlexFit CI/CD pipeline.

## 📋 Table of Contents

- [🎯 Pipeline Overview](#-pipeline-overview)
- [🔄 Automatic Triggers](#-automatic-triggers)
- [🎮 Manual Triggers](#-manual-triggers)
- [🔍 Verification & Monitoring](#-verification--monitoring)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🔐 Secrets Management](#-secrets-management)

---

## 🎯 Pipeline Overview

FlexFit uses **GitHub Actions** for CI/CD with automatic deployment to Kubernetes.

### **Pipeline Stages:**
```
┌─────────────┬─────────────┬────────────────┬──────────────┐
│ Branch Type │ Unit Tests  │ Integration    │ Deploy       │
├─────────────┼─────────────┼────────────────┼──────────────┤
│ Feature/*   │ ✅ Always   │ ✅ Always      │ ❌ Skip      │
│ Pull Request│ ✅ Always   │ ✅ Always      │ ❌ Skip      │
│ Development │ ✅ Always   │ ✅ Always      │ ✅ Auto-Dev  │
│ Main        │ ✅ Always   │ ✅ Always      │ ✅ Auto-Prod │
└─────────────┴─────────────┴────────────────┴──────────────┘
```

### **Environment Mapping:**
| Branch | Image Tag | Namespace | Environment |
|--------|-----------|-----------|-------------|
| `development` | `:latest` | `team-code-compass-development` | Development |
| `main` | `:main` | `team-code-compass-production` | Production |

---

## 🔄 Automatic Triggers

The CI/CD pipeline **automatically runs** when you push to specific branches.

### **✅ Automatic Deployment Triggers:**

#### **1. Development Deployment:**
```bash
# Any push to development branch triggers:
# → Unit Tests → Integration Tests → Build Images → Deploy to Development

git checkout development
git merge feature/your-feature
git push origin development

# Result: Automatic deployment to team-code-compass-development
```

#### **2. Production Deployment:**
```bash
# Any push to main branch triggers:
# → Unit Tests → Integration Tests → Build Images → Deploy to Production

git checkout main  
git merge development
git push origin main

# Result: Automatic deployment to team-code-compass-production
```

#### **3. Feature Branch Testing:**
```bash
# Push to feature/* or pull request triggers:
# → Unit Tests → Integration Tests (no deployment)

git checkout -b feature/new-feature
git push origin feature/new-feature

# Result: Tests run, but no deployment (safe for testing)
```

---

## 🎮 Manual Triggers

You can manually trigger the CI/CD pipeline through GitHub Actions.

### **🖱️ GitHub Actions Manual Trigger:**

1. **Go to GitHub Repository**
2. **Click "Actions" tab**
3. **Select "🚀 FlexFit CI/CD Pipeline"**
4. **Click "Run workflow"**
5. **Choose options:**
   ```
   Branch: development/main/feature-branch
   Test level: unit-only/integration-only/quick/full
   ```
6. **Click "Run workflow"**

### **⚡ Manual Trigger Options:**

```yaml
# Test Level Options:
unit-only:        # Run only unit tests (fastest)
integration-only: # Run only integration tests  
quick:           # Skip some non-critical tests
full:            # Run complete test suite (default)
```

### **🖥️ Local Manual Deployment:**

```bash
# Deploy to development manually
IMAGE_TAG=latest ./scripts/deploy.sh

# Deploy to production manually  
IMAGE_TAG=main ./scripts/deploy.sh production

# Deploy specific version to any environment
IMAGE_TAG=v1.0.0 ./scripts/deploy.sh development
```

---

## 🔍 Verification & Monitoring

How to check if your CI/CD pipeline worked successfully.

### **📊 GitHub Actions Status:**

#### **1. Check Pipeline Status:**
- **Go to**: `https://github.com/your-org/team-code-compass/actions`
- **Look for**: ✅ Green checkmark (success) or ❌ Red X (failure)
- **Click workflow** to see detailed logs

#### **2. Pipeline Stages to Monitor:**
```
🔧 Setup & Validation     → Should complete in ~1 min
🧪 Unit Tests            → Should complete in ~3 mins  
🔗 Integration Tests     → Should complete in ~5 mins
🐳 Build & Push to GHCR  → Should complete in ~8 mins
🚀 Deploy to Kubernetes  → Should complete in ~10 mins
📊 Pipeline Summary      → Final results
```

### **☸️ Kubernetes Verification:**

#### **1. Check Pod Status:**
```bash
# Development environment
kubectl get pods -n team-code-compass-development

# Production environment  
kubectl get pods -n team-code-compass-production

# Look for: All pods showing "1/1 Running"
```

#### **2. Check Deployment Timestamps:**
```bash
# Check when deployments were last updated
kubectl get deployments -n team-code-compass-development -o wide

# Look for: READY column showing desired replicas
```

#### **3. Verify Service Health:**
```bash
# Check if services are accessible
kubectl get services -n team-code-compass-development

# Test frontend accessibility
curl -I https://ge85zat-devops25.student.k8s.aet.cit.tum.de
```

### **🐳 Docker Image Verification:**

#### **Check GHCR Images:**
```bash
# List recent images
docker images | grep ghcr.io/aet-devops25/team-code-compass

# Pull specific image to verify it exists
docker pull ghcr.io/aet-devops25/team-code-compass/frontend:latest
```

---

## 🛠️ Troubleshooting

Common issues and how to resolve them.

### **❌ Common CI/CD Failures:**

#### **1. Missing GitHub Secrets:**
```
Error: ❌ Missing required secrets. Please configure:
  - TUM_ID
  - CHAIR_API_KEY  
  - POSTGRES_PASSWORD
  - GRAFANA_ADMIN_PASSWORD
```

**Solution:**
- Go to **GitHub → Settings → Secrets and Variables → Actions**
- Add missing secrets

#### **2. Kubernetes Deployment Timeout:**
```
Error: deployment "frontend" exceeded its progress deadline
```

**Solution:**
```bash
# Check pod events
kubectl describe pod frontend-xxx -n team-code-compass-development

# Common fixes:
# - Image pull issues → Check GHCR image exists
# - Resource limits → Check cluster resources
# - Health check failures → Check service logs
```

#### **3. Test Failures:**
```
Error: Unit tests failed in user-service
```

**Solution:**
```bash
# Run tests locally first
cd server/user-service
./mvnw test

# Fix failing tests, then push again
```

### **🔧 Debug Commands:**

```bash
# Check GitHub Actions logs
# → Go to GitHub Actions tab, click failed job

# Check Kubernetes events
kubectl get events -n team-code-compass-development --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs deployment/frontend -n team-code-compass-development

# Check service health
kubectl port-forward svc/frontend 3000:3000 -n team-code-compass-development
curl http://localhost:3000
```

### **🔄 Recovery Steps:**

#### **If CI/CD Fails:**
1. **Check GitHub Actions logs** for specific error
2. **Fix the issue** in code
3. **Push to same branch** → CI/CD will retry automatically

#### **If Deployment Fails:**
1. **Check Kubernetes status**: `kubectl get pods -n namespace`
2. **Review pod logs**: `kubectl logs pod-name -n namespace`
3. **Redeploy manually**: `./scripts/deploy.sh`

---

## 🔐 Secrets Management

Required secrets for CI/CD pipeline to work.

### **📋 Required GitHub Secrets:**

| Secret Name | Purpose | Example Value |
|-------------|---------|---------------|
| `TUM_ID` | Your TUM student ID | `ge85zat` |
| `CHAIR_API_KEY` | OpenAI API key for GenAI | `sk-abc123...` |
| `POSTGRES_PASSWORD` | Database password | `SecurePassword2025!` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | `GrafanaAdmin2025!` |

### **🔧 How to Add Secrets:**

1. **Go to GitHub Repository**
2. **Settings → Secrets and Variables → Actions**
3. **Click "New repository secret"**
4. **Add each secret with name and value**

### **🛡️ Security Best Practices:**

```bash
# Use strong passwords for production
POSTGRES_PASSWORD=FlexFit_DB_Prod_2025_X9#mK8!
GRAFANA_ADMIN_PASSWORD=Grafana_Admin_2025_P9@wR5$

# Rotate secrets regularly (recommended every 3 months)
# Never commit secrets to git
# Use different passwords for different environments
```

---

## 🎯 Quick Reference

### **🚀 Deploy Development:**
```bash
# Automatic (recommended)
git push origin development

# Manual
./scripts/deploy.sh
```

### **🏭 Deploy Production:**
```bash
# Automatic (recommended)  
git push origin main

# Manual
IMAGE_TAG=main ./scripts/deploy.sh production
```

### **🔍 Check Status:**
```bash
# GitHub Actions
https://github.com/your-org/team-code-compass/actions

# Kubernetes
kubectl get pods -n team-code-compass-development
kubectl get pods -n team-code-compass-production

# Frontend
https://ge85zat-devops25.student.k8s.aet.cit.tum.de
```

### **🛠️ Debug Issues:**
```bash
# Check logs
kubectl logs deployment/service-name -n namespace

# Check events  
kubectl get events -n namespace

# Redeploy manually
./scripts/deploy.sh
```

---

<div align="center">

**🚀 FlexFit CI/CD Pipeline - Automated Excellence! 🎯**

*For issues or questions, check the [troubleshooting section](#️-troubleshooting) above.*

</div> 