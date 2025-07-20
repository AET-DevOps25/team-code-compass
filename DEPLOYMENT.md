# 🚀 FlexFit Deployment Guide

## 📋 Overview

This document describes the CI/CD pipeline and deployment process for the FlexFit application, including the TTS (Text-to-Speech) service.

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and includes:

1. **Setup & Validation** - Determines what tests to run based on branch/event
2. **Unit Tests** - Java and Python unit tests
3. **Integration Tests** - Service integration tests with PostgreSQL
4. **System Tests** - End-to-end system tests
5. **Build & Push to GHCR** - Docker image building and pushing to GitHub Container Registry
6. **Build & Package** - Creating deployment artifacts
7. **Deploy to Kubernetes** - Automatic deployment to EKS cluster
8. **Summary** - Pipeline results summary

### TTS Service Integration

The TTS service is now fully integrated into the CI/CD pipeline:

- ✅ **Docker Image Building** - TTS service image built and pushed to GHCR
- ✅ **Kubernetes Deployment** - TTS service deployed to EKS cluster
- ✅ **Health Checks** - Automated health monitoring
- ✅ **Secrets Management** - Google Cloud credentials handled securely

## 🐳 Docker Images

### Image Registry

All images are pushed to **GitHub Container Registry (GHCR)**:

```
ghcr.io/aet-devops25/team-code-compass/
├── service-registry:latest
├── api-gateway:latest
├── user-service:latest
├── workout-plan-service:latest
├── tts-service:latest          # ✅ NEW
├── genai-worker:latest
└── frontend:latest
```

### TTS Service Image

The TTS service image includes:
- Spring Boot application with TTS functionality
- Google Cloud TTS integration
- Spring Security configuration
- Health check endpoints
- Service discovery (Eureka client)

## ☸️ Kubernetes Deployment

### Helm Chart Structure

```
helm/flexfit/
├── Chart.yaml
├── values.yaml
├── values-tum.yaml
├── templates/
│   ├── tts-service-deployment.yaml    # ✅ NEW
│   ├── tts-service-service.yaml       # ✅ NEW
│   ├── google-credentials-secret.yaml # ✅ NEW
│   └── ... (other services)
```

### TTS Service Configuration

#### Deployment (`tts-service-deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flexfit-tts-service
spec:
  replicas: 1
  containers:
    - name: tts-service
      image: ghcr.io/aet-devops25/team-code-compass/tts-service:latest
      ports:
        - containerPort: 8083
      env:
        - name: SPRING_PROFILES_ACTIVE
          value: "docker"
        - name: EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE
          value: "http://flexfit-service-registry:8761/eureka"
        - name: GOOGLE_APPLICATION_CREDENTIALS
          value: "/app/google-credentials.json"
      volumeMounts:
        - name: google-credentials
          mountPath: /app/google-credentials.json
          subPath: google-credentials.json
      livenessProbe:
        httpGet:
          path: /actuator/health
          port: 8083
      readinessProbe:
        httpGet:
          path: /actuator/health
          port: 8083
```

#### Service (`tts-service-service.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: flexfit-tts-service
spec:
  type: ClusterIP
  ports:
    - port: 8083
      targetPort: 8083
      protocol: TCP
  selector:
    app.kubernetes.io/component: tts-service
```

#### Google Credentials Secret (`google-credentials-secret.yaml`)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: flexfit-google-credentials
type: Opaque
data:
  google-credentials.json: <base64-encoded-credentials>
```

### Values Configuration

```yaml
# TTS Service
ttsService:
  enabled: true
  image:
    repository: ghcr.io/aet-devops25/team-code-compass/tts-service
    tag: latest
    pullPolicy: Always
  replicaCount: 1
  service:
    type: ClusterIP
    port: 8083
  resources:
    limits:
      cpu: 500m
      memory: 768Mi
    requests:
      cpu: 250m
      memory: 512Mi

# Google Cloud Credentials
googleCredentials: ""  # Set via --set or values file (base64 encoded)
```

## 🏗️ Infrastructure (Terraform)

### EKS Cluster

The EKS cluster is defined in `terraform/eks.tf`:

```hcl
# EKS Cluster
resource "aws_eks_cluster" "flexfit" {
  name     = "flexfit-cluster-${var.environment}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"
  
  vpc_config {
    subnet_ids              = aws_subnet.public[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
  }
}

# EKS Node Group
resource "aws_eks_node_group" "flexfit" {
  cluster_name    = aws_eks_cluster.flexfit.name
  node_group_name = "flexfit-node-group"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.public[*].id
  version         = "1.28"
  
  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }
  
  instance_types = ["t3.medium"]
}
```

