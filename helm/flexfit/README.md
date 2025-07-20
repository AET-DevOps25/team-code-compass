# FlexFit Helm Chart

This Helm chart deploys the FlexFit microservices application to Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- kubectl configured to connect to your cluster
- GitHub Container Registry images built and pushed

## Installation

### TUM Student Cluster

1. Download the kubeconfig from Rancher: https://rancher.ase.cit.tum.de
2. Create your namespace:
   ```bash
   kubectl create namespace <tumid>-devops25
   ```
3. Update `values.yaml` with your TUM ID:
   ```yaml
   tumid: <your-tumid>
   ```
4. Install the chart:
   ```bash
   helm install flexfit . --namespace <tumid>-devops25
   ```

### Local/Other Clusters

1. Create namespace:
   ```bash
   kubectl create namespace flexfit
   ```
2. Install the chart:
   ```bash
   helm install flexfit . --namespace flexfit \
     --set chairApiKey=<your-api-key>
   ```

## Configuration

### Required Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `tumid` | Your TUM ID (for student cluster) | `""` |
| `chairApiKey` | API key for Chair OpenWebUI | `""` |

### Service Configuration

Each service can be configured with:
- `image.repository`: Docker image repository
- `image.tag`: Docker image tag  
- `replicaCount`: Number of replicas
- `resources`: CPU/memory requests and limits
- `env`: Additional environment variables

### Ingress

The ingress is configured to use nginx and cert-manager:
- Host: `<tumid>-devops25.student.k8s.aet.cit.tum.de`
- TLS: Enabled with Let's Encrypt

## Accessing the Application

Once deployed, access the application at:
- https://<tumid>-devops25.student.k8s.aet.cit.tum.de

## Troubleshooting

### Check pod status:
```bash
kubectl get pods -n <namespace>
```

### Check logs:
```bash
kubectl logs -n <namespace> <pod-name>
```

### Check ingress:
```bash
kubectl get ingress -n <namespace>
```

## Uninstalling

```bash
helm uninstall flexfit -n <namespace>
```