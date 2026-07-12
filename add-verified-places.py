"""Append verified real welfare / TAAS danger spots and geocode coordinates."""
import json
import re
import time
import urllib.parse
import urllib.request

NEW_PLACES = [
    # 경기 — 장애인·복지
    {"name": "용인시처인장애인복지관", "address": "경기도 용인시 처인구 경안천로 318", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·보조기기 지원 (☎ 031-320-4800)"},
    {"name": "용인시기흥장애인복지관", "address": "경기도 용인시 기흥구 용구대로2469번길 94", "type": "help", "category": "장애인 시설", "description": "구립 장애인 재활·직업훈련 (☎ 031-895-3200)"},
    {"name": "화성시아르딤복지관", "address": "경기도 화성시 향남읍 도이1길 104", "type": "help", "category": "장애인 시설", "description": "장애인 종합 재활·직업훈련 (☎ 031-5183-8900)"},
    {"name": "화성시동탄아르딤복지관", "address": "경기도 화성시 동탄대로10길 17-12", "type": "help", "category": "장애인 시설", "description": "동탄권 장애인 재활·복지 (☎ 031-8077-0800)"},
    {"name": "에바다장애인종합복지관", "address": "경기도 평택시 팽성읍 노와길 447", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·주간보호 (☎ 031-692-2362)"},
    {"name": "평택북부장애인복지관", "address": "경기도 평택시 서정로 295", "type": "help", "category": "장애인 시설", "description": "북부권 장애인 종합 재활 (☎ 031-615-3975)"},
    {"name": "안산시장애인종합복지관", "address": "경기도 안산시 단원구 원초로 80", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·보조기기 (☎ 031-403-0078)"},
    {"name": "의정부시장애인종합복지관", "address": "경기도 의정부시 용민로 160", "type": "help", "category": "장애인 시설", "description": "활동지원·재활·직업훈련 (☎ 031-837-5300)"},
    {"name": "남양주시장애인종합복지관", "address": "경기도 남양주시 홍유릉로 273-1", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·복지 서비스 (☎ 031-590-0200)"},
    {"name": "시흥시장애인복지관", "address": "경기도 시흥시 서울대학로278번길 25", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·보조기기 지원 (☎ 031-496-7700)"},
    {"name": "광명시장애인종합복지관", "address": "경기도 광명시 광명로 721", "type": "help", "category": "장애인 시설", "description": "장애인 재활·직업훈련·복지 (☎ 02-2680-6600)"},
    {"name": "파주시장애인종합복지관", "address": "경기도 파주시 경의로 1080", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·이동 지원 (☎ 031-940-6600)"},
    {"name": "안양시노인종합복지관", "address": "경기도 안양시 만안구 석수로 97", "type": "help", "category": "노인복지 시설", "description": "노인 건강·급식·여가 프로그램 (☎ 031-463-6900)"},
    # 서울·인천 — 여성·아동 안전
    {"name": "서울동부해바라기센터", "address": "서울특별시 송파구 송이로 123", "type": "help", "category": "여성 안전", "description": "성폭력·가정폭력 24시간 통합지원 (☎ 02-3400-1700)"},
    {"name": "인천북부해바라기센터", "address": "인천광역시 부평구 동수로 56", "type": "help", "category": "여성 안전", "description": "365일 성폭력 피해자 상담·의료·수사 연계 (☎ 032-280-5678)"},
    {"name": "인천동부해바라기센터", "address": "인천광역시 동구 방축로 217", "type": "help", "category": "여성 안전", "description": "성폭력·가정폭력 위기 지원 (☎ 032-582-1170)"},
    {"name": "인천아동보호전문기관", "address": "인천광역시 남동구 남동대로 769", "type": "help", "category": "아동 안전", "description": "아동학대 상담·조사·보호 (☎ 1577-1391)"},
    {"name": "서울해바라기아동센터", "address": "서울특별시 구로구 구프라자1로 68", "type": "help", "category": "아동 안전", "description": "아동·청소년 성폭력 피해 전문 지원 (☎ 02-3274-1375)"},
    {"name": "대구해바라기아동센터", "address": "대구광역시 중구 동덕로 125", "type": "help", "category": "아동 안전", "description": "아동·청소년 성폭력 피해 지원 (☎ 053-421-1375)"},
    # 충남·충북
    {"name": "아산시장애인복지관", "address": "충청남도 아산시 곡교천로27번길 10", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·보조기기 (☎ 041-545-8800)"},
    {"name": "공주시장애인종합복지관", "address": "충청남도 공주시 번영1로 70", "type": "help", "category": "장애인 시설", "description": "장애인 재활·직업훈련·복지"},
    {"name": "서산시장애인종합복지관", "address": "충청남도 서산시 예천2로 28", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·이동 지원"},
    {"name": "충주시노인종합복지관", "address": "충청북도 충주시 중원대로 3019", "type": "help", "category": "노인복지 시설", "description": "노인 건강·급식·여가 프로그램"},
    # 전남·전북
    {"name": "광양시장애인복지관", "address": "전라남도 광양시 광양읍 대림오성로 117", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련 (☎ 061-761-4438)"},
    {"name": "나주시장애인종합복지관", "address": "전라남도 나주시 빛가람로 685", "type": "help", "category": "장애인 시설", "description": "전남 서부권 장애인 재활·복지"},
    {"name": "정읍시장애인종합복지관", "address": "전북특별자치도 정읍시 연지2길 20", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·복지 서비스"},
    {"name": "군산시노인종합복지관", "address": "전북특별자치도 군산시 수송로 195", "type": "help", "category": "노인복지 시설", "description": "노인 건강·급식·방문요양"},
    # 강원
    {"name": "강원도장애인종합복지관 속초분관", "address": "강원특별자치도 속초시 청초호반로 201", "type": "help", "category": "장애인 시설", "description": "속초·고성·양양권 재활·활동지원 (☎ 033-636-2491)"},
    {"name": "동해시노인종합복지관", "address": "강원특별자치도 동해시 발한로 67", "type": "help", "category": "노인복지 시설", "description": "노인 건강·급식·여가 프로그램"},
    {"name": "원주시장애인종합복지관", "address": "강원특별자치도 원주시 능라동길 77", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·보조기기"},
    # 경북·경남
    {"name": "영천시장애인종합복지관", "address": "경상북도 영천시 대학로 15", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·복지 서비스"},
    {"name": "문경시장애인종합복지관", "address": "경상북도 문경시 중앙로 27", "type": "help", "category": "장애인 시설", "description": "장애인 재활·직업훈련"},
    {"name": "사천시장애인복지관", "address": "경상남도 사천시 사남로 77", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·복지 서비스"},
    {"name": "밀양시장애인종합복지관", "address": "경상남도 밀양시 삼문중앙로 36", "type": "help", "category": "장애인 시설", "description": "재활·직업훈련·이동 지원"},
    {"name": "창원시성산노인종합복지관", "address": "경상남도 창원시 성산구 중앙대로100번길 16", "type": "help", "category": "노인복지 시설", "description": "노인 건강·급식·여가 프로그램"},
    # TAAS·교통사고 다발 (보행)
    {"name": "청주역 인근 무단횡단 사고다발지", "address": "충청북도 청주시 흥덕구 가경동", "type": "danger", "category": "보행자 안전", "description": "청주시 무단횡단 교통사고 다발지 (TAAS)"},
    {"name": "전주역 인근 무단횡단 사고다발지", "address": "전북특별자치도 전주시 덕진구 인후동", "type": "danger", "category": "보행자 안전", "description": "전주시 보행자 교통사고 다발지 (TAAS)"},
    {"name": "춘천 중앙로 무단횡단 사고다발지", "address": "강원특별자치도 춘천시 조양동", "type": "danger", "category": "보행자 안전", "description": "춘천시 무단횡단 사고 다발지 (TAAS)"},
    {"name": "원주역 인근 무단횡단 사고다발지", "address": "강원특별자치도 원주시 무실동", "type": "danger", "category": "보행자 안전", "description": "원주시 보행자 교통사고 다발지 (TAAS)"},
    {"name": "제주연동 무단횡단 사고다발지", "address": "제주특별자치도 제주시 연동", "type": "danger", "category": "보행자 안전", "description": "제주시 무단횡단 사고 다발지 (TAAS)"},
    {"name": "안양역 인근 무단횡단 사고다발지", "address": "경기도 안양시 만안구 안양동", "type": "danger", "category": "보행자 안전", "description": "경기 TAAS 무단횡단 사고 다발지"},
    {"name": "부천역 인근 무단횡단 사고다발지", "address": "경기도 부천시 원미구 중동", "type": "danger", "category": "보행자 안전", "description": "부천시 보행자 교통사고 다발지 (TAAS)"},
    {"name": "천안역 인근 무단횡단 사고다발지", "address": "충청남도 천안시 동남구 대흥동", "type": "danger", "category": "보행자 안전", "description": "천안시 무단횡단 사고 다발지 (TAAS)"},
    {"name": "포항역 인근 무단횡단 사고다발지", "address": "경상북도 포항시 북구 흥해읍", "type": "danger", "category": "보행자 안전", "description": "포항시 보행자 교통사고 다발지 (TAAS)"},
    {"name": "순천역 인근 무단횡단 사고다발지", "address": "전라남도 순천시 조례동", "type": "danger", "category": "보행자 안전", "description": "순천시 무단횡단 사고 다발지 (TAAS)"},
    {"name": "인천 차이나타운 무단횡단 사고다발지", "address": "인천광역시 중구 차이나타운로", "type": "danger", "category": "노인 안전", "description": "인천시 보행·무단횡단 사고 다발지 (TAAS)"},
    {"name": "동대구역 인근 무단횡단 사고다발지", "address": "대구광역시 동구 신암동", "type": "danger", "category": "보행자 안전", "description": "대구시 보행자 교통사고 다발지 (TAAS)"},
    {"name": "익산역 인근 무단횡단 사고다발지", "address": "전북특별자치도 익산시 모현동", "type": "danger", "category": "보행자 안전", "description": "익산시 무단횡단 사고 다발지 (TAAS)"},
    {"name": "목포역 인근 무단횡단 사고다발지", "address": "전라남도 목포시 용당동", "type": "danger", "category": "보행자 안전", "description": "목포시 보행자 교통사고 다발지 (TAAS)"},
    {"name": "공주역 인근 무단횡단 사고다발지", "address": "충청남도 공주시 금학동", "type": "danger", "category": "노인 안전", "description": "공주시 무단횡단·노인 보행 사고 다발지 (TAAS)"},
    {"name": "의정부역 인근 무단횡단 사고다발지", "address": "경기도 의정부시 의정부동", "type": "danger", "category": "보행자 안전", "description": "의정부시 보행자 교통사고 다발지 (TAAS)"},
]

PLACE_PATTERN = re.compile(
    r'\{\s*name:\s*"([^"]*)",\s*address:\s*"([^"]*)",\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+),\s*type:\s*"([^"]*)",\s*category:\s*"([^"]*)",\s*description:\s*"([^"]*)"\s*\}'
)


def geocode(query):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1, "countrycodes": "kr"}
    )
    req = urllib.request.Request(url, headers={"User-Agent": "oasi5-safety-map/1.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read().decode())
    if not data:
        return None
    return round(float(data[0]["lat"]), 6), round(float(data[0]["lon"]), 6)


def parse_places(content):
    return [m.group(1) for m in re.finditer(r'name:\s*"([^"]+)"', content[content.index("var places"):content.index("];")])]


def main():
    content = open("places.js", encoding="utf-8").read()
    existing = set(parse_places(content))
    to_add = [p for p in NEW_PLACES if p["name"] not in existing]
    print(f"Adding {len(to_add)} new places ({len(NEW_PLACES) - len(to_add)} skipped as duplicates)")

    lines = []
    for p in to_add:
        if p["category"] == "보행er 안전":
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
        print(f"OK {p['name'][:30]:30} {coords}")

    if not lines:
        print("Nothing to append.")
        return

    insert_at = content.index("\n];", content.index("var places = ["))
    new_content = content[:insert_at].rstrip() + ",\n" + "\n".join(lines) + "\n" + content[insert_at:]
    open("places.js", "w", encoding="utf-8").write(new_content)
    print(f"\nAppended {len(lines)} places to places.js")


if __name__ == "__main__":
    main()