## 🔐 Secrets Management

### Required Secrets

The following secrets must be configured in GitHub repository settings:

1. **AWS_ACCESS_KEY_ID** - AWS access key for EKS deployment
2. **AWS_SECRET_ACCESS_KEY** - AWS secret key for EKS deployment
3. **GOOGLE_CREDENTIALS** - Base64 encoded Google Cloud service account JSON
4. **CHAIR_API_KEY** - Chair API key for GenAI worker
5. **GITHUB_TOKEN** - GitHub token for GHCR access

### Setting Up Secrets

```bash
# Google Cloud credentials (base64 encode)
cat google-service-account.json | base64 -w 0

# Add to GitHub repository secrets:
# Settings > Secrets and variables > Actions > New repository secret
```

## 🚀 Deployment Process

### Automatic Deployment

1. **Push to main branch** triggers the CI/CD pipeline
2. **Tests run** - Unit, integration, and system tests
3. **Images built** - All services including TTS service
4. **Images pushed** - To GitHub Container Registry
5. **Kubernetes deployment** - Automatic deployment to EKS cluster
6. **Health checks** - Verify all services are running

### Manual Deployment

```bash
# Deploy to Kubernetes manually
helm upgrade --install flexfit ./helm/flexfit \
  --namespace flexfit \
  --set googleCredentials="$GOOGLE_CREDENTIALS" \
  --set chairApiKey="$CHAIR_API_KEY" \
  --set global.imageTag="latest" \
  --wait --timeout=10m
```

### Infrastructure Setup

```bash
# Initialize Terraform
cd terraform
terraform init

# Plan deployment
terraform plan -var="db_password=your_password" -var="api_key=your_api_key"

# Apply infrastructure
terraform apply -var="db_password=your_password" -var="api_key=your_api_key"
```

## 📊 Monitoring

### Health Checks

- **TTS Service**: `http://tts-service:8083/actuator/health`
- **API Gateway**: `http://api-gateway:8000/actuator/health`
- **Service Registry**: `http://service-registry:8761/actuator/health`

### Logs

```bash
# View TTS service logs
kubectl logs -f deployment/flexfit-tts-service -n flexfit

# View all service logs
kubectl logs -f -l app.kubernetes.io/name=flexfit -n flexfit
```

### Service Status

```bash
# Check all services
kubectl get pods -n flexfit

# Check services
kubectl get services -n flexfit

# Check deployments
kubectl get deployments -n flexfit
```

## 🔧 Troubleshooting

### Common Issues

1. **Image Pull Errors**
   ```bash
   kubectl describe pod <pod-name> -n flexfit
   # Check for image pull errors
   ```

2. **Google Credentials Issues**
   ```bash
   kubectl get secret flexfit-google-credentials -n flexfit -o yaml
   # Verify secret exists and is properly formatted
   ```

3. **Service Discovery Issues**
   ```bash
   kubectl logs deployment/flexfit-service-registry -n flexfit
   # Check Eureka service registry logs
   ```

4. **TTS Service Health Issues**
   ```bash
   kubectl exec -it deployment/flexfit-tts-service -n flexfit -- curl localhost:8083/actuator/health
   # Check TTS service health directly
   ```

### Debugging Commands

```bash
# Get detailed pod information
kubectl describe pod <pod-name> -n flexfit

# Check events
kubectl get events -n flexfit --sort-by='.lastTimestamp'

# Port forward for local testing
kubectl port-forward service/flexfit-tts-service 8083:8083 -n flexfit
```

## 📈 Scaling

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: flexfit-tts-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: flexfit-tts-service
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🔄 Rollback

### Helm Rollback

```bash
# List releases
helm list -n flexfit

# Rollback to previous version
helm rollback flexfit 1 -n flexfit

# Rollback to specific version
helm rollback flexfit <revision> -n flexfit
```

### Emergency Rollback

```bash
# Delete deployment
kubectl delete deployment flexfit-tts-service -n flexfit

# Recreate from previous image
kubectl apply -f helm/flexfit/templates/tts-service-deployment.yaml
```

## 📝 Summary

The TTS service is now fully integrated into the CI/CD pipeline with:

- ✅ **Automated Docker image building and pushing**
- ✅ **Kubernetes deployment via Helm**
- ✅ **Health monitoring and probes**
- ✅ **Secrets management for Google Cloud credentials**
- ✅ **Service discovery integration**
- ✅ **Rollback capabilities**
- ✅ **Comprehensive monitoring and logging**

The deployment process is fully automated and will trigger on every push to the main branch, ensuring continuous delivery of the FlexFit application including the TTS service. 