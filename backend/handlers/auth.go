package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"webcrawler/database"
	"webcrawler/models"
)

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	// Find user by username
	var user models.User
	query := "SELECT id, username, email, password_hash FROM users WHERE username = ?"
	err := database.DB.QueryRow(query, req.Username).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error: "Invalid credentials",
		})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error: "Invalid credentials",
		})
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: tokenString,
		User:  user,
	})
}

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to hash password",
		})
		return
	}

	// Insert user
	query := "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
	result, err := database.DB.Exec(query, req.Username, req.Email, string(hashedPassword))
	if err != nil {
		c.JSON(http.StatusConflict, models.ErrorResponse{
			Error: "Username or email already exists",
		})
		return
	}

	userID, _ := result.LastInsertId()

	// Create user object
	user := models.User{
		ID:       int(userID),
		Username: req.Username,
		Email:    req.Email,
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: tokenString,
		User:  user,
	})
}

func GetURLs(c *gin.Context) {
	userID := c.GetInt("user_id")
	
	// Get query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	search := c.Query("search")
	status := c.Query("status")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	// Build query
	query := `
		SELECT u.id, u.url, u.status, u.created_at, u.updated_at,
			   r.id, r.title, r.html_version, r.h1_count, r.h2_count, r.h3_count, 
			   r.h4_count, r.h5_count, r.h6_count, r.internal_links, r.external_links,
			   r.inaccessible_links, r.has_login_form
		FROM urls u
		LEFT JOIN crawl_results r ON u.id = r.url_id
		WHERE u.user_id = ?
	`
	
	args := []interface{}{userID}

	if search != "" {
		query += " AND (u.url LIKE ? OR r.title LIKE ?)"
		searchParam := "%" + search + "%"
		args = append(args, searchParam, searchParam)
	}

	if status != "" {
		query += " AND u.status = ?"
		args = append(args, status)
	}

	// Add sorting
	if sortBy == "title" {
		query += " ORDER BY r.title"
	} else if sortBy == "internal_links" {
		query += " ORDER BY r.internal_links"
	} else if sortBy == "external_links" {
		query += " ORDER BY r.external_links"
	} else {
		query += " ORDER BY u." + sortBy
	}

	if sortOrder == "asc" {
		query += " ASC"
	} else {
		query += " DESC"
	}

	// Get total count
	countQuery := `
		SELECT COUNT(*)
		FROM urls u
		LEFT JOIN crawl_results r ON u.id = r.url_id
		WHERE u.user_id = ?
	`
	countArgs := []interface{}{userID}

	if search != "" {
		countQuery += " AND (u.url LIKE ? OR r.title LIKE ?)"
		searchParam := "%" + search + "%"
		countArgs = append(countArgs, searchParam, searchParam)
	}

	if status != "" {
		countQuery += " AND u.status = ?"
		countArgs = append(countArgs, status)
	}

	var total int
	err := database.DB.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to get count",
		})
		return
	}

	// Add pagination
	offset := (page - 1) * pageSize
	query += " LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	// Execute query
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to get URLs",
		})
		return
	}
	defer rows.Close()

	var urls []models.URL
	for rows.Next() {
		var url models.URL
		var result models.CrawlResult
		var resultID sql.NullInt64
		var title, htmlVersion sql.NullString
		var h1, h2, h3, h4, h5, h6, internal, external, inaccessible sql.NullInt64
		var hasLoginForm sql.NullBool

		err := rows.Scan(
			&url.ID, &url.URL, &url.Status, &url.CreatedAt, &url.UpdatedAt,
			&resultID, &title, &htmlVersion, &h1, &h2, &h3, &h4, &h5, &h6,
			&internal, &external, &inaccessible, &hasLoginForm,
		)
		if err != nil {
			continue
		}

		url.UserID = userID

		// If result exists, populate it
		if resultID.Valid {
			result.ID = int(resultID.Int64)
			result.URLID = url.ID
			result.Title = title.String
			result.HTMLVersion = htmlVersion.String
			result.H1Count = int(h1.Int64)
			result.H2Count = int(h2.Int64)
			result.H3Count = int(h3.Int64)
			result.H4Count = int(h4.Int64)
			result.H5Count = int(h5.Int64)
			result.H6Count = int(h6.Int64)
			result.InternalLinks = int(internal.Int64)
			result.ExternalLinks = int(external.Int64)
			result.InaccessibleLinks = int(inaccessible.Int64)
			result.HasLoginForm = hasLoginForm.Bool
			url.Result = &result
		}

		urls = append(urls, url)
	}

	totalPages := (total + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data:       urls,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}
