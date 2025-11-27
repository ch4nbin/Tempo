package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"tempo/internal/models"
	"tempo/internal/repository"
)

// ProjectHandler handles project CRUD operations
type ProjectHandler struct {
	projectRepo *repository.ProjectRepository
}

// NewProjectHandler creates a new project handler
func NewProjectHandler(projectRepo *repository.ProjectRepository) *ProjectHandler {
	return &ProjectHandler{projectRepo: projectRepo}
}

// Create creates a new project
// POST /api/projects
func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r.Context())
	if userID == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	var req models.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Project name is required")
		return
	}

	project, err := h.projectRepo.Create(r.Context(), *userID, req.Name, req.Description)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create project")
		return
	}

	respondJSON(w, http.StatusCreated, project)
}

// List returns all projects the user has access to
// GET /api/projects
func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r.Context())
	if userID == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	// Parse pagination parameters
	page := 1
	perPage := 20 // default

	if p := r.URL.Query().Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if pp := r.URL.Query().Get("per_page"); pp != "" {
		if parsed, err := strconv.Atoi(pp); err == nil && parsed > 0 && parsed <= 100 {
			perPage = parsed
		}
	}

	projects, totalCount, err := h.projectRepo.ListByUser(r.Context(), *userID, page, perPage)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to list projects")
		return
	}

	respondJSON(w, http.StatusOK, models.ProjectListResponse{
		Projects:   projects,
		TotalCount: totalCount,
		Page:       page,
		PerPage:    perPage,
	})
}

// Get returns a single project
// GET /api/projects/{id}
func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r.Context())
	if userID == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	// Get project ID from URL
	// chi.URLParam extracts path parameters
	projectIDStr := chi.URLParam(r, "id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	project, err := h.projectRepo.GetByID(r.Context(), projectID, *userID)
	if err != nil {
		if errors.Is(err, repository.ErrProjectNotFound) {
			respondError(w, http.StatusNotFound, "Project not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get project")
		return
	}

	// Also get collaborators
	collaborators, err := h.projectRepo.GetCollaborators(r.Context(), projectID)
	if err == nil {
		project.Collaborators = collaborators
	}

	respondJSON(w, http.StatusOK, project)
}

// Update modifies a project
// PATCH /api/projects/{id}
func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r.Context())
	if userID == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	projectIDStr := chi.URLParam(r, "id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var req models.UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	project, err := h.projectRepo.Update(r.Context(), projectID, *userID, req.Name, req.Description)
	if err != nil {
		if errors.Is(err, repository.ErrProjectNotFound) {
			respondError(w, http.StatusNotFound, "Project not found")
			return
		}
		if errors.Is(err, repository.ErrNotAuthorized) {
			respondError(w, http.StatusForbidden, "Not authorized to edit this project")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to update project")
		return
	}

	respondJSON(w, http.StatusOK, project)
}

// Delete removes a project
// DELETE /api/projects/{id}
func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r.Context())
	if userID == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	projectIDStr := chi.URLParam(r, "id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	err = h.projectRepo.Delete(r.Context(), projectID, *userID)
	if err != nil {
		if errors.Is(err, repository.ErrProjectNotFound) {
			respondError(w, http.StatusNotFound, "Project not found")
			return
		}
		if errors.Is(err, repository.ErrNotAuthorized) {
			respondError(w, http.StatusForbidden, "Only the owner can delete a project")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to delete project")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetCollaborators returns all collaborators for a project
// GET /api/projects/{id}/collaborators
func (h *ProjectHandler) GetCollaborators(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r.Context())
	if userID == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	projectIDStr := chi.URLParam(r, "id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	// First verify user has access
	_, err = h.projectRepo.GetByID(r.Context(), projectID, *userID)
	if err != nil {
		if errors.Is(err, repository.ErrProjectNotFound) {
			respondError(w, http.StatusNotFound, "Project not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to verify access")
		return
	}

	collaborators, err := h.projectRepo.GetCollaborators(r.Context(), projectID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get collaborators")
		return
	}

	respondJSON(w, http.StatusOK, collaborators)
}

