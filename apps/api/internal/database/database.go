// Package database handles PostgreSQL connections
//
// WHY PostgreSQL?
// - Most popular open-source relational database
// - Used at Apple, Instagram, Spotify, Reddit
// - ACID compliant (data integrity guaranteed)
// - Excellent for complex queries and relationships
//
// We use the "pgx" driver because:
// - Fastest Go PostgreSQL driver
// - Native PostgreSQL protocol (not generic database/sql)
// - Better error messages and type handling
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps the connection pool
// We use a wrapper struct so we can add helper methods
type DB struct {
	// Pool is a connection pool
	// WHY A POOL?
	// Creating a new database connection is slow (~50-100ms)
	// A pool keeps connections open and reuses them
	// This is CRITICAL for performance at scale
	Pool *pgxpool.Pool
}

// New creates a new database connection pool
// This is called once at application startup
func New(databaseURL string, maxConns, maxIdleConns int, connMaxLifetime time.Duration) (*DB, error) {
	// Context with timeout - don't wait forever to connect
	// If DB is down, fail fast rather than hanging
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel() // Always clean up contexts!

	// Parse the connection string into a config object
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Configure the connection pool
	config.MaxConns = int32(maxConns)
	config.MinConns = int32(maxIdleConns)
	config.MaxConnLifetime = connMaxLifetime

	// Create the pool
	// This doesn't actually connect yet - connections are lazy
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection by pinging the database
	// This ensures we can actually reach the database
	if err := pool.Ping(ctx); err != nil {
		pool.Close() // Clean up on failure
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{Pool: pool}, nil
}

// Close gracefully shuts down the connection pool
// Call this when the application is shutting down
func (db *DB) Close() {
	db.Pool.Close()
}

// Health checks if the database is reachable
// Used by health check endpoints (load balancers, Kubernetes)
func (db *DB) Health(ctx context.Context) error {
	// Ping with the provided context
	// This respects any timeout/deadline in the context
	return db.Pool.Ping(ctx)
}

// RunMigrations executes the schema.sql file
// In production, you'd use a migration tool like golang-migrate
// For simplicity, we're running raw SQL
func (db *DB) RunMigrations(ctx context.Context, schema string) error {
	_, err := db.Pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	return nil
}

