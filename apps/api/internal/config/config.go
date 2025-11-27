// Package config handles application configuration
//
// WHY THIS PATTERN?
// Configuration should come from environment variables, not hardcoded values.
// This is one of the "12 Factor App" principles used at all FAANG companies.
// Benefits:
// 1. Same code runs in dev, staging, production (just change env vars)
// 2. Secrets stay out of code (security)
// 3. Easy to change without redeploying
package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all application configuration
// We use a struct to group related settings together
type Config struct {
	// Server settings
	Server ServerConfig

	// Database connection
	Database DatabaseConfig

	// JWT authentication
	JWT JWTConfig

	// External services
	Redis RedisConfig
}

// ServerConfig holds HTTP server settings
type ServerConfig struct {
	Port         string        // Which port to listen on (e.g., "8080")
	ReadTimeout  time.Duration // Max time to read request
	WriteTimeout time.Duration // Max time to write response
	Environment  string        // "development", "staging", "production"
}

// DatabaseConfig holds PostgreSQL connection settings
type DatabaseConfig struct {
	// Connection string format:
	// postgres://username:password@host:port/database?sslmode=disable
	URL string

	// Connection pool settings
	// A "pool" is a set of reusable connections
	// Creating new DB connections is slow, so we reuse them
	MaxOpenConns    int           // Max simultaneous connections
	MaxIdleConns    int           // Max idle (unused) connections to keep
	ConnMaxLifetime time.Duration // How long a connection can live
}

// JWTConfig holds authentication settings
type JWTConfig struct {
	// Secret key for signing tokens
	// MUST be random and kept secret!
	// If someone gets this, they can forge any user's identity
	SecretKey string

	// How long access tokens are valid
	// Short = more secure (less time if stolen)
	// Typical: 15 minutes to 1 hour
	AccessTokenTTL time.Duration

	// How long refresh tokens are valid
	// Longer than access tokens
	// Typical: 7 days to 30 days
	RefreshTokenTTL time.Duration
}

// RedisConfig holds Redis connection settings
// Redis is an in-memory database used for:
// 1. Caching (fast lookups)
// 2. Rate limiting (counting requests)
// 3. Session storage
type RedisConfig struct {
	URL string
}

// Load reads configuration from environment variables
// This is called once at startup
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("PORT", "8080"),
			ReadTimeout:  getDurationEnv("SERVER_READ_TIMEOUT", 10*time.Second),
			WriteTimeout: getDurationEnv("SERVER_WRITE_TIMEOUT", 10*time.Second),
			Environment:  getEnv("ENVIRONMENT", "development"),
		},
		Database: DatabaseConfig{
			URL:             getEnv("DATABASE_URL", "postgres://localhost:5432/tempo?sslmode=disable"),
			MaxOpenConns:    getIntEnv("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getIntEnv("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getDurationEnv("DB_CONN_MAX_LIFETIME", 5*time.Minute),
		},
		JWT: JWTConfig{
			SecretKey:       getEnv("JWT_SECRET", "CHANGE-THIS-IN-PRODUCTION-use-random-32-bytes"),
			AccessTokenTTL:  getDurationEnv("JWT_ACCESS_TTL", 15*time.Minute),
			RefreshTokenTTL: getDurationEnv("JWT_REFRESH_TTL", 7*24*time.Hour), // 7 days
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", "redis://localhost:6379"),
		},
	}
}

// Helper function: Get env var with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Helper function: Get integer env var
func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

// Helper function: Get duration env var
func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

