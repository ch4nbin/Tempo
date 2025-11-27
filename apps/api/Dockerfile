# =============================================================================
# TEMPO API - Multi-stage Dockerfile
# =============================================================================
# Multi-stage builds are standard at big tech because they:
# 1. Keep final image small (no build tools)
# 2. Faster deployments (smaller images to transfer)
# 3. More secure (less attack surface)
#
# This creates a ~15MB image vs ~1GB with build tools
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
# Use the full Go image with all build tools
FROM golang:1.21-alpine AS builder

# Install git (needed for some Go modules) and certificates
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first (Docker layer caching)
# If these don't change, Docker reuses the cached layer
COPY go.mod go.sum ./

# Download dependencies
# This layer is cached unless go.mod/go.sum change
RUN go mod download

# Copy source code
COPY . .

# Build the binary
# CGO_ENABLED=0: Pure Go, no C dependencies (needed for Alpine)
# -ldflags="-s -w": Strip debug info (smaller binary)
# -o server: Output filename
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
# Use a minimal base image (Alpine Linux ~5MB)
FROM alpine:3.19

# Install certificates (needed for HTTPS calls)
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user for security
# Never run as root in production!
RUN addgroup -g 1001 -S tempo && \
    adduser -u 1001 -S tempo -G tempo

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/server .

# Change ownership to non-root user
RUN chown -R tempo:tempo /app

# Switch to non-root user
USER tempo

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the server
CMD ["./server"]

