#!/bin/sh

# Start script for Alertmanager with environment variable substitution
echo "🚀 Starting Alertmanager with environment variable substitution..."

# Check if envsubst is available
if ! command -v envsubst > /dev/null 2>&1; then
    echo "Installing envsubst..."
    apk add --no-cache gettext
fi

# Set default values if not provided
export SMTP_HOST=${SMTP_HOST:-smtp.gmail.com:587}
export ALERT_EMAIL_FROM=${ALERT_EMAIL_FROM:-hakanduranyt@gmail.com}
export ALERT_EMAIL_TO=${ALERT_EMAIL_TO:-hakanduranyt@gmail.com}
export ALERT_EMAIL_USERNAME=${ALERT_EMAIL_USERNAME:-hakanduranyt@gmail.com}
export ALERT_EMAIL_PASSWORD=${ALERT_EMAIL_PASSWORD:-your_gmail_app_password_here}

echo "📧 Email configuration:"
echo "  SMTP Host: $SMTP_HOST"
echo "  From: $ALERT_EMAIL_FROM"
echo "  To: $ALERT_EMAIL_TO"
echo "  Username: $ALERT_EMAIL_USERNAME"

# Create processed config file
echo "🔄 Processing alertmanager.yml with environment variables..."
envsubst < /etc/alertmanager/alertmanager.yml > /tmp/alertmanager.yml

echo "✅ Starting Alertmanager..."
exec /bin/alertmanager \
    --config.file=/tmp/alertmanager.yml \
    --storage.path=/alertmanager \
    --web.external-url=http://localhost:9093 \
    "$@" 