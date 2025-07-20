# Email Alerts Setup Guide

## 🤔 **Which Email Should I Use?**

You have **3 options** for setting up email alerts:

### **Option 1: Your Personal Gmail (Recommended for testing) 📧**
- **FROM**: Your personal Gmail sends the alerts
- **TO**: Your personal Gmail receives the alerts
- **Why**: Easy to test, you control everything

### **Option 2: Current Setup (Already configured) ✅**
- **FROM**: `hakanduranyt@gmail.com` sends alerts
- **TO**: `hakanduranyt@gmail.com` receives alerts  
- **Why**: Works immediately for testing

### **Option 3: Dedicated FlexFit Gmail (Best for production) 🏢**
- **FROM**: `flexfit.alerts@gmail.com` sends alerts
- **TO**: Your personal email receives alerts
- **Why**: Professional, separate from personal accounts

## 🚀 **Quick Setup Steps**

### 1. **Choose Your Email Setup**

**For YOUR Gmail (Option 1):**
```bash
# Copy env.example to .env
cp env.example .env

# Edit .env with your email:
ALERT_EMAIL_FROM=your.email@gmail.com
ALERT_EMAIL_TO=your.email@gmail.com  
ALERT_EMAIL_USERNAME=your.email@gmail.com
ALERT_EMAIL_PASSWORD=your_gmail_app_password_here
```

**For Current Setup (Option 2):**
```bash
# Just copy the example - it's already configured!
cp env.example .env
# You'll still need to set the App Password below
```

### 2. **Get Gmail App Password**

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Turn on 2-Step Verification

2. **Generate App Password**
   - Google Account → Security → App passwords
   - Select "Mail" and generate password
   - Copy the 16-character password (like: `abcd efgh ijkl mnop`)

3. **Update .env file**
   ```bash
   # Replace this line in your .env:
   ALERT_EMAIL_PASSWORD=your_gmail_app_password_here
   # With your actual app password:
   ALERT_EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

### 3. **Add to GitHub Secrets (For CI/CD)**

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
ALERT_EMAIL_FROM=your.email@gmail.com
ALERT_EMAIL_TO=your.email@gmail.com
ALERT_EMAIL_USERNAME=your.email@gmail.com
ALERT_EMAIL_PASSWORD=your_gmail_app_password
SMTP_HOST=smtp.gmail.com:587
```

## 🧪 **Test Your Setup**

### 1. Start the monitoring stack:
```bash
docker compose up -d
```

### 2. Wait 30-60 seconds, then send test alert:
```bash
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "EmailTest",
      "severity": "critical",
      "job": "test"
    },
    "annotations": {
      "summary": "🧪 Testing FlexFit email alerts",
      "description": "If you receive this email, your monitoring system is working perfectly!"
    }
  }]'
```

### 3. Check your email inbox! 📧

You should receive a **beautiful HTML email** with:
- 🚨 Critical alert styling
- 📊 Formatted alert details
- ⏰ Timestamp information

## 🎯 **Alert Testing Scripts**

We've created **3 different test scripts** to make testing alerts super easy:

### **1. 🚀 Quick One-Liner Test**
```bash
./scripts/quick-alert-test.sh
```
- **Perfect for**: Quick verification that alerts work
- **Sends**: Single critical test alert
- **Time**: 5 seconds

### **2. 📧 Basic Email Test**
```bash
./monitoring/test-email-alert.sh
```
- **Perfect for**: Testing both critical and warning alert styling
- **Sends**: Critical + Warning test alerts
- **Features**: Shows current active alerts, logs checking

### **3. 🎮 Interactive Test Suite**
```bash
./scripts/test-alerts.sh
```
- **Perfect for**: Comprehensive testing and demonstrations
- **Features**: Interactive menu with multiple scenarios

