package crawler

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/net/html"
	"webcrawler/database"
	"webcrawler/models"
)

type CrawlData struct {
	Title             string
	HTMLVersion       string
	HeadingCounts     map[string]int
	InternalLinks     int
	ExternalLinks     int
	InaccessibleLinks int
	HasLoginForm      bool
	BrokenLinks       []models.BrokenLink
}

func CrawlURL(urlID int, targetURL string) {
	log.Printf("Starting crawl for URL ID %d: %s", urlID, targetURL)
	
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Make request
	resp, err := client.Get(targetURL)
	if err != nil {
		log.Printf("Failed to fetch URL %s: %v", targetURL, err)
		updateURLStatus(urlID, "failed")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Non-200 status code for URL %s: %d", targetURL, resp.StatusCode)
		updateURLStatus(urlID, "failed")
		return
	}

	// Parse HTML
	doc, err := html.Parse(resp.Body)
	if err != nil {
		log.Printf("Failed to parse HTML for URL %s: %v", targetURL, err)
		updateURLStatus(urlID, "failed")
		return
	}

	// Initialize crawl data
	data := CrawlData{
		HeadingCounts: make(map[string]int),
		BrokenLinks:   []models.BrokenLink{},
	}

	// Extract base URL for relative link resolution
	baseURL, err := url.Parse(targetURL)
	if err != nil {
		log.Printf("Failed to parse base URL %s: %v", targetURL, err)
		updateURLStatus(urlID, "failed")
		return
	}

	// Analyze HTML
	analyzeHTML(doc, &data, baseURL)

	// Save results
	if err := saveResults(urlID, &data); err != nil {
		log.Printf("Failed to save results for URL %s: %v", targetURL, err)
		updateURLStatus(urlID, "failed")
		return
	}

	// Update status to completed
	updateURLStatus(urlID, "completed")
	log.Printf("Crawl completed for URL ID %d: %s", urlID, targetURL)
}

func analyzeHTML(n *html.Node, data *CrawlData, baseURL *url.URL) {
	if n.Type == html.ElementNode {
		switch n.Data {
		case "html":
			// Extract HTML version from DOCTYPE or html tag
			data.HTMLVersion = extractHTMLVersion(n)
		case "title":
			// Extract page title
			if title := extractTextContent(n); title != "" {
				data.Title = title
			}
		case "h1", "h2", "h3", "h4", "h5", "h6":
			// Count heading tags
			data.HeadingCounts[n.Data]++
		case "a":
			// Analyze links
			analyzeLink(n, data, baseURL)
		case "form":
			// Check for login form
			if isLoginForm(n) {
				data.HasLoginForm = true
			}
		}
	}

	// Recursively analyze child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		analyzeHTML(c, data, baseURL)
	}
}

func extractHTMLVersion(n *html.Node) string {
	// Check for HTML5 (default)
	if n.Parent != nil && n.Parent.Type == html.DocumentNode {
		for sibling := n.Parent.FirstChild; sibling != nil; sibling = sibling.NextSibling {
			if sibling.Type == html.DoctypeNode {
				if strings.Contains(strings.ToLower(sibling.Data), "html") {
					return "HTML5"
				}
			}
		}
	}
	
	// Check for XHTML or older versions in attributes
	for _, attr := range n.Attr {
		if attr.Key == "xmlns" || strings.Contains(attr.Val, "xhtml") {
			return "XHTML"
		}
	}
	
	return "HTML5" // Default to HTML5
}

func extractTextContent(n *html.Node) string {
	if n.Type == html.TextNode {
		return strings.TrimSpace(n.Data)
	}
	
	var text strings.Builder
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		text.WriteString(extractTextContent(c))
	}
	return strings.TrimSpace(text.String())
}

func analyzeLink(n *html.Node, data *CrawlData, baseURL *url.URL) {
	var href string
	for _, attr := range n.Attr {
		if attr.Key == "href" {
			href = attr.Val
			break
		}
	}

	if href == "" {
		return
	}

	// Parse the link URL
	linkURL, err := url.Parse(href)
	if err != nil {
		return
	}

	// Resolve relative URLs
	resolvedURL := baseURL.ResolveReference(linkURL)

	// Check if it's internal or external
	if resolvedURL.Host == baseURL.Host {
		data.InternalLinks++
	} else {
		data.ExternalLinks++
	}

	// Check if link is accessible (basic check)
	if !isAccessibleLink(resolvedURL.String()) {
		data.InaccessibleLinks++
		data.BrokenLinks = append(data.BrokenLinks, models.BrokenLink{
			URL:          resolvedURL.String(),
			StatusCode:   0, // Will be updated with actual status
			ErrorMessage: "Link check failed",
		})
	}
}

