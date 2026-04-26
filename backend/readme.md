# ⚡ verbaai API

A production-ready SaaS-style AI API platform providing NLP endpoints — **summarization**, **sentiment analysis**, **toxicity detection**, and **keyword extraction** — powered by OpenAI, with API key authentication, Redis rate limiting, response caching, and usage tracking.

---

## 🏗️ Architecture

verbaai follows a **modular monolith** architecture with clean separation of concerns:

```
src/
├── config/          # Environment, database, Redis, OpenAI, Swagger
├── controllers/     # Request/response handling (thin layer)
├── middlewares/      # Auth, API key, rate limiting, validation, errors
├── models/          # Data access layer (Prisma)
├── routes/          # Express route definitions + Swagger docs
├── services/        # Business logic + AI calls
├── utils/           # Logger, hashing, custom errors
├── validators/      # Zod schemas
├── app.js           # Express app factory
└── server.js        # Entry point
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Modular Monolith** | Keeps deployment simple while maintaining clean boundaries. Easy to extract into microservices later. |
| **Service Layer for AI** | `AIService._callModel()` is the only method touching OpenAI SDK. Swap to HuggingFace by changing one method. |
| **Hashed API Keys** | Raw keys are SHA-256 hashed before storage. Users see the key exactly once at creation. |
| **Fire-and-forget logging** | Usage logging and caching don't block the API response. Failures are logged but never break requests. |
| **Redis for rate limiting + caching** | Atomic INCR for rate limits. SHA-256 input hashing for cache keys. Graceful degradation if Redis is down. |
| **Zod validation** | Type-safe input validation with clear error messages. Parsed data replaces `req.body`. |
| **Prisma v5** | Stable ORM with type-safe queries, migrations, and a great developer experience. |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & Docker Compose (for PostgreSQL + Redis)
- **OpenAI API Key** ([get one here](https://platform.openai.com/api-keys))

### 1. Clone & Install

```bash
git clone https://github.com/rudracodesnits/verbaai.git
cd verbaai
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-real-api-key-here
JWT_SECRET=change-this-to-something-random
```

### 3. Start Infrastructure

```bash
docker compose up -d postgres redis
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start the Server

```bash
npm run dev
```

The server starts at `http://localhost:3000` with Swagger docs at `http://localhost:3000/docs`.

---

## 📡 API Reference

### Authentication Flow

#### 1. Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-04-26T..."
    },
    "token": "eyJhbGci..."
  },
  "message": "User registered successfully"
}
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Generate API Key

```bash
curl -X POST http://localhost:3000/auth/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Production Key"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "tfk_928c66700f28...",  
    "id": "uuid",
    "prefix": "tfk_928c6670",
    "name": "My Production Key",
    "active": true
  },
  "message": "API key created. Save it now — you will not be able to see it again."
}
```

> ⚠️ The full API key is shown **only once**. Store it securely.

#### 4. List API Keys

```bash
curl http://localhost:3000/auth/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Revoke API Key

```bash
curl -X DELETE http://localhost:3000/auth/keys/KEY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. View Usage Stats

```bash
curl http://localhost:3000/auth/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### NLP Endpoints

All NLP endpoints require the `x-api-key` header.

#### POST /api/summarize

```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals and humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "AI is machine-demonstrated intelligence, studied as intelligent agents that perceive environments and act to achieve goals."
  },
  "cached": false
}
```

#### POST /api/sentiment

```bash
curl -X POST http://localhost:3000/api/sentiment \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "I absolutely love this product! It is incredible."}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sentiment": "positive",
    "score": 0.95
  },
  "cached": false
}
```

#### POST /api/toxicity

```bash
curl -X POST http://localhost:3000/api/toxicity \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a perfectly normal comment."}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "toxic": false,
    "confidence": 0.98
  },
  "cached": false
}
```

#### POST /api/keywords

```bash
curl -X POST http://localhost:3000/api/keywords \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data."}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "keywords": ["machine learning", "artificial intelligence", "data", "systems"]
  },
  "cached": false
}
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| **API Key Auth** | SHA-256 hashed keys stored in DB. Raw key shown once at creation. |
| **JWT Auth** | For account management endpoints. 7-day expiry. |
| **Rate Limiting** | Redis-backed, 100 requests/day per user. Returns `X-RateLimit-*` headers. |
| **Helmet** | Sets secure HTTP headers. |
| **CORS** | Enabled with sensible defaults. |
| **Input Validation** | Zod schemas validate all inputs. Max 10,000 characters. |
| **Password Hashing** | bcrypt with 12 salt rounds. |

---

## 🗄️ Database Schema

```
┌──────────┐     ┌──────────┐     ┌────────────┐
│  users   │ 1:N │ api_keys │ 1:N │ usage_logs │
│──────────│────▶│──────────│────▶│────────────│
│ id (PK)  │     │ id (PK)  │     │ id (PK)    │
│ email    │     │ key_hash │     │ user_id    │
│ password │     │ prefix   │     │ api_key_id │
│ name     │     │ name     │     │ endpoint   │
│ created  │     │ user_id  │     │ tokens_used│
│ updated  │     │ active   │     │ cached     │
└──────────┘     │ created  │     │ created    │
                 └──────────┘     └────────────┘
```

---

## 🐳 Docker

### Infrastructure only (recommended for dev)

```bash
docker compose up -d postgres redis
npm run dev
```

### Full stack (app + infra)

```bash
docker compose --profile full up -d
```

---

## 📊 Rate Limiting

- **Limit**: 100 requests/day per user (configurable via `RATE_LIMIT_PER_DAY`)
- **Scope**: Per user, not per API key
- **Reset**: Midnight UTC
- **Headers**: Every response includes:
  - `X-RateLimit-Limit` — total allowed
  - `X-RateLimit-Remaining` — remaining requests
  - `X-RateLimit-Reset` — reset date

---

## ⚡ Caching

- Same input to the same endpoint returns a cached result
- Cache key: `cache:{endpoint}:{sha256(input)}`
- Default TTL: 1 hour (configurable via `CACHE_TTL`)
- Cache responses include `"cached": true`

---

## 📚 Swagger Documentation

Interactive API docs available at: **http://localhost:3000/docs**

Raw OpenAPI spec: **http://localhost:3000/docs.json**

---

## 📁 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `JWT_SECRET` | Yes | — | Secret for JWT signing |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiry |
| `RATE_LIMIT_PER_DAY` | No | `100` | Daily rate limit per user |
| `CACHE_TTL` | No | `3600` | Cache TTL in seconds |

---

## 🛠️ Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start with nodemon (auto-reload) |
| `start` | `npm start` | Production start |
| `db:migrate` | `npm run db:migrate` | Run Prisma migrations |
| `db:generate` | `npm run db:generate` | Regenerate Prisma client |
| `db:studio` | `npm run db:studio` | Open Prisma Studio GUI |

---

## License

ISC
