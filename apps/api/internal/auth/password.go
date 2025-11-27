package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

// Password errors
var (
	ErrPasswordTooShort = errors.New("password must be at least 8 characters")
	ErrPasswordMismatch = errors.New("incorrect password")
)

// MinPasswordLength is the minimum allowed password length
const MinPasswordLength = 8

// HashPassword creates a bcrypt hash of a password
//
// HOW BCRYPT WORKS:
// 1. Generates a random "salt" (random bytes)
// 2. Combines password + salt
// 3. Runs through bcrypt algorithm (intentionally slow!)
// 4. Returns: $2a$10$salt...hash...
//
// WHY BCRYPT?
// - Slow by design: Takes ~100ms to hash (prevents brute force)
// - Includes salt: Same password = different hash each time
// - "Cost factor" adjustable: Can make it slower as CPUs get faster
// - Industry standard since 1999, still unbroken
//
// The "cost" parameter (10-12 typical) determines iterations:
// - Cost 10 = 2^10 = 1024 iterations
// - Cost 12 = 2^12 = 4096 iterations
// Higher = slower = more secure, but uses more CPU
func HashPassword(password string) (string, error) {
	// Validate password length first
	if len(password) < MinPasswordLength {
		return "", ErrPasswordTooShort
	}

	// Generate hash with default cost (10)
	// bcrypt.DefaultCost = 10, which is good for most cases
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

// VerifyPassword checks if a password matches a hash
//
// This is used during login:
// 1. Look up user by email
// 2. Get their password_hash from database
// 3. Call VerifyPassword(inputPassword, storedHash)
// 4. If match, user is authenticated!
func VerifyPassword(password, hash string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		// Don't expose whether user exists or password is wrong
		// This prevents "user enumeration" attacks
		return ErrPasswordMismatch
	}
	return nil
}

// PasswordMeetsRequirements checks if a password is strong enough
// In production, you might add more checks:
// - Contains uppercase, lowercase, numbers, symbols
// - Not in list of common passwords
// - Not similar to email/username
func PasswordMeetsRequirements(password string) error {
	if len(password) < MinPasswordLength {
		return ErrPasswordTooShort
	}
	// Add more checks here if needed
	return nil
}

