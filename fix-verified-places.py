"""Replace non-existent or misnamed welfare facilities with verified official data."""
import json
import re
import time
import urllib.parse
import urllib.request

FIXES = {
    "부산광역시립 장애인복지관": {
        "name": "부산광역시장애인종합복지관",
        "address": "부산광역시 연제구 중앙대로1150번길 15",
        "description": "장애인 재활·직업훈련·복지 서비스 (☎ 051-790-6100)",
    },
    "대전광역시립 장애인종합복지관": {
        "name": "대전광역시립장애인종합복지관",
        "address": "대전광역시 유성구 유성대로298번길 175",
        "description": "직업재활·이동 지원·재활치료 (☎ 042-540-3500)",
    },
    "춘천시립 노인종합복지관": {
        "name": "춘천동부노인복지관",
        "address": "강원특별자치도 춘천시 동면 세실로 250",
        "description": "노인 건강·급식·방문요양 (☎ 033-255-8866)",
    },
    "원주시립 장애인복지관": {
        "name": "원주시장애인종합복지관",
        "address": "강원특별자치도 원주시 동부순환로 9-8",
        "description": "재활·직업훈련·보조기기 지원 (☎ 033-766-5990)",
    },
    "강릉시립 노인종합복지관": {
        "name": "강릉노인종합복지관",
        "address": "강원특별자치도 강릉시 경강로 1956",
        "description": "노인 건강·여가·복지 프로그램 (☎ 033-640-4800)",
    },
    "청주시립 장애인복지관": {
        "name": "청주시장애인종합복지관",
        "address": "충청북도 청주시 상당구 상당로 82",
        "description": "보조기기·재활·이동 지원",
    },
    "울산광역시립 장애인복지관": {
        "name": "울산광역시장애인종합복지관",
        "address": "울산광역시 중구 백양로 160",
        "description": "장애인 재활·직업훈련·복지 서비스 (☎ 052-242-1778)",
    },
    "순천시립장애인복지관": {
        "name": "순천시장애인종합복지관",
        "address": "전라남도 순천시 서면 청소년수련원길 2",
        "description": "장애인 재활·직업훈련·복지 서비스 (☎ 061-755-4450)",
    },
    "경주시립노인종합복지관": {
        "name": "경주시노인종합복지관",
        "address": "경상북도 경주시 원효로 38",
        "description": "노인 건강·여가·복지 프로그램",
    },
    "상주시노인복지회관": {
        "name": "상주시노인종합복지관",
        "address": "경상북도 상주시 중앙로 111",
        "description": "노인 건강·급식·여가 프로그램 (☎ 054-536-6232)",
    },
}

REMOVE_NAMES = {
    "포항시립 장애인복지관",
}

ADDITIONS = [
    {
        "name": "유성구장애인종합복지관",
        "address": "대전광역시 유성구 북유성대로 166",
        "type": "help",
        "category": "장애인 시설",
        "description": "구립 장애인 재활·직업훈련·일상돌봄 (☎ 042-820-6851)",
    },
    {
        "name": "대덕구장애인종합복지관",
        "address": "대전광역시 대덕구 신탄진로 77",
        "type": "help",
        "category": "장애인 시설",
        "description": "구립 장애인 재활·직업훈련 (☎ 042-637-8848)",
    },
    {
        "name": "춘천시장애인종합복지관",
        "address": "강원특별자치도 춘천시 영서로 1925-21",
        "type": "help",
        "category": "장애인 시설",
        "description": "재활·직업훈련·보조기기 지원 (☎ 033-262-0035)",
    },
    {
        "name": "포항시북부장애인종합복지관",
        "address": "경상북도 포항시 북구 새천년대로 1486",
        "type": "help",
        "category": "장애인 시설",
        "description": "재활·직업훈련·복지 서비스 (☎ 054-231-1117)",
    },
]


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
    req = urllib.request.Request(url, headers={"User-Agent": "safety-map-school-project/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    if not data:
        return None
    return round(float(data[0]["lat"]), 6), round(float(data[0]["lon"]), 6)


def main():
    content = open("places.js", encoding="utf-8").read()
    places = parse_places(content)

    filtered = [p for p in places if p["name"] not in REMOVE_NAMES]
    if len(filtered) != len(places):
        print(f"Removed {len(places) - len(filtered)} fake entries")

    for p in filtered:
        if p["name"] in FIXES:
            fix = FIXES[p["name"]]
            print(f"Fix: {p['name']} -> {fix['name']}")
            p.update(fix)

    existing_names = {p["name"] for p in filtered}
    for add in ADDITIONS:
        if add["name"] not in existing_names:
            filtered.append(dict(add))
            print(f"Add: {add['name']}")

    # Geocode only changed/new entries
    to_geocode = set(FIXES.keys()) | REMOVE_NAMES
    for add in ADDITIONS:
        to_geocode.add(add["name"])

    for i, p in enumerate(filtered):
        if p["name"] in to_geocode or any(p["name"] == FIXES[k]["name"] for k in FIXES):
            try:
                coords = geocode(p["address"])
                if coords:
                    p["lat"], p["lng"] = coords
                    print(f"Geocode OK: {p['name']} -> {coords}")
                else:
                    print(f"Geocode MISS: {p['name']}")
            except Exception as e:
                print(f"Geocode ERR: {p['name']}: {e}")
            time.sleep(1.1)

    # Rebuild places.js preserving header/footer
    header_end = content.index("var places = [")
    footer_start = content.index("];", header_end) + 3

    lines = ["var places = ["]
    for p in filtered:
        lines.append(
            '  { name: "%s", address: "%s", lat: %s, lng: %s, type: "%s", category: "%s", description: "%s" },'
            % (p["name"], p["address"], p["lat"], p["lng"], p["type"], p["category"], p["description"])
        )
    lines.append("];")
    new_content = content[:header_end] + "\n".join(lines) + content[footer_start:]
    open("places.js", "w", encoding="utf-8").write(new_content)
    print(f"Updated places.js with {len(filtered)} entries")


if __name__ == "__main__":
    main()
