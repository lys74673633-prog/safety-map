"""Patch zero-coord entries in places.js"""
import re

PATCHES = {
    "서울시립 서초노인종합복지관": (37.490046, 127.005695),
    "서울시립은평노인종합복지관": (37.619277, 126.919805),
    "서울시립서부장애인종합복지관": (37.556681, 126.848401),
    "용산구종합사회복지관": (37.537218, 126.972834),
    "홍대입구역 인근 무단횡단 사고다발지": (37.557414, 126.923773),
    "수원역 인근 무단횡단 사고다발지": (37.26714, 127.002303),
    "울산 태화강역 인근 무단횡단 사고다발지": (35.538809, 129.354011),
    "경포대 해수욕장": (37.781774, 128.889277),
    "남이섬": (37.791728, 127.525144),
    "정동진 해변": (37.69183, 129.032508),
}

REPLACEMENTS = [
    (
        '  { name: "대전광역시립 노인종합복지관", address: "대전광역시 서구 둔산로 100", lat: 0.0, lng: 0.0, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램" },',
        '  { name: "대전광역시노인복지관", address: "대전광역시 중구 테미로 26", lat: 36.318623, lng: 127.420411, type: "help", category: "노인복지 시설", description: "대전 노인 건강·급식·여가 프로그램" },',
    ),
    (
        '  { name: "울산광역시립 노인종합복지관", address: "울산광역시 남구 삼산로 237", lat: 0.0, lng: 0.0, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },',
        '  { name: "울산광역시 노인복지관", address: "울산광역시 남구 삼산중로 136", lat: 35.537658, lng: 129.335776, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램 (☎ 052-256-6820)" },',
    ),
    (
        '  { name: "안양시립 장애인복지관", address: "경기도 안양시 만안구 안양로 233", lat: 0.0, lng: 0.0, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원" },',
        '  { name: "안양시관악장애인종합복지관", address: "경기도 안양시 만안구 경수대로 1132", lat: 37.432023, lng: 126.903863, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원" },',
    ),
    (
        '  { name: "부천시립 장애인복지관", address: "경기도 부천시 원미구 부천로 245", lat: 0.0, lng: 0.0, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 서비스" },',
        '  { name: "부천시장애인종합복지관", address: "경기도 부천시 오정구 역곡로 367", lat: 37.50922, lng: 126.812127, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 서비스" },',
    ),
    (
        '  { name: "여수시립 장애인복지관", address: "전라남도 여수시 좌수영로 243", lat: 0.0, lng: 0.0, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원" },',
        '  { name: "여수시장애인종합복지관", address: "전라남도 여수시 만성로 173", lat: 34.770068, lng: 127.701619, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원 (☎ 061-652-5005)" },',
    ),
]

content = open("places.js", encoding="utf-8").read()
for old, new in REPLACEMENTS:
    content = content.replace(old, new)

for name, (lat, lng) in PATCHES.items():
    pattern = re.compile(
        r'(\{ name: "' + re.escape(name) + r'", address: "[^"]*", )lat: 0\.0, lng: 0\.0'
    )
    content, n = pattern.subn(r"\1lat: %s, lng: %s" % (lat, lng), content)
    if n:
        print("patched", name)

open("places.js", "w", encoding="utf-8").write(content)
remaining = content.count("lat: 0.0")
print("remaining zero coords:", remaining)
