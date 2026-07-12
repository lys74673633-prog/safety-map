import json
import re
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", "Referer": "https://map.naver.com/"}


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")


def try_json(url):
    print("JSON", url[:100])
    try:
        text = get(url)
        print(text[:2500])
    except Exception as e:
        print("FAIL", e)
    print("---\n")


q = urllib.parse.quote("경주여")
q2 = urllib.parse.quote("경주여고")

endpoints = [
    f"https://map.naver.com/p/api/search/allSearch?query={q2}&type=all&searchCoord=129.0;35.8;500&token=undefined",
    f"https://map.naver.com/p/api/search/instant-search?query={q}",
    f"https://map.naver.com/p/api/search/instantSearch?query={q}",
    f"https://map.naver.com/v5/api/search?caller=pcweb&query={q2}&type=all&page=1&displayCount=5&coord=127.0;37.5;500&lang=ko",
    f"https://map.naver.com/p/api/search/place?query={q2}&type=place&token=undefined",
]

for u in endpoints:
    try_json(u)

print("HTML search page snippet")
html = get(f"https://map.naver.com/p/search/{q2}")
# look for apollo state or json blobs
for pat in [r"__APOLLO_STATE__\s*=\s*(\{.*?\});", r"window\.__NEXT_DATA__\s*=\s*(\{.*?\})\s*;"]:
    m = re.search(pat, html, re.DOTALL)
    if m:
        print("FOUND", pat[:30], len(m.group(1)))
        print(m.group(1)[:1500])
        break
else:
    print("No embedded JSON, len=", len(html))
    # find api urls in script
    apis = re.findall(r"/p/api/[^\"']+", html)
    print("API paths:", apis[:10])
