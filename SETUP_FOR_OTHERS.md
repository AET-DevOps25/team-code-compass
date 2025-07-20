# 🚀 Başka Geliştiriciler İçin TTS Service Kurulumu

Bu doküman, Google Cloud credentials dosyası olmayan geliştiriciler için TTS service kurulumunu açıklar.

## 📋 Ön Gereksinimler

- Docker ve Docker Compose
- Git (projeyi clone etmek için)

## 🔧 Kurulum Seçenekleri

### Seçenek 1: Environment Variable ile (En Kolay)

```bash
# 1. Projeyi clone edin
git clone <repository-url>
cd team-code-compass

# 2. .env dosyasını oluşturun
cp env.example .env

# 3. Aşağıdaki satırı .env dosyasına ekleyin:
GOOGLE_APPLICATION_CREDENTIALS_JSON=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZXNzZW50aWFsLWdyYXBoLTQ2NjQxNS1rOCIsCiAgInByaXZhdGVfa2V5X2lkIjogIjNmZjU1ZjQ4YzBjY2I2YWM5YjAwOWZmY2JkOTAxY2EwOTJkZDM1YzkiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzJPd1dPMk1GU0xSblJcbktHWnRidEpIcFlqdERSUU5rSHRtL2ZoRTRvd1VEcXFLL2kyUDlDNit2UjVnNENDMHZ2b2hYMEJrQmRjdW15VHNcbkhOMjFMYkRhd3VWQjdwMzFybVdvQVl5UnhmeHVOcDB4VTRFa1Q3emZnU0F3Uzg5SXBPTEdGOUlsSFpIZ0pZOExcbmpaRmIwWmRRc1YxWStaVzdmL3VvcnVydm9pTmFCNHlxWDBsNzJ1OWlUcE0xS0N6b2wrUTNDVEorT090dFdFSm9cbm9JNUUzR2w3bGx1ekhNRjA1VXl6Rm9Yb21hN0pxNm0wZzcrWlBwNWZaZk9GTzVXMkFuRnpvdlVpUHU3TW1ScXJcbmhDQ2FPMDZUQ0xlZUZpUG1oQnUrOWxaeWtUNmsxdlRqZ2xxZExlUk14S1NjbUZ4WGQ3bzgzdTQvLy9ZdTArU2xcbkVnc3BRYzJWQWdNQkFBRUNnZ0VBRmRPNXBZa0ZRREczd0d1UzRva0l5eko0S3FYMk5oa05ZWXpmc21jM283cTNcbi9HQlg2OEN4NHFzbUJZWXRxZ2lmK1k3K1dFZGMwQVVlNWVCMVFURExyZ0JKMDkwS3lEVWtrYWJuTHBvUGZpZGJcbmY3VFgvZXRHY21KTE4rTUtCOUpSZVZjUmJER3FXZUNWelgvMWlRUEY3ZWFPQ2FJU0tHY1FLU2hwRlRLUFY4YVFcbnRxUmxvMWFrbG1CZk5lcDBMNHVvbkkwbVFEakFSeU83SHBMd2lKSFJOeTE2eE5rKzRpVWxBR3BzTTc1dy9EUm9cbmd3KzA0bTJ5ZjRUSGN6enJwOEVIaHMvenBpTVQ3VzJaRElFdVVjNkJRWGpVdkdyTjc4bXVXNUxBK3pKQ2NBb3RcbkdMQ2lsa1lqdE02Y2JqbjZkRjJNYnJIbnVYYXZLZUpvU3hlV3pmc3ZWd0tCZ1FEdTFqYW5KNVRJRjlTVXM3ZDFcbkhmN3JycEppT2YxQnY1SFQ0VXkwQyt2cDJVUExtMllnVVpXVWVqMDI2RERQT1BMNVpMUzBSQXRTeXVka2tRRWVcbkZtYlByMVg2V21sOXJkSkhNcGUvWU1xSkk4NS81YWY5bTBOTmhLZWcvUkQ0NEtlTTdvNFhzaVlMT2lKdkt0YVFcbkpkdjNaVGNNV0ZGcU9xUXl6cmI1SXcxdkV3S0JnUUREVTNJZ21JV3Bvcm55L3JtMHdNZnFsYUxuL0Rib0tXM2tcblpUUFM0OHRCenBrWUJUQndiS09RN1luN0txZHVxRUtRMjdyQzRzeTR0YWhHbTl2dG1RSkNOb0QxajB4eWJLem5cbjFIS0RqZlNJZm5XN3huZnV2SE9ZSWRnK1RvRmdnUVdzcEhXMDBhclZVWllqMUFhZW84TUMwR2VtWmNUU2RDTkdcblJ1bzl1NnpkdHdLQmdRQ0JGYnd5T2QxYkRDNDBOTEg2RmIwNjZuNXBvb2Z6NmpOSi9pSXp5YUczSVZ0WUIyUjZcbklUNGtJckZGSk5lRW1IWVNQdERBQVdyUlU2TWVvcFNsQzF5RDhYTVp2Wlg0ZkdNRFloL01LdWNzbWZLNUE0bjVcbk10cDhZaThyZnJ1V2wrMVc2WFJZOEV0SmxDRWFUbC9yUnRzTmFtSUhSUkN6eG9BS2lka3c3RFlOaXdLQmdCbDdcbmUzb3hLODd6d2RxbnpNWitHQmJNcXRJbEgyeXVhdjNQRGpISE1pOUZxc2R0ZGVKVTZnbndVMzRIRkl6bE9ybjNcblVLZzRPb2ttZWV1c1RjYnpuVTNTR29UdXl3UnFsU3d4bFRjQWdCU0dtd21DWFFjeVlzcElNQlFBM2ZRZklRUmlcbitGQTh3bExPTUE1QWpSU0pQTm5USXBLYzJFNjBoQjJaQnRwQzc4eUZBb0dCQU11TW1VS3VsWmxkMFdZbkkranhcbk0rckVzaHpuOEtZV1h5enZpV2tram52RnY2ZVVtVWM4SkcweHAvV2Y2RmxwQ3ZUV1FoRUwzK0xYbEVtZmNXN1NcbmJySUVIOVJuQkdWclliUUpsUHdWYVdzR29UME9SOGpSOGtya1lUUFN5b0E2QkRoVDJ0UWRRZXVNeEl4TjljUEpcbmQ2RkVjeDYwN3FFZncwYjEyblQrLzcyelxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogIm5ld3R0c0Blc3NlbnRpYWwtZ3JhcGgtNDY2NDE1LWs4LmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjEwODkwNzA0NjQwMTk2NzUxMzU1MyIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvbmV3dHRzJTQwZXNzZW50aWFsLWdyYXBoLTQ2NjQxNS1rOC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=

# 4. Servisleri başlatın
docker compose up tts-service
```

