package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"tempo/internal/middleware"
)

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			// If encoding fails, log it (in production, use proper logging)
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}

// respondError sends a JSON error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{
		"error": message,
	})
}

// getUserIDFromContext retrieves the user ID from the request context
// Uses the middleware's GetUserID function to ensure consistency
func getUserIDFromContext(ctx context.Context) *uuid.UUID {
	return middleware.GetUserID(ctx)
}

