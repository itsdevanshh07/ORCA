#!/usr/bin/env python3
"""Local, deterministic downstream response with the expected title/heading drift."""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith("/posts/"):
            self.send_error(404)
            return
        payload = {"userId": 7, "id": 1, "title": "Fixture title", "body": "Fixture body"}
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, _format, *_args):
        # Avoid logging request headers or application data.
        return


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8091), Handler).serve_forever()
