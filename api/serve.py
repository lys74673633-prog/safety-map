#!/usr/bin/env python3
"""Oasi5 local dev server: static files + API (same handlers as Vercel)."""
from __future__ import annotations

import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from _lib import (
    PORT,
    ROOT,
    image_response,
    load_kric_key,
    load_odsay_key,
    resolve_api,
)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            super().do_GET()
            return

        params = urllib.parse.parse_qs(parsed.query)
        status, content_type, body = resolve_api(parsed.path, params)
        if content_type.startswith("image/"):
            image_response(self, status, body, content_type)
            return
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store" if status >= 400 else "public, max-age=120")
        self.end_headers()
        self.wfile.write(body)


def main():
    key = load_odsay_key()
    kric = load_kric_key()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Oasi5 server: http://127.0.0.1:{PORT}/index.html")
    print("API routes share logic with Vercel serverless functions under /api/*")
    if key:
        print("ODsay API key: loaded")
    else:
        print("ODsay API key: not set (set ODSAY_API_KEY or odsay-config.local.json)")
    if kric:
        print("KRIC API key: loaded")
    else:
        print("KRIC API key: not set (optional)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
