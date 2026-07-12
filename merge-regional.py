"""Merge regional-places.json into places.js with geocoding"""
import json
import re
import time
import urllib.parse
import urllib.request

GEOCODE_OVERRIDES = {
    "구미역 인근 무단횡단 사고다발지": "구미역, 경상북도 구미시",
    "경주 대릉원": "경주 대릉원, 경상북도 경주시",
    "안동 하회마을": "안동 하회마을, 경상북도 안동시",
    "진주성": "진주성, 경상남도 진주시",
    "통영 동피랑항": "통영 동피랑, 경상남도 통영시",
}

FOOTER = """

places.forEach(function (p, i) {
  p.id = i;
  p.region = getRegionFromAddress(p.address);
});

if (typeof PlaceInfo !== 'undefined') {
  PlaceInfo.enrichPlaces(places);
}

function getSatelliteImageUrl(lat, lng) {
  var d = 0.006;
  var bbox = (lng - d) + "," + (lat - d) + "," + (lng + d) + "," + (lat + d);
  return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox="
    + bbox + "&bboxSR=4326&imageSR=4326&size=960,540&format=jpg&f=image";
}

function getStreetMapImageUrl(lat, lng) {
  var zoom = 16;
  var x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  var y = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
    / 2 * Math.pow(2, zoom)
  );
  return "https://tiles.osm.kr/hot/" + zoom + "/" + x + "/" + y + ".png";
}

function openPlacePage(id) {
  window.open("place.html?id=" + id, "_blank");
}
"""


def parse_places(content):
    places = []
    pattern = re.compile(
        r'\{\s*name:\s*"([^"]*)",\s*address:\s*"([^"]*)",\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+),\s*type:\s*"([^"]*)",\s*category:\s*"([^"]*)",\s*description:\s*"([^"]*)"\s*\}'
    )
    for m in pattern.finditer(content):
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
        {"q": query, "format": "json", "limit": 1, "countrycodes": "kr"}
    )
    req = urllib.request.Request(url, headers={"User-Agent": "oasis-safety-map/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    if not data:
        return None
    return float(data[0]["lat"]), float(data[0]["lon"])


def format_places_js(places):
    lines = ["var places = ["]
    for p in places:
        lines.append(
            '  { name: "%s", address: "%s", lat: %s, lng: %s, type: "%s", category: "%s", description: "%s" },'
            % (p["name"], p["address"], p["lat"], p["lng"], p["type"], p["category"], p["description"])
        )
    lines.append("];")
    return "\n".join(lines)


def main():
    content = open("places.js", encoding="utf-8").read()
    header = content.split("var places =")[0]
    existing = parse_places(content)
    new_items = json.load(open("regional-places.json", encoding="utf-8"))
    names = {p["name"] for p in existing}
    merged = existing[:]
    added = 0
    for item in new_items:
        if item["name"] in names:
            continue
        names.add(item["name"])
        merged.append({**item, "lat": 0.0, "lng": 0.0})
        added += 1
    print(f"Added {added} regional places, total {len(merged)}")

    for i, place in enumerate(merged):
        if place["lat"] and place["lng"] and place["lat"] != 0.0:
            continue
        query = GEOCODE_OVERRIDES.get(place["name"], place["address"])
        try:
            coords = geocode(query)
            if coords:
                place["lat"], place["lng"] = round(coords[0], 6), round(coords[1], 6)
                print(f"[{i+1}] OK {place['name'][:30]}")
            else:
                print(f"[{i+1}] MISS {place['name']}")
        except Exception as e:
            print(f"[{i+1}] ERR {place['name']}: {e}")
        time.sleep(1.05)

    open("places.js", "w", encoding="utf-8").write(header + format_places_js(merged) + FOOTER)
    print("places.js updated")


if __name__ == "__main__":
    main()
