# Web Crawler Application
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY frontend/ ./

# Build the application
RUN npm run build

# Backend build stage
FROM golang:1.21-alpine as backend-builder

WORKDIR /app/backend

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY backend/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o webcrawler .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy backend binary
COPY --from=backend-builder /app/backend/webcrawler .

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./static

# Create .env file template
COPY backend/.env.example .env

# Expose port
EXPOSE 8080

# Command to run
CMD ["./webcrawler"]
