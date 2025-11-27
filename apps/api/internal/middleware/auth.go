// Package middleware contains HTTP middleware functions
//
// WHAT IS MIDDLEWARE?
// Middleware is code that runs BEFORE (and sometimes after) your handlers.
// It's like a chain of functions that process the request.
//
// Request → Middleware 1 → Middleware 2 → Handler → Response
//
// Common uses:
// - Authentication (check if user is logged in)
// - Logging (log every request)
// - Rate limiting (prevent abuse)
// - CORS (cross-origin requests)
// - Compression (gzip responses)
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"tempo/internal/auth"
)

// Context key for user ID
type contextKey string

const userIDKey contextKey = "userID"

// AuthMiddleware checks for a valid JWT token
// If valid, adds the user ID to the request context
// If invalid, returns 401 Unauthorized
type AuthMiddleware struct {
	jwtManager *auth.JWTManager
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(jwtManager *auth.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{jwtManager: jwtManager}
}

// RequireAuth is middleware that requires authentication
// Use this for protected routes
func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get the Authorization header
		// Format: "Bearer <token>"
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Authorization header required"}`, http.StatusUnauthorized)
			return
		}

		// Extract the token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error": "Invalid authorization format. Use: Bearer <token>"}`, http.StatusUnauthorized)
			return
		}
		tokenString := parts[1]

		// Validate the token
		claims, err := m.jwtManager.ValidateAccessToken(tokenString)
		if err != nil {
			if err == auth.ErrExpiredToken {
				http.Error(w, `{"error": "Token has expired"}`, http.StatusUnauthorized)
				return
			}
			http.Error(w, `{"error": "Invalid token"}`, http.StatusUnauthorized)
			return
		}

		// Add user ID to context
		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		
		// Call the next handler with the updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalAuth is middleware that checks for auth but doesn't require it
// Use this for routes that work for both logged-in and anonymous users
func (m *AuthMiddleware) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				claims, err := m.jwtManager.ValidateAccessToken(parts[1])
				if err == nil {
					ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
					r = r.WithContext(ctx)
				}
			}
		}
		
		next.ServeHTTP(w, r)
	})
}

// GetUserID retrieves the user ID from the context
// Returns nil if not authenticated
func GetUserID(ctx context.Context) *uuid.UUID {
	if value := ctx.Value(userIDKey); value != nil {
		if userID, ok := value.(uuid.UUID); ok {
			return &userID
		}
	}
	return nil
}

