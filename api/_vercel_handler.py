"""Shared Vercel BaseHTTPRequestHandler helper."""
from __future__ import annotations

import urllib.parse
from http.server import BaseHTTPRequestHandler

from _lib import resolve_api


class ApiHandler(BaseHTTPRequestHandler):
    """Subclass and set `api_path` to the canonical /api/... route."""

    api_path = "/api"

    def log_message(self, format, *args):  # noqa: A003
        return

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        status, content_type, body = resolve_api(self.api_path, params)
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store" if status >= 400 else "public, max-age=120")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)
