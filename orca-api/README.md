# ORCA API

See the monorepo [setup and verification guide](../README.md). Spring Boot imports the local `.env` file during development and accepts ordinary environment variables for deployment. Start it with `./mvnw spring-boot:run` (Windows: `./mvnw.cmd spring-boot:run`).

For a Gemini API connectivity check, export `GEMINI_API_KEY` in the shell and run `python scripts/gemini-smoke-test.py`. For the authenticated end-to-end flow, run `python scripts/full-flow-smoke.py` while PostgreSQL, the API, and a working Gemini key are available.
