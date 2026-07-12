import re
import urllib.parse
import urllib.request

def test(label, url):
    print("===", label)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://map.naver.com/"})
    html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace")
    for pat in [
        r'https://search\.pstatic\.net/common/[^"\'<>\s]+',
        r'https://ldb-phinf\.pstatic\.net/[^"\'<>\s]+',
        r'https://imgnews\.pstatic\.net/[^"\'<>\s]+',
    ]:
        imgs = re.findall(pat, html)
        if imgs:
            print(pat, len(imgs), imgs[0][:140])

q = urllib.parse.quote("카페 온수 성수")
test("image search", "https://search.naver.com/search.naver?where=image&query=" + q)
test("local", "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=" + q)
