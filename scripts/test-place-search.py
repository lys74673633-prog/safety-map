import json
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def fetch(url, headers=None):
    h = {"User-Agent": UA}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        data = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace")
        print("URL:", url[:120])
        print(data[:2000])
        print("---\n")
    except Exception as e:
        print("FAIL", url[:100], e, "\n---\n")

q = "경주여"
# Naver autocomplete
fetch("https://ac.search.naver.com/nx/ac?q=" + urllib.parse.quote(q) + "&con=0&frm=map&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&ans=2")
# Naver local search page API (might need cookies)
fetch(
    "https://map.naver.com/p/api/search/allSearch?query=" + urllib.parse.quote(q) + "&type=all&token=undefined",
    {"Referer": "https://map.naver.com/", "Accept": "application/json"},
)
# Kakao keyword (no key - expect fail but see response)
fetch("https://dapi.kakao.com/v2/local/search/keyword.json?query=" + urllib.parse.quote("경주여고"))
# VWorld geocoder
fetch("https://api.vworld.kr/req/search?service=search&request=search&version=2.0&size=5&page=1&query=" + urllib.parse.quote("경주여고") + "&type=place&format=json&errorformat=json&key=TEST")
# Nominatim with proper UA
fetch(
    "https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=kr&q=" + urllib.parse.quote("경주여고"),
    {"User-Agent": "Oasi5SafetyMap/1.0 (contact@example.com)", "Accept-Language": "ko"},
)
