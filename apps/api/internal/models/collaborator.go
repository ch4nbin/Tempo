package models

import (
	"time"

	"github.com/google/uuid"
)

// Role constants
// Using constants prevents typos and enables autocomplete
const (
	RoleOwner  = "owner"
	RoleEditor = "editor"
	RoleViewer = "viewer"
)

// InvitationStatus constants
const (
	StatusPending  = "pending"
	StatusAccepted = "accepted"
	StatusDeclined = "declined"
)

// Collaborator represents a user's access to a project
type Collaborator struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	ProjectID uuid.UUID  `json:"project_id" db:"project_id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Role      string     `json:"role" db:"role"`
	InvitedBy *uuid.UUID `json:"invited_by,omitempty" db:"invited_by"`
	Status    string     `json:"status" db:"status"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`

	// Populated by JOINs
	User *UserPublic `json:"user,omitempty"`
}

// Invitation represents a pending invitation
type Invitation struct {
	ID        uuid.UUID `json:"id" db:"id"`
	ProjectID uuid.UUID `json:"project_id" db:"project_id"`
	Email     string    `json:"email" db:"email"`
	InvitedBy uuid.UUID `json:"invited_by" db:"invited_by"`
	Role      string    `json:"role" db:"role"`
	Token     uuid.UUID `json:"-" db:"token"` // Never expose token in API!
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// Populated by JOINs
	Project   *Project    `json:"project,omitempty"`
	InvitedByUser *UserPublic `json:"invited_by_user,omitempty"`
}

// InviteRequest is the payload for inviting a collaborator
type InviteRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"` // "editor" or "viewer"
}

// InviteResponse is returned after creating an invitation
type InviteResponse struct {
	Invitation Invitation `json:"invitation"`
	InviteLink string     `json:"invite_link"` // Full URL to accept
}

// CanEdit returns true if the role allows editing
func CanEdit(role string) bool {
	return role == RoleOwner || role == RoleEditor
}

// CanManage returns true if the role allows managing collaborators
func CanManage(role string) bool {
	return role == RoleOwner
}

