"""Remove example/unverified places and geocode addresses via OpenStreetMap Nominatim."""
import json
import re
import time
import urllib.parse
import urllib.request

REMOVE_NAMES = {
    "GS25 종각역점 (아동안전지킴이집)",
    "CU 강남역점 (아동안전지킴이집)",
    "GS25 신도림역점 (아동안전지킴이집)",
    "GS25 해운대역점 (아동안전지킴이집)",
    "CU 성남역점 (아동안전지킴이집)",
    "GS25 수원역점 (아동안전지킴이집)",
    "홍대입구역 상권",
    "이태원로 상권",
    "대구 동성로 상권",
    "송도국제도시 센트럴파크",
    "광주 충장로 상권",
    "울산 성남동 상권",
    "안산 고잔동 외국인 밀집지역",
    "판교역 테크노밸리",
    "일산 대화역 상권",
    "충주 교현동 (응급의료 접근 취약)",
    "아산 둔포면 산업단지",
    "군산항 인근",
    "진주 강변 상권",
}

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
}

HEADER = r"""function getRegionFromAddress(address) {
  if (address.indexOf("서울") === 0) return "서울";
  if (address.indexOf("부산") === 0) return "부산";
  if (address.indexOf("대구") === 0) return "대구";
  if (address.indexOf("인천") === 0) return "인천";
  if (address.indexOf("광주") === 0) return "광주";
  if (address.indexOf("대전") === 0) return "대전";
  if (address.indexOf("울산") === 0) return "울산";
  if (address.indexOf("세종") === 0) return "세종";
  if (address.indexOf("경기") === 0) return "경기";
  if (address.indexOf("강원") === 0) return "강원";
  if (address.indexOf("충청북도") === 0 || address.indexOf("충북") === 0) return "충북";
  if (address.indexOf("충청남도") === 0 || address.indexOf("충남") === 0) return "충남";
  if (address.indexOf("전북") === 0 || address.indexOf("전라북도") === 0) return "전북";
  if (address.indexOf("전남") === 0 || address.indexOf("전라남도") === 0) return "전남";
  if (address.indexOf("경북") === 0 || address.indexOf("경상북도") === 0) return "경북";
  if (address.indexOf("경남") === 0 || address.indexOf("경상남도") === 0) return "경남";
  if (address.indexOf("제주") === 0) return "제주";
  return "전국";
}

var places = PLACES_JSON;

places.forEach(function (p, i) {
  p.id = i;
  p.region = getRegionFromAddress(p.address);
});

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

FOOTER_FUNCTIONS = ""


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


def format_places_js(places):
    lines = ["["]
    for p in places:
        lines.append(
            '  { name: "%s", address: "%s", lat: %s, lng: %s, type: "%s", category: "%s", description: "%s" },'
            % (p["name"], p["address"], p["lat"], p["lng"], p["type"], p["category"], p["description"])
        )
    lines.append("];")
    return "\n".join(lines)


def geocode(query):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1, "countrycodes": "kr"}
    )
    req = urllib.request.Request(url, headers={"User-Agent": "safety-map-school-project/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    if not data:
        return None
    return float(data[0]["lat"]), float(data[0]["lon"])


def main():
    content = open("places.js", encoding="utf-8").read()
    places = parse_places(content)
    filtered = [p for p in places if p["name"] not in REMOVE_NAMES]
    if len(filtered) != len(places):
        print(f"Removed {len(places) - len(filtered)} places, keeping {len(filtered)}")
    else:
        filtered = places
        print(f"Geocoding {len(filtered)} places")

    for i, place in enumerate(filtered):
        query = GEOCODE_OVERRIDES.get(place["name"], place["address"])
        try:
            coords = geocode(query)
            if coords:
                place["lat"], place["lng"] = round(coords[0], 6), round(coords[1], 6)
                print(f"[{i+1}/{len(filtered)}] OK {place['name'][:30]} -> {place['lat']}, {place['lng']}")
            else:
                print(f"[{i+1}/{len(filtered)}] MISS {place['name']}")
        except Exception as e:
            print(f"[{i+1}/{len(filtered)}] ERR {place['name']}: {e}")
        time.sleep(1.1)

    places_json = format_places_js(filtered)
    output = HEADER.replace("PLACES_JSON", places_json)
    open("places.js", "w", encoding="utf-8").write(output)
    print("places.js updated")


if __name__ == "__main__":
    main()
