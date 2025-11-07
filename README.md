# Frontend Application

A production-ready Next.js application with authentication and document management, deployed on AWS EC2 with Docker containers and NGINX load balancing.

## 🚀 Features

- **Authentication System**: Login, registration, and JWT-based authentication with automatic token refresh
- **Document Management**: Upload, view, and manage documents with authentication
- **High Availability**: Dual container setup with NGINX load balancer (least connections algorithm)
- **Zero-Downtime Deployments**: Rolling updates script for seamless deployments
- **AWS Integration**: EC2 deployment with Secrets Manager for configuration management
- **CI/CD Pipeline**: Automated GitHub Actions workflow for building and deployment
- **Type Safety**: Full TypeScript implementation with strict type checking

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Infrastructure](#infrastructure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🏗️ Architecture

### Deployment Architecture

```
Internet (HTTP :80)
        ↓
Elastic IP (xx.xx.xx.xx)
        ↓
┌─────────────────────────────────────────────┐
│ EC2 Instance (Amazon Linux 2023)            │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │ Docker Runtime                         ││
│  │                                        ││
│  │  ┌──────────────────────────────────┐ ││
│  │  │ NGINX Load Balancer (Port 80)    │ ││
│  │  │ - Least Connections Algorithm    │ ││
│  │  │ - Health Checks & Failover       │ ││
│  │  └──────────────────────────────────┘ ││
│  │         │                  │           ││
│  │         ↓                  ↓           ││
│  │  ┌─────────────┐  ┌─────────────┐    ││
│  │  │ Next.js App │  │ Next.js App │    ││
│  │  │ Container#1 │  │ Container#2 │    ││
│  │  │   :3000     │  │   :3000     │    ││
│  │  └─────────────┘  └─────────────┘    ││
│  └────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
         │                    │
         │                    ↓
         │          AWS Secrets Manager
         │          (Configuration)
         ↓
   External Microservices
   - Auth API (AWS API Gateway)
   - Documents API (AWS API Gateway)
```

### Load Balancing Strategy

- **Algorithm**: Least Connections (distributes traffic to the server with fewer active connections)
- **Health Checks**: `max_fails=3`, `fail_timeout=30s`
- **Automatic Failover**: `proxy_next_upstream` for error handling
- **Rolling Updates**: Zero-downtime deployments updating one container at a time

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **UI**: React 19 with Server Components

### Backend Integration
- **Authentication**: JWT with automatic refresh mechanism
- **API Clients**: Custom fetch wrappers with retry logic
- **State Management**: React Context API (AuthProvider)

### Infrastructure
- **Cloud Provider**: AWS
- **Compute**: EC2 (t3.micro, Amazon Linux 2023)
- **Networking**: Elastic IP, Default VPC
- **Secrets**: AWS Secrets Manager
- **IAM**: Instance Profile with least privilege access
- **IaC**: Terraform 1.0+

### DevOps
- **Containerization**: Docker (multi-stage builds)
- **Orchestration**: Docker Compose
- **Load Balancer**: NGINX Alpine
- **CI/CD**: GitHub Actions
- **Registry**: Docker Hub

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Proxy Layer)
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── register/
│   │   │   ├── refresh/
│   │   │   └── me/
│   │   └── documents/            # Document management endpoints
│   ├── components/               # Reusable UI components
│   ├── documents/                # Document pages
│   ├── hooks/                    # Custom React hooks
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── me/                       # User profile page
│   ├── providers/                # React Context providers
│   │   └── AuthProvider.tsx     # Authentication state management
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── lib/                          # Utility libraries
│   ├── api-constants.ts          # Centralized API endpoints
│   ├── auth-utils.ts             # Authentication utilities
│   ├── documents-utils.ts        # Document management utilities
│   ├── error-utils.ts            # Error handling
│   ├── jwt.ts                    # JWT utilities
│   ├── users.ts                  # User management
│   └── validation-utils.ts       # Input validation
├── infra/                        # Infrastructure as Code
│   └── terraform/                # Terraform configurations
│       ├── main.tf               # Provider configuration
│       ├── ec2.tf                # EC2 instance setup
│       ├── network.tf            # Network configuration
│       ├── security-groups.tf    # Security group rules
│       ├── iam.tf                # IAM roles and policies
│       ├── secrets.tf            # Secrets Manager
│       ├── user-data.sh          # EC2 initialization script
│       └── variables.tf          # Terraform variables
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline
├── Dockerfile                    # Docker image definition
├── next.config.ts                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies

```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for local containerized development)
- AWS CLI configured (for deployment)
- Terraform 1.0+ (for infrastructure)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/kristianrpo/frontend.git
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   AUTH_BASE_URL=https://your-auth-api.com/api/auth
   DOCUMENTS_BASE_URL=https://your-docs-api.com/api/docs
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Development

1. **Build the Docker image**
   ```bash
   docker build -t frontend-app .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 \
     -e AUTH_BASE_URL=https://your-auth-api.com \
     -e DOCUMENTS_BASE_URL=https://your-docs-api.com \
     -e JWT_SECRET=your-secret \
     frontend-app
   ```

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AUTH_BASE_URL` | Base URL for authentication microservice | Yes | - |
| `DOCUMENTS_BASE_URL` | Base URL for documents microservice | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing/verification | Yes | - |
| `NODE_ENV` | Environment mode | No | `development` |

### AWS Secrets Manager

In production, these variables are stored in AWS Secrets Manager:
- Secret Name: `frontend-app-secrets`
- Retrieved automatically during EC2 instance initialization
- Passed to Docker containers via environment variables

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build production bundle
npm run start    # Start production server
npm run lint     # Run ESLint for code quality
```

### Code Structure

#### API Constants (`lib/api-constants.ts`)

Centralized API endpoints and configuration:

```typescript
import { APP_ROUTES, API_ROUTES, COOKIE_CONFIG } from '@/lib/api-constants'

