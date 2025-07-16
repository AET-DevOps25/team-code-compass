# AWS Deployment Guide

This guide explains how to deploy FlexFit to AWS using Terraform and Ansible.

## Prerequisites

1. **AWS Academy Account** or AWS credentials configured
2. **Terraform** installed: https://www.terraform.io/downloads
3. **Ansible** installed: `pip install ansible`
4. **SSH Key Pair** for EC2 access

## Directory Structure

```
├── terraform/          # Infrastructure as Code
│   ├── main.tf        # AWS resources definition
│   ├── user_data.sh   # EC2 initialization script
│   └── terraform.tfvars.example
├── ansible/           # Configuration management
│   ├── playbook.yml   # Main deployment playbook
│   ├── inventory.ini  # Server inventory
│   └── templates/     # Configuration templates
└── scripts/
    └── deploy-aws.sh  # Automated deployment script
```

## Setup Instructions

### 1. Configure Terraform Variables

```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region   = "us-east-1"
environment  = "production"
image_tag    = "feature-ci-cd-ghcr-integration"
db_password  = "your_secure_password"
api_key      = "sk-bb7ebe4b651845929b8594afb0aa11b1"
```

### 2. Create SSH Key Pair

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/flexfit-key
```

### 3. Deploy Infrastructure

#### Option A: Automated Deployment
```bash
cd scripts/
./deploy-aws.sh
```

#### Option B: Manual Deployment

##### Step 1: Provision with Terraform
```bash
cd terraform/
terraform init
terraform plan
terraform apply
```

##### Step 2: Deploy with Ansible
```bash
cd ansible/
# Update inventory.ini with EC2 public IP
ansible-playbook -i inventory.ini playbook.yml \
  -e "db_host=<RDS_ENDPOINT>" \
  -e "db_password=<DB_PASSWORD>" \
  -e "chair_api_key=<API_KEY>" \
  -e "image_tag=feature-ci-cd-ghcr-integration"
```

## Architecture

### AWS Resources Created

1. **VPC** with public subnets
2. **EC2 Instance** (t3.medium) running Ubuntu
3. **RDS PostgreSQL** database
4. **Security Groups** for network access
5. **Elastic IP** for stable public address

### Application Stack

- **Nginx**: Reverse proxy on port 80
- **Docker Compose**: Container orchestration
- **Services**:
  - Service Registry (Eureka) - 8761
  - API Gateway - 8080
  - User Service
  - Workout Plan Service
  - GenAI Worker
  - Frontend - 3000

## Access Points

After deployment:
- **Frontend**: http://<EC2_PUBLIC_IP>
- **API**: http://<EC2_PUBLIC_IP>/api
- **Eureka Dashboard**: http://<EC2_PUBLIC_IP>/eureka

## Maintenance

### Update Application
```bash
# Set new image tag
export IMAGE_TAG=new-tag

# Run Ansible playbook
ansible-playbook -i inventory.ini playbook.yml -e "image_tag=$IMAGE_TAG"
```

### SSH Access
```bash
ssh -i ~/.ssh/flexfit-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### View Logs
```bash
ssh -i ~/.ssh/flexfit-key.pem ubuntu@<EC2_PUBLIC_IP> \
  'cd /opt/flexfit && docker-compose logs -f'
```

### Restart Services
```bash
ssh -i ~/.ssh/flexfit-key.pem ubuntu@<EC2_PUBLIC_IP> \
  'sudo systemctl restart flexfit'
```

## Cleanup

To destroy all AWS resources:
```bash
cd terraform/
terraform destroy
```

## Cost Optimization

- Use `terraform destroy` when not in use
- Consider using smaller instance types for development
- Enable RDS auto-pause for development environments
- Use AWS Academy credits if available

## Troubleshooting

### Cannot connect to EC2
- Check security group allows your IP
- Verify SSH key permissions: `chmod 600 ~/.ssh/flexfit-key.pem`

### Services not starting
- Check Docker logs: `docker-compose logs`
- Verify environment variables in `.env`
- Ensure RDS is accessible from EC2

### Database connection issues
- Check RDS security group
- Verify database credentials
- Ensure RDS is in the same VPC