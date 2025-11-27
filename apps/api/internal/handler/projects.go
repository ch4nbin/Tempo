package handler

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// In-memory store (replace with database in production)
var (
	projects     = make(map[string]*Project)
	projectsLock sync.RWMutex
)

type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	VideoID     string    `json:"videoId,omitempty"`
	Effects     []Effect  `json:"effects"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Effect struct {
	ID        string             `json:"id"`
	Type      string             `json:"type"`
	Name      string             `json:"name"`
	StartTime float64            `json:"startTime"`
	EndTime   float64            `json:"endTime"`
	Params    map[string]float64 `json:"params"`
}

type CreateProjectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

type UpdateProjectRequest struct {
	Name        string   `json:"name,omitempty"`
	Description string   `json:"description,omitempty"`
	VideoID     string   `json:"videoId,omitempty"`
	Effects     []Effect `json:"effects,omitempty"`
}

func ListProjects(w http.ResponseWriter, r *http.Request) {
	projectsLock.RLock()
	defer projectsLock.RUnlock()

	list := make([]*Project, 0, len(projects))
	for _, p := range projects {
		list = append(list, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"projects": list,
		"total":    len(list),
	})
}

func CreateProject(w http.ResponseWriter, r *http.Request) {
	var req CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	project := &Project{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Effects:     []Effect{},
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}

	projectsLock.Lock()
	projects[project.ID] = project
	projectsLock.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(project)
}

func GetProject(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	projectsLock.RLock()
	project, exists := projects[projectID]
	projectsLock.RUnlock()

	if !exists {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func UpdateProject(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	projectsLock.Lock()
	defer projectsLock.Unlock()

	project, exists := projects[projectID]
	if !exists {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	var req UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.VideoID != "" {
		project.VideoID = req.VideoID
	}
	if req.Effects != nil {
		project.Effects = req.Effects
	}
	project.UpdatedAt = time.Now().UTC()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func DeleteProject(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	projectsLock.Lock()
	defer projectsLock.Unlock()

	if _, exists := projects[projectID]; !exists {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	delete(projects, projectID)
	w.WriteHeader(http.StatusNoContent)
}

