package main

import (
	"log"
	"net/http"
	"os"

	"webcrawler/database"
	"webcrawler/handlers"
	"webcrawler/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	database.InitDB()

	// Initialize Gin router
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/login", handlers.Login)
		auth.POST("/register", handlers.Register)
	}

	// Protected routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		urls := protected.Group("/urls")
		{
			urls.GET("", handlers.GetURLs)
			urls.POST("", handlers.CreateURL)
			urls.GET("/:id", handlers.GetURL)
			urls.PUT("/:id/start", handlers.StartCrawling)
			urls.PUT("/:id/stop", handlers.StopCrawling)
			urls.DELETE("/:id", handlers.DeleteURL)
			urls.GET("/:id/results", handlers.GetResults)
		}

		// Bulk actions
		protected.POST("/bulk/delete", handlers.BulkDeleteURLs)
		protected.POST("/bulk/rerun", handlers.BulkRerunURLs)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
