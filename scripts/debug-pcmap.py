import re
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
url = "https://pcmap.place.naver.com/place/list?query=" + urllib.parse.quote("경주여고") + "&x=129.224&y=35.8562&clientX=129.224&clientY=35.8562&display=70&page=1"
req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://map.naver.com/", "Accept-Language": "ko"})
try:
    html = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")
    open(r"C:\Users\ilin0\Projects\safety-map\scripts\_pcmap_sample.html", "w", encoding="utf-8").write(html)
    print("saved", len(html))
    for pat in [
        r'"name":"([^"]{2,60})"',
        r'"title":"([^"]{2,60})"',
        r'"x":"([0-9.]+)"',
    ]:
        print(pat, len(re.findall(pat, html)))
    names = re.findall(r'"name":"([^"]{2,60})"', html)
    print("sample names", names[:15])
except Exception as e:
    print("ERR", e)
