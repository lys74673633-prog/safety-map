"""Fetch Naver image-search thumbnails for facility recommendations."""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS_PATH = ROOT / "disability-access.js"
OUT_JSON = ROOT / "facility-images.json"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
HEADERS = {"User-Agent": UA, "Referer": "https://search.naver.com/"}

PATTERNS = [
    re.compile(r"https://ldb-phinf\.pstatic\.net/[^\"'<>\s]+"),
    re.compile(r"https://search\.pstatic\.net/common/\?[^\"'<>\s]+"),
    re.compile(r"https://cafefiles\.naver\.net/[^\"'<>\s]+"),
    re.compile(r"https://[^\"'<>\s]*phinf\.pstatic\.net/[^\"'<>\s]+"),
]

SKIP_IN_URL = ("blogpfthumb", "blogfiles", "ssl.pstatic.net/sstatic", "favicon", "logo", "icon", "banner", "marketing_banner", "onlylogo")


def parse_recommendations(text: str):
    entries = []
    block_re = re.compile(
        r"\{\s*kind:\s*'([^']+)',\s*name:\s*'([^']+)'.*?(?:image:\s*'([^']*)')?.*?(?:photoQuery:\s*'([^']*)')?",
        re.DOTALL,
    )
    for m in re.finditer(
        r"\{\s*kind:\s*'([^']+)',\s*name:\s*'([^']+)'[^}]*?(?:image:\s*'([^']*)')?[^}]*?(?:photoQuery:\s*'([^']*)')?[^}]*?\}",
        text,
        re.DOTALL,
    ):
        kind, name = m.group(1), m.group(2)
        image = (m.group(3) or "").strip()
        photo_query = (m.group(4) or "").strip()
        entries.append(
            {"kind": kind, "name": name, "image": image, "photoQuery": photo_query}
        )
    return entries


def score_url(url: str) -> int:
    u = url.lower()
    if any(s in u for s in SKIP_IN_URL):
        return -100
    if "ldb-phinf" in u:
        return 100
    if "cafefiles" in u:
        return 90
    if "homebuilder" in u or "place" in u:
        return 80
    if "search.pstatic.net/common" in u:
        return 50
    if "phinf.pstatic.net" in u:
        return 40
    return 10


def pick_best(urls):
    ranked = sorted(set(urls), key=score_url, reverse=True)
    for url in ranked:
        if score_url(url) > 0:
            return url
    return ranked[0] if ranked else None


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", "replace")


def naver_image(query: str) -> str | None:
    q = urllib.parse.quote(query)
    urls = []
    for where in ("image", "nexearch"):
        try:
            html = fetch_html(
                f"https://search.naver.com/search.naver?where={where}&query={q}"
            )
            for pat in PATTERNS:
                urls.extend(pat.findall(html))
        except Exception as exc:
            print(f"  warn ({where}): {exc}")
    return pick_best(urls)


def main():
    text = JS_PATH.read_text(encoding="utf-8")
    entries = parse_recommendations(text)
    existing = {}
    if OUT_JSON.exists():
        existing = json.loads(OUT_JSON.read_text(encoding="utf-8"))

    results = dict(existing)
    missing = [e for e in entries if not e["image"]]
    print(f"Total: {len(entries)}, missing image: {len(missing)}")

    for i, entry in enumerate(missing, 1):
        name = entry["name"]
        if name in results and results[name]:
            print(f"[{i}/{len(missing)}] skip cached {name}")
            continue
        query = entry["photoQuery"] or name
        print(f"[{i}/{len(missing)}] {name} -> {query}")
        url = naver_image(query)
        results[name] = url or ""
        print(f"  -> {url[:100] if url else 'NOT FOUND'}")
        time.sleep(0.35)

    OUT_JSON.write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    found = sum(1 for e in missing if results.get(e["name"]))
    print(f"\nDone: {found}/{len(missing)} found -> {OUT_JSON}")


if __name__ == "__main__":
    main()
