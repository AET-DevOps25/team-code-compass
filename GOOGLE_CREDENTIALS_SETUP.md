# 🔐 Google Cloud TTS Credentials Setup

This document explains the Google Cloud Text-to-Speech (TTS) service credentials setup for the FlexFit project.

## 📋 Requirements

- Google Cloud account
- Text-to-Speech API enabled
- Service Account JSON file

## 🚀 Quick Setup

### 1. Automatic Setup (Recommended)

```bash
# 1. Copy your Google Cloud service account JSON file to this location:
cp your-credentials.json server/tts-service/google-credentials.json

# 2. Run the setup script:
./setup-credentials.sh
```

### 2. Manual Setup

#### Option A: Environment Variable (Recommended for Production)

```bash
# 1. Base64 encode the JSON file
cat your-credentials.json | base64 -w 0

# 2. Add to .env file
echo "GOOGLE_APPLICATION_CREDENTIALS_JSON=your_encoded_string_here" >> .env
```

#### Option B: Local File (For Development)

```bash
# 1. Copy the JSON file to the TTS service directory
cp your-credentials.json server/tts-service/google-credentials.json
```

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Base64 encoded JSON | `eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...` |
| `GOOGLE_APPLICATION_CREDENTIALS_PATH` | Local file path | `/app/google-credentials.json` |

### Docker Compose Configuration

```yaml
tts-service:
  environment:
    - GOOGLE_APPLICATION_CREDENTIALS_JSON=${GOOGLE_APPLICATION_CREDENTIALS_JSON}
    - GOOGLE_APPLICATION_CREDENTIALS_PATH=${GOOGLE_APPLICATION_CREDENTIALS_PATH:/app/google-credentials.json}
  volumes:
    - ./server/tts-service/google-credentials.json:/app/google-credentials.json:ro
```

### Kubernetes Configuration

```yaml
# Create secret
kubectl create secret generic flexfit-google-credentials \
  --from-literal=credentials.json="$GOOGLE_CREDENTIALS" \
  --namespace flexfit

# Usage in deployment
env:
  - name: GOOGLE_APPLICATION_CREDENTIALS_JSON
    valueFrom:
      secretKeyRef:
        name: flexfit-google-credentials
        key: credentials.json
```

## 🔒 Security

### .gitignore Configuration

The following files are automatically added to .gitignore:

```
# Google Cloud credentials
essential-graph-466415-k8-3ff55f48c0cc.json
google-credentials.json
google-service-account.json
*.json
!package.json
!tsconfig.json
# ... other necessary JSON files
```

### GitHub Secrets

Add to GitHub repository secrets for production deployment:

1. **GOOGLE_CREDENTIALS**: Base64 encoded service account JSON
2. **CHAIR_API_KEY**: GenAI API key
3. **AWS_ACCESS_KEY_ID**: AWS credentials
4. **AWS_SECRET_ACCESS_KEY**: AWS credentials

## 🧪 Testing

### Local Test

```bash
# 1. Start services
docker compose up tts-service

# 2. Health check
curl http://localhost:8083/actuator/health

# 3. TTS test
curl -X POST http://localhost:8083/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","languageCode":"en-US","voiceName":"en-US-Neural2-F"}'
```

### Kubernetes Test

```bash
# 1. Check pod status
kubectl get pods -n flexfit -l app.kubernetes.io/component=tts-service

# 2. Check logs
kubectl logs -n flexfit -l app.kubernetes.io/component=tts-service

# 3. Test service endpoint
kubectl port-forward -n flexfit svc/flexfit-tts-service 8083:8083
```

## 🚨 Troubleshooting

### Common Errors

1. **"No credentials found"**
   - Check that the JSON file is in the correct location
   - Check that the environment variable is set correctly

2. **"Permission denied"**
   - Check that the service account has access to Text-to-Speech API
   - Check that the JSON file is in the correct format

3. **"Invalid credentials"**
   - Check that the JSON file is valid
   - Check that the service account is active

### Debug Commands

```bash
# Check environment variable
echo $GOOGLE_APPLICATION_CREDENTIALS_JSON | base64 -d

# Check JSON file existence
ls -la server/tts-service/google-credentials.json

# Check TTS service logs
docker compose logs tts-service
```

## 📚 Additional Resources

- [Google Cloud Text-to-Speech API](https://cloud.google.com/text-to-speech)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/service-accounts)
- [Spring Boot Google Cloud](https://spring.io/projects/spring-cloud-gcp)

## 🤝 Contributing

To update this document:

1. Make changes
2. Test them
3. Create a pull request

---

**Note**: These credentials files should never be committed to version control! 