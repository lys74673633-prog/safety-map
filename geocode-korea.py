"""Re-geocode help facilities using facility name + Korean address for Google Maps accuracy."""
import json
import re
import time
import urllib.parse
import urllib.request

PLACE_PATTERN = re.compile(
    r'\{\s*name:\s*"([^"]*)",\s*address:\s*"([^"]*)",\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+),\s*type:\s*"([^"]*)",\s*category:\s*"([^"]*)",\s*description:\s*"([^"]*)"\s*\}'
)


def parse_places(content):
    places = []
    for m in PLACE_PATTERN.finditer(content):
        places.append({
            "name": m.group(1),
            "address": m.group(2),
            "lat": float(m.group(3)),
            "lng": float(m.group(4)),
            "type": m.group(5),
            "category": m.group(6),
            "description": m.group(7),
        })
    return places


def geocode(query):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1, "countrycodes": "kr", "addressdetails": 0}
    )
    req = urllib.request.Request(url, headers={"User-Agent": "safety-map-oasis/1.0 (school project)"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read().decode())
    if not data:
        return None
    return round(float(data[0]["lat"]), 6), round(float(data[0]["lon"]), 6)


def build_queries(place):
    name = place["name"]
    addr = place["address"]
    return [
        name + ", " + addr,
        addr,
    ]


def main():
    content = open("places.js", encoding="utf-8").read()
    places = parse_places(content)
    updated = 0

    for i, place in enumerate(places):
        if place["type"] != "help":
            continue
        old = (place["lat"], place["lng"])
        coords = None
        used = None
        for q in build_queries(place):
            try:
                coords = geocode(q)
                if coords:
                    used = q
                    break
            except Exception as e:
                print(f"ERR [{place['name']}] {q[:40]}: {e}")
            time.sleep(1.05)

        if coords:
            place["lat"], place["lng"] = coords
            if coords != old:
                updated += 1
                print(f"OK {place['name'][:24]:24} {old} -> {coords}  ({used[:50]})")
            else:
                print(f"=  {place['name'][:24]:24} unchanged")
        else:
            print(f"MISS {place['name']} kept {old}")

    header_end = content.index("var places = [")
    footer_start = content.index("];", header_end) + 3
    lines = ["var places = ["]
    for p in places:
        lines.append(
            '  { name: "%s", address: "%s", lat: %s, lng: %s, type: "%s", category: "%s", description: "%s" },'
            % (p["name"], p["address"], p["lat"], p["lng"], p["type"], p["category"], p["description"])
        )
    lines.append("];")
    open("places.js", "w", encoding="utf-8").write(content[:header_end] + "\n".join(lines) + content[footer_start:])
    print(f"\nDone. Updated {updated} help facility coordinates.")


if __name__ == "__main__":
    main()
