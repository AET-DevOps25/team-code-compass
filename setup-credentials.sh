#!/bin/bash

# =============================================================================
# TEAM CODE COMPASS - GOOGLE CLOUD CREDENTIALS SETUP
# =============================================================================

set -e

echo "🔐 Setting up Google Cloud TTS Credentials..."
echo ""

# Check if credentials file exists
if [ ! -f "server/tts-service/google-credentials.json" ]; then
    echo "❌ Error: Google Cloud credentials file not found!"
    echo ""
    echo "Please place your Google Cloud service account JSON file in:"
    echo "  server/tts-service/google-credentials.json"
    echo ""
    echo "You can download it from Google Cloud Console:"
    echo "  https://console.cloud.google.com/iam-admin/serviceaccounts"
    echo ""
    exit 1
fi

echo "✅ Found credentials file: server/tts-service/google-credentials.json"
echo ""

# Option 1: Set up environment variable (base64 encoded)
echo "📝 Setting up environment variable (base64 encoded)..."
ENCODED_CREDS=$(base64 -w 0 < server/tts-service/google-credentials.json)

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from env.example..."
    cp env.example .env
fi

# Add or update the credentials in .env
if grep -q "GOOGLE_APPLICATION_CREDENTIALS_JSON" .env; then
    echo "🔄 Updating existing GOOGLE_APPLICATION_CREDENTIALS_JSON in .env..."
    sed -i "s/GOOGLE_APPLICATION_CREDENTIALS_JSON=.*/GOOGLE_APPLICATION_CREDENTIALS_JSON=$ENCODED_CREDS/" .env
else
    echo "➕ Adding GOOGLE_APPLICATION_CREDENTIALS_JSON to .env..."
    echo "GOOGLE_APPLICATION_CREDENTIALS_JSON=$ENCODED_CREDS" >> .env
fi

echo ""
echo "✅ Google Cloud TTS credentials configured successfully!"
echo ""
echo "📋 Summary:"
echo "  - Credentials file: server/tts-service/google-credentials.json"
echo "  - Environment variable: GOOGLE_APPLICATION_CREDENTIALS_JSON (base64 encoded)"
echo "  - Docker will use the environment variable"
echo "  - Local development will use the file directly"
echo ""
echo "🚀 You can now run the application with:"
echo "  docker compose up"
echo "" 