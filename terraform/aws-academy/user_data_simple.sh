#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install nginx
apt-get install -y nginx git

# Configure nginx
cat > /etc/nginx/sites-available/default <<'EOF'
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /eureka {
        proxy_pass http://localhost:8761;
        proxy_set_header Host $host;
    }
}
EOF

systemctl restart nginx

# Create app directory
mkdir -p /home/ubuntu/flexfit
cd /home/ubuntu/flexfit

# Create environment file
cat > .env <<EOF
POSTGRES_DB=user_service_db
POSTGRES_USER=flexfit
POSTGRES_PASSWORD=flexfit_local
CHAIR_API_KEY=sk-bb7ebe4b651845929b8594afb0aa11b1
MODEL_NAME=llama3.3:latest
IMAGE_TAG=feature-ci-cd-ghcr-integration
EOF

# Create docker-compose.yml with local PostgreSQL
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=user_service_db
      - POSTGRES_USER=flexfit
      - POSTGRES_PASSWORD=flexfit_local
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  service-registry:
    image: ghcr.io/aet-devops25/team-code-compass/service-registry:feature-ci-cd-ghcr-integration
    ports:
      - "8761:8761"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
    restart: unless-stopped

  api-gateway:
    image: ghcr.io/aet-devops25/team-code-compass/api-gateway:feature-ci-cd-ghcr-integration
    ports:
      - "8080:8000"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka/
    depends_on:
      - service-registry
    restart: unless-stopped

  user-service:
    image: ghcr.io/aet-devops25/team-code-compass/user-service:feature-ci-cd-ghcr-integration
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/user_service_db
      - SPRING_DATASOURCE_USERNAME=flexfit
      - SPRING_DATASOURCE_PASSWORD=flexfit_local
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka/
    depends_on:
      - postgres
      - service-registry
    restart: unless-stopped

  workout-plan-service:
    image: ghcr.io/aet-devops25/team-code-compass/workout-plan-service:feature-ci-cd-ghcr-integration
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/user_service_db
      - SPRING_DATASOURCE_USERNAME=flexfit
      - SPRING_DATASOURCE_PASSWORD=flexfit_local
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka/
    depends_on:
      - postgres
      - service-registry
    restart: unless-stopped

  genai-worker:
    image: ghcr.io/aet-devops25/team-code-compass/genai-worker:feature-ci-cd-ghcr-integration
    environment:
      - CHAIR_API_KEY=sk-bb7ebe4b651845929b8594afb0aa11b1
      - MODEL_NAME=llama3.3:latest
      - OPEN_WEBUI_BASE_URL=https://gpu.aet.cit.tum.de
    restart: unless-stopped

  frontend:
    image: ghcr.io/aet-devops25/team-code-compass/frontend:feature-ci-cd-ghcr-integration
    ports:
      - "3000:80"
    depends_on:
      - api-gateway
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Change ownership
chown -R ubuntu:ubuntu /home/ubuntu/flexfit

# Start services
cd /home/ubuntu/flexfit
sudo -u ubuntu docker-compose pull
sudo -u ubuntu docker-compose up -d

echo "FlexFit deployment completed!"