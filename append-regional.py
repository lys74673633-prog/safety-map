"""Append regional verified places from regional-batch.json."""
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

BATCH_FILE = "regional-batch.json"


def geocode(query, retries=4):
    for attempt in range(retries):
        try:
            url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
                {"q": query, "format": "json", "limit": 1, "countrycodes": "kr"}
            )
            req = urllib.request.Request(url, headers={"User-Agent": "oasi5-safety-map/1.0"})
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode())
            if not data:
                return None
            return round(float(data[0]["lat"]), 6), round(float(data[0]["lon"]), 6)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                wait = 8 + attempt * 4
                print(f"RATE LIMIT, wait {wait}s...")
                time.sleep(wait)
                continue
            raise
    return None


def main():
    new_places = json.load(open(BATCH_FILE, encoding="utf-8"))
    content = open("places.js", encoding="utf-8").read()
    slice_ = content[content.index("var places"): content.index("];")]
    existing = set(re.findall(r'name:\s*"([^"]+)"', slice_))
    to_add = [p for p in new_places if p["name"] not in existing]
    print(f"Adding {len(to_add)} new places ({len(new_places) - len(to_add)} skipped)")

    lines = []
    for p in to_add:
        if p.get("category") == "보행er 안전":
            p["category"] = "보행자 안전"
        coords = None
        for q in [p["name"] + ", " + p["address"], p["address"]]:
            try:
                coords = geocode(q)
                if coords:
                    break
            except Exception as e:
                print(f"ERR {p['name']}: {e}")
            time.sleep(1.1)
        if not coords:
            print(f"SKIP (no coords): {p['name']}")
            continue
        lat, lng = coords
        lines.append(
            '  { name: "%s", address: "%s", lat: %s, lng: %s, type: "%s", category: "%s", description: "%s" },'
            % (p["name"], p["address"], lat, lng, p["type"], p["category"], p["description"])
        )
        print(f"OK {p['name'][:35]:35} {coords}")
        time.sleep(4)

    if not lines:
        print("Nothing to append.")
        return

    insert_at = content.index("\n];", content.index("var places = ["))
    body = content[:insert_at].rstrip()
    if body.endswith(","):
        body = body[:-1]
    new_content = body + ",\n" + "\n".join(lines) + "\n" + content[insert_at:]
    open("places.js", "w", encoding="utf-8").write(new_content)
    print(f"\nAppended {len(lines)} places to places.js")


if __name__ == "__main__":
    main()
