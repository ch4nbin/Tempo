package middleware

import (
	"net/http"
	"sync"
	"time"
)

var (
	rateLimiter = make(map[string]*clientLimit)
	rateLock    sync.Mutex
)

type clientLimit struct {
	requests  int
	resetTime time.Time
}

const (
	maxRequests = 10        // requests per window
	windowSize  = time.Minute
)

// RateLimit middleware to prevent API abuse
func RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get client IP
		clientIP := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			clientIP = forwarded
		}

		rateLock.Lock()
		defer rateLock.Unlock()

		now := time.Now()

		// Get or create client limit
		limit, exists := rateLimiter[clientIP]
		if !exists || now.After(limit.resetTime) {
			rateLimiter[clientIP] = &clientLimit{
				requests:  1,
				resetTime: now.Add(windowSize),
			}
		} else {
			limit.requests++
			if limit.requests > maxRequests {
				w.Header().Set("Retry-After", limit.resetTime.Format(time.RFC1123))
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