func isAccessibleLink(linkURL string) bool {
	// Skip certain types of links
	if strings.HasPrefix(linkURL, "mailto:") ||
		strings.HasPrefix(linkURL, "tel:") ||
		strings.HasPrefix(linkURL, "javascript:") ||
		strings.HasPrefix(linkURL, "#") {
		return true
	}

	// Create a quick HEAD request to check accessibility
	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	resp, err := client.Head(linkURL)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	// Consider 2xx and 3xx status codes as accessible
	return resp.StatusCode < 400
}

func isLoginForm(n *html.Node) bool {
	// Look for common login form indicators
	hasPasswordField := false
	hasUsernameField := false
	
	// Check form attributes
	for _, attr := range n.Attr {
		if attr.Key == "id" || attr.Key == "class" || attr.Key == "name" {
			lowerVal := strings.ToLower(attr.Val)
			if strings.Contains(lowerVal, "login") ||
				strings.Contains(lowerVal, "signin") ||
				strings.Contains(lowerVal, "auth") {
				return true
			}
		}
	}

	// Check for password and username/email fields
	checkInputs(n, &hasPasswordField, &hasUsernameField)
	
	return hasPasswordField && hasUsernameField
}

func checkInputs(n *html.Node, hasPassword, hasUsername *bool) {
	if n.Type == html.ElementNode && n.Data == "input" {
		var inputType, inputName string
		for _, attr := range n.Attr {
			if attr.Key == "type" {
				inputType = strings.ToLower(attr.Val)
			}
			if attr.Key == "name" || attr.Key == "id" {
				inputName = strings.ToLower(attr.Val)
			}
		}

		if inputType == "password" {
			*hasPassword = true
		}
		
		if inputType == "text" || inputType == "email" {
			if strings.Contains(inputName, "user") ||
				strings.Contains(inputName, "email") ||
				strings.Contains(inputName, "login") {
				*hasUsername = true
			}
		}
	}

	// Recursively check child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		checkInputs(c, hasPassword, hasUsername)
	}
}

func saveResults(urlID int, data *CrawlData) error {
	// First, delete any existing results for this URL
	_, err := database.DB.Exec("DELETE FROM crawl_results WHERE url_id = ?", urlID)
	if err != nil {
		return fmt.Errorf("failed to delete existing results: %v", err)
	}

	// Insert new results
	query := `
		INSERT INTO crawl_results (
			url_id, title, html_version, h1_count, h2_count, h3_count, 
			h4_count, h5_count, h6_count, internal_links, external_links, 
			inaccessible_links, has_login_form
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := database.DB.Exec(query,
		urlID,
		data.Title,
		data.HTMLVersion,
		data.HeadingCounts["h1"],
		data.HeadingCounts["h2"],
		data.HeadingCounts["h3"],
		data.HeadingCounts["h4"],
		data.HeadingCounts["h5"],
		data.HeadingCounts["h6"],
		data.InternalLinks,
		data.ExternalLinks,
		data.InaccessibleLinks,
		data.HasLoginForm,
	)
	if err != nil {
		return fmt.Errorf("failed to insert results: %v", err)
	}

	resultID, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get result ID: %v", err)
	}

	// Insert broken links
	for _, brokenLink := range data.BrokenLinks {
		_, err := database.DB.Exec(
			"INSERT INTO broken_links (result_id, url, status_code, error_message) VALUES (?, ?, ?, ?)",
			resultID,
			brokenLink.URL,
			brokenLink.StatusCode,
			brokenLink.ErrorMessage,
		)
		if err != nil {
			log.Printf("Failed to insert broken link: %v", err)
		}
	}

	return nil
}

func updateURLStatus(urlID int, status string) {
	_, err := database.DB.Exec("UPDATE urls SET status = ? WHERE id = ?", status, urlID)
	if err != nil {
		log.Printf("Failed to update URL status: %v", err)
	}
}
