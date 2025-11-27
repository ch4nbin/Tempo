package main

import (
	"log"
	"net/http"
	"os"

	"github.com/ch4nbin/tempo/api/internal/handler"
	"github.com/ch4nbin/tempo/api/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://*.vercel.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", handler.HealthCheck)

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Projects
		r.Route("/projects", func(r chi.Router) {
			r.Get("/", handler.ListProjects)
			r.Post("/", handler.CreateProject)
			r.Get("/{projectID}", handler.GetProject)
			r.Put("/{projectID}", handler.UpdateProject)
			r.Delete("/{projectID}", handler.DeleteProject)
		})

		// Videos (upload handling)
		r.Route("/videos", func(r chi.Router) {
			r.Post("/upload", handler.UploadVideo)
			r.Get("/{videoID}", handler.GetVideo)
			r.Delete("/{videoID}", handler.DeleteVideo)
		})

		// Effects
		r.Route("/effects", func(r chi.Router) {
			r.Get("/", handler.ListEffects)
			r.Get("/{effectID}", handler.GetEffect)
		})

		// AI Generation
		r.Route("/ai", func(r chi.Router) {
			r.Use(middleware.RateLimit)
			r.Post("/generate-effect", handler.GenerateEffect)
		})

		// Export
		r.Route("/export", func(r chi.Router) {
			r.Post("/", handler.StartExport)
			r.Get("/{exportID}/status", handler.GetExportStatus)
			r.Get("/{exportID}/download", handler.DownloadExport)
		})
	})

	log.Printf("🎬 Tempo API server starting on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
