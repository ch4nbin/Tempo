// Package auth handles authentication and authorization
//
// We use JWT (JSON Web Tokens) for authentication.
//
// HOW JWT WORKS:
// 1. User logs in with email/password
// 2. Server verifies password, creates a JWT token
// 3. JWT contains: user ID, expiration time, signature
// 4. Client stores JWT and sends it with every request
// 5. Server verifies signature to trust the token
//
// WHY JWT?
// - Stateless: Server doesn't need to store sessions
// - Scalable: Any server can verify tokens (no shared session store)
// - Used at Google, Facebook, every FAANG company
//
// JWT STRUCTURE (3 parts separated by dots):
// header.payload.signature
//
// Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
//
// Header: {"alg": "HS256", "typ": "JWT"}  (algorithm used)
// Payload: {"sub": "user-id", "exp": 1234567890}  (claims/data)
// Signature: HMAC-SHA256(header + payload, secret)  (verification)
package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Common errors
var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

// TokenType distinguishes access tokens from refresh tokens
type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

// Claims represents the data stored in a JWT
// jwt.RegisteredClaims includes standard fields: exp, iat, sub, etc.
type Claims struct {
	jwt.RegisteredClaims
	UserID    uuid.UUID `json:"user_id"`
	TokenType TokenType `json:"token_type"`
}

// JWTManager handles token creation and validation
type JWTManager struct {
	secretKey       []byte        // Secret for signing tokens
	accessTokenTTL  time.Duration // Access token lifetime
	refreshTokenTTL time.Duration // Refresh token lifetime
}

// NewJWTManager creates a new JWT manager
func NewJWTManager(secretKey string, accessTTL, refreshTTL time.Duration) *JWTManager {
	return &JWTManager{
		secretKey:       []byte(secretKey),
		accessTokenTTL:  accessTTL,
		refreshTokenTTL: refreshTTL,
	}
}

// GenerateAccessToken creates a new access token for a user
// Access tokens are short-lived (15 min - 1 hour)
// Used for API requests
func (m *JWTManager) GenerateAccessToken(userID uuid.UUID) (string, error) {
	return m.generateToken(userID, AccessToken, m.accessTokenTTL)
}

// GenerateRefreshToken creates a new refresh token for a user
// Refresh tokens are long-lived (7-30 days)
// Used to get new access tokens without re-login
func (m *JWTManager) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	return m.generateToken(userID, RefreshToken, m.refreshTokenTTL)
}

// generateToken is the internal token generation logic
func (m *JWTManager) generateToken(userID uuid.UUID, tokenType TokenType, ttl time.Duration) (string, error) {
	now := time.Now()

	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			// Subject: Who this token is for
			Subject: userID.String(),
			// IssuedAt: When the token was created
			IssuedAt: jwt.NewNumericDate(now),
			// ExpiresAt: When the token expires
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			// NotBefore: Token isn't valid before this time
			NotBefore: jwt.NewNumericDate(now),
		},
		UserID:    userID,
		TokenType: tokenType,
	}

	// Create the token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with our secret key
	// This creates the signature part of the JWT
	tokenString, err := token.SignedString(m.secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken verifies a token and returns its claims
func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			// Verify the signing method is what we expect
			// This prevents algorithm switching attacks
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, ErrInvalidToken
			}
			return m.secretKey, nil
		},
	)

	if err != nil {
		// Check if it's specifically an expiration error
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	// Extract and return the claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// ValidateAccessToken validates that a token is an access token
func (m *JWTManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != AccessToken {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// ValidateRefreshToken validates that a token is a refresh token
func (m *JWTManager) ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != RefreshToken {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

