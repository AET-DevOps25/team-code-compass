# AWS Academy Deployment Guide

Simplified deployment for AWS Academy Learner Lab.

## Quick Start

### 1. Start AWS Academy Lab
- Log into AWS Academy
- Start your Learner Lab
- Wait for lab to be ready (green dot)

### 2. Access AWS Console
- Click "AWS" to open console
- Navigate to EC2 service

### 3. Deploy with Terraform

```bash
# Clone repository
git clone https://github.com/AET-DevOps25/team-code-compass.git
cd team-code-compass/terraform/aws-academy

# Initialize Terraform
terraform init

# Deploy (uses default vockey)
terraform apply
```

### 4. Access Application

After ~5 minutes:
- Frontend: `http://<PUBLIC_IP>`
- Eureka: `http://<PUBLIC_IP>/eureka`

Get the public IP:
```bash
terraform output public_ip
```

### 5. SSH Access (Optional)

Download the labsuser.pem from AWS Academy:
```bash
# In AWS Console: EC2 > Key Pairs > Download labsuser.pem
chmod 600 ~/Downloads/labsuser.pem
ssh -i ~/Downloads/labsuser.pem ubuntu@<PUBLIC_IP>
```

## What Gets Deployed

- 1 EC2 instance (t3.medium)
- Local PostgreSQL database
- All FlexFit microservices
- Nginx reverse proxy

## Cost: ~$0.10/hour (covered by AWS Academy credits)

## Cleanup

**Important**: Always destroy resources when done!
```bash
terraform destroy
```

## Troubleshooting

### Services not ready
Wait 5-10 minutes for all services to start. Check status:
```bash
ssh -i ~/Downloads/labsuser.pem ubuntu@<PUBLIC_IP> \
  'cd /home/ubuntu/flexfit && docker-compose ps'
```

### View logs
```bash
ssh -i ~/Downloads/labsuser.pem ubuntu@<PUBLIC_IP> \
  'cd /home/ubuntu/flexfit && docker-compose logs -f'
```