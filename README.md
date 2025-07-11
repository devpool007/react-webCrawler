# Web Crawler Application

A full-stack web application for crawling websites and analyzing their content with real-time updates, interactive charts, and comprehensive URL management.

## Features

- **User Authentication**: Secure registration and login system
- **URL Management**: Add, delete, start/stop crawling for multiple URLs
- **Real-Time Dashboard**: Live status updates with polling for active crawls
- **Detailed Analysis**: 
  - Interactive charts (Pie/Bar) for link and heading distribution
  - Broken links table with status codes and error messages
  - Page metadata (title, HTML version, login form detection)
- **Advanced Table Features**:
  - Pagination with page navigation
  - Column sorting with visual indicators
  - Search and filtering capabilities
  - Bulk operations (delete, rerun multiple URLs)
- **Responsive Design**: Mobile-friendly interface with modern UI

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and hot reload
- **Tailwind CSS 4** for modern styling
- **Chart.js** with react-chartjs-2 for data visualization
- **Axios** for HTTP requests with interceptors
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Go (Golang)** with Gin framework
- **MySQL** for data storage with proper schema
- **JWT** authentication with middleware
- **CORS** support for cross-origin requests
- **RESTful API** design with proper error handling

## Getting Started

You can run this application in two ways:
1. **Docker (Recommended)** - For quick setup and reproducible builds
2. **Local Development** - For development and customization

### Option 1: Docker Setup (Recommended)

This is the fastest way to get the entire application running with all dependencies.

