#!/bin/bash
set -e

# Update system
apt-get update
apt-get install -y docker.io git

# Start Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose V2
curl -L "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone repository
cd /opt
git clone https://github.com/AET-DevOps25/team-code-compass.git
cd team-code-compass

# Create environment file
cat > .env <<EOF
# Database
POSTGRES_HOST=${db_host}
POSTGRES_DB=flexfit
POSTGRES_USER=flexfit
POSTGRES_PASSWORD=${db_password}

# GenAI
CHAIR_API_KEY=${api_key}
OPEN_WEBUI_BASE_URL=https://gpu.aet.cit.tum.de
MODEL_NAME=llama3.3:latest

# API URL
NEXT_PUBLIC_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080
EOF

# Update docker-compose.yml to use RDS
sed -i 's/db:/# db:/' docker-compose.yml
sed -i 's/image: postgres:13/# image: postgres:13/' docker-compose.yml

# Update database URLs
find . -name "*.yml" -o -name "*.yaml" -o -name "*.properties" | xargs sed -i "s/db:5432/${db_host}:5432/g"

# Pull images with specific tag
export IMAGE_TAG=${image_tag}
docker compose pull

# Start services
docker compose up -d

# Setup nginx as reverse proxy
apt-get install -y nginx

cat > /etc/nginx/sites-available/flexfit <<'NGINX'
server {
    listen 80;
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
}
NGINX

ln -sf /etc/nginx/sites-available/flexfit /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx