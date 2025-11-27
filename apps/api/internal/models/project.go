package models

import (
	"time"

	"github.com/google/uuid"
)

// Project represents a video editing project
type Project struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	OwnerID      uuid.UUID  `json:"owner_id" db:"owner_id"`
	Name         string     `json:"name" db:"name"`
	Description  *string    `json:"description,omitempty" db:"description"`
	ThumbnailURL *string    `json:"thumbnail_url,omitempty" db:"thumbnail_url"`
	Settings     JSONMap    `json:"settings" db:"settings"` // JSONB field
	IsDeleted    bool       `json:"-" db:"is_deleted"`      // Don't expose in API
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`

	// These are populated by JOINs, not stored in projects table
	Owner         *UserPublic     `json:"owner,omitempty"`
	Collaborators []Collaborator  `json:"collaborators,omitempty"`
	Role          string          `json:"role,omitempty"` // Current user's role
}

// JSONMap is a helper type for JSONB columns
// It's just a map that can hold any JSON structure
type JSONMap map[string]interface{}

// CreateProjectRequest is the payload for creating a project
type CreateProjectRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

// UpdateProjectRequest is the payload for updating a project
type UpdateProjectRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}

// ProjectListResponse is a paginated list of projects
type ProjectListResponse struct {
	Projects   []Project `json:"projects"`
	TotalCount int       `json:"total_count"`
	Page       int       `json:"page"`
	PerPage    int       `json:"per_page"`
}

