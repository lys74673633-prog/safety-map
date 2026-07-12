"""Merge facility-images.json into disability-access.js RECOMMENDATIONS."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS_PATH = ROOT / "disability-access.js"
JSON_PATH = ROOT / "facility-images.json"

images = json.loads(JSON_PATH.read_text(encoding="utf-8"))
text = JS_PATH.read_text(encoding="utf-8")

for name, url in images.items():
    if not url:
        continue
    url = url.replace("&amp;", "&").replace("\\u0026", "&")
    # Prefer larger thumbnails from Naver proxy URLs
    url = re.sub(r"type=f\d+_\d+", "type=w560_sharpen", url)
    url = re.sub(r"type=b\d+", "type=w560_sharpen", url)
    url = re.sub(r"type=a\d+", "type=w560_sharpen", url)

    escaped_name = re.escape(name)
    # Entry block starting with this name
    pattern = (
        r"(\{\s*kind:\s*'[^']+',\s*name:\s*'"
        + escaped_name
        + r"'[^}]*?)(\n\s*\})"
    )

    def add_image(match, u=url):
        block = match.group(1)
        if re.search(r"\bimage:\s*'", block):
            block = re.sub(r"image:\s*'[^']*'", "image: '" + u + "'", block)
        else:
            block = block.rstrip() + ",\n      image: '" + u + "'"
        return block + match.group(2)

    new_text, n = re.subn(pattern, add_image, text, count=1, flags=re.DOTALL)
    if n:
        text = new_text
    else:
        print("WARN: not found:", name)

JS_PATH.write_text(text, encoding="utf-8")
print("Patched", JS_PATH)
