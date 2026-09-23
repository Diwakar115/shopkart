building e-commerce web-app
# ShopKart

ShopKart is an end-to-end e-commerce DevOps project built using AWS, Terraform,
Docker, Kubernetes, CI/CD, monitoring, and security best practices.

## Project Goals

- Build and deploy an e-commerce application
- Manage AWS infrastructure using Terraform
- Containerize applications using Docker
- Deploy workloads on Kubernetes / Amazon EKS
- Implement CI/CD using GitHub Actions and Jenkins
- Store container images in Amazon ECR
- Implement application monitoring using Prometheus and Grafana
- Use Amazon CloudWatch for AWS monitoring and logging
- Implement security best practices across AWS, CI/CD, and Kubernetes
- Practice real-world DevOps troubleshooting scenarios

## Technology Stack

### Cloud
- AWS

### Infrastructure as Code
- Terraform

### Containers
- Docker
- Kubernetes
- Amazon EKS

### CI/CD
- GitHub Actions
- Jenkins

### Container Registry
- Amazon ECR

### Monitoring
- Prometheus
- Grafana
- Amazon CloudWatch

### Version Control
- Git
- GitHub

## Project Status

Currently setting up the project repository and Terraform workflow.

## Architecture

Architecture documentation will be added as the project progresses.

## DevOps Workflow

Developer
→ GitHub
→ CI
→ Code Quality
→ Build
→ Docker Image
→ Amazon ECR
→ Deployment
→ Amazon EKS
→ Monitoring

## Infrastructure

The initial AWS networking environment was created manually for learning
and validation purposes.

Existing infrastructure includes:

- VPC
- Public and private subnets
- Internet Gateway
- NAT Gateway
- Route tables
- Security groups
- Network ACLs
- Amazon RDS MySQL

Terraform will be used to manage and create the required infrastructure
as we progress.

## Security

Security will be implemented using:

- IAM least privilege
- Security groups
- Private subnets
- Kubernetes RBAC
- Secrets management
- Encryption
- CI/CD secret protection
- Network policies
- CloudTrail / auditing

## Documentation

Project documentation will be maintained under the `docs/` directory.

- `docs/architecture` - Architecture diagrams and explanations
- `docs/troubleshooting` - Issues and solutions
- `docs/interview-notes` - Interview preparation and project explanations