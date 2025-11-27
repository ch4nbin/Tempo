# Tempo

**A real-time collaborative video editor focused on temporal distortion effects.**

Built with WebGPU shaders, CRDT-based sync, and AI-powered effect generation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Go](https://img.shields.io/badge/Go-1.21-00ADD8)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

---

## Overview

Tempo is a browser-based video editor that specializes in **time-based visual effects** — motion trails, echo cascades, temporal glitches, and more. Multiple users can collaborate on the same timeline in real-time.

### Key Features

- **Temporal Effects Engine** — GPU-accelerated shaders for time smear, echo trails, liquid time, and glitch effects
- **Live Collaboration** — CRDT-powered timeline sync with cursor presence
- **AI Effect Generator** — Describe a mood, get effect parameters
- **Real-time Preview** — WebGPU-rendered preview with frame caching
- **Export Pipeline** — Server-side FFmpeg rendering for final output

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, WebGPU/WebGL |
| Collaboration | Yjs (CRDT), WebSocket |
| Backend | Go, FFmpeg, Redis |
| Storage | AWS S3, CloudFront CDN |
| AI | OpenAI API / Claude API |
| Infrastructure | Docker, Terraform, GitHub Actions |

---

## Project Structure

```
tempo/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Go backend
├── packages/
│   ├── effects/             # Shared effect definitions
│   ├── crdt/                # Timeline state types
│   └── shaders/             # WGSL shader sources
├── docker/                  # Container configs
├── terraform/               # Infrastructure as code
└── .github/workflows/       # CI/CD pipelines
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Go 1.21+
- pnpm 8+
- Docker (optional)

### Development

```bash
# Install dependencies
pnpm install

# Start the frontend
pnpm dev

# Start the backend (separate terminal)
cd apps/api && go run cmd/server/main.go
```

### Environment Variables

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# apps/api/.env
AWS_S3_BUCKET=tempo-assets
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
```

---

## Effects

| Effect | Description |
|--------|-------------|
| **Time Smear** | Motion trails that linger and fade |
| **Echo Cascade** | Recursive ghost copies offset in time |
| **Liquid Time** | Regions move at different speeds |
| **Temporal Glitch** | Frames from past/future bleed through |
| **Breath Sync** | Video pulses rhythmically |
| **Memory Fade** | Older frames desaturate progressively |

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│   Browser   │────▶│   Next.js   │────▶│     Go Backend      │
│   WebGPU    │     │   Frontend  │     │  FFmpeg + S3 + AI   │
└─────────────┘     └─────────────┘     └─────────────────────┘
       │                   │                      │
       └───────────────────┴──────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Yjs CRDT   │
                    │  Sync Layer │
                    └─────────────┘
```

---

## License

MIT © 2024

