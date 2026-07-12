"""Fetch Naver images for all map places in places.js."""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLACES_JS = ROOT / "places.js"
OUT_JSON = ROOT / "place-images.json"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
HEADERS = {"User-Agent": UA, "Referer": "https://search.naver.com/"}

PATTERNS = [
    re.compile(r"https://ldb-phinf\.pstatic\.net/[^\"'<>\s]+"),
    re.compile(r"https://search\.pstatic\.net/common/\?[^\"'<>\s]+"),
    re.compile(r"https://[^\"'<>\s]*phinf\.pstatic\.net/[^\"'<>\s]+"),
]

SKIP = (
    "blogpfthumb", "favicon", "logo", "icon", "banner",
    "marketing_banner", "onlylogo", "app_150x150",
)


def parse_places(text: str):
    pattern = re.compile(
        r'\{\s*name:\s*"([^"]+)"\s*,\s*address:\s*"([^"]+)"',
        re.MULTILINE,
    )
    return [{"name": m.group(1), "address": m.group(2)} for m in pattern.finditer(text)]


def clean_query(name: str, address: str) -> str:
    q = name
    q = re.sub(r"\([^)]*\)", "", q)
    q = q.replace("무단횡단 사고다발지", "").replace("인근", "").replace("일대", "")
    q = re.sub(r"\s+", " ", q).strip()
    if len(q) < 4:
        q = name
    # Add city hint from address
    city = address.split()[0] if address else ""
    if city and city not in q:
        return f"{q} {city}"
    return q


def score_url(url: str) -> int:
    low = url.lower()
    if any(s in low for s in SKIP):
        return -100
    if "ldb-phinf" in low:
        return 100
    if "search.pstatic.net/common" in low:
        return 60
    if "phinf.pstatic.net" in low:
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


def naver_images(query: str, limit=3):
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
    ranked = sorted(set(urls), key=score_url, reverse=True)
    out = []
    for url in ranked:
        if score_url(url) <= 0:
            continue
        url = url.replace("&amp;", "&").replace("\\u0026", "&").rstrip("\\")
        url = re.sub(r"type=f\d+_\d+", "type=w560_sharpen", url)
        url = re.sub(r"type=b\d+", "type=w560_sharpen", url)
        url = re.sub(r"type=a\d+", "type=w560_sharpen", url)
        if url not in out:
            out.append(url)
        if len(out) >= limit:
            break
    return out


def main():
    text = PLACES_JS.read_text(encoding="utf-8")
    places = parse_places(text)
    existing = {}
    if OUT_JSON.exists():
        existing = json.loads(OUT_JSON.read_text(encoding="utf-8"))

    results = dict(existing)
    print(f"Places: {len(places)}")

    for i, place in enumerate(places, 1):
        name = place["name"]
        if name in results and results[name]:
            print(f"[{i}/{len(places)}] cached {name[:40]}")
            continue
        query = clean_query(name, place["address"])
        print(f"[{i}/{len(places)}] {name[:50]} -> {query[:60]}")
        imgs = naver_images(query)
        results[name] = imgs
        print(f"  -> {len(imgs)} img(s)")
        time.sleep(0.3)

    OUT_JSON.write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    found = sum(1 for p in places if results.get(p["name"]))
    print(f"\nDone: {found}/{len(places)} -> {OUT_JSON}")


if __name__ == "__main__":
    main()
