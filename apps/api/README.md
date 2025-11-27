# Tempo API

Go backend for the Tempo video editor.

## Running

```bash
# Install dependencies
go mod tidy

# Run the server
go run cmd/server/main.go
```

The server starts at `http://localhost:8080`

## API Endpoints

### Health
- `GET /health` — Health check

### Projects
- `GET /api/v1/projects` — List all projects
- `POST /api/v1/projects` — Create a project
- `GET /api/v1/projects/{id}` — Get a project
- `PUT /api/v1/projects/{id}` — Update a project
- `DELETE /api/v1/projects/{id}` — Delete a project

### Videos
- `POST /api/v1/videos/upload` — Upload a video (multipart form)
- `GET /api/v1/videos/{id}` — Get video info
- `DELETE /api/v1/videos/{id}` — Delete a video

### Effects
- `GET /api/v1/effects` — List available effects
- `GET /api/v1/effects/{id}` — Get effect details

### AI
- `POST /api/v1/ai/generate-effect` — Generate effects from a mood prompt

### Export
- `POST /api/v1/export` — Start an export job
- `GET /api/v1/export/{id}/status` — Get export status
- `GET /api/v1/export/{id}/download` — Download exported video

## Environment Variables

```bash
PORT=8080                    # Server port
AWS_S3_BUCKET=tempo-assets   # S3 bucket (future)
REDIS_URL=redis://localhost  # Redis URL (future)
OPENAI_API_KEY=sk-...        # OpenAI API key (future)
```

## Project Structure

```
apps/api/
├── cmd/
│   └── server/
│       └── main.go           # Entry point
├── internal/
│   ├── handler/              # HTTP handlers
│   │   ├── health.go
│   │   ├── projects.go
│   │   ├── videos.go
│   │   ├── effects.go
│   │   ├── ai.go
│   │   └── export.go
│   └── middleware/           # HTTP middleware
│       └── ratelimit.go
├── go.mod
├── go.sum
└── README.md
```
