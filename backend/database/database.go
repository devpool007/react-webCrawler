package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDB() {
	var err error
	
	// Build connection string
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		getEnv("DB_USER", "root"),
		getEnv("DB_PASSWORD", "password"),
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "3306"),
		getEnv("DB_NAME", "webcrawler"),
	)

	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Test the connection
	if err := DB.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Database connected successfully")

	// Create tables
	if err := createTables(); err != nil {
		log.Fatal("Failed to create tables:", err)
	}
}

func createTables() error {
	// Users table
	userTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		email VARCHAR(100) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	);`

	// URLs table
	urlTable := `
	CREATE TABLE IF NOT EXISTS urls (
		id INT AUTO_INCREMENT PRIMARY KEY,
		user_id INT NOT NULL,
		url VARCHAR(2048) NOT NULL,
		status ENUM('queued', 'running', 'completed', 'failed') DEFAULT 'queued',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		INDEX idx_user_id (user_id),
		INDEX idx_status (status)
	);`

	// Crawl results table
	resultTable := `
	CREATE TABLE IF NOT EXISTS crawl_results (
		id INT AUTO_INCREMENT PRIMARY KEY,
		url_id INT NOT NULL,
		title VARCHAR(500),
		html_version VARCHAR(20),
		h1_count INT DEFAULT 0,
		h2_count INT DEFAULT 0,
		h3_count INT DEFAULT 0,
		h4_count INT DEFAULT 0,
		h5_count INT DEFAULT 0,
		h6_count INT DEFAULT 0,
		internal_links INT DEFAULT 0,
		external_links INT DEFAULT 0,
		inaccessible_links INT DEFAULT 0,
		has_login_form BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
	);`

	// Broken links table
	brokenLinksTable := `
	CREATE TABLE IF NOT EXISTS broken_links (
		id INT AUTO_INCREMENT PRIMARY KEY,
		result_id INT NOT NULL,
		url VARCHAR(2048) NOT NULL,
		status_code INT NOT NULL,
		error_message TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (result_id) REFERENCES crawl_results(id) ON DELETE CASCADE
	);`

	tables := []string{userTable, urlTable, resultTable, brokenLinksTable}

	for _, table := range tables {
		if _, err := DB.Exec(table); err != nil {
			return err
		}
	}

	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
