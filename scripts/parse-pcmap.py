import json
import re
import urllib.parse
import urllib.request

q = urllib.parse.quote("경주여")
url = (
    "https://pcmap.place.naver.com/place/list?query="
    + q
    + "&x=129.224&y=35.8562&clientX=129.224&clientY=35.8562&display=70&page=1"
)
req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Referer": "https://map.naver.com/",
    },
)
html = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")

# Apollo-style embedded JSON chunks
chunks = re.findall(r'\{"__typename":"PlaceSummary"[^}]+\}', html)
print("PlaceSummary chunks", len(chunks))
for c in chunks[:3]:
    print(c[:300])

# Broader extract name + address + x/y
pattern = re.compile(
    r'"name":"(?P<name>[^"]{2,80})".*?"normalizedName":"(?P<nname>[^"]*)".*?'
    r'"fullAddress":"(?P<addr>[^"]*)".*?"x":"(?P<x>[0-9.]+)".*?"y":"(?P<y>[0-9.]+)"',
    re.DOTALL,
)
matches = []
for m in pattern.finditer(html):
    matches.append(m.groupdict())
    if len(matches) >= 12:
        break

print("matches", len(matches))
for m in matches[:8]:
    print(m)

# Simpler: find all name/x/y triples near each other
simple = re.findall(
    r'"name":"([^"]{2,60})"[^}]{0,400}?"x":"([0-9.]+)"[^}]{0,80}?"y":"([0-9.]+)"',
    html,
)
print("simple", len(simple))
for s in simple[:10]:
    print(s)
