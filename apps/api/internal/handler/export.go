package handler

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

var (
	exports     = make(map[string]*ExportJob)
	exportsLock sync.RWMutex
)

type ExportJob struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"projectId"`
	Status    string    `json:"status"` // pending, processing, completed, failed
	Progress  int       `json:"progress"`
	URL       string    `json:"url,omitempty"`
	Error     string    `json:"error,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type StartExportRequest struct {
	ProjectID string `json:"projectId"`
	Format    string `json:"format"`   // mp4, webm
	Quality   string `json:"quality"`  // low, medium, high
}

func StartExport(w http.ResponseWriter, r *http.Request) {
	var req StartExportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ProjectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	// Create export job
	job := &ExportJob{
		ID:        uuid.New().String(),
		ProjectID: req.ProjectID,
		Status:    "pending",
		Progress:  0,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	exportsLock.Lock()
	exports[job.ID] = job
	exportsLock.Unlock()

	// In production, this would queue a job to a worker
	// For now, simulate processing in a goroutine
	go simulateExport(job.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(job)
}

func simulateExport(exportID string) {
	exportsLock.Lock()
	job := exports[exportID]
	job.Status = "processing"
	exportsLock.Unlock()

	// Simulate processing time
	for i := 0; i <= 100; i += 10 {
		time.Sleep(500 * time.Millisecond)
		exportsLock.Lock()
		job.Progress = i
		job.UpdatedAt = time.Now().UTC()
		exportsLock.Unlock()
	}

	exportsLock.Lock()
	job.Status = "completed"
	job.Progress = 100
	job.URL = "/exports/" + exportID + ".mp4"
	job.UpdatedAt = time.Now().UTC()
	exportsLock.Unlock()
}

func GetExportStatus(w http.ResponseWriter, r *http.Request) {
	exportID := chi.URLParam(r, "exportID")

	exportsLock.RLock()
	job, exists := exports[exportID]
	exportsLock.RUnlock()

	if !exists {
		http.Error(w, "Export job not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(job)
}

func DownloadExport(w http.ResponseWriter, r *http.Request) {
	exportID := chi.URLParam(r, "exportID")

	exportsLock.RLock()
	job, exists := exports[exportID]
	exportsLock.RUnlock()

	if !exists {
		http.Error(w, "Export job not found", http.StatusNotFound)
		return
	}

	if job.Status != "completed" {
		http.Error(w, "Export not ready", http.StatusBadRequest)
		return
	}

	// In production, redirect to S3/CloudFront URL
	// For now, return a placeholder
	http.Error(w, "Export download not implemented in development mode", http.StatusNotImplemented)
}

