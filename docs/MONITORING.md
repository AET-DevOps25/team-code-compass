# 📊 FlexFit Monitoring & Observability

## Overview

This document describes the monitoring and observability setup for the FlexFit application, with a focus on the TTS (Text-to-Speech) service.

## 🎯 Monitoring Components

### 1. Prometheus Metrics Collection

#### TTS Service Metrics

The TTS service exposes the following custom metrics:

**Audio Generation Metrics:**
- `tts_audio_generation_requests_total` - Total number of audio generation requests
- `tts_audio_generation_success_total` - Total number of successful audio generations
- `tts_audio_generation_errors_total` - Total number of audio generation errors
- `tts_audio_generation_duration_seconds` - Time taken for audio generation

**Voice Synthesis Metrics:**
- `tts_voice_synthesis_requests_total` - Total number of voice synthesis requests
- `tts_voice_synthesis_success_total` - Total number of successful voice synthesis
- `tts_voice_synthesis_errors_total` - Total number of voice synthesis errors
- `tts_voice_synthesis_duration_seconds` - Time taken for voice synthesis

**General Metrics:**
- `tts_available_voices_requests_total` - Total number of available voices requests
- `tts_health_check_requests_total` - Total number of health check requests

#### Standard Spring Boot Metrics

The TTS service also exposes standard Spring Boot metrics:
- HTTP request metrics
- JVM metrics (memory, GC, threads)
- Application startup metrics
- Security metrics

### 2. Prometheus Configuration

**Location:** `monitoring/prometheus.yml`

**Key Configuration:**
```yaml
# TTS Service specific metrics
- job_name: 'tts-service-metrics'
  static_configs:
    - targets: ['host.docker.internal:8083']
  metrics_path: '/actuator/prometheus'
  scrape_interval: 15s
```

### 3. Grafana Dashboards

#### TTS Service Dashboard

**Location:** `monitoring/grafana/dashboards/tts-service-dashboard.json`

**Dashboard Panels:**
1. **Service Status** - Shows if TTS service is up/down
2. **Audio Generation Requests Rate** - Requests per second
3. **Voice Synthesis Requests Rate** - Voice synthesis requests per second
4. **Available Voices Requests Rate** - Available voices requests per second
5. **Audio Generation Success Rate** - Successful generations per second
6. **Voice Synthesis Success Rate** - Successful voice synthesis per second
7. **Audio Generation Errors Rate** - Error rate for audio generation
8. **Voice Synthesis Errors Rate** - Error rate for voice synthesis
9. **Audio Generation Duration (95th percentile)** - Performance metrics
10. **Voice Synthesis Duration (95th percentile)** - Performance metrics
11. **Health Check Requests Rate** - Health check frequency
12. **Total Audio Generations** - Cumulative count
13. **Total Voice Synthesis** - Cumulative count
14. **Error Rate Percentage** - Overall error rate

#### FlexFit Services Dashboard

**Location:** `monitoring/grafana/dashboards/flexfit-services.json`

**Dashboard Panels:**
1. **Service Status** - All services up/down status
2. **HTTP Requests Rate** - Request rate for all services
3. **GenAI Requests** - GenAI service metrics
4. **Workout Generations** - Workout generation metrics

### 4. Alert Rules

**Location:** `monitoring/prometheus-alert-rules.yml`

#### TTS Service Alerts

1. **TTSServiceDown** - Critical alert when TTS service is down
2. **TTSServiceHighErrorRate** - Warning when error rate > 10%
3. **TTSServiceHighLatency** - Warning when 95th percentile latency > 10s
4. **TTSVoiceSynthesisHighLatency** - Warning when voice synthesis latency > 15s
5. **TTSServiceNoRequests** - Info alert when no requests for 10 minutes
6. **TTSServiceHighRequestRate** - Info alert when request rate > 10 req/s
7. **TTSServiceHealthCheckFailures** - Warning when health checks fail

## 🚀 Setup Instructions

### Local Development

1. **Start Monitoring Stack:**
   ```bash
   docker compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access Monitoring Tools:**
   - **Prometheus:** http://localhost:9090
   - **Grafana:** http://localhost:3000 (admin/admin)

3. **Import Dashboards:**
   - Import `monitoring/grafana/dashboards/tts-service-dashboard.json`
   - Import `monitoring/grafana/dashboards/flexfit-services.json`

### Production Deployment

1. **Kubernetes Deployment:**
   ```bash
   kubectl apply -f k8s/monitoring-namespace.yaml
   kubectl apply -f k8s/alert-rules.yaml
   kubectl apply -f k8s/grafana-dashboards.yaml
   ```

2. **Helm Deployment:**
   ```bash
   helm install flexfit-monitoring ./helm/flexfit -f ./helm/flexfit/values-tum.yaml
   ```

## 📈 Key Metrics to Monitor

### Performance Metrics
- **Response Time:** 95th percentile should be < 10 seconds
- **Throughput:** Audio generation requests per second
- **Error Rate:** Should be < 5%

### Business Metrics
- **Audio Generation Success Rate:** Should be > 95%
- **Voice Synthesis Success Rate:** Should be > 95%
- **Service Uptime:** Should be > 99.9%

### Resource Metrics
- **Memory Usage:** JVM heap usage
- **CPU Usage:** Process CPU utilization
- **Disk Usage:** Available disk space

## 🔧 Troubleshooting

### Common Issues

1. **Metrics Not Appearing:**
   - Check if TTS service is running: `curl http://localhost:8083/actuator/health`
   - Verify Prometheus configuration: `curl http://localhost:9090/api/v1/targets`
   - Check service logs: `docker logs flexfit-tts-service`

2. **High Error Rates:**
   - Check Google Cloud credentials
   - Verify network connectivity
   - Review application logs

3. **High Latency:**
   - Check Google Cloud TTS API response times
   - Monitor system resources
   - Review concurrent request handling

### Debug Commands

```bash
# Check TTS service metrics
curl http://localhost:8083/actuator/prometheus | grep tts_

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana datasources
curl http://localhost:3000/api/datasources

# View service logs
docker logs flexfit-tts-service -f
```

## 📊 Dashboard Screenshots

### TTS Service Dashboard
- Service status indicators
- Request rate graphs
- Error rate monitoring
- Performance metrics
- Resource utilization

### FlexFit Services Dashboard
- All services overview
- Cross-service metrics
- System health status

## 🔄 Continuous Monitoring

### Automated Alerts
- Email notifications for critical alerts
- Slack/Teams integration for warnings
- PagerDuty integration for on-call

### Regular Health Checks
- Automated dashboard checks
- Metric validation
- Alert rule testing

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Micrometer Metrics](https://micrometer.io/docs)

## 🤝 Contributing

To add new metrics or modify existing ones:

1. Update `TtsMetrics.java` with new metrics
2. Add metrics collection in controllers
3. Update Prometheus configuration if needed
4. Add corresponding Grafana panels
5. Create alert rules for new metrics
6. Update this documentation

## 📞 Support

For monitoring issues:
1. Check the troubleshooting section above
2. Review service logs
3. Verify configuration files
4. Contact the development team 