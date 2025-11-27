// Package models defines data structures used throughout the application
//
// These structs map directly to database tables
// They're used to:
// 1. Read data from the database
// 2. Send data in API responses
// 3. Validate incoming requests
package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered user
// The `json` tags control how this struct serializes to JSON
// The `db` tags help with database scanning (some libraries use these)
type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"` // "-" means NEVER include in JSON!
	Name         string    `json:"name" db:"name"`
	AvatarURL    *string   `json:"avatar_url,omitempty" db:"avatar_url"` // Pointer for nullable fields
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserPublic is what we send to OTHER users (not yourself)
// Never expose email to other users!
type UserPublic struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
}

// ToPublic converts a full User to a public view
func (u *User) ToPublic() UserPublic {
	return UserPublic{
		ID:        u.ID,
		Name:      u.Name,
		AvatarURL: u.AvatarURL,
	}
}

// RegisterRequest is the expected payload for user registration
// We use separate structs for requests to:
// 1. Validate exactly what fields are expected
// 2. Avoid accidentally accepting extra fields
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// LoginRequest is the expected payload for login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse is returned after successful login/register
type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// RefreshRequest is used to get a new access token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

