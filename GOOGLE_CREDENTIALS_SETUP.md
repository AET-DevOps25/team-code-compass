# 🔐 Google Cloud TTS Credentials Setup

Bu doküman, FlexFit projesinde Google Cloud Text-to-Speech (TTS) servisi için credentials kurulumunu açıklar.

## 📋 Gereksinimler

- Google Cloud hesabı
- Text-to-Speech API etkinleştirilmiş
- Service Account JSON dosyası

## 🚀 Hızlı Kurulum

### 1. Otomatik Kurulum (Önerilen)

```bash
# 1. Google Cloud service account JSON dosyanızı şu konuma kopyalayın:
cp your-credentials.json server/tts-service/google-credentials.json

# 2. Setup script'ini çalıştırın:
./setup-credentials.sh
```

### 2. Manuel Kurulum

#### Seçenek A: Environment Variable (Production için önerilen)

```bash
# 1. JSON dosyasını base64 encode edin
cat your-credentials.json | base64 -w 0

# 2. .env dosyasına ekleyin
echo "GOOGLE_APPLICATION_CREDENTIALS_JSON=your_encoded_string_here" >> .env
```

#### Seçenek B: Local File (Development için)

```bash
# 1. JSON dosyasını TTS service dizinine kopyalayın
cp your-credentials.json server/tts-service/google-credentials.json
```

## 🔧 Konfigürasyon Detayları

### Environment Variables

| Variable | Açıklama | Örnek |
|----------|----------|-------|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Base64 encoded JSON | `eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...` |
| `GOOGLE_APPLICATION_CREDENTIALS_PATH` | Local file path | `/app/google-credentials.json` |

### Docker Compose Konfigürasyonu

```yaml
tts-service:
  environment:
    - GOOGLE_APPLICATION_CREDENTIALS_JSON=${GOOGLE_APPLICATION_CREDENTIALS_JSON}
    - GOOGLE_APPLICATION_CREDENTIALS_PATH=${GOOGLE_APPLICATION_CREDENTIALS_PATH:/app/google-credentials.json}
  volumes:
    - ./server/tts-service/google-credentials.json:/app/google-credentials.json:ro
```

### Kubernetes Konfigürasyonu

```yaml
# Secret oluşturma
kubectl create secret generic flexfit-google-credentials \
  --from-literal=credentials.json="$GOOGLE_CREDENTIALS" \
  --namespace flexfit

# Deployment'da kullanım
env:
  - name: GOOGLE_APPLICATION_CREDENTIALS_JSON
    valueFrom:
      secretKeyRef:
        name: flexfit-google-credentials
        key: credentials.json
```

## 🔒 Güvenlik

### .gitignore Konfigürasyonu

Aşağıdaki dosyalar otomatik olarak .gitignore'a eklenmiştir:

```
# Google Cloud credentials
essential-graph-466415-k8-3ff55f48c0cc.json
google-credentials.json
google-service-account.json
*.json
!package.json
!tsconfig.json
# ... diğer gerekli JSON dosyaları
```

### GitHub Secrets

Production deployment için GitHub repository secrets'a ekleyin:

1. **GOOGLE_CREDENTIALS**: Base64 encoded service account JSON
2. **CHAIR_API_KEY**: GenAI API key
3. **AWS_ACCESS_KEY_ID**: AWS credentials
4. **AWS_SECRET_ACCESS_KEY**: AWS credentials

## 🧪 Test Etme

### Local Test

```bash
# 1. Servisleri başlatın
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
# 1. Pod durumunu kontrol edin
kubectl get pods -n flexfit -l app.kubernetes.io/component=tts-service

# 2. Logları kontrol edin
kubectl logs -n flexfit -l app.kubernetes.io/component=tts-service

# 3. Service endpoint'ini test edin
kubectl port-forward -n flexfit svc/flexfit-tts-service 8083:8083
```

## 🚨 Sorun Giderme

### Yaygın Hatalar

1. **"No credentials found"**
   - JSON dosyasının doğru konumda olduğunu kontrol edin
   - Environment variable'ın doğru set edildiğini kontrol edin

2. **"Permission denied"**
   - Service account'un Text-to-Speech API'ye erişimi olduğunu kontrol edin
   - JSON dosyasının doğru formatda olduğunu kontrol edin

3. **"Invalid credentials"**
   - JSON dosyasının geçerli olduğunu kontrol edin
   - Service account'un aktif olduğunu kontrol edin

### Debug Komutları

```bash
# Environment variable'ı kontrol edin
echo $GOOGLE_APPLICATION_CREDENTIALS_JSON | base64 -d

# JSON dosyasının varlığını kontrol edin
ls -la server/tts-service/google-credentials.json

# TTS service loglarını kontrol edin
docker compose logs tts-service
```

## 📚 Ek Kaynaklar

- [Google Cloud Text-to-Speech API](https://cloud.google.com/text-to-speech)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/service-accounts)
- [Spring Boot Google Cloud](https://spring.io/projects/spring-cloud-gcp)

## 🤝 Katkıda Bulunma

Bu dokümanı güncellemek için:

1. Değişiklikleri yapın
2. Test edin
3. Pull request oluşturun

---

**Not**: Bu credentials dosyaları asla version control'e commit edilmemelidir! 