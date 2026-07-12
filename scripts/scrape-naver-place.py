import json
import re
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
HEADERS = {
    "User-Agent": UA,
    "Accept-Language": "ko-KR,ko;q=0.9",
    "Referer": "https://map.naver.com/",
    "Accept": "text/html,application/xhtml+xml",
}


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")


for q in ["경주여", "경주여고"]:
    enc = urllib.parse.quote(q)
    urls = [
        f"https://map.naver.com/p/search/{enc}",
        f"https://search.naver.com/search.naver?query={enc}&where=nexearch",
        f"https://pcmap.place.naver.com/place/list?query={enc}&x=129.224&y=35.8562&clientX=129.224&clientY=35.8562&display=70&ts=&queryRank=&page=1",
    ]
    for url in urls:
        print("===", q, url[:70])
        try:
            html = fetch(url)
            print("len", len(html))
            # place names
            titles = re.findall(r'"title"\s*:\s*"([^"]{2,40})"', html)
            names = re.findall(r'"name"\s*:\s*"([^"]{2,40})"', html)
            coords = re.findall(r'"x"\s*:\s*([0-9.]+).*?"y"\s*:\s*([0-9.]+)', html[:50000])
            print("titles", titles[:8])
            print("names", names[:8])
            # apollo
            if "경주" in html or "여고" in html:
                idx = html.find("경주")
                print("context", html[max(0, idx - 40) : idx + 120])
        except Exception as e:
            print("ERR", e)
        print()
