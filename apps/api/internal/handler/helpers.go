package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

// Context key type to avoid collisions
// Using a custom type prevents accidentally using the same key
type contextKey string

const userIDKey contextKey = "userID"

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

// setUserIDInContext adds the user ID to the request context
// Used by auth middleware
func setUserIDInContext(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// getUserIDFromContext retrieves the user ID from the request context
// Returns nil if not authenticated
func getUserIDFromContext(ctx context.Context) *uuid.UUID {
	if value := ctx.Value(userIDKey); value != nil {
		if userID, ok := value.(uuid.UUID); ok {
			return &userID
		}
	}
	return nil
}

