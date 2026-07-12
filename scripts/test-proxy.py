import re
import urllib.parse
import urllib.request

search_url = "https://search.naver.com/search.naver?where=image&query=" + urllib.parse.quote("카페 온수 성수")
proxy = "https://api.allorigins.win/raw?url=" + urllib.parse.quote(search_url, safe="")
try:
    html = urllib.request.urlopen(proxy, timeout=25).read().decode("utf-8", "replace")
    imgs = re.findall(r'https://search\.pstatic\.net/common/[^"\'<>\s]+', html)
    print("allorigins ok", len(html), "imgs", len(imgs))
except Exception as e:
    print("allorigins fail", e)
