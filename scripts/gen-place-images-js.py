"""Generate place-images.js from place-images.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "place-images.json").read_text(encoding="utf-8"))

lines = [
    "(function (global) {",
    "  var PLACE_IMAGES = {",
]
def rank_url(url: str) -> int:
    low = url.lower()
    if "ldb-phinf.pstatic.net/" in low and "search.pstatic" not in low:
        return 100
    if "type=w560_sharpen" in low:
        return 80
    if "type=sc960" in low:
        return 60
    return 10


def dedupe_urls(urls):
    seen = set()
    ordered = sorted(urls, key=rank_url, reverse=True)
    out = []
    for url in ordered:
        key = re.search(r"src=([^&]+)", url)
        key = key.group(1) if key else url
        if key in seen:
            continue
        seen.add(key)
        out.append(url)
    return out

items = [(n, dedupe_urls(u)) for n, u in data.items() if u]
for i, (name, urls) in enumerate(items):
    key = name.replace("\\", "\\\\").replace("'", "\\'")
    photo_objs = []
    for url in urls[:3]:
        url = url.replace("\\&", "&").replace("&amp;", "&").replace("\\u0026", "&")
        url = url.rstrip("\\")
        url = re.sub(r"type=f\d+_\d+", "type=w560_sharpen", url)
        url = re.sub(r"type=b\d+", "type=w560_sharpen", url)
        url = url.replace("\\", "\\\\").replace("'", "\\'")
        cap = name.replace("\\", "\\\\").replace("'", "\\'")
        photo_objs.append(
            "{ url: '" + url + "', thumb: '" + url
            + "', caption: '" + cap + " (네이버)', source: 'naver' }"
        )
    comma = "," if i < len(items) - 1 else ""
    lines.append("    '" + key + "': [" + ", ".join(photo_objs) + "]" + comma)

lines.extend([
    "  };",
    "  global.PLACE_IMAGES = PLACE_IMAGES;",
    "})(window);",
    "",
])

out = ROOT / "place-images.js"
out.write_text("\n".join(lines), encoding="utf-8")
count = sum(1 for v in data.values() if v)
print(f"Wrote {count} places -> {out}")
