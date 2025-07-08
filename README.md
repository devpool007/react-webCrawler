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

### Prerequisites
- **Node.js 18+** (with npm)
- **Go 1.21+**
- **MySQL 8.0+** (or compatible)
- **Git** for version control

### 1. Clone the Repository
```bash
git clone <repository-url>
cd react-webCrawler
```

### 2. Database Setup

#### Install MySQL (if not already installed)
```bash
# On macOS with Homebrew
brew install mysql

# On Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# On Windows
# Download and install from https://dev.mysql.com/downloads/mysql/
```

#### Start MySQL Service
```bash
# On macOS with Homebrew
brew services start mysql

# On Ubuntu/Debian with systemd
sudo systemctl start mysql
sudo systemctl enable mysql

# On Windows
# Use MySQL Workbench or Services panel
```

#### Create Database and User
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

### 3. Backend Setup

#### Create Environment File
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

#### Install Dependencies and Run
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

### 4. Frontend Setup

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

### 5. Access the Application

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
├── backend/                 # Go backend application
│   ├── main.go             # Application entry point & routing
│   ├── .env                # Environment configuration
│   ├── database/           # Database connection & setup
│   ├── models/             # Data models & schemas
│   ├── handlers/           # HTTP request handlers
│   ├── middleware/         # Authentication & CORS middleware
│   └── crawler/            # Web crawling logic
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React context providers
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── vite.config.ts      # Vite build configuration
└── README.md              # This file
```

### Building for Production

#### Frontend Build
```bash
cd frontend
npm run build
# Outputs to frontend/dist/
```

#### Backend Build
```bash
cd backend
go build -o webcrawler main.go
# Creates webcrawler executable
```

### Troubleshooting

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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### URL Management  
- `GET /api/urls` - List URLs with pagination, search, and filters
- `POST /api/urls` - Add new URL for crawling
- `GET /api/urls/:id` - Get specific URL details
- `PUT /api/urls/:id/start` - Start crawling URL
- `PUT /api/urls/:id/stop` - Stop crawling URL
- `PUT /api/urls/:id/rerun` - Rerun crawl for URL
- `DELETE /api/urls/:id` - Delete URL

### Results & Analysis
- `GET /api/urls/:id/results` - Get crawl results
- `GET /api/results/:id/broken-links` - Get broken links for result

### Bulk Operations
- `POST /api/bulk/delete` - Delete multiple URLs
- `POST /api/bulk/rerun` - Rerun crawls for multiple URLs

### Health Check
- `GET /health` - Server health status

## License

MIT License