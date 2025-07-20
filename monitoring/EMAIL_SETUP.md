# Email Alerts Setup Guide

## 🚀 Quick Setup for Testing

### 1. Gmail App Password Setup

Since the alerts are configured to send from `hakanduranyt@gmail.com`, you need to set up a Gmail App Password:

1. **Enable 2-Factor Authentication**
   - Go to Google Account → Security
   - Turn on 2-Step Verification

2. **Generate App Password**
   - Google Account → Security → App passwords
   - Select "Mail" and generate password
   - Copy the 16-character password

3. **Update Alertmanager Configuration**
   - Edit `monitoring/alertmanager/alertmanager.yml`
   - Replace `your_app_password_here` with your actual App Password:
   
   ```yaml
   global:
     smtp_smarthost: 'smtp.gmail.com:587'
     smtp_from: 'hakanduranyt@gmail.com'
     smtp_auth_username: 'hakanduranyt@gmail.com'
     smtp_auth_password: 'abcd efgh ijkl mnop'  # Your 16-character app password
     smtp_require_tls: true
   ```

## 📧 Static Configuration

All alerts are currently configured to send to `hakanduranyt@gmail.com`. This is perfect for testing!

## 🧪 Testing Email Alerts

### 1. Start the monitoring stack:

```bash
docker compose up -d
```

### 2. Wait for services to start (30-60 seconds), then test:

```bash
# Check if Alertmanager is running
curl http://localhost:9093/-/healthy

# Send a test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "TestEmailAlert",
      "severity": "warning",
      "job": "test"
    },
    "annotations": {
      "summary": "Testing email configuration",
      "description": "This is a test alert to verify email notifications are working"
    }
  }]'
```

### 3. Check your email inbox for the test alert!

## 🔍 Troubleshooting

### Email not received?

1. **Check Alertmanager logs**:
   ```bash
   docker logs flexfit-alertmanager
   ```

2. **Check Alertmanager configuration**:
   ```bash
   curl http://localhost:9093/api/v1/config
   ```

### Common Issues:

- **Gmail**: Make sure you're using an App Password, not your regular password
- **2FA Required**: Most email providers require 2-factor authentication for app passwords
- **Corporate Email**: May require different SMTP settings or VPN
- **Firewall**: Check if port 587 is blocked

## 📝 That's It!

Since we're using static configuration, you only need to:
1. ✅ Enable 2FA on `hakanduranyt@gmail.com`
2. ✅ Generate an App Password 
3. ✅ Update the password in `monitoring/alertmanager/alertmanager.yml`

## 🚀 Ready to Test!

Once your App Password is set in `monitoring/alertmanager/alertmanager.yml`:

```bash
# Start everything including monitoring
docker compose up -d

# Wait 30-60 seconds for services to start, then test:
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "EmailTest",
      "severity": "critical", 
      "job": "test"
    },
    "annotations": {
      "summary": "Critical test alert for FlexFit monitoring",
      "description": "If you receive this email, your monitoring alerts are working perfectly!"
    }
  }]'
```

Check `hakanduranyt@gmail.com` inbox - you should receive a nicely formatted HTML email! 📧✨

## 🔄 Making it Configurable Later

Once you understand how it works, we can easily make it configurable with environment variables for different environments (dev/staging/prod). 