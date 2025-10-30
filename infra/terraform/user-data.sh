#!/bin/bash
set -e

# Variables from Terraform
AWS_REGION="${aws_region}"
SECRET_NAME="${secret_name}"
DOCKERHUB_USERNAME="${dockerhub_username}"

# Log output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script..."

# Update system
echo "Updating system packages..."
yum update -y

# Ensure SSH and EC2 Instance Connect (for console-based SSH) are installed and running
echo "Ensuring sshd and ec2-instance-connect are installed..."
yum install -y openssh-server ec2-instance-connect || true
systemctl enable sshd || true
systemctl start sshd || true

# Install Docker
echo "Installing Docker..."
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install AWS CLI v2
echo "Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install jq for JSON parsing
echo "Installing jq..."
yum install -y jq

# Create app directory
echo "Creating application directory..."
mkdir -p /opt/frontend-app
cd /opt/frontend-app

# Retrieve secrets from Secrets Manager
echo "Retrieving secrets from Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text)

# Parse secrets
export AUTH_BASE_URL=$(echo $SECRET_JSON | jq -r '.AUTH_BASE_URL')
export DOCUMENTS_BASE_URL=$(echo $SECRET_JSON | jq -r '.DOCUMENTS_BASE_URL')
export JWT_SECRET=$(echo $SECRET_JSON | jq -r '.JWT_SECRET')
export NODE_ENV=$(echo $SECRET_JSON | jq -r '.NODE_ENV')

echo "Secrets retrieved successfully"

# Create nginx.conf
echo "Creating nginx configuration..."
cat > nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        least_conn;
        server app1:3000 max_fails=3 fail_timeout=30s;
        server app2:3000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_next_upstream error timeout http_502 http_503 http_504;
        }
    }
}
EOF

# Create docker-compose.yml
echo "Creating docker-compose configuration..."
cat > docker-compose.yml <<EOF
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app1
      - app2
    restart: unless-stopped

  app1:
    image: $DOCKERHUB_USERNAME/frontend-app:latest
    environment:
      - AUTH_BASE_URL=$AUTH_BASE_URL
      - DOCUMENTS_BASE_URL=$DOCUMENTS_BASE_URL
      - JWT_SECRET=$JWT_SECRET
      - NODE_ENV=$NODE_ENV
    expose:
      - "3000"
    restart: unless-stopped

  app2:
    image: $DOCKERHUB_USERNAME/frontend-app:latest
    environment:
      - AUTH_BASE_URL=$AUTH_BASE_URL
      - DOCUMENTS_BASE_URL=$DOCUMENTS_BASE_URL
      - JWT_SECRET=$JWT_SECRET
      - NODE_ENV=$NODE_ENV
    expose:
      - "3000"
    restart: unless-stopped
EOF

# Pull images and start containers
echo "Pulling Docker images..."
docker-compose pull

echo "Starting containers..."
docker-compose up -d

# Setup log rotation
echo "Configuring log rotation..."
cat > /etc/logrotate.d/docker-compose <<EOF
/opt/frontend-app/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF

echo "Frontend application deployed successfully!"
echo "Application should be accessible on port 80"

# Display container status
docker-compose ps
