package models

import (
	"time"
)

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type URL struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	URL       string    `json:"url"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Result    *CrawlResult `json:"result,omitempty"`
}

type CrawlResult struct {
	ID                int           `json:"id"`
	URLID             int           `json:"url_id"`
	Title             string        `json:"title"`
	HTMLVersion       string        `json:"html_version"`
	H1Count           int           `json:"h1_count"`
	H2Count           int           `json:"h2_count"`
	H3Count           int           `json:"h3_count"`
	H4Count           int           `json:"h4_count"`
	H5Count           int           `json:"h5_count"`
	H6Count           int           `json:"h6_count"`
	InternalLinks     int           `json:"internal_links"`
	ExternalLinks     int           `json:"external_links"`
	InaccessibleLinks int           `json:"inaccessible_links"`
	HasLoginForm      bool          `json:"has_login_form"`
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`
	BrokenLinks       []BrokenLink  `json:"broken_links,omitempty"`
}

type BrokenLink struct {
	ID           int    `json:"id"`
	ResultID     int    `json:"result_id"`
	URL          string `json:"url"`
	StatusCode   int    `json:"status_code"`
	ErrorMessage string `json:"error_message"`
	CreatedAt    time.Time `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type URLRequest struct {
	URL string `json:"url" binding:"required,url"`
}

type BulkRequest struct {
	IDs []int `json:"ids" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}