#### **Interactive Menu Options:**
1. **Quick Email Test** - Critical + Warning alerts
2. **Service Down Alerts** - Simulate service outages
3. **Performance Alerts** - High CPU, memory, latency alerts
4. **Database Alerts** - DB connection, slow queries, disk space
5. **All Real-World Scenarios** - Comprehensive test suite
6. **View Current Alerts** - See what's currently active
7. **Clear All Test Alerts** - Clean up test alerts
8. **Check Alertmanager Config** - Verify configuration

### **Sample Alert Scenarios:**

#### **🔴 Critical Alerts (Red styling):**
- Service Down
- Database Connection Lost  
- Disk Space Critical (>95%)
- Memory Usage Critical (>90%)

#### **⚠️ Warning Alerts (Orange styling):**
- High Response Time (>2s)
- High CPU Usage (>80%)
- SSL Certificate Expiring
- Database Slow Queries

### **Test Script Usage Examples:**

```bash
# Start monitoring stack
docker compose up -d

# Wait for services to start (30-60 seconds)
sleep 60

# Option 1: Quick test
./scripts/quick-alert-test.sh

# Option 2: Comprehensive test with menu
./scripts/test-alerts.sh
# Choose option 1 for quick email test
# Choose option 5 for all scenarios

# Option 3: Original test script
./monitoring/test-email-alert.sh
```

### **What You'll Receive:**

**Critical Alert Email:**
- 🚨 **Red header** with "CRITICAL ALERT"
- **HTML table** with alert details
- **Action Required** message
- **Professional formatting**

**Warning Alert Email:**
- ⚠️ **Orange header** with "WARNING ALERT"
- **HTML table** with alert details
- **Note to review** message
- **Clean professional styling**

## 🔍 **Troubleshooting**

### Email not received?

1. **Check Alertmanager logs**:
   ```bash
   docker logs flexfit-alertmanager
   ```

2. **Common Issues**:
   - ❌ Using regular Gmail password → ✅ Use App Password
   - ❌ 2FA not enabled → ✅ Enable 2-Factor Authentication
   - ❌ Wrong email in .env → ✅ Double-check email addresses
   - ❌ Firewall blocking port 587 → ✅ Check network settings

### 3. **Verify Configuration**:
   ```bash
   # Check if Alertmanager loaded your config
   curl http://localhost:9093/api/v1/config
   ```

### 4. **Check Active Alerts**:
   ```bash
   # View current alerts
   curl http://localhost:9093/api/v1/alerts
   
   # Or use the test script
   ./scripts/test-alerts.sh
   # Choose option 6: "View Current Alerts"
   ```

### 5. **Test Connectivity**:
   ```bash
   # Check if Alertmanager is running
   curl http://localhost:9093/-/healthy
   
   # Check if Prometheus is running
   curl http://localhost:9090/-/healthy
   ```

## 📝 **Summary**

✅ **For Testing**: Use your personal Gmail (Option 1)  
✅ **For Production**: Create dedicated FlexFit Gmail (Option 3)  
✅ **Add to**: Both `.env` file AND GitHub Secrets  
✅ **Remember**: Use Gmail App Password, not regular password!

## 🎯 **What Emails Do What?**

- **`ALERT_EMAIL_FROM`** = WHO sends the email (the sender)
- **`ALERT_EMAIL_TO`** = WHO receives the email (you!)
- **`ALERT_EMAIL_USERNAME`** = Gmail login (same as FROM)
- **`ALERT_EMAIL_PASSWORD`** = Gmail App Password (NOT your regular password!)

## 🚀 **Quick Start Checklist**

- [ ] Set up Gmail 2FA
- [ ] Generate Gmail App Password
- [ ] Update `.env` with your email settings
- [ ] Start monitoring: `docker compose up -d`
- [ ] Test alerts: `./scripts/quick-alert-test.sh`
- [ ] Check your email inbox! 📧
- [ ] Add secrets to GitHub for CI/CD

Once setup, you'll get **beautiful email notifications** whenever your FlexFit system has issues! 🚀 