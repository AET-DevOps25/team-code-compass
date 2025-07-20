#!/bin/bash

# FlexFit Kubernetes Deployment Script
# Usage: ./scripts/deploy.sh [development|production]
# Auto-detects environment based on IMAGE_TAG if no parameter provided

set -e

ENVIRONMENT=${1}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 FlexFit Kubernetes Deployment${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "Please copy env.example to .env and fill in your values:"
    echo -e "${YELLOW}cp env.example .env${NC}"
    exit 1
fi

# Load environment variables
echo -e "${GREEN}📋 Loading environment variables...${NC}"
set -a
source .env
set +a

# Validate required variables
required_vars=("TUM_ID" "CHAIR_API_KEY" "POSTGRES_PASSWORD" "GRAFANA_ADMIN_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in .env file${NC}"
        exit 1
    fi
done

# Set default IMAGE_TAG if not provided
IMAGE_TAG=${IMAGE_TAG:-latest}

# Auto-detect environment if not specified
if [ -z "$ENVIRONMENT" ]; then
    if [ "$IMAGE_TAG" = "main" ] || [ "$IMAGE_TAG" = "production" ]; then
        ENVIRONMENT="production"
        echo -e "${YELLOW}🤖 Auto-detected: IMAGE_TAG=$IMAGE_TAG → PRODUCTION environment${NC}"
    else
        ENVIRONMENT="development"
        echo -e "${YELLOW}🤖 Auto-detected: IMAGE_TAG=$IMAGE_TAG → DEVELOPMENT environment${NC}"
    fi
else
    echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC} (manually specified)"
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"
echo -e "TUM_ID: ${TUM_ID}"
echo -e "IMAGE_TAG: ${IMAGE_TAG}"

# Change to helm directory
cd helm/flexfit

# Determine values file and namespace
if [ "$ENVIRONMENT" = "production" ]; then
    VALUES_FILE="values-tum-production.yaml"
    NAMESPACE="team-code-compass-production"
    echo -e "${YELLOW}🏭 Deploying to PRODUCTION${NC}"
    echo -e "Namespace: ${NAMESPACE}"
    echo -e "Values file: ${VALUES_FILE}"
else
    VALUES_FILE="values-tum.yaml"
    NAMESPACE="team-code-compass-development"
    echo -e "${YELLOW}🧪 Deploying to DEVELOPMENT${NC}"
    echo -e "Namespace: ${NAMESPACE}"
    echo -e "Values file: ${VALUES_FILE}"
fi

echo -e "${GREEN}🔄 Substituting environment variables and deploying...${NC}"

# Deploy using envsubst to substitute variables
envsubst < "$VALUES_FILE" | helm upgrade --install flexfit . \
    --namespace "$NAMESPACE" \
    --create-namespace \
    -f -

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}📊 Check deployment status:${NC}"
echo -e "${YELLOW}kubectl get pods -n $NAMESPACE${NC}" 