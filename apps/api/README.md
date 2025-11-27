# Tempo API

The Go backend for Tempo - a real-time collaborative video editor.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         HTTP Layer                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Auth   │  │ Project │  │  Video  │  │  Collaboration  │ │
│  │ Handler │  │ Handler │  │ Handler │  │     Handler     │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
├───────┼────────────┼────────────┼─────────────────┼─────────┤
│       │            │            │                 │         │
│  ┌────▼────────────▼────────────▼─────────────────▼────┐    │
│  │                    Middleware                        │    │
│  │  (Auth, Logging, Rate Limiting, CORS, Recovery)     │    │
│  └─────────────────────────┬───────────────────────────┘    │
├────────────────────────────┼────────────────────────────────┤
│                            │         Business Logic         │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │                   Repositories                       │    │
│  │  (UserRepo, ProjectRepo, CollaboratorRepo)          │    │
│  └─────────────────────────┬───────────────────────────┘    │
├────────────────────────────┼────────────────────────────────┤
│                            │         Data Layer             │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │                    PostgreSQL                        │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Technologies

| Technology | Purpose | Why Used at FAANG |
|------------|---------|-------------------|
| **Go** | Backend language | Google created it; used at Uber, Twitch, Cloudflare |
| **PostgreSQL** | Database | ACID compliance, complex queries, everywhere |
| **JWT** | Authentication | Stateless auth, scales horizontally |
| **bcrypt** | Password hashing | Industry standard, slow-by-design |
| **chi** | HTTP router | Lightweight, idiomatic Go, great middleware |

## 📁 Project Structure

```
apps/api/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/                 # Private application code
│   ├── auth/
│   │   ├── jwt.go           # JWT token generation/validation
│   │   └── password.go      # Password hashing (bcrypt)
│   ├── config/
│   │   └── config.go        # Environment configuration
│   ├── database/
│   │   ├── database.go      # PostgreSQL connection pool
│   │   └── schema.sql       # Database schema
│   ├── handler/
│   │   ├── auth_handler.go  # Auth endpoints
│   │   ├── project_handler.go
│   │   └── helpers.go       # Response utilities
│   ├── middleware/
│   │   └── auth.go          # JWT verification middleware
│   ├── models/
│   │   ├── user.go          # User data structures
│   │   ├── project.go
│   │   └── collaborator.go
│   └── repository/
│       ├── user_repository.go
│       └── project_repository.go
├── go.mod
├── go.sum
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL 15+ (or use Neon/Supabase for hosted)
- (Optional) Docker for local development

### Setup

1. **Clone and navigate:**
   ```bash
   cd apps/api
   ```

2. **Copy environment file:**
   ```bash
   cp env.example .env
   ```

3. **Set up PostgreSQL:**
   
   Option A - Docker:
   ```bash
   docker run -d \
     --name tempo-db \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=tempo \
     -p 5432:5432 \
     postgres:15
   ```
   
   Option B - Neon (free hosted):
   1. Go to [neon.tech](https://neon.tech)
   2. Create a project
   3. Copy the connection string to `.env`

4. **Install dependencies:**
   ```bash
   go mod download
   ```

5. **Run the server:**
   ```bash
   go run cmd/server/main.go
   ```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List your projects |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/collaborators` | List collaborators |

## 🔐 Authentication Flow

```
1. User registers/logs in
   └── Server returns: { access_token, refresh_token }

2. Client stores tokens
   └── access_token: In memory (short-lived, 15min)
   └── refresh_token: In httpOnly cookie or secure storage (7 days)

3. Client makes API requests
   └── Header: Authorization: Bearer <access_token>

4. When access_token expires
   └── Client calls /api/auth/refresh with refresh_token
   └── Server returns new access_token

5. When refresh_token expires
   └── User must log in again
```

## 🧪 Testing the API

```bash
# Register a user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create a project (with token)
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{"name":"My First Project"}'
```

## 🚢 Deployment

### Railway

1. Connect GitHub repo
2. Set environment variables
3. Add PostgreSQL add-on
4. Deploy!

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

FROM alpine:latest
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
```

## 📚 Learning Resources

- [Go by Example](https://gobyexample.com/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [chi Router Docs](https://go-chi.io/)
