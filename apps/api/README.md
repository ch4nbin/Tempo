# Tempo API

Go backend for Tempo video editor.

## Running

```bash
go run cmd/server/main.go
```

## Endpoints

- `GET /health` - Health check
- `GET /api/v1/projects` - List projects

## Environment Variables

- `PORT` - Server port (default: 8080)
- `AWS_S3_BUCKET` - S3 bucket for video assets
- `REDIS_URL` - Redis connection URL
- `OPENAI_API_KEY` - OpenAI API key for AI features