#### Prerequisites
- **Docker** and **Docker Compose** installed
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows/macOS
  - [Docker Engine](https://docs.docker.com/engine/install/) for Linux
- **Git** for version control
- **Make** (optional, for using Makefile commands)

#### Quick Start
```bash
# 1. Ensure Docker is running
# - On macOS/Windows: Start Docker Desktop application
# - On Linux: sudo systemctl start docker

# 2. Clone the repository
git clone <repository-url>
cd react-webCrawler

# 3. Build and start all services
make up

# Or use docker-compose directly if make is not available
docker-compose up -d --build
```

#### Verify Installation
After running `make up` or `docker-compose up -d`, verify all services are running:

```bash
# Check service status
docker-compose ps

# Expected output should show 3 services running:
# webcrawler-mysql     (healthy)
# webcrawler-backend   (up)
# webcrawler-frontend  (up)

# Check logs if any service fails
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Test the application
curl http://localhost:8080/health
# Should return: {"status":"ok"}

# Access the frontend
open http://localhost:3000
# Should show the login/register page
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MySQL**: localhost:3306

#### Docker Commands (using Makefile)
```bash
# Build all Docker images
make build

# Start all services
make up

# View logs for all services
make logs

# Stop all services
make down

# Clean up (remove containers, images, and volumes)
make clean

# Run tests
make test

# Start only backend services (MySQL + Backend)
make backend

# Start only frontend development server
make frontend
```

#### Docker Commands (using docker-compose directly)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Remove volumes (clean database)
docker-compose down -v
```

#### Environment Configuration for Docker
The Docker setup uses these default configurations:
- MySQL database: `webcrawler`
- MySQL user: `crawler` / password: `crawlerpassword`
- JWT secret: Auto-generated secure key
- All services run in isolated Docker network

No additional configuration needed for Docker setup!

### Option 2: Local Development Setup

#### Prerequisites
- **Node.js 18+** (with npm)
- **Go 1.21+**
- **MySQL 8.0+** (or compatible)
- **Git** for version control

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd react-webCrawler
```

#### 2. Database Setup

##### Install MySQL (if not already installed)
```bash
# On macOS with Homebrew
brew install mysql

# On Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# On Windows
# Download and install from https://dev.mysql.com/downloads/mysql/
```

##### Start MySQL Service
```bash
# On macOS with Homebrew
brew services start mysql

# On Ubuntu/Debian with systemd
sudo systemctl start mysql
sudo systemctl enable mysql

# On Windows
# Use MySQL Workbench or Services panel
```

##### Create Database and User
```bash
# Connect to MySQL as root
mysql -u root -p

# Create database and user (run these commands in MySQL)
CREATE DATABASE IF NOT EXISTS webcrawler;
CREATE USER IF NOT EXISTS 'webcrawler'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON webcrawler.* TO 'webcrawler'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Backend Setup

##### Create Environment File
```bash
cd backend
```

Create a `.env` file with the following content:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=webcrawler
DB_PASSWORD=password
DB_NAME=webcrawler
JWT_SECRET=your-secret-key-here-change-in-production
GIN_MODE=debug
```

##### Install Dependencies and Run
```bash
# Install Go dependencies
go mod tidy

# Start the backend server
go run main.go
```

The backend server will start on **http://localhost:8080** and automatically create the required database tables.

You should see output like:
```
Database connected successfully
[GIN-debug] Listening and serving HTTP on :8080
```

#### 4. Frontend Setup

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on **http://localhost:5173** (or 5174 if 5173 is busy).

You should see output like:
```
VITE v7.0.3  ready in 620 ms
➜  Local:   http://localhost:5173/
```

#### 5. Access the Application

1. **Open your browser** and navigate to `http://localhost:5173` (or the port shown in terminal)

2. **Register a new user**:
   - Click "Register" or navigate to `/register`
   - Fill in username, email, and password
   - Click "Create Account"

3. **Start using the application**:
   - You'll be automatically logged in and redirected to the dashboard
   - Click "Add URL" to add your first website for crawling
   - Enter a valid URL (e.g., `https://example.com`)
   - Click "Add URL" to start crawling
   - Monitor real-time progress on the dashboard
   - Click the eye icon to view detailed analysis with charts

## Application Workflow

### Adding and Crawling URLs
1. **Add URL**: Click "Add URL" button and enter a website URL
2. **Auto-Start**: Crawling starts automatically after adding
3. **Monitor Progress**: Watch real-time status updates (Queued → Running → Completed)
4. **View Results**: Click the eye icon to see detailed analysis

### Understanding the Analysis
- **Link Distribution**: Pie chart showing internal vs external vs broken links
- **Heading Structure**: Bar chart of H1-H6 heading counts
- **Broken Links**: Table of inaccessible links with error details
- **Page Metadata**: Title, HTML version, login form detection

### Managing URLs
- **Bulk Actions**: Select multiple URLs for batch delete/rerun
- **Search & Filter**: Find URLs by name or filter by status
- **Sorting**: Click column headers to sort by URL, status, or date
- **Pagination**: Navigate through large lists of URLs

## Development

### Project Structure
```
react-webCrawler/
├── docker-compose.yml      # Docker orchestration configuration
├── Dockerfile              # Multi-stage production build  
├── Dockerfile.backend      # Backend-specific Docker build
├── Dockerfile.frontend     # Frontend-specific Docker build
├── Makefile                # Build automation and commands
├── nginx.conf              # Nginx configuration for frontend
├── .dockerignore           # Docker build optimization
├── README.md               # This documentation
├── database/
│   └── init.sql           # MySQL database initialization
├── backend/                # Go backend application
│   ├── main.go             # Application entry point & routing
│   ├── .env.example        # Environment template
│   ├── go.mod              # Go module dependencies
│   ├── go.sum              # Go dependency checksums
│   ├── database/           # Database connection & setup
│   ├── models/             # Data models & schemas
│   ├── handlers/           # HTTP request handlers
│   │   ├── auth_test.go    # Authentication tests
│   │   └── urls_test.go    # URL management tests
│   ├── middleware/         # Authentication & CORS middleware
│   └── crawler/            # Web crawling logic
└── frontend/               # React frontend application
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page-level components
    │   ├── hooks/          # Custom React hooks
    │   ├── contexts/       # React context providers
    │   ├── services/       # API service layer
    │   ├── types/          # TypeScript type definitions
    │   ├── utils/          # Utility functions
    │   └── test/           # Frontend unit tests
    ├── public/             # Static assets
    ├── .env.example        # Environment template
    ├── tailwind.config.js  # Tailwind CSS configuration
    ├── vite.config.ts      # Vite build configuration
    └── package.json        # NPM dependencies and scripts
```

### Building for Production

#### Docker Production Build

The application includes multi-stage Dockerfiles optimized for production:

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start in production mode
docker-compose up -d

# Scale services if needed
docker-compose up -d --scale backend=2
```

#### Production Environment Variables

Create production `.env` files:

**Backend (`backend/.env`):**
```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=crawler
DB_PASSWORD=your-secure-password-here
DB_NAME=webcrawler
JWT_SECRET=your-super-secure-jwt-key-change-this
GIN_MODE=release
PORT=8080
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=https://your-domain.com/api
```

#### Building for Production

##### Frontend Build
```bash
cd frontend
npm run build
# Outputs to frontend/dist/
```

##### Backend Build
```bash
cd backend
go build -o webcrawler main.go
# Creates webcrawler executable
```

#### Docker Images
The application uses optimized multi-stage builds:
- **Frontend**: nginx:alpine (serves static files + API proxy)
- **Backend**: golang:alpine (compiled Go binary)
- **Database**: mysql:8.0 (with initialization scripts)

## Testing

### Running Tests

#### Using Docker (Recommended)
```bash
# Run all tests
make test

# Or individually
docker-compose exec backend go test ./...
docker-compose exec frontend npm test
```

#### Local Testing
```bash
# Backend tests
cd backend
go test ./...

# Frontend tests  
cd frontend
npm test

# Frontend test coverage
npm run test:coverage
```

### Test Coverage
- **Backend**: Unit tests for authentication, URL management, and crawling logic
- **Frontend**: Component tests, hook tests, and API service tests
- **Integration**: Docker-based integration tests for full stack flows

### Troubleshooting

#### Docker Issues
- **Docker Daemon Not Running**: 
  - macOS/Windows: Start Docker Desktop application
  - Linux: `sudo systemctl start docker` or `sudo service docker start`
  - Verify with: `docker --version` and `docker-compose --version`
- **Port Conflicts**: Change ports in `docker-compose.yml` if 3000, 8080, or 3306 are in use
- **Build Failures**: Run `docker system prune` to clean up and rebuild with `make build`
- **Database Issues**: Remove volumes with `docker-compose down -v` to reset database
- **Memory Issues**: Increase Docker memory limit in Docker Desktop settings
- **Permission Issues**: 
  - Linux: Add user to docker group: `sudo usermod -aG docker $USER` (logout/login required)
  - Ensure Docker daemon is running and user has Docker permissions

#### Backend Issues
- **Database Connection Failed**: Ensure MySQL is running and credentials in `.env` are correct
- **Port 8080 in Use**: Kill existing processes with `lsof -ti:8080 | xargs kill -9`
- **CORS Errors**: Check that frontend URL is included in CORS configuration

#### Frontend Issues
- **API Connection Failed**: Verify backend is running on port 8080
- **Build Errors**: Run `npm install` to ensure all dependencies are installed
- **Port Issues**: Vite will automatically try alternative ports

#### Database Issues
- **Access Denied**: Verify MySQL user has correct permissions
- **Database Not Found**: Ensure `webcrawler` database was created successfully
- **Connection Refused**: Check that MySQL service is running

### Development Workflow

#### With Docker
```bash
# Start development environment
make up

# View logs
make logs

# Make code changes (hot reload enabled)
# - Frontend: Changes reflect immediately
# - Backend: Restart with `docker-compose restart backend`

# Run tests
make test

# Clean up when done
make down
```

#### Without Docker (Local Development)
```bash
# Terminal 1: Start database
mysql -u root -p
# Run database setup commands...

# Terminal 2: Start backend
cd backend
go run main.go

# Terminal 3: Start frontend  
cd frontend
npm run dev
```