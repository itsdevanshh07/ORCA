# Deployment

## 1. Deploy the API on Render

1. Push this repository to your Git provider.
2. In Render, create **New > Web Service**, connect the repository, set the root directory to `orca-api`, and select **Docker**.
3. Add the API environment variables listed below. Use the internal PostgreSQL connection URL and credentials from your managed PostgreSQL database. Generate a unique JWT secret (at least 32 UTF-8 bytes), and enter your own Gemini API key. Keep all secret values in Render's environment settings.
4. Set the health check path to `/actuator/health` and deploy.
5. Verify with `curl https://<your-api-host>/actuator/health`.

## 2. Deploy the frontend on Vercel

1. Import the same repository in Vercel and set the project root directory to `orca-frontend`.
2. Add `NEXT_PUBLIC_API_URL` using the public HTTPS URL of the deployed API (origin only, no trailing slash).
3. Deploy. Open `/signup` to create the first account.

## Environment variables

API service (Render):

- `PORT` (Render supplies this; defaults to 8080 in the container)
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `GEMINI_API_KEY` (optional; healing falls back to the source payload when missing)
- `ORCA_GEMINI_PROVIDER` (optional; set to `google-genai` when providing `GEMINI_API_KEY`; otherwise leave unset or use `none`)
- `SPRING_AI_MODEL_CHAT` (optional primary model; defaults to `gemini-3.8-flash`; on repeated 503/UNAVAILABLE the API tries `gemini-2.0-flash` once)
- `ORCA_TARGET_API_BASE_URL` (optional; defaults to JSONPlaceholder)
- `ORCA_CORS_ALLOWED_ORIGINS` (comma-separated browser origins; set to the Vercel deployment origin)
- `ORCA_HEALING_TIMEOUT` (optional; defaults to PT25S)
- `DEMO_USERNAME` (optional demo account; omit demo variables to disable seeding)
- `DEMO_EMAIL` (optional demo account)
- `DEMO_PASSWORD` (optional demo account)
- `DEMO_API_KEY` (optional demo project key)

Frontend service (Vercel):

- `NEXT_PUBLIC_API_URL`

Only `NEXT_PUBLIC_API_URL` is public. Never put database credentials, JWT secrets, Gemini keys, or demo account values in frontend variables.
