import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://search.naver.com/"}

FIXES = {
    "블루보틀 성수": "블루보틀 성수 카페",
    "포스투커피 (이태원)": "포스투커피 이태원",
    "부산 카페 1987 (광안리)": "카페1987 광안리",
}

SKIP = ("logo", "icon", "banner", "blogpfthumb", "onlylogo", "marketing_banner")


def pick(query):
    url = (
        "https://search.naver.com/search.naver?where=image&query="
        + urllib.parse.quote(query)
    )
    html = urllib.request.urlopen(
        urllib.request.Request(url, headers=HEADERS), timeout=20
    ).read().decode("utf-8", "replace")
    urls = re.findall(
        r"https://(?:ldb-phinf|search\.pstatic\.net)[^\"'<>\s]+", html
    )
    for u in urls:
        low = u.lower()
        if any(x in low for x in SKIP):
            continue
        return u.replace("&amp;", "&").replace("type=f\\d+_\\d+", "type=w560_sharpen")
    return ""


data = json.loads((ROOT / "facility-images.json").read_text(encoding="utf-8"))
for name, query in FIXES.items():
    url = pick(query)
    if url:
        url = re.sub(r"type=f\d+_\d+", "type=w560_sharpen", url)
        data[name] = url
        print(name, "OK")

(ROOT / "facility-images.json").write_text(
    json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
)

# regenerate snippet + patch js
import subprocess

subprocess.run(["py", str(ROOT / "scripts" / "gen-facility-images-snippet.py")], check=True)

js = (ROOT / "disability-access.js").read_text(encoding="utf-8")
snippet = (ROOT / "scripts" / "facility-images-snippet.js").read_text(encoding="utf-8")
start = js.index("  var FACILITY_IMAGES = {")
end = js.index("  };", start) + len("  };")
js = js[:start] + snippet + js[end:]
(ROOT / "disability-access.js").write_text(js, encoding="utf-8")
print("Updated disability-access.js")
