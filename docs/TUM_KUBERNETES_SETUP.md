# TUM Kubernetes Cluster Setup Guide

## 🎯 **Overview**
This guide shows how to deploy FlexFit to the **TUM Student Kubernetes Cluster** using the same process described in W05.

## 📋 **Prerequisites**
- TUM ID (e.g., `ge85zat`)
- Access to TUM VPN/network
- GitHub repository with CI/CD setup

## 🚀 **Step 1: Access TUM Rancher**

1. **Open Rancher**: https://rancher.ase.cit.tum.de
2. **Login** with your TUM ID credentials  
3. **Access** the Student Cluster

## 🔑 **Step 2: Download Kubeconfig**

1. In Rancher, **download** the `student.yaml` kubeconfig file
2. **Save** it securely (this gives access to the TUM cluster)

## 🏗️ **Step 3: Create Your Namespace**

1. Go to **Projects/Namespaces** in Rancher
2. **Create Namespace**: `<your-tum-id>-devops25`
   - Example: `ge85zat-devops25`
3. This will be your **team's deployment space**

## 📦 **Step 4: Add to GitHub Secrets**

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

```
TUM_KUBECONFIG          = <content of student.yaml file>
TUM_NAMESPACE           = <your-tum-id>-devops25  
TUM_INGRESS_HOST        = <your-tum-id>-devops25.student.k8s.aet.cit.tum.de
```

## 🔧 **Step 5: Update CI/CD Pipeline**

The pipeline should:
1. ✅ **Build & Push** Docker images to GHCR
2. ✅ **Deploy to TUM** Kubernetes using Helm
3. ✅ **Use your namespace** for isolation

## 🌐 **Step 6: Access Your Application**

After deployment:
- **URL**: `https://<your-tum-id>-devops25.student.k8s.aet.cit.tum.de`
- **Monitoring**: Check pods in Rancher dashboard
- **Logs**: Use `kubectl logs` or Rancher UI

## 📊 **Points Breakdown**
- ✅ **CI Pipeline** (8 points): Build, test, Docker images ✅
- ✅ **CD Pipeline** (6 points): Auto-deploy to Kubernetes ✅  
- ✅ **TUM Infrastructure**: Works on Rancher cluster ✅

## 🛠️ **Local Testing**
```bash
# Test with your local kubectl
export KUBECONFIG=student.yaml
kubectl config current-context  # Should return "student"
kubectl get namespaces | grep <your-tum-id>

# Deploy locally to test
helm upgrade --install flexfit helm/flexfit/ \
  --namespace <your-tum-id>-devops25 \
  -f helm/flexfit/values-tum-production.yaml
```

## 🔍 **Troubleshooting**
- **Access denied**: Check VPN connection to TUM
- **Namespace not found**: Create namespace in Rancher first  
- **Image pull errors**: Verify GHCR images are public/accessible
- **Ingress issues**: Check TUM_INGRESS_HOST matches your namespace 