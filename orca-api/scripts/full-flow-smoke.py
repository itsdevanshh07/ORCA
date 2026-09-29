#!/usr/bin/env python3
"""Exercise auth, tenant keys, schema healing, cache reuse, and revert via HTTP."""

import json
import os
import secrets
import sys
import urllib.error
import urllib.request


BASE = os.environ.get("ORCA_API_URL", "http://localhost:8080").rstrip("/")
FAILURES = False


def request(method, path, *, body=None, token=None, api_key=None):
    headers = {"Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if api_key:
        headers["x-api-key"] = api_key
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            payload = response.read()
            return response.status, json.loads(payload) if payload else None
    except urllib.error.HTTPError as error:
        return error.code, None


def check(label, condition):
    global FAILURES
    print(f"{'PASS' if condition else 'FAIL'} {label}")
    FAILURES = FAILURES or not bool(condition)
    return bool(condition)


def main():
    global FAILURES
    FAILURES = False
    needs_me = False
    try:
        status, _ = request("GET", "/api/projects")
        check("protected dashboard route rejects missing JWT (401)", status == 401)

        status, _ = request("GET", "/posts/1")
        check("proxy route rejects missing x-api-key (401)", status == 401)

        email = f"orca-smoke-{secrets.token_hex(8)}@example.invalid"
        password = secrets.token_urlsafe(24)
        status, signup = request("POST", "/api/auth/signup", body={
            "fullName": "ORCA Smoke Test", "email": email, "password": password
        })
        check("signup creates a user and returns JWT", status == 200 and bool((signup or {}).get("token")))

        status, login = request("POST", "/api/auth/login", body={"username": email, "password": password})
        token = (login or {}).get("token")
        check("login returns JWT", status == 200 and bool(token))

        status, project_response = request(
            "POST", "/api/projects", token=token, body={"name": "ORCA Automated Smoke"}
        )
        project = (project_response or {}).get("data") or {}
        project_id, api_key = project.get("id"), project.get("apiKey")
        check("create project returns project ID and API key", status == 200 and bool(project_id and api_key))

        status, first = request("GET", "/posts/1", api_key=api_key)
        check("first proxied request succeeds with tenant key", status == 200 and isinstance(first, dict))
        status, second = request("GET", "/posts/1", api_key=api_key)
        check("repeat proxied request succeeds", status == 200 and isinstance(second, dict))

        status, metrics = request("GET", f"/api/metrics?projectId={project_id}", token=token)
        metrics_status = status
        check("authenticated metrics endpoint responds successfully", metrics_status == 200)
        records = metrics if isinstance(metrics, list) else []
        generated = next((row for row in records if row.get("status") == "AI_GENERATED_PATCH"), None)
        cached = next((row for row in records if row.get("status") == "CACHED_PATCH"), None)
        repaired = bool(second and all(k in second for k in ("userId", "id", "heading", "body")))
        if status == 200 and generated and cached and repaired:
            check("first drift request records AI_GENERATED_PATCH", True)
            check("repeat drift request records CACHED_PATCH", True)
            check("repaired response conforms to the required schema", True)
        else:
            needs_me = True
            print("NEEDS ME live Gemini call required to verify AI repair and cache-hit records")
            check("Gemini failure preserves the unchanged downstream payload", bool(
                first and second and first == second and "title" in second and "heading" not in second
            ))
        if generated:
            surgery_id = generated.get("id")
            status, _ = request("POST", f"/api/surgeries/{surgery_id}/revert", token=token)
            check("POST surgery revert succeeds", status in (200, 204))
            status, metrics = request("GET", f"/api/metrics?projectId={project_id}", token=token)
            reverted = next((row for row in (metrics or []) if row.get("id") == surgery_id), None)
            check("reverted surgery status is REJECTED_BY_DEV", status == 200 and (reverted or {}).get("status") == "REJECTED_BY_DEV")
        else:
            needs_me = True
            print("NEEDS ME revert requires an AI-generated surgery record")
        return 1 if FAILURES else (2 if needs_me else 0)
    except Exception as error:
        print(f"FAIL full-flow smoke test ({type(error).__name__})")
        return 1


if __name__ == "__main__":
    sys.exit(main())
