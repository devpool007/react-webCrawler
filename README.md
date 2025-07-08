# Web Crawler Application

A full-stack web application for crawling websites and analyzing their content.

## Features

- **URL Management**: Add URLs for analysis and start/stop processing
- **Results Dashboard**: Paginated, sortable table with filters and search
- **Details View**: Detailed analysis with charts and broken links
- **Bulk Actions**: Re-run analysis or delete selected URLs
- **Real-Time Progress**: Live crawl status updates

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Responsive design (desktop and mobile)

### Backend
- Go (Golang) with Gin framework
- MySQL for data storage
- JWT-based authentication
- RESTful API design

## Getting Started

### Prerequisites
- Node.js 18+
- Go 1.21+
- MySQL 8.0+

### Backend Setup
```bash
cd backend
go mod init webcrawler
go mod tidy
go run main.go
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
# Create database and run migrations
mysql -u root -p
CREATE DATABASE webcrawler;
```

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/urls` - List all URLs
- `POST /api/urls` - Add new URL
- `PUT /api/urls/:id/start` - Start crawling
- `PUT /api/urls/:id/stop` - Stop crawling
- `DELETE /api/urls/:id` - Delete URL
- `GET /api/urls/:id/results` - Get crawl results

## Development

The project is structured with clear separation between frontend and backend:

```
├── backend/           # Go backend application
│   ├── main.go       # Application entry point
│   ├── models/       # Database models
│   ├── handlers/     # HTTP handlers
│   ├── middleware/   # HTTP middleware
│   ├── crawler/      # Web crawler logic
│   └── database/     # Database configuration
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utility functions
│   └── public/
```

## Testing

- Frontend tests: `npm test`
- Backend tests: `go test ./...`

## License

MIT License