// Package handler contains HTTP request handlers
//
// Each handler:
// 1. Parses the incoming request
// 2. Validates the input
// 3. Calls the appropriate service/repository
// 4. Returns a JSON response
package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"tempo/internal/auth"
	"tempo/internal/models"
	"tempo/internal/repository"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	userRepo   *repository.UserRepository
	jwtManager *auth.JWTManager
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(userRepo *repository.UserRepository, jwtManager *auth.JWTManager) *AuthHandler {
	return &AuthHandler{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

// Register creates a new user account
// POST /api/auth/register
// Body: { "email": "...", "password": "...", "name": "..." }
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	// Parse JSON body
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondError(w, http.StatusBadRequest, "Email, password, and name are required")
		return
	}

	// Validate email format (basic check)
	if !strings.Contains(req.Email, "@") {
		respondError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// Validate password
	if err := auth.PasswordMeetsRequirements(req.Password); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Hash the password
	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Create the user
	user, err := h.userRepo.Create(r.Context(), req.Email, passwordHash, req.Name)
	if err != nil {
		if errors.Is(err, repository.ErrEmailAlreadyExists) {
			respondError(w, http.StatusConflict, "Email already registered")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Generate tokens
	accessToken, err := h.jwtManager.GenerateAccessToken(user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	refreshToken, err := h.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Return success response
	respondJSON(w, http.StatusCreated, models.AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// Login authenticates a user
// POST /api/auth/login
// Body: { "email": "...", "password": "..." }
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	// Find user by email
	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			// Don't reveal if email exists or not (security)
			respondError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to authenticate")
		return
	}

	// Verify password
	if err := auth.VerifyPassword(req.Password, user.PasswordHash); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Generate tokens
	accessToken, err := h.jwtManager.GenerateAccessToken(user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	refreshToken, err := h.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, models.AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// Refresh exchanges a refresh token for a new access token
// POST /api/auth/refresh
// Body: { "refresh_token": "..." }
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req models.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.RefreshToken == "" {
		respondError(w, http.StatusBadRequest, "Refresh token is required")
		return
	}

	// Validate the refresh token
	claims, err := h.jwtManager.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		if errors.Is(err, auth.ErrExpiredToken) {
			respondError(w, http.StatusUnauthorized, "Refresh token has expired")
			return
		}
		respondError(w, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	// Generate new access token
	accessToken, err := h.jwtManager.GenerateAccessToken(claims.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"access_token": accessToken,
	})
}

// Me returns the current user's profile
// GET /api/auth/me
// Requires: Authorization header with access token
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID := getUserIDFromContext(r.Context())
	if userID == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), *userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			respondError(w, http.StatusNotFound, "User not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