// Navigation routes
router.push(APP_ROUTES.LOGIN)
router.push(APP_ROUTES.DOCUMENTS.BASE)

// Internal API endpoints
fetch(API_ROUTES.AUTH.LOGIN, { method: 'POST', ... })
fetch(API_ROUTES.DOCUMENTS.BASE)

// Cookie configuration
cookie.serialize(COOKIE_CONFIG.ACCESS_TOKEN.name, token, COOKIE_CONFIG.ACCESS_TOKEN)
```

#### Authentication Provider

Handles authentication state and token refresh:

```typescript
import { useAuth } from '@/app/providers/AuthProvider'

function Component() {
  const { user, loading, login, logout, fetchWithRefresh } = useAuth()
  
  // Automatic token refresh on 401 responses
  const data = await fetchWithRefresh('/api/documents')
}
```

#### Document Management

```typescript
import { getDocuments, uploadDocument, deleteDocument } from '@/lib/documents-utils'

// Fetch documents with pagination
const docs = await getDocuments(fetchWithRefresh, { page: 1, limit: 10 })

// Upload a document
const newDoc = await uploadDocument(fetchWithRefresh, file)
```

### Benefits of Centralization

- ✅ Single source of truth for all endpoints
- ✅ TypeScript autocompletion and type safety
- ✅ Prevents typos in URLs
- ✅ Consistent cookie configuration
- ✅ Easy maintenance and scalability
- ✅ Clear separation of concerns

## 🚢 Deployment

### Automated Deployment (GitHub Actions)

The application automatically deploys to AWS EC2 on every push to `main`:

1. **Build & Push**: Docker image is built and pushed to Docker Hub
2. **Infrastructure**: Terraform provisions/updates AWS infrastructure
3. **Configuration**: Secrets are updated in AWS Secrets Manager
4. **Rolling Update**: Zero-downtime deployment of new containers

### Manual Deployment

1. **Configure AWS credentials**
   ```bash
   aws configure
   ```

2. **Set GitHub Secrets**
   Required secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
   - `JWT_SECRET`
   - `NODE_ENV`
   - `TF_BACKEND_BUCKET`
   - `TF_BACKEND_DDB_TABLE`

3. **Deploy infrastructure**
   ```bash
   cd infra/terraform
   terraform init
   terraform apply -var="dockerhub_username=your-username"
   ```

4. **Access the application**
   ```bash
   terraform output instance_public_ip
   # Open http://<public-ip> in your browser
   ```

### Rolling Updates

For zero-downtime updates:

```bash
# SSH into EC2 instance
ssh -i ec2-key.pem ec2-user@<public-ip>

# Run rolling update script
/opt/frontend-app/rolling-update.sh
```

This script:
1. Pulls latest Docker images
2. Updates `app1` container
3. Waits for health check
4. Updates `app2` container
5. Cleans up old images

## 🏗️ Infrastructure

### AWS Resources

- **EC2 Instance**: t3.micro running Amazon Linux 2023
- **Elastic IP**: Static public IP address
- **Security Group**: HTTP (80), SSH (22) access
- **IAM Role**: Permissions for Secrets Manager access
- **Secrets Manager**: Stores application configuration
- **Internet Gateway**: Enables internet access

### Terraform Modules

```hcl
# Main resources
- EC2 Instance with user-data initialization
- Elastic IP association
- Security Groups
- IAM Instance Profile
- Secrets Manager secret (value managed by CI/CD)
```

### EC2 Initialization

The `user-data.sh` script:
1. Updates system packages
2. Installs Docker, Docker Compose, AWS CLI
3. Retrieves secrets from AWS Secrets Manager
4. Creates NGINX and docker-compose configurations
5. Pulls Docker images and starts containers
6. Sets up log rotation and rolling update script

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.
```typescript
// Request
{ email: string, password: string }

// Response
{ user: User, message: string }
```

#### POST /api/auth/register
Register a new user.
```typescript
// Request
{ email: string, password: string, name: string, id_citizen: number }

// Response
{ message: string }
```

#### GET /api/auth/me
Get current user information.
```typescript
// Response
{ user: User, exp: number }
```

#### POST /api/auth/refresh
Refresh authentication tokens.
```typescript
// Response
{ message: string }
```

#### POST /api/auth/logout
Logout current user.
```typescript
// Response
{ message: string }
```

### Document Endpoints

#### GET /api/documents
List documents with pagination.
```typescript
// Query params: ?page=1&limit=10

// Response
{
  documents: Document[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

#### POST /api/documents
Upload a new document.
```typescript
// Request: FormData with 'file' field

// Response
{ document: Document }
```

#### GET /api/documents/[id]
Get document details.
```typescript
// Response
{ document: Document }
```

#### DELETE /api/documents/[id]
Delete a document.
```typescript
// Response
{ message: string }
```

#### POST /api/documents/[id]/authenticate
Request document authentication.
```typescript
// Response
{ message: string }
```

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication with automatic refresh
- **HTTP-Only Cookies**: Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- **IAM Roles**: Least privilege access for EC2 instance
- **Security Groups**: Restricted network access (only HTTP and SSH)
- **Secrets Management**: Sensitive data stored in AWS Secrets Manager
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Secure error messages without exposing internals

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👥 Authors

- **Kristian Restrepo** - [kristianrpo](https://github.com/kristianrpo)

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Docker Documentation](https://docs.docker.com/)
