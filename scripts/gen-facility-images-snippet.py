import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "facility-images.json").read_text(encoding="utf-8"))
fixed = {}
for k, v in data.items():
    if not v:
        continue
    v = v.replace("&amp;", "&").replace("\\u0026", "&")
    v = re.sub(r"type=f\d+_\d+", "type=w560_sharpen", v)
    v = re.sub(r"type=b\d+", "type=w560_sharpen", v)
    v = re.sub(r"type=a\d+", "type=w560_sharpen", v)
    fixed[k] = v

lines = ["  var FACILITY_IMAGES = {"]
items = list(fixed.items())
for i, (k, v) in enumerate(items):
    comma = "," if i < len(items) - 1 else ""
    key = k.replace("\\", "\\\\").replace("'", "\\'")
    val = v.replace("\\", "\\\\").replace("'", "\\'")
    lines.append(f"    '{key}': '{val}'{comma}")
lines.append("  };")

snippet = "\n".join(lines)
(ROOT / "scripts" / "facility-images-snippet.js").write_text(snippet, encoding="utf-8")
print(f"Wrote {len(fixed)} entries")
