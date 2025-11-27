package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"tempo/internal/models"
)

var (
	ErrProjectNotFound = errors.New("project not found")
	ErrNotAuthorized   = errors.New("not authorized to access this project")
)

// ProjectRepository handles project database operations
type ProjectRepository struct {
	db *pgxpool.Pool
}

// NewProjectRepository creates a new project repository
func NewProjectRepository(db *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{db: db}
}

// Create makes a new project
func (r *ProjectRepository) Create(ctx context.Context, ownerID uuid.UUID, name string, description *string) (*models.Project, error) {
	project := &models.Project{}

	// Use a transaction to create project AND add owner as collaborator
	// Transactions ensure both operations succeed or both fail
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	// Defer rollback - it's a no-op if we commit
	defer tx.Rollback(ctx)

	// Create the project
	err = tx.QueryRow(ctx, `
		INSERT INTO projects (owner_id, name, description)
		VALUES ($1, $2, $3)
		RETURNING id, owner_id, name, description, thumbnail_url, settings, is_deleted, created_at, updated_at
	`, ownerID, name, description).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Name,
		&project.Description,
		&project.ThumbnailURL,
		&project.Settings,
		&project.IsDeleted,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Add owner as collaborator with "owner" role
	_, err = tx.Exec(ctx, `
		INSERT INTO collaborators (project_id, user_id, role, status)
		VALUES ($1, $2, 'owner', 'accepted')
	`, project.ID, ownerID)
	if err != nil {
		return nil, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	project.Role = models.RoleOwner
	return project, nil
}

// GetByID retrieves a project by ID
// Also checks if the user has access
func (r *ProjectRepository) GetByID(ctx context.Context, projectID, userID uuid.UUID) (*models.Project, error) {
	project := &models.Project{}

	// JOIN with collaborators to:
	// 1. Check user has access
	// 2. Get user's role in one query
	err := r.db.QueryRow(ctx, `
		SELECT 
			p.id, p.owner_id, p.name, p.description, p.thumbnail_url, 
			p.settings, p.is_deleted, p.created_at, p.updated_at,
			c.role
		FROM projects p
		INNER JOIN collaborators c ON c.project_id = p.id
		WHERE p.id = $1 AND c.user_id = $2 AND c.status = 'accepted' AND p.is_deleted = false
	`, projectID, userID).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Name,
		&project.Description,
		&project.ThumbnailURL,
		&project.Settings,
		&project.IsDeleted,
		&project.CreatedAt,
		&project.UpdatedAt,
		&project.Role,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}

	return project, nil
}

// ListByUser returns all projects a user has access to
func (r *ProjectRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, perPage int) ([]models.Project, int, error) {
	// Calculate offset for pagination
	// Page 1, PerPage 10 → Offset 0
	// Page 2, PerPage 10 → Offset 10
	offset := (page - 1) * perPage

	// First, get total count
	var totalCount int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM projects p
		INNER JOIN collaborators c ON c.project_id = p.id
		WHERE c.user_id = $1 AND c.status = 'accepted' AND p.is_deleted = false
	`, userID).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// Then get the page of results
	rows, err := r.db.Query(ctx, `
		SELECT 
			p.id, p.owner_id, p.name, p.description, p.thumbnail_url,
			p.settings, p.is_deleted, p.created_at, p.updated_at,
			c.role
		FROM projects p
		INNER JOIN collaborators c ON c.project_id = p.id
		WHERE c.user_id = $1 AND c.status = 'accepted' AND p.is_deleted = false
		ORDER BY p.updated_at DESC
		LIMIT $2 OFFSET $3
	`, userID, perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		var p models.Project
		err := rows.Scan(
			&p.ID,
			&p.OwnerID,
			&p.Name,
			&p.Description,
			&p.ThumbnailURL,
			&p.Settings,
			&p.IsDeleted,
			&p.CreatedAt,
			&p.UpdatedAt,
			&p.Role,
		)
		if err != nil {
			return nil, 0, err
		}
		projects = append(projects, p)
	}

	return projects, totalCount, nil
}

// Update modifies a project (only if user has edit permission)
func (r *ProjectRepository) Update(ctx context.Context, projectID, userID uuid.UUID, name, description *string) (*models.Project, error) {
	// First check permissions
	var role string
	err := r.db.QueryRow(ctx, `
		SELECT c.role FROM collaborators c
		WHERE c.project_id = $1 AND c.user_id = $2 AND c.status = 'accepted'
	`, projectID, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotAuthorized
		}
		return nil, err
	}

	if !models.CanEdit(role) {
		return nil, ErrNotAuthorized
	}

	// Update the project
	project := &models.Project{}
	err = r.db.QueryRow(ctx, `
		UPDATE projects
		SET 
			name = COALESCE($2, name),
			description = COALESCE($3, description),
			updated_at = NOW()
		WHERE id = $1 AND is_deleted = false
		RETURNING id, owner_id, name, description, thumbnail_url, settings, is_deleted, created_at, updated_at
	`, projectID, name, description).Scan(
		&project.ID,
		&project.OwnerID,
		&project.Name,
		&project.Description,
		&project.ThumbnailURL,
		&project.Settings,
		&project.IsDeleted,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}

	project.Role = role
	return project, nil
}

// Delete soft-deletes a project (only owner can delete)
func (r *ProjectRepository) Delete(ctx context.Context, projectID, userID uuid.UUID) error {
	// Check if user is owner
	var role string
	err := r.db.QueryRow(ctx, `
		SELECT c.role FROM collaborators c
		WHERE c.project_id = $1 AND c.user_id = $2 AND c.status = 'accepted'
	`, projectID, userID).Scan(&role)
	if err != nil {
		return ErrNotAuthorized
	}

	if role != models.RoleOwner {
		return ErrNotAuthorized
	}

	// Soft delete (set is_deleted = true)
	result, err := r.db.Exec(ctx, `
		UPDATE projects SET is_deleted = true, updated_at = NOW()
		WHERE id = $1
	`, projectID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrProjectNotFound
	}

	return nil
}

// GetCollaborators returns all collaborators for a project
func (r *ProjectRepository) GetCollaborators(ctx context.Context, projectID uuid.UUID) ([]models.Collaborator, error) {
	rows, err := r.db.Query(ctx, `
		SELECT 
			c.id, c.project_id, c.user_id, c.role, c.invited_by, c.status, c.created_at,
			u.id, u.name, u.avatar_url
		FROM collaborators c
		INNER JOIN users u ON u.id = c.user_id
		WHERE c.project_id = $1 AND c.status = 'accepted'
		ORDER BY c.created_at
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	collaborators := []models.Collaborator{}
	for rows.Next() {
		var c models.Collaborator
		var user models.UserPublic
		err := rows.Scan(
			&c.ID, &c.ProjectID, &c.UserID, &c.Role, &c.InvitedBy, &c.Status, &c.CreatedAt,
			&user.ID, &user.Name, &user.AvatarURL,
		)
		if err != nil {
			return nil, err
		}
		c.User = &user
		collaborators = append(collaborators, c)
	}

	return collaborators, nil
}

