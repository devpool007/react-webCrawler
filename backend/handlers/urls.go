package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"webcrawler/crawler"
	"webcrawler/database"
	"webcrawler/models"
)

func CreateURL(c *gin.Context) {
	userID := c.GetInt("user_id")
	
	var req models.URLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	// Insert URL
	query := "INSERT INTO urls (user_id, url, status) VALUES (?, ?, 'queued')"
	result, err := database.DB.Exec(query, userID, req.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to create URL",
		})
		return
	}

	urlID, _ := result.LastInsertId()

	// Return created URL
	url := models.URL{
		ID:     int(urlID),
		UserID: userID,
		URL:    req.URL,
		Status: "queued",
	}

	c.JSON(http.StatusCreated, models.SuccessResponse{
		Message: "URL created successfully",
		Data:    url,
	})
}

func GetURL(c *gin.Context) {
	userID := c.GetInt("user_id")
	urlID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid URL ID",
		})
		return
	}

	query := `
		SELECT u.id, u.url, u.status, u.created_at, u.updated_at,
			   r.id, r.title, r.html_version, r.h1_count, r.h2_count, r.h3_count, 
			   r.h4_count, r.h5_count, r.h6_count, r.internal_links, r.external_links,
			   r.inaccessible_links, r.has_login_form
		FROM urls u
		LEFT JOIN crawl_results r ON u.id = r.url_id
		WHERE u.id = ? AND u.user_id = ?
	`

	var url models.URL
	var result models.CrawlResult
	var resultID sql.NullInt64
	var title, htmlVersion sql.NullString
	var h1, h2, h3, h4, h5, h6, internal, external, inaccessible sql.NullInt64
	var hasLoginForm sql.NullBool

	err = database.DB.QueryRow(query, urlID, userID).Scan(
		&url.ID, &url.URL, &url.Status, &url.CreatedAt, &url.UpdatedAt,
		&resultID, &title, &htmlVersion, &h1, &h2, &h3, &h4, &h5, &h6,
		&internal, &external, &inaccessible, &hasLoginForm,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error: "URL not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Error: "Failed to get URL",
			})
		}
		return
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

	c.JSON(http.StatusOK, url)
}

func StartCrawling(c *gin.Context) {
	userID := c.GetInt("user_id")
	urlID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid URL ID",
		})
		return
	}

	// Check if URL exists and belongs to user
	var url models.URL
	query := "SELECT id, url, status FROM urls WHERE id = ? AND user_id = ?"
	err = database.DB.QueryRow(query, urlID, userID).Scan(&url.ID, &url.URL, &url.Status)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error: "URL not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Error: "Failed to get URL",
			})
		}
		return
	}

	// Update status to running
	_, err = database.DB.Exec("UPDATE urls SET status = 'running' WHERE id = ?", urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to update URL status",
		})
		return
	}

	// Start crawling in background
	go crawler.CrawlURL(urlID, url.URL)

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Crawling started",
	})
}

func StopCrawling(c *gin.Context) {
	userID := c.GetInt("user_id")
	urlID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid URL ID",
		})
		return
	}

	// Check if URL exists and belongs to user
	query := "SELECT id FROM urls WHERE id = ? AND user_id = ?"
	err = database.DB.QueryRow(query, urlID, userID).Scan(&urlID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error: "URL not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Error: "Failed to get URL",
			})
		}
		return
	}

	// Update status to queued (stopped)
	_, err = database.DB.Exec("UPDATE urls SET status = 'queued' WHERE id = ?", urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to update URL status",
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Crawling stopped",
	})
}

func DeleteURL(c *gin.Context) {
	userID := c.GetInt("user_id")
	urlID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid URL ID",
		})
		return
	}

	// Delete URL (cascade will handle related records)
	result, err := database.DB.Exec("DELETE FROM urls WHERE id = ? AND user_id = ?", urlID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to delete URL",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error: "URL not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "URL deleted successfully",
	})
}

func GetResults(c *gin.Context) {
	userID := c.GetInt("user_id")
	urlID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid URL ID",
		})
		return
	}

	// Get crawl results with broken links
	query := `
		SELECT r.id, r.title, r.html_version, r.h1_count, r.h2_count, r.h3_count, 
			   r.h4_count, r.h5_count, r.h6_count, r.internal_links, r.external_links,
			   r.inaccessible_links, r.has_login_form, r.created_at, r.updated_at
		FROM crawl_results r
		JOIN urls u ON r.url_id = u.id
		WHERE u.id = ? AND u.user_id = ?
	`

	var result models.CrawlResult
	err = database.DB.QueryRow(query, urlID, userID).Scan(
		&result.ID, &result.Title, &result.HTMLVersion, &result.H1Count, &result.H2Count,
		&result.H3Count, &result.H4Count, &result.H5Count, &result.H6Count,
		&result.InternalLinks, &result.ExternalLinks, &result.InaccessibleLinks,
		&result.HasLoginForm, &result.CreatedAt, &result.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error: "Results not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Error: "Failed to get results",
			})
		}
		return
	}

	result.URLID = urlID

	// Get broken links
	brokenQuery := "SELECT id, url, status_code, error_message, created_at FROM broken_links WHERE result_id = ?"
	rows, err := database.DB.Query(brokenQuery, result.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to get broken links",
		})
		return
	}
	defer rows.Close()

	var brokenLinks []models.BrokenLink
	for rows.Next() {
		var link models.BrokenLink
		err := rows.Scan(&link.ID, &link.URL, &link.StatusCode, &link.ErrorMessage, &link.CreatedAt)
		if err != nil {
			continue
		}
		link.ResultID = result.ID
		brokenLinks = append(brokenLinks, link)
	}

	result.BrokenLinks = brokenLinks

	c.JSON(http.StatusOK, result)
}

func BulkDeleteURLs(c *gin.Context) {
	userID := c.GetInt("user_id")
	
	var req models.BulkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "No IDs provided",
		})
		return
	}

	// Build query with placeholders
	query := "DELETE FROM urls WHERE user_id = ? AND id IN ("
	args := []interface{}{userID}
	
	for i, id := range req.IDs {
		if i > 0 {
			query += ","
		}
		query += "?"
		args = append(args, id)
	}
	query += ")"

	result, err := database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to delete URLs",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "URLs deleted successfully",
		Data:    map[string]int64{"deleted_count": rowsAffected},
	})
}

func BulkRerunURLs(c *gin.Context) {
	userID := c.GetInt("user_id")
	
	var req models.BulkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "No IDs provided",
		})
		return
	}

	// Get URLs to rerun
	query := "SELECT id, url FROM urls WHERE user_id = ? AND id IN ("
	args := []interface{}{userID}
	
	for i, id := range req.IDs {
		if i > 0 {
			query += ","
		}
		query += "?"
		args = append(args, id)
	}
	query += ")"

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
		err := rows.Scan(&url.ID, &url.URL)
		if err != nil {
			continue
		}
		urls = append(urls, url)
	}

	// Update status to running and start crawling
	for _, url := range urls {
		_, err = database.DB.Exec("UPDATE urls SET status = 'running' WHERE id = ?", url.ID)
		if err != nil {
			continue
		}
		
		// Start crawling in background
		go crawler.CrawlURL(url.ID, url.URL)
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "URLs rerun started",
		Data:    map[string]int{"rerun_count": len(urls)},
	})
}
