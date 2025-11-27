package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

var (
	videos     = make(map[string]*Video)
	videosLock sync.RWMutex
)

type Video struct {
	ID          string    `json:"id"`
	Filename    string    `json:"filename"`
	Size        int64     `json:"size"`
	ContentType string    `json:"contentType"`
	Duration    float64   `json:"duration,omitempty"`
	Width       int       `json:"width,omitempty"`
	Height      int       `json:"height,omitempty"`
	URL         string    `json:"url"`
	CreatedAt   time.Time `json:"createdAt"`
}

func UploadVideo(w http.ResponseWriter, r *http.Request) {
	// Limit upload size to 500MB
	r.Body = http.MaxBytesReader(w, r.Body, 500<<20)

	// Parse multipart form
	if err := r.ParseMultipartForm(500 << 20); err != nil {
		http.Error(w, "File too large (max 500MB)", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("video")
	if err != nil {
		http.Error(w, "No video file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate content type
	contentType := header.Header.Get("Content-Type")
	if contentType != "video/mp4" && contentType != "video/webm" && contentType != "video/quicktime" {
		http.Error(w, "Invalid video format. Supported: MP4, WebM, MOV", http.StatusBadRequest)
		return
	}

	// Generate unique ID
	videoID := uuid.New().String()

	// Create uploads directory if it doesn't exist
	uploadsDir := "./uploads"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		http.Error(w, "Failed to create uploads directory", http.StatusInternalServerError)
		return
	}

	// Save file
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".mp4"
	}
	filename := videoID + ext
	filePath := filepath.Join(uploadsDir, filename)

	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Failed to save video", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	size, err := io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Failed to save video", http.StatusInternalServerError)
		return
	}

	// Create video record
	video := &Video{
		ID:          videoID,
		Filename:    header.Filename,
		Size:        size,
		ContentType: contentType,
		URL:         "/uploads/" + filename,
		CreatedAt:   time.Now().UTC(),
	}

	videosLock.Lock()
	videos[videoID] = video
	videosLock.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(video)
}

func GetVideo(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "videoID")

	videosLock.RLock()
	video, exists := videos[videoID]
	videosLock.RUnlock()

	if !exists {
		http.Error(w, "Video not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(video)
}

func DeleteVideo(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "videoID")

	videosLock.Lock()
	video, exists := videos[videoID]
	if exists {
		delete(videos, videoID)
	}
	videosLock.Unlock()

	if !exists {
		http.Error(w, "Video not found", http.StatusNotFound)
		return
	}

	// Delete file from disk
	ext := filepath.Ext(video.Filename)
	if ext == "" {
		ext = ".mp4"
	}
	filePath := filepath.Join("./uploads", videoID+ext)
	os.Remove(filePath)

	w.WriteHeader(http.StatusNoContent)
}

