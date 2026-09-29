# O.R.C.A.

O.R.C.A. (Operational Resilience & Cloud Adaptation) is a full-stack API gateway prototype. Its Spring Boot/WebFlux API proxies downstream JSON APIs, validates responses against a schema, and uses Gemini to create and cache a repair when fields drift. A Next.js dashboard supports signup, login, project/API-key management, healing metrics, and reverting a repair.

## Stack

- Java 17+, Spring Boot, Spring WebFlux, Spring Data JPA, PostgreSQL
- Spring AI Google GenAI (`gemini-2.5-flash`)
- Resilience4j circuit breaker
- Next.js, React, Tailwind CSS

## Prerequisites

- Java 17 or newer
- Node.js 20.9 or newer and npm
- PostgreSQL 14 or newer
- A Gemini API key for live healing (the rest of the app can start without a usable key, but healing calls will fall back to the original response)

## Local setup

### 1. Create a PostgreSQL database

Create a database named `orca`, for example in `psql`:

```sql
CREATE DATABASE orca;
```

### 2. Configure the API

From `orca-api`, copy `.env.example` to `.env` (`cp .env.example .env`; Windows PowerShell: `Copy-Item .env.example .env`) and set the database URL, username, password, Gemini key, and a private JWT secret. Spring Boot imports this file through `application.yml`; ordinary environment variables are also supported and take precedence. Do not commit `.env`.

Generate a JWT secret locally, for example with `openssl rand -base64 48`, and put the result in `JWT_SECRET`. The value must be at least 32 bytes when encoded as UTF-8.

Start the API from `orca-api`:

```bash
./mvnw spring-boot:run
```

On Windows, use `./mvnw.cmd spring-boot:run`. The API listens on `http://localhost:8080`.

### 3. Configure and start the frontend

From `orca-frontend`, copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_API_URL` to the API's browser-reachable base URL; this value is public and must not contain secrets.

```bash
npm ci
npm run dev
```

The dashboard listens on `http://localhost:3000`. Open `/signup` to create an account, then `/login` or `/projects` to access workspaces.

## Verification

Run backend verification:

```bash
cd orca-api
./mvnw clean verify
```

Run frontend verification:

```bash
cd orca-frontend
npm ci
npm run build
```

To check Gemini independently, export `GEMINI_API_KEY` in the current shell and run `python scripts/gemini-smoke-test.py` from `orca-api`. The script never prints the key or response body. With the API and PostgreSQL running and a valid Gemini key in the environment, `python scripts/full-flow-smoke.py` exercises signup, login, project creation, missing-auth checks, drift healing, cache reuse, and surgery revert. For a deterministic downstream fixture, run `python scripts/mock-downstream.py` and set `ORCA_TARGET_API_BASE_URL=http://127.0.0.1:8091` before starting the API.

## API flow

- `POST /api/auth/signup` and `POST /api/auth/login` issue JWTs.
- `/api/projects`, `/api/orca/**`, `/api/metrics`, and `/api/surgeries/**` require a bearer JWT.
- `GET /posts/{id}` requires the tenant's `x-api-key` header. The gateway checks schema drift, calls Gemini on a cache miss, and returns the original downstream body if generation fails or the repair is invalid.
- `POST /api/surgeries/{id}/revert` marks the healing record `REJECTED_BY_DEV` and invalidates its cached patch.

The default downstream API is JSONPlaceholder. Set `ORCA_TARGET_API_BASE_URL` in `orca-api/.env` to use another compatible service.

## Deployment status

This repository has no live frontend URL configured. The checked-in frontend example points to a local API URL for development. A deployment needs a reachable backend, managed PostgreSQL, server-side Gemini/JWT/database secrets, and a frontend `NEXT_PUBLIC_API_URL` set to the deployed API origin. No deployment has been performed.
