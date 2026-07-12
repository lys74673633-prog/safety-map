import re
import urllib.request

articles = [
    ("448", "0000607831"),
    ("056", "0012180051"),
    ("025", "0003190458"),
    ("022", "0004121385"),
    ("422", "0000855762"),
    ("032", "0003439997"),
    ("003", "0013922644"),
    ("018", "0006241079"),
    ("028", "0002801950"),
    ("310", "0000135246"),
    ("056", "0012156090"),
    ("018", "0006261654"),
]

for oid, aid in articles:
    url = "https://n.news.naver.com/article/" + oid + "/" + aid
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace")
        m = re.search(r'property="og:image"\s+content="([^"]+)"', html)
        if not m:
            m = re.search(r'content="([^"]+)"\s+property="og:image"', html)
        img = m.group(1) if m else "NONE"
        print(oid + "/" + aid + "|" + img)
    except Exception as e:
        print(oid + "/" + aid + "|ERR " + str(e))
