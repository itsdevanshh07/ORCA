#!/usr/bin/env python3
"""Call Gemini once using GEMINI_API_KEY from the process environment."""

import json
import os
import sys
import urllib.error
import urllib.request


MODEL = "gemini-2.5-flash"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def main() -> int:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Gemini smoke test: FAIL (GEMINI_API_KEY is not set in the environment)")
        return 2

    payload = {
        "contents": [{"parts": [{"text": 'Return exactly this JSON object: {"ok":true}'}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
    }
    request = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read())
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        if json.loads(text).get("ok") is not True:
            raise ValueError("model output did not match expected JSON")
        print(f"Gemini smoke test: PASS ({MODEL} returned valid JSON)")
        return 0
    except urllib.error.HTTPError as error:
        print(f"Gemini smoke test: FAIL (HTTP {error.code}; response body omitted)")
    except urllib.error.URLError as error:
        print(f"Gemini smoke test: FAIL (network error: {type(error.reason).__name__})")
    except Exception as error:
        # Exception messages can contain request details; report only the class.
        print(f"Gemini smoke test: FAIL ({type(error).__name__})")
    return 1


if __name__ == "__main__":
    sys.exit(main())