### Seçenek 2: Kendi Credentials'ınızı Kullanın

```bash
# 1. Kendi Google Cloud service account JSON dosyanızı alın
# https://console.cloud.google.com/iam-admin/serviceaccounts

# 2. Dosyayı kopyalayın
cp your-credentials.json server/tts-service/google-credentials.json

# 3. Servisleri başlatın
docker compose up tts-service
```

### Seçenek 3: Google Cloud SDK ile (Gelişmiş)

```bash
# 1. Google Cloud SDK kurun
# https://cloud.google.com/sdk/docs/install

# 2. Authenticate olun
gcloud auth application-default login

# 3. Servisleri başlatın (credentials olmadan)
docker compose up tts-service
```

## 🧪 Test Etme

```bash
# Health check
curl http://localhost:8083/actuator/health

# TTS test
curl -X POST http://localhost:8083/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","languageCode":"en-US"}' \
  --output test-audio.mp3
```

## 🔒 Güvenlik Notları

- ✅ Credentials dosyaları `.gitignore`'da
- ✅ Environment variable base64 encoded
- ✅ Local file sadece development için
- ✅ Production'da Kubernetes secrets kullanın

## 🚨 Sorun Giderme

### "No credentials found" hatası
```bash
# Environment variable'ı kontrol edin
echo $GOOGLE_APPLICATION_CREDENTIALS_JSON | base64 -d | head -3

# Dosya varlığını kontrol edin
ls -la server/tts-service/google-credentials.json
```

### "Permission denied" hatası
- Service account'un Text-to-Speech API'ye erişimi olduğunu kontrol edin
- JSON dosyasının doğru formatda olduğunu kontrol edin

---

**Not**: Bu credentials paylaşılan bir development hesabıdır. Production'da kendi credentials'ınızı kullanın! 