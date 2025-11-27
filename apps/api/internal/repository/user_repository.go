// Package repository contains database access logic
//
// WHY THE REPOSITORY PATTERN?
// - Separates "how to store data" from "what to do with data"
// - Easy to test: Can mock the repository in unit tests
// - Easy to change: Switch databases without touching business logic
// - Used at Google, Amazon, every large company
//
// The pattern:
// Handler (HTTP) → Service (Business Logic) → Repository (Database)
package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"tempo/internal/models"
)

// Common errors
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrEmailAlreadyExists = errors.New("email already exists")
)

// UserRepository handles user database operations
type UserRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new user into the database
func (r *UserRepository) Create(ctx context.Context, email, passwordHash, name string) (*models.User, error) {
	user := &models.User{}

	// SQL INSERT with RETURNING
	// RETURNING gives us the created row back (including generated ID, timestamps)
	// This is more efficient than INSERT then SELECT
	err := r.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, name)
		VALUES ($1, $2, $3)
		RETURNING id, email, password_hash, name, avatar_url, created_at, updated_at
	`, email, passwordHash, name).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		// Check for unique constraint violation (duplicate email)
		// PostgreSQL error code 23505 = unique_violation
		if err.Error() == `ERROR: duplicate key value violates unique constraint "users_email_key" (SQLSTATE 23505)` {
			return nil, ErrEmailAlreadyExists
		}
		return nil, err
	}

	return user, nil
}

// GetByID finds a user by their ID
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user := &models.User{}

	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, name, avatar_url, created_at, updated_at
		FROM users
		WHERE id = $1
	`, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return user, nil
}

// GetByEmail finds a user by their email
// Used during login
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}

	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, name, avatar_url, created_at, updated_at
		FROM users
		WHERE email = $1
	`, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return user, nil
}

// Update modifies a user's profile
func (r *UserRepository) Update(ctx context.Context, id uuid.UUID, name string, avatarURL *string) (*models.User, error) {
	user := &models.User{}

	// Use COALESCE to keep existing values if new value is NULL
	err := r.db.QueryRow(ctx, `
		UPDATE users
		SET name = $2, avatar_url = $3, updated_at = NOW()
		WHERE id = $1
		RETURNING id, email, password_hash, name, avatar_url, created_at, updated_at
	`, id, name, avatarURL).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return user, nil
}

// UpdatePassword changes a user's password
func (r *UserRepository) UpdatePassword(ctx context.Context, id uuid.UUID, newPasswordHash string) error {
	result, err := r.db.Exec(ctx, `
		UPDATE users
		SET password_hash = $2, updated_at = NOW()
		WHERE id = $1
	`, id, newPasswordHash)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

// Delete removes a user (use with caution!)
func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.Exec(ctx, `
		DELETE FROM users WHERE id = $1
	`, id)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

