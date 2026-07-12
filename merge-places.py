"""Merge new places, dedupe by name, geocode, write places.js"""
import json
import re
import time
import urllib.parse
import urllib.request

GEOCODE_OVERRIDES = {
    "구로 만민중앙교회 인근 무단횡단 사고다발지": "구로구 구일로8길 66, 서울",
    "신설동역 인근 무단횡단 사고다발지": "신설동역, 서울특별시 동대문구",
    "영등포역 인근 무단횡단 사고다발지": "영등포역, 서울특별시 영등포구",
    "부전시장 앞 무단횡단 사고다발지": "부전시장, 부산광역시 부산진구",
    "부평역 사거리 무단횡단 사고다발지": "부평역, 인천광역시 부평구",
    "대전 은행네거리 무단횡단 사고다발지": "은행동, 대전광역시 중구",
    "부산 교대역 앞 횡단보도": "부산 교대역, 부산광역시 해운대구",
    "김해국제공항 인근": "김해국제공항, 경상남도 김해시",
    "강릉 안목해변": "강릉 안목해변, 강원특별자치도 강릉시",
    "마포역 인근 무단횡단 사고다발지": "마포역, 서울특별시 마포구",
    "강남역 인근 무단횡단 사고다발지": "강남역, 서울특별시 강남구",
    "종로3가역 인근 무단횡단 사고다발지": "종로3가역, 서울특별시 종로구",
    "서울역 환승구역 무단횡단 사고다발지": "서울역, 서울특별시 중구",
    "대구 반월당역 인근 무단횡단 사고다발지": "반월당역, 대구광역시 중구",
    "광주 금남로4가 무단횡단 사고다발지": "금남로4가, 광주광역시 동구",
    "창원중앙역 앞 무단횡단 사고다발지": "창원중앙역, 경상남도 창원시",
    "부산 서면역 인근 무단횡단 사고다발지": "서면역, 부산광역시 부산진구",
    "설악산 권금성 코스": "설악산 국립공원, 강원특별자치도 속초시",
}

HEADER = open("places.js", encoding="utf-8").read().split("var places =")[0]

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
    existing = parse_places(open("places.js", encoding="utf-8").read())
    new_items = json.load(open("new-places.json", encoding="utf-8"))
    names = {p["name"] for p in existing}
    merged = existing[:]
    added = 0
    for item in new_items:
        if item["name"] in names:
            continue
        names.add(item["name"])
        merged.append({**item, "lat": 0.0, "lng": 0.0})
        added += 1
    print(f"Added {added} new places, total {len(merged)}")

    for i, place in enumerate(merged):
        if place["lat"] and place["lng"] and place["lat"] != 0.0:
            continue
        query = GEOCODE_OVERRIDES.get(place["name"], place["address"])
        try:
            coords = geocode(query)
            if coords:
                place["lat"], place["lng"] = round(coords[0], 6), round(coords[1], 6)
                print(f"[{i+1}] OK {place['name'][:28]}")
            else:
                print(f"[{i+1}] MISS {place['name']}")
        except Exception as e:
            print(f"[{i+1}] ERR {place['name']}: {e}")
        time.sleep(1.05)

    open("places.js", "w", encoding="utf-8").write(HEADER + format_places_js(merged) + FOOTER)
    print("places.js updated")


if __name__ == "__main__":
    main()
