// Package main is the entry point for the Tempo API server
//
// This file:
// 1. Loads configuration from environment variables
// 2. Connects to the database
// 3. Sets up all the routes
// 4. Starts the HTTP server
//
// In production, this would also:
// - Set up graceful shutdown
// - Initialize logging
// - Connect to monitoring/tracing
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"tempo/internal/auth"
	"tempo/internal/config"
	"tempo/internal/database"
	"tempo/internal/handler"
	"tempo/internal/middleware"
	"tempo/internal/repository"
)

func main() {
	// Load .env file in development
	// In production, env vars are set by the deployment platform
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()
	log.Printf("Starting server in %s mode", cfg.Server.Environment)

	// Connect to database
	db, err := database.New(
		cfg.Database.URL,
		cfg.Database.MaxOpenConns,
		cfg.Database.MaxIdleConns,
		cfg.Database.ConnMaxLifetime,
	)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	log.Println("Connected to database")

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(
		cfg.JWT.SecretKey,
		cfg.JWT.AccessTokenTTL,
		cfg.JWT.RefreshTokenTTL,
	)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.Pool)
	projectRepo := repository.NewProjectRepository(db.Pool)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(userRepo, jwtManager)
	projectHandler := handler.NewProjectHandler(projectRepo)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	// Create router
	r := chi.NewRouter()

	// Global middleware
	// These run for EVERY request
	r.Use(chiMiddleware.Logger)      // Log all requests
	r.Use(chiMiddleware.Recoverer)   // Recover from panics
	r.Use(chiMiddleware.RequestID)   // Add unique ID to each request
	r.Use(chiMiddleware.RealIP)      // Get real IP from proxy headers
	r.Use(chiMiddleware.Timeout(30 * time.Second)) // Timeout requests

	// CORS configuration
	// CORS (Cross-Origin Resource Sharing) controls which websites
	// can call your API. Without this, browsers block cross-origin requests.
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://*.vercel.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Cache preflight for 5 minutes
	}))

	// Health check endpoint
	// Used by load balancers/Kubernetes to check if server is healthy
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := db.Health(r.Context()); err != nil {
			http.Error(w, "Database unhealthy", http.StatusServiceUnavailable)
			return
		}
		w.Write([]byte("OK"))
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Auth routes (public)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/refresh", authHandler.Refresh)

			// Protected auth routes
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequireAuth)
				r.Get("/me", authHandler.Me)
			})
		})

		// Project routes (protected)
		r.Route("/projects", func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			
			r.Post("/", projectHandler.Create)
			r.Get("/", projectHandler.List)
			r.Get("/{id}", projectHandler.Get)
			r.Patch("/{id}", projectHandler.Update)
			r.Delete("/{id}", projectHandler.Delete)
			r.Get("/{id}/collaborators", projectHandler.GetCollaborators)
		})
	})

	// Create the HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server listening on http://localhost:%s", cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	// This ensures in-flight requests complete before shutting down
	// SIGINT = Ctrl+C, SIGTERM = kill command / container orchestrator
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}
