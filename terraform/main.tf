terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "flexfit-terraform-state"
    key    = "flexfit/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

variable "image_tag" {
  description = "Docker image tag"
  default     = "latest"
}

variable "db_password" {
  description = "Database password"
  sensitive   = true
}

variable "api_key" {
  description = "Chair API key for GenAI"
  sensitive   = true
}

# VPC
resource "aws_vpc" "flexfit" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "flexfit-vpc-${var.environment}"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "flexfit" {
  vpc_id = aws_vpc.flexfit.id

  tags = {
    Name        = "flexfit-igw-${var.environment}"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.flexfit.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "flexfit-public-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.flexfit.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.flexfit.id
  }

  tags = {
    Name        = "flexfit-public-rt"
    Environment = var.environment
  }
}

# Route Table Association
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "flexfit" {
  name        = "flexfit-sg-${var.environment}"
  description = "Security group for FlexFit application"
  vpc_id      = aws_vpc.flexfit.id

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "flexfit-sg-${var.environment}"
    Environment = var.environment
  }
}

# RDS Database
resource "aws_db_subnet_group" "flexfit" {
  name       = "flexfit-db-subnet-group"
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name        = "flexfit-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "flexfit" {
  identifier     = "flexfit-db-${var.environment}"
  engine         = "postgres"
  engine_version = "13"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "flexfit"
  username = "flexfit"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.flexfit.id]
  db_subnet_group_name   = aws_db_subnet_group.flexfit.name
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = {
    Name        = "flexfit-db-${var.environment}"
    Environment = var.environment
  }
}

# EC2 Instance
resource "aws_instance" "flexfit" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.medium"
  
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.flexfit.id]
  associate_public_ip_address = true
  
  key_name = aws_key_pair.flexfit.key_name
  
  user_data = templatefile("${path.module}/user_data.sh", {
    db_host     = aws_db_instance.flexfit.address
    db_password = var.db_password
    api_key     = var.api_key
    image_tag   = var.image_tag
  })
  
  tags = {
    Name        = "flexfit-app-${var.environment}"
    Environment = var.environment
  }
}

# Key Pair
resource "aws_key_pair" "flexfit" {
  key_name   = "flexfit-key-${var.environment}"
  public_key = file("~/.ssh/id_rsa.pub")
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Outputs
output "app_url" {
  value = "http://${aws_instance.flexfit.public_ip}"
}

output "db_endpoint" {
  value     = aws_db_instance.flexfit.endpoint
  sensitive = true
}