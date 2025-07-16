#!/bin/bash
# Deploy FlexFit to AWS using Terraform and Ansible

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="../terraform"
ANSIBLE_DIR="../ansible"
IMAGE_TAG="${IMAGE_TAG:-feature-ci-cd-ghcr-integration}"

echo -e "${GREEN}🚀 FlexFit AWS Deployment Script${NC}"
echo "================================="

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not found. Please install terraform.${NC}"
    exit 1
fi

if ! command -v ansible-playbook &> /dev/null; then
    echo -e "${RED}❌ Ansible not found. Please install ansible.${NC}"
    exit 1
fi

# Step 1: Terraform
echo -e "${GREEN}Step 1: Provisioning infrastructure with Terraform${NC}"
cd "$TERRAFORM_DIR"

# Check for terraform.tfvars
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}❌ terraform.tfvars not found. Please copy terraform.tfvars.example and fill in your values.${NC}"
    exit 1
fi

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Plan Terraform changes
echo "Planning infrastructure changes..."
terraform plan

# Apply Terraform changes
echo -e "${YELLOW}Do you want to apply these changes? (yes/no)${NC}"
read -r response
if [[ "$response" == "yes" ]]; then
    terraform apply -auto-approve
else
    echo "Terraform apply cancelled."
    exit 1
fi

# Get outputs
EC2_PUBLIC_IP=$(terraform output -raw public_ip)
DB_ENDPOINT=$(terraform output -raw db_endpoint | cut -d: -f1)

echo -e "${GREEN}✅ Infrastructure provisioned successfully!${NC}"
echo "EC2 Public IP: $EC2_PUBLIC_IP"

# Step 2: Wait for EC2 instance to be ready
echo -e "${GREEN}Step 2: Waiting for EC2 instance to be ready...${NC}"
sleep 30

# Step 3: Ansible deployment
echo -e "${GREEN}Step 3: Deploying application with Ansible${NC}"
cd "../ansible"

# Create temporary inventory
cat > inventory.ini <<EOF
[flexfit]
flexfit-server ansible_host=$EC2_PUBLIC_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/flexfit-key.pem

[flexfit:vars]
ansible_python_interpreter=/usr/bin/python3
EOF

# Get values from terraform.tfvars
DB_PASSWORD=$(grep db_password ../terraform/terraform.tfvars | cut -d'"' -f2)
CHAIR_API_KEY=$(grep api_key ../terraform/terraform.tfvars | cut -d'"' -f2)

# Run Ansible playbook
echo "Running Ansible playbook..."
ansible-playbook -i inventory.ini playbook.yml \
    -e "db_host=$DB_ENDPOINT" \
    -e "db_name=flexfit" \
    -e "db_user=flexfit" \
    -e "db_password=$DB_PASSWORD" \
    -e "chair_api_key=$CHAIR_API_KEY" \
    -e "image_tag=$IMAGE_TAG" \
    -e "ansible_host=$EC2_PUBLIC_IP"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$EC2_PUBLIC_IP"
echo "   API: http://$EC2_PUBLIC_IP/api"
echo "   Eureka: http://$EC2_PUBLIC_IP/eureka"
echo ""
echo "📝 SSH Access:"
echo "   ssh -i ~/.ssh/flexfit-key.pem ubuntu@$EC2_PUBLIC_IP"
echo ""
echo "🔧 Useful commands:"
echo "   Check status: ssh -i ~/.ssh/flexfit-key.pem ubuntu@$EC2_PUBLIC_IP 'cd /opt/flexfit && docker-compose ps'"
echo "   View logs: ssh -i ~/.ssh/flexfit-key.pem ubuntu@$EC2_PUBLIC_IP 'cd /opt/flexfit && docker-compose logs -f'"
echo "   Restart: ssh -i ~/.ssh/flexfit-key.pem ubuntu@$EC2_PUBLIC_IP 'sudo systemctl restart flexfit'"