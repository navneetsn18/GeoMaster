# GeoMaster 🌍 — Geography Knowledge Game

A full-stack geography quiz game. Test your knowledge of world countries, continents, and regions.

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, react-simple-maps
- **Backend**: Spring Boot 3, Java 21, PostgreSQL, Flyway, JWT auth
- **Infrastructure**: Docker Compose

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 18+
- Java 21 (for local backend dev)

### Run with Docker Compose (recommended)
```bash
cd /path/to/map
docker-compose up --build
```
Backend: http://localhost:8080
Frontend: run separately (below)

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

### Run Backend Locally (without Docker)
Start PostgreSQL:
```bash
docker-compose up postgres
```
Then run Spring Boot:
```bash
cd backend
mvn spring-boot:run
```

## Game Modes
- **World** — Guess all 195 countries on the world map
- **Africa** — 54 African countries
- **Asia** — 48 Asian countries
- **Europe** — 44 European countries
- **Americas** — 35 countries (North + South)
- **Oceania** — 14 countries

## Scoring
- Correct answer: 100 base points + up to 50 time bonus (decreases after 3s)
- Streak multipliers: 5+ streak = 1.5x, 10+ = 2x, 20+ = 3x
- Wrong answer: 0 points, streak reset

## API Endpoints
See `docs/api-contracts.md` for full API reference.

## Running Tests
```bash
cd backend
mvn test
```

## Smoke Test
```bash
# Requires backend running at localhost:8080 and jq installed
chmod +x scripts/smoke-test.sh
./scripts/smoke-test.sh
```
