# Simplified Terraform configuration for AWS Academy
# This version uses local PostgreSQL instead of RDS to reduce costs

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "key_name" {
  description = "AWS Academy key pair name"
  default     = "labsuser"
}

# Security Group
resource "aws_security_group" "flexfit" {
  name        = "flexfit-sg"
  description = "Security group for FlexFit application"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8761
    to_port     = 8761
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Instance
resource "aws_instance" "flexfit" {
  # Using specific AMI ID to avoid lookup issues
  ami           = "ami-0e2c8caa4b6378d8c" # Ubuntu 22.04 LTS in us-east-1
  instance_type = "t3.medium"
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.flexfit.id]

  root_block_device {
    volume_size = 30
  }

  user_data = file("${path.module}/user_data_simple.sh")

  tags = {
    Name = "flexfit-server"
  }
}

output "public_ip" {
  value = aws_instance.flexfit.public_ip
}

output "ssh_command" {
  value = "ssh -i ~/Downloads/labsuser.pem ubuntu@${aws_instance.flexfit.public_ip}"
}