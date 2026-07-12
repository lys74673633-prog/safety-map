#!/usr/bin/env python3
"""Oasi5 dev server: static files, place search, mobility-aware route API."""
from __future__ import annotations

import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = 3456
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
OSRM = "https://router.project-osrm.org/route/v1"

SKIP_NAMES = {
    "거리1km", "거리2km", "거리3km", "거리4km", "거리5km", "거리10km",
    "정렬", "관련도순", "리뷰많은순", "신규장소", "펼치기", "접기",
}

_search_cache: dict[str, tuple[float, list]] = {}
_geocode_cache: dict[str, tuple[float, list]] = {}
_route_cache: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = 3600
_last_place_fetch = 0.0
_last_geocode_fetch = 0.0
_place_fetch_lock = threading.Lock()
_PLACE_FETCH_INTERVAL = 0.12
_html_cache: dict[str, tuple[float, str]] = {}
_HTML_CACHE_TTL = 900
_nearby_all_cache: dict[str, tuple[float, dict]] = {}


def load_kric_key() -> str | None:
    local = ROOT / "kric-config.local.json"
    if local.exists():
        try:
            data = json.loads(local.read_text(encoding="utf-8"))
            key = str(data.get("apiKey", "")).strip()
            if key and not key.startswith("레일"):
                return key
        except Exception:
            pass
    env = os.environ.get("KRIC_API_KEY", "").strip()
    return env or None


KRIC_BASE = "https://openapi.kric.go.kr/openapi"
_kric_cache: dict[str, tuple[float, dict]] = {}

FALLBACK_MOBILITY = {
    "서울역": {
        "stationName": "서울역",
        "lineName": "4호선",
        "source": "fallback",
        "gates": [
            {"exitNo": "1번 출구", "elevator": True, "escalator": True, "wheelchairLift": False},
            {"exitNo": "2번 출구", "elevator": True, "escalator": False, "wheelchairLift": True},
            {"exitNo": "3번 출구", "elevator": False, "escalator": True, "wheelchairLift": False},
        ],
        "movement": [
            {"from": "1번 출구", "to": "4호선 승강장", "detail": "엘리베이터를 이용해 지하 대합실로 이동", "elevatorType": "EV"},
            {"from": "대합실", "to": "승강장", "detail": "승강장 연결 엘리베이터 이용", "elevatorType": "EV"},
        ],
        "facilities": [
            {"label": "장애인 화장실", "location": "대합실"},
            {"label": "휠체어 충전", "location": "고객센터 인근"},
        ],
    },
    "강남역": {
        "stationName": "강남역",
        "lineName": "2호선",
        "source": "fallback",
        "gates": [
            {"exitNo": "1번 출구", "elevator": True, "escalator": True, "wheelchairLift": False},
            {"exitNo": "5번 출구", "elevator": True, "escalator": True, "wheelchairLift": False},
            {"exitNo": "11번 출구", "elevator": True, "escalator": False, "wheelchairLift": True},
        ],
        "movement": [
            {"from": "11번 출구", "to": "2호선 승강장", "detail": "엘리베이터·휠체어리프트 이용 가능", "elevatorType": "EV"},
        ],
        "facilities": [
            {"label": "장애인 화장실", "location": "2호선 대합실"},
            {"label": "수유실", "location": "환승통로"},
        ],
    },
    "충무로": {
        "stationName": "충무로",
        "lineName": "3호선",
        "source": "fallback",
        "gates": [
            {"exitNo": "1번 출구", "elevator": True, "escalator": True, "wheelchairLift": False},
            {"exitNo": "3번 출구", "elevator": True, "escalator": False, "wheelchairLift": False},
        ],
        "movement": [
            {"from": "3호선 승강장", "to": "4호선 환승통로", "detail": "엘리베이터 환승 동선 이용", "elevatorType": "EV"},
        ],
        "transfer": [
            {"from": "3호선 승강장", "to": "4호선 승강장", "detail": "교통약자 환승 엘리베이터 경로", "elevatorType": "EV"},
        ],
        "facilities": [{"label": "장애인 화장실", "location": "환승층"}],
    },
}


def kric_get(path: str, params: dict) -> dict | list | None:
    key = load_kric_key()
    if not key:
        return None
    q = urllib.parse.urlencode({"serviceKey": key, "format": "json", **params})
    try:
        data = fetch_json(f"{KRIC_BASE}/{path}?{q}")
    except Exception:
        return None
    body = data.get("body") if isinstance(data, dict) else data
    if isinstance(body, dict):
        items = body.get("items") or body.get("item")
        if items is None and "list" in body:
            items = body.get("list")
        if isinstance(items, dict):
            return [items]
        if isinstance(items, list):
            return items
    if isinstance(data, list):
        return data
    return None


def parse_gates(items: list | None) -> list[dict]:
    gates = []
    for item in items or []:
        exit_no = item.get("exitNo") or item.get("gateNo") or item.get("exitsNo") or item.get("vcntEntrcNo")
        if not exit_no:
            continue
        elvt = str(item.get("elvtTpCd") or item.get("elvtTp") or "").upper()
        gates.append({
            "exitNo": str(exit_no) + ("번 출구" if str(exit_no).isdigit() else ""),
            "elevator": elvt == "EV" or item.get("elvtYn") == "Y" or "엘리" in str(item.get("elvtTpNm") or ""),
            "escalator": elvt == "ES" or "에스컬" in str(item.get("elvtTpNm") or ""),
            "wheelchairLift": elvt in ("WL", "EL") or "리프트" in str(item.get("elvtTpNm") or ""),
        })
    return gates


def parse_movement(items: list | None) -> list[dict]:
    rows = []
    for item in items or []:
        rows.append({
            "from": item.get("stMovePath") or item.get("startPath") or "",
            "to": item.get("edMovePath") or item.get("endPath") or "",
            "detail": item.get("mvContDtl") or item.get("moveDetail") or "",
            "elevatorType": item.get("elvtTpCd") or "",
            "order": item.get("exitMvTpOrdr") or item.get("chtnMvTpOrdr") or len(rows) + 1,
        })
    rows.sort(key=lambda r: r.get("order") or 0)
    return rows


def fallback_mobility(name: str) -> dict | None:
    key = name.replace("역", "").strip()
    for k, v in FALLBACK_MOBILITY.items():
        if k.replace("역", "") == key:
            return dict(v)
    return None


def get_station_mobility(params: dict) -> dict:
    rail = (params.get("rail") or [""])[0]
    ln = (params.get("ln") or [""])[0]
    stin = (params.get("stin") or [""])[0]
    name = (params.get("name") or [""])[0]
    next_stin = (params.get("nextStin") or [""])[0] or None
    prev_stin = (params.get("prevStin") or [""])[0] or None
    transfer_ln = (params.get("transferLn") or [""])[0] or None
    transfer_next = (params.get("transferNext") or [""])[0] or None

    cache_key = "|".join([rail, ln, stin, name, next_stin or "", prev_stin or ""])
    now = time.time()
    cached = _kric_cache.get(cache_key)
    if cached and now - cached[0] < 3600:
        return cached[1]

    result = {
        "stationName": name or "",
        "railOprIsttCd": rail,
        "lnCd": ln,
        "stinCd": stin,
        "gates": [],
        "movement": [],
        "transfer": [],
        "facilities": [],
        "elevators": [],
        "lifts": [],
    }

    if not load_kric_key():
        fb = fallback_mobility(name)
        if fb:
            fb["fallback"] = True
            _kric_cache[cache_key] = (now, fb)
            return fb
        return {"error": True, "code": "KRIC_KEY_REQUIRED", "message": "KRIC API 키가 없어 샘플·제한 데이터만 제공됩니다.", "fallback": True, **result}

    base = {"railOprIsttCd": rail, "lnCd": ln, "stinCd": stin}
    gates_raw = kric_get("convenientInfo/stationGateInfo", base)
    if gates_raw:
        result["gates"] = parse_gates(gates_raw)

    elev_raw = kric_get("convenientInfo/stationElevator", base)
    if elev_raw:
        result["elevators"] = elev_raw

    lift_raw = kric_get("vulnerableUserInfo/stationWheelchairLiftLocation", base)
    if lift_raw:
        result["lifts"] = lift_raw

    if next_stin:
        mv = kric_get("vulnerableUserInfo/stationMovement", {**base, "nextStinCd": next_stin})
        result["movement"] = parse_movement(mv)

    if prev_stin and transfer_ln and transfer_next:
        tr = kric_get("vulnerableUserInfo/transferMovement", {
            **base,
            "prevStinCd": prev_stin,
            "chthTgtLn": transfer_ln,
            "chtnNextStinCd": transfer_next,
        })
        result["transfer"] = parse_movement(tr)

    if not result["gates"] and not result["movement"]:
        fb = fallback_mobility(name)
        if fb:
            result.update(fb)
            result["source"] = "fallback"

    result["source"] = result.get("source") or "kric"
    _kric_cache[cache_key] = (now, result)
    return result


def load_odsay_key() -> str | None:
    local = ROOT / "odsay-config.local.json"
    if local.exists():
        try:
            data = json.loads(local.read_text(encoding="utf-8"))
            key = str(data.get("apiKey", "")).strip()
            if key and not key.startswith("ODsay"):
                return key
        except Exception:
            pass
    env = os.environ.get("ODSAY_API_KEY", "").strip()
    return env or None


def json_body(payload: dict) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def json_response(handler, status: int, payload: dict):
    body = json_body(payload)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store" if status >= 400 else "public, max-age=120")
    handler.end_headers()
    handler.wfile.write(body)


_skip_in_image_url = (
    "blogpfthumb", "favicon", "logo", "icon", "banner",
    "marketing_banner", "onlylogo", "app_150x150", "profile",
)

IMAGE_URL_PATTERNS = [
    re.compile(r'"imageUrl":"((?:[^"\\]|\\.)*)"'),
    re.compile(r"https://ldb-phinf\.pstatic\.net/[^\"'\\<>\\s]+"),
    re.compile(r"https://[^\"'\\<>\\s]*pstatic\.net/[^\"'\\<>\\s]+"),
    re.compile(r"https://search\.pstatic\.net/common/\?[^\"'\\<>\\s]+"),
    re.compile(r"https://imgnews\.pstatic\.net/[^\"'\\<>\\s]+"),
]

_photo_cache: dict[str, tuple[float, str]] = {}
_image_bytes_cache: dict[str, tuple[float, bytes, str]] = {}

ALLOWED_IMAGE_PREFIXES = (
    "https://ldb-phinf.pstatic.net/",
    "https://search.pstatic.net/",
    "https://cafefiles.naver.net/",
    "https://cafefiles.pstatic.net/",
    "https://imgnews.pstatic.net/",
    "https://blogfiles.naver.net/",
    "https://postfiles.pstatic.net/",
    "https://clip-service-phinf.pstatic.net/",
    "https://pup-review-phinf.pstatic.net/",
)


def decode_naver_url(raw: str) -> str:
    s = (raw or "").replace("\\/", "/")
    for _ in range(4):
        if "\\u" not in s:
            break
        try:
            s = bytes(s, "utf-8").decode("unicode_escape")
        except Exception:
            break
    return s.strip()


def is_allowed_image_url(url: str) -> bool:
    if not url or not url.startswith("https://"):
        return False
    if any(url.startswith(prefix) for prefix in ALLOWED_IMAGE_PREFIXES):
        return True
    if "pstatic.net" in url and score_image_url(url) > 0:
        return True
    if ("encrypted-tbn" in url or "gstatic.com" in url or "googleusercontent.com" in url) and score_image_url(url) > 0:
        return True
    return False


def collect_image_urls_from_html(html: str) -> list[str]:
    urls: list[str] = []
    for pat in IMAGE_URL_PATTERNS:
        for match in pat.finditer(html or ""):
            raw = match.group(1) if match.lastindex else match.group(0)
            url = decode_naver_url(raw)
            if url.startswith("http") and score_image_url(url) > 0:
                urls.append(url)
    return urls


def photo_proxy_path(name: str, address: str = "", lat: float | None = None, lng: float | None = None, src: str = "") -> str:
    params: dict[str, str] = {"name": name}
    if address:
        params["address"] = address
    if lat is not None and lng is not None:
        params["lat"] = str(lat)
        params["lng"] = str(lng)
    if src and is_allowed_image_url(src):
        params["src"] = src
    return "/api/place-photo/img?" + urllib.parse.urlencode(params)


def fetch_image_bytes(url: str) -> tuple[bytes, str] | None:
    if not is_allowed_image_url(url):
        return None
    now = time.time()
    cached = _image_bytes_cache.get(url)
    if cached and now - cached[0] < 86400:
        return cached[1], cached[2]

    referer = "https://map.naver.com/" if "ldb-phinf" in url else "https://search.naver.com/"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Referer": referer, "Accept": "image/*,*/*"},
    )
    try:
        with urllib.request.urlopen(req, timeout=18) as resp:
            data = resp.read()
            if len(data) < 80:
                return None
            ct = resp.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
            if not ct.startswith("image/"):
                ct = "image/jpeg"
            _image_bytes_cache[url] = (now, data, ct)
            return data, ct
    except Exception:
        return None


def image_response(handler, status: int, data: bytes, content_type: str = "image/jpeg"):
    handler.send_response(status)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Cache-Control", "public, max-age=86400")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def serve_place_image(params: dict) -> tuple[bytes, str] | None:
    name = (params.get("name") or [""])[0].strip()
    address = (params.get("address") or [""])[0].strip()
    src = (params.get("src") or [""])[0].strip()
    lat = lng = None
    try:
        if params.get("lat") and params.get("lng"):
            lat = float(params.get("lat", ["0"])[0])
            lng = float(params.get("lng", ["0"])[0])
    except ValueError:
        lat = lng = None

    remote = src if is_allowed_image_url(src) else ""
    if not remote and name:
        remote = fetch_place_photo(name, address, lat, lng)
    if not remote:
        return None
    return fetch_image_bytes(remote)


def score_image_url(url: str) -> int:
    low = url.lower()
    if any(s in low for s in _skip_in_image_url):
        return -100
    if "ldb-phinf" in low:
        return 100
    if "cafefiles" in low:
        return 90
    if "search.pstatic.net/common" in low:
        return 60
    if "phinf.pstatic.net" in low:
        return 40
    if "encrypted-tbn" in low or "gstatic.com/images" in low:
        return 55
    if "googleusercontent.com" in low:
        return 50
    if low.startswith("https://"):
        return 10
    return 0


def pick_best_image(urls: list[str]) -> str:
    ranked = sorted(set(urls), key=score_image_url, reverse=True)
    for url in ranked:
        if score_image_url(url) > 0:
            return url
    return ranked[0] if ranked else ""


def extract_image_from_block(text: str) -> str:
    m = re.search(r'"imageUrl":"((?:[^"\\]|\\.)*)"', text or "")
    if m:
        url = decode_naver_url(m.group(1))
        if url.startswith("http") and score_image_url(url) > 0:
            return url
    for key in ("thumbUrl", "thumbnailUrl", "thumb", "imgUrl"):
        m = re.search(rf'"{key}":"((?:[^"\\]|\\.)*)"', text or "")
        if m:
            url = decode_naver_url(m.group(1))
            if url.startswith("http") and score_image_url(url) > 0:
                return url
    return pick_best_image(collect_image_urls_from_html(text or ""))


def fetch_place_photo(name: str, address: str = "", lat: float | None = None, lng: float | None = None) -> str:
    query = (name or "").strip()
    if not query:
        return ""
    cache_key = f"{query}|{address}|{lat}|{lng}"
    now = time.time()
    cached = _photo_cache.get(cache_key)
    if cached and now - cached[0] < 86400:
        return cached[1]

    urls: list[str] = []
    html = fetch_naver_places_html(query, lat, lng)
    if html:
        image_block = re.compile(
            r'"name":"(?P<name>[^"\\]{2,80})"[\s\S]{0,5000}?"imageUrl":"(?P<img>(?:[^"\\]|\\.)*)"[\s\S]{0,2000}?"x":"(?P<x>[0-9.]+)"[\s\S]{0,300}?"y":"(?P<y>[0-9.]+)"',
        )
        for m in image_block.finditer(html):
            block_name = m.group("name").strip()
            if block_name != query and query not in block_name and block_name not in query:
                continue
            img = decode_naver_url(m.group("img"))
            if img.startswith("http") and score_image_url(img) > 0:
                urls.append(img)
        if not urls:
            for m in image_block.finditer(html):
                img = decode_naver_url(m.group("img"))
                if img.startswith("http") and score_image_url(img) > 0:
                    urls.append(img)
                    break
        if not urls:
            urls.extend(collect_image_urls_from_html(html))

    if not urls:
        search_q = query if not address else f"{query} {address}".strip()
        enc = urllib.parse.quote(search_q)
        for where in ("image", "nexearch"):
            try:
                req = urllib.request.Request(
                    f"https://search.naver.com/search.naver?where={where}&query={enc}",
                    headers={"User-Agent": UA, "Referer": "https://search.naver.com/", "Accept-Language": "ko-KR,ko;q=0.9"},
                )
                search_html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace")
                for pat in IMAGE_URL_PATTERNS:
                    urls.extend(pat.findall(search_html))
                if urls:
                    break
            except Exception:
                continue

    url = pick_best_image(urls)
    _photo_cache[cache_key] = (now, url)
    return url


def place_row(name: str, address: str, lat: float, lng: float, block: str = "", include_images: bool = True) -> dict:
    row = {
        "name": name,
        "address": address,
        "lat": lat,
        "lng": lng,
        "kind": "장소",
        "source": "naver",
        "image": extract_image_from_block(block) if include_images and block else "",
    }
    return row


def parse_places(html: str, limit: int, include_images: bool = True) -> list[dict]:
    seen: set[str] = set()
    results: list[dict] = []

    if include_images:
        image_block = re.compile(
            r'"name":"(?P<name>[^"\\]{2,80})"[\s\S]{0,5000}?"imageUrl":"(?P<img>(?:[^"\\]|\\.)*)"[\s\S]{0,2000}?"x":"(?P<x>[0-9.]+)"[\s\S]{0,300}?"y":"(?P<y>[0-9.]+)"',
        )
        for m in image_block.finditer(html):
            name = m.group("name").strip()
            if not name or name in SKIP_NAMES or name in seen:
                continue
            try:
                lng = float(m.group("x"))
                lat = float(m.group("y"))
            except ValueError:
                continue
            if not (124 <= lng <= 132 and 33 <= lat <= 39):
                continue
            addr_m = re.search(r'"fullAddress":"([^"\\]*)"', m.group(0))
            img = decode_naver_url(m.group("img"))
            image = img if img.startswith("http") and score_image_url(img) > 0 else ""
            seen.add(name)
            results.append({
                "name": name,
                "address": addr_m.group(1) if addr_m else "",
                "lat": lat,
                "lng": lng,
                "kind": "장소",
                "source": "naver",
                "image": image,
            })
            if len(results) >= limit:
                return results

    block_pattern = re.compile(
        r'"name":"(?P<name>[^"\\]{2,80})"(?P<body>[\s\S]{0,900}?)"x":"(?P<x>[0-9.]+)"(?P<body2>[\s\S]{0,120}?)"y":"(?P<y>[0-9.]+)"',
    )
    for m in block_pattern.finditer(html):
        name = m.group("name").strip()
        if not name or name in SKIP_NAMES or name in seen:
            continue
        addr_m = re.search(r'"fullAddress":"([^"\\]*)"', m.group("body") + m.group("body2"))
        try:
            lng = float(m.group("x"))
            lat = float(m.group("y"))
        except ValueError:
            continue
        if not (124 <= lng <= 132 and 33 <= lat <= 39):
            continue
        seen.add(name)
        block = m.group("body") + m.group("body2")
        results.append(place_row(name, addr_m.group(1) if addr_m else "", lat, lng, block, include_images))
        if len(results) >= limit:
            return results

    for m in re.finditer(
        r'"normalizedName":"([^"\\]{2,80})"[\s\S]{0,400}?"x":"([0-9.]+)"[\s\S]{0,120}?"y":"([0-9.]+)"',
        html,
    ):
        name = m.group(1).strip()
        if not name or name in SKIP_NAMES or name in seen:
            continue
        try:
            lng = float(m.group(2))
            lat = float(m.group(3))
        except ValueError:
            continue
        if not (124 <= lng <= 132 and 33 <= lat <= 39):
            continue
        seen.add(name)
        results.append(place_row(name, "", lat, lng, m.group(0), include_images))
        if len(results) >= limit:
            break

    if len(results) < limit:
        for m in re.finditer(
            r'"name":"([^"\\]{2,80})"[\s\S]{0,500}?"y":"([0-9.]+)"[\s\S]{0,120}?"x":"([0-9.]+)"',
            html,
        ):
            name = m.group(1).strip()
            if not name or name in SKIP_NAMES or name in seen:
                continue
            addr_m = re.search(r'"fullAddress":"([^"\\]*)"', m.group(0))
            try:
                lat = float(m.group(2))
                lng = float(m.group(3))
            except ValueError:
                continue
            if not (124 <= lng <= 132 and 33 <= lat <= 39):
                continue
            seen.add(name)
            results.append(place_row(name, addr_m.group(1) if addr_m else "", lat, lng, m.group(0), include_images))
            if len(results) >= limit:
                break

    if len(results) < limit:
        for m in re.finditer(
            r'"mapy":"([0-9.]+)"[\s\S]{0,200}?"mapx":"([0-9.]+)"[\s\S]{0,300}?"name":"([^"\\]{2,80})"',
            html,
        ):
            name = m.group(3).strip()
            if not name or name in SKIP_NAMES or name in seen:
                continue
            try:
                lat = float(m.group(1))
                lng = float(m.group(2))
            except ValueError:
                continue
            if not (124 <= lng <= 132 and 33 <= lat <= 39):
                continue
            seen.add(name)
            results.append(place_row(name, "", lat, lng, m.group(0), include_images))
            if len(results) >= limit:
                break
    return results


def merge_place_results(*groups: list[dict], limit: int = 8) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for group in groups:
        for item in group:
            if not item or not item.get("name"):
                continue
            key = f"{item.get('name', '')}|{item.get('lat', '')},{item.get('lng', '')}"
            if key in seen:
                continue
            seen.add(key)
            out.append(item)
            if len(out) >= limit:
                return out
    return out


def geocode_query_variants(query: str) -> list[str]:
    q = re.sub(r"\s*\d+\s*동(\s*\d+\s*호)?", " ", query.strip())
    q = re.sub(r"\s*\d+\s*호", " ", q)
    q = re.sub(r"\s+", " ", q).strip()
    if not q:
        return []
    variants = [q, f"{q}, 대한민국", f"{q} 아파트" if "아파트" not in q else q]
    parts = re.split(r"\s+", q)
    if len(parts) >= 2:
        rev = " ".join(reversed(parts))
        variants.append(rev)
        variants.append(f"{rev}, 대한민국")
        variants.append(", ".join(reversed(parts)) + ", 대한민국")
    m = re.match(r"^(.+?[시도])(.+?[군구])(.+)$", q)
    if m:
        variants.append(f"{m.group(3).strip()}, {m.group(2).strip()}, {m.group(1).strip()}, 대한민국")
    m2 = re.match(r"^(.+?[시도군구])(.+?[동읍면동리].*)$", q)
    if m2:
        variants.append(f"{m2.group(2).strip()}, {m2.group(1).strip()}, 대한민국")
    deduped: list[str] = []
    seen: set[str] = set()
    for v in variants:
        v = v.strip()
        if v and v not in seen:
            seen.add(v)
            deduped.append(v)
    return deduped


def geocode_nominatim(query: str, limit: int = 5) -> list[dict]:
    global _last_geocode_fetch
    q = query.strip()
    if not q:
        return []

    now = time.time()
    cached = _geocode_cache.get(q)
    if cached and now - cached[0] < _CACHE_TTL:
        return cached[1][:limit]

    results: list[dict] = []
    seen_coords: set[str] = set()
    for variant in geocode_query_variants(q):
        if len(results) >= limit:
            break
        if time.time() - _last_geocode_fetch < 1.1:
            time.sleep(1.1)
        params = urllib.parse.urlencode({
            "q": variant,
            "format": "json",
            "limit": str(limit),
            "countrycodes": "kr",
            "addressdetails": "0",
        })
        url = f"https://nominatim.openstreetmap.org/search?{params}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Oasi5SafetyMap/1.0 (transit geocode)", "Accept-Language": "ko"},
        )
        try:
            _last_geocode_fetch = time.time()
            data = json.loads(urllib.request.urlopen(req, timeout=20).read())
            for item in data or []:
                try:
                    lat = round(float(item["lat"]), 6)
                    lng = round(float(item["lon"]), 6)
                except (KeyError, TypeError, ValueError):
                    continue
                if not (124 <= lng <= 132 and 33 <= lat <= 39):
                    continue
                coord_key = f"{lat:.5f},{lng:.5f}"
                if coord_key in seen_coords:
                    continue
                seen_coords.add(coord_key)
                display = item.get("display_name") or variant
                short_name = q
                if item.get("name"):
                    short_name = str(item["name"])
                results.append({
                    "name": short_name,
                    "address": display,
                    "lat": lat,
                    "lng": lng,
                    "kind": "주소",
                    "source": "geocode",
                })
                if len(results) >= limit:
                    break
        except Exception:
            continue

    _geocode_cache[q] = (now, results)
    return results[:limit]


def fetch_naver_places_html(query: str, lat: float | None = None, lng: float | None = None) -> str | None:
    global _last_place_fetch
    cache_key = f"{query}|{lat}|{lng}"
    now = time.time()
    cached = _html_cache.get(cache_key)
    if cached and now - cached[0] < _HTML_CACHE_TTL:
        return cached[1]

    enc = urllib.parse.quote(query)
    if lat is not None and lng is not None:
        url = (
            f"https://pcmap.place.naver.com/place/list?query={enc}"
            f"&x={lng}&y={lat}&clientX={lng}&clientY={lat}&display=100&page=1"
        )
    else:
        url = f"https://pcmap.place.naver.com/place/list?query={enc}&display=100&page=1"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", "Referer": "https://map.naver.com/"},
    )
    for attempt in range(2):
        with _place_fetch_lock:
            wait = _PLACE_FETCH_INTERVAL - (time.time() - _last_place_fetch)
            if wait > 0:
                time.sleep(wait)
            _last_place_fetch = time.time()
        try:
            html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "replace")
            _html_cache[cache_key] = (time.time(), html)
            return html
        except Exception:
            if attempt < 1:
                time.sleep(0.5)
            continue
    return None


def geocode_point(query: str) -> dict | None:
    q = query.strip()
    if not q:
        return None
    now = time.time()
    cached = _geocode_cache.get(f"point|{q}")
    if cached and now - cached[0] < _CACHE_TTL:
        return cached[1]

    html = fetch_naver_places_html(q)
    if html:
        items = parse_places(html, 5, include_images=False)
        if items:
            best = items[0]
            if best.get("lat") and best.get("lng"):
                _geocode_cache[f"point|{q}"] = (now, best)
                return best

    geo = geocode_nominatim(q, 1)
    point = geo[0] if geo else None
    _geocode_cache[f"point|{q}"] = (now, point)
    return point


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    import math
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    x = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x))


NEARBY_KIND_QUERIES: dict[str, str] = {
    "cafe": "카페",
    "food": "식당",
    "shop": "마트",
}

_nearby_cache: dict[str, tuple[float, list]] = {}
_bus_stop_cache: dict[str, tuple[float, list]] = {}


def search_nearby_bus_stops(lat: float, lng: float, radius_km: float = 0.8, limit: int = 8) -> list[dict]:
    cache_key = f"{lat:.4f},{lng:.4f}|{radius_km}|{limit}"
    now = time.time()
    cached = _bus_stop_cache.get(cache_key)
    if cached and now - cached[0] < 1800:
        return cached[1]

    radius_m = int(radius_km * 1000)
    query = (
        f'[out:json][timeout:8];('
        f'node["highway"="bus_stop"](around:{radius_m},{lat},{lng});'
        f'node["public_transport"="platform"]["bus"="yes"](around:{radius_m},{lat},{lng});'
        f'node["amenity"="bus_station"](around:{radius_m},{lat},{lng});'
        f');out body 30;'
    )
    endpoints = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
    ]
    data = None
    for endpoint in endpoints:
        try:
            req = urllib.request.Request(
                endpoint,
                data=("data=" + urllib.parse.quote(query)).encode("utf-8"),
                headers={
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "User-Agent": "Oasi5/1.0",
                },
                method="POST",
            )
            data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode("utf-8", "replace"))
            break
        except Exception:
            continue

    items: list[dict] = []
    seen: set[str] = set()
    for el in (data or {}).get("elements") or []:
        tags = el.get("tags") or {}
        name = tags.get("name") or tags.get("name:ko") or "버스정류장"
        elat = el.get("lat")
        elon = el.get("lon")
        if elat is None or elon is None:
            continue
        dist = haversine_km(lat, lng, float(elat), float(elon))
        key = f"{name}|{float(elat):.5f},{float(elon):.5f}"
        if key in seen:
            continue
        seen.add(key)
        items.append({
            "name": name,
            "lat": float(elat),
            "lng": float(elon),
            "distanceKm": round(dist, 3),
            "distanceM": int(round(dist * 1000)),
            "source": "osm",
            "kind": "bus_stop",
        })
    items.sort(key=lambda x: x["distanceKm"])
    items = items[:limit]
    _bus_stop_cache[cache_key] = (now, items)
    return items


def _collect_nearby_from_html(
    html: str,
    lat: float,
    lng: float,
    kind: str,
    radius_km: float,
    limit: int,
) -> list[dict]:
    seen: set[str] = set()
    within: list[dict] = []
    outside: list[dict] = []

    for item in parse_places(html, 80, include_images=True):
        try:
            plat = float(item["lat"])
            plng = float(item["lng"])
        except (KeyError, TypeError, ValueError):
            continue
        key = f"{item.get('name', '')}|{plat:.5f},{plng:.5f}"
        if key in seen:
            continue
        seen.add(key)
        dist = haversine_km(lat, lng, plat, plng)
        image_src = item.get("image") or ""
        row = {
            **item,
            "distanceKm": round(dist, 2),
            "source": "nearby",
            "kind": kind,
            "image": image_src,
            "photoUrl": photo_proxy_path(item.get("name", ""), item.get("address", ""), plat, plng, image_src),
        }
        if dist <= radius_km:
            within.append(row)
        else:
            outside.append(row)

    within.sort(key=lambda row: row.get("distanceKm", 999))
    if len(within) >= limit:
        return within[:limit]

    outside.sort(key=lambda row: row.get("distanceKm", 999))
    fallback_radius = min(radius_km + 3.0, 8.0)
    for row in outside:
        if len(within) >= limit:
            break
        if row.get("distanceKm", 999) <= fallback_radius:
            within.append(row)
    return within[:limit]


def _collect_nearby_candidates(
    lat: float,
    lng: float,
    kind: str,
    radius_km: float = 5.0,
    limit: int = 20,
) -> list[dict]:
    query = NEARBY_KIND_QUERIES.get(kind, "카페")
    html = fetch_naver_places_html(query, lat, lng)
    if not html:
        return []
    return _collect_nearby_from_html(html, lat, lng, kind, radius_km, limit)


def search_naver_places(query: str, limit: int = 8) -> list[dict]:
    q = query.strip()
    if not q:
        return []

    now = time.time()
    cached = _search_cache.get(q)
    if cached and now - cached[0] < _CACHE_TTL:
        return cached[1][:limit]

    naver_results: list[dict] = []
    html = fetch_naver_places_html(q)
    if html:
        naver_results = parse_places(html, limit, include_images=False)

    geocode_results: list[dict] = []
    if len(naver_results) < limit:
        geocode_results = geocode_nominatim(q, max(limit - len(naver_results), 3))

    results = merge_place_results(naver_results, geocode_results, limit=limit)
    _search_cache[q] = (now, results)
    return results[:limit]


def search_naver_nearby(lat: float, lng: float, kind: str, radius_km: float = 5.0, limit: int = 20) -> list[dict]:
    cache_key = f"{lat:.4f}|{lng:.4f}|{kind}|{radius_km:.1f}|{limit}"
    now = time.time()
    cached = _nearby_cache.get(cache_key)
    if cached and now - cached[0] < 600:
        return cached[1][:limit]

    collected = _collect_nearby_candidates(lat, lng, kind, radius_km, limit)
    _nearby_cache[cache_key] = (now, collected)
    return collected[:limit]


def search_naver_nearby_all(lat: float, lng: float, radius_km: float = 5.0, limit: int = 20) -> dict[str, list[dict]]:
    cache_key = f"all|{lat:.4f}|{lng:.4f}|{radius_km:.1f}|{limit}"
    now = time.time()
    cached = _nearby_all_cache.get(cache_key)
    if cached and now - cached[0] < 600:
        return cached[1]

    kinds = ("cafe", "food", "shop")
    html_by_kind: dict[str, str | None] = {}
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {
            pool.submit(fetch_naver_places_html, NEARBY_KIND_QUERIES[kind], lat, lng): kind
            for kind in kinds
        }
        for future in as_completed(futures):
            kind = futures[future]
            try:
                html_by_kind[kind] = future.result()
            except Exception:
                html_by_kind[kind] = None

    payload: dict[str, list[dict]] = {}
    for kind in kinds:
        html = html_by_kind.get(kind)
        payload[kind] = (
            _collect_nearby_from_html(html, lat, lng, kind, radius_km, limit)
            if html else []
        )

    _nearby_all_cache[cache_key] = (now, payload)
    return payload


def fetch_json(url: str, timeout: int = 30) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "Oasi5/1.0"})
    raw = urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "replace")
    return json.loads(raw)


def lane_name(lane) -> str:
    if isinstance(lane, list):
        lane = lane[0] if lane else {}
    if not isinstance(lane, dict):
        return ""
    return lane.get("name") or lane.get("busNo") or ""


def push_point(polyline: list[list[float]], lng: float, lat: float):
    if lng and lat:
        pt = [lat, lng]
        if not polyline or polyline[-1] != pt:
            polyline.append(pt)


def parse_odsay_path(path: dict, from_name: str, to_name: str) -> dict:
    info = path.get("info") or {}
    steps = []
    polyline: list[list[float]] = []

    walk_m = info.get("totalWalk")
    if walk_m is None or walk_m < 0:
        walk_m = max(0, int(info.get("totalWalkTime", 0)) * 80)
    walk_min = max(0, int(info.get("totalWalkTime", 0)))
    if walk_min <= 0 and walk_m:
        walk_min = max(1, round(walk_m / 80))

    for sub in path.get("subPath") or []:
        t = sub.get("trafficType")
        duration = max(0, int(sub.get("sectionTime") or 0))
        distance = max(0, int(sub.get("distance") or 0))

        if t == 3:
            steps.append({
                "type": "walk",
                "duration": duration,
                "distance": distance,
                "from": sub.get("startName") or from_name,
                "to": sub.get("endName") or to_name,
                "line": None,
                "notes": [],
            })
            push_point(polyline, sub.get("startX"), sub.get("startY"))
            push_point(polyline, sub.get("endX"), sub.get("endY"))
        elif t == 1:
            stations = ((sub.get("passStopList") or {}).get("stations") or [])
            for st in stations:
                push_point(polyline, st.get("x"), st.get("y"))
            steps.append({
                "type": "subway",
                "duration": duration,
                "distance": distance,
                "from": sub.get("startName") or "",
                "to": sub.get("endName") or "",
                "line": lane_name(sub.get("lane")),
                "stationCount": sub.get("stationCount") or max(0, len(stations) - 1),
                "startId": sub.get("startID"),
                "endId": sub.get("endID"),
                "stations": [
                    {"id": st.get("stationID"), "name": st.get("stationName")}
                    for st in stations if st.get("stationName")
                ],
                "notes": [],
            })
        elif t == 2:
            bus_no = lane_name(sub.get("lane"))
            steps.append({
                "type": "bus",
                "duration": duration,
                "distance": distance,
                "from": sub.get("startName") or "",
                "to": sub.get("endName") or "",
                "line": bus_no or "버스",
                "stationCount": sub.get("stationCount") or 0,
                "notes": ["버스는 저상버스·리프트 장착 여부가 노선·차량마다 다릅니다."],
            })
            push_point(polyline, sub.get("startX"), sub.get("startY"))
            push_point(polyline, sub.get("endX"), sub.get("endY"))

    return {
        "summary": {
            "totalMinutes": max(0, int(info.get("totalTime") or 0)),
            "payment": info.get("payment"),
            "transfers": max(0, int(info.get("busTransitCount") or 0) + int(info.get("subwayTransitCount") or 0)),
            "walkMeters": int(walk_m or 0),
            "walkMinutes": walk_min,
            "busCount": int(info.get("busTransitCount") or 0),
            "subwayCount": int(info.get("subwayTransitCount") or 0),
            "label": "대중교통",
            "firstStop": info.get("firstStartStation") or "",
            "lastStop": info.get("lastEndStation") or "",
        },
        "steps": steps,
        "polyline": polyline,
    }


def push_polyline_point(polyline: list[list[float]], lng: float | None, lat: float | None):
    if lng is None or lat is None:
        return
    try:
        pt = [float(lat), float(lng)]
    except (TypeError, ValueError):
        return
    if not polyline or polyline[-1] != pt:
        polyline.append(pt)


def parse_naver_transit_step(step: dict, from_name: str, to_name: str) -> dict | None:
    stype = step.get("type")
    duration = max(0, round((step.get("duration") or 0) / 60000))
    distance = max(0, int(step.get("distance") or 0))

    if stype == "WALKING":
        goal = ((step.get("walkPath") or {}).get("summary") or {}).get("goal") or {}
        return {
            "type": "walk",
            "duration": duration,
            "distance": distance,
            "from": from_name,
            "to": goal.get("name") or to_name,
            "line": None,
            "notes": [],
        }

    if stype == "SUBWAY":
        routes = step.get("routes") or []
        line = (routes[0].get("name") if routes else None) or "지하철"
        stops = step.get("stops") or []
        from_st = (stops[0].get("displayName") or stops[0].get("name")) if stops else ""
        to_st = (stops[-1].get("displayName") or stops[-1].get("name")) if stops else ""
        return {
            "type": "subway",
            "duration": duration,
            "distance": distance,
            "from": from_st,
            "to": to_st,
            "line": line,
            "stationCount": max(0, len(stops) - 1),
            "startId": stops[0].get("id") if stops else None,
            "endId": stops[-1].get("id") if stops else None,
            "stations": [
                {"id": st.get("id"), "name": st.get("displayName") or st.get("name")}
                for st in stops if st.get("name")
            ],
            "notes": [],
        }

    if stype == "BUS":
        routes = step.get("routes") or []
        line = (routes[0].get("name") if routes else None) or "버스"
        stops = step.get("stops") or []
        from_st = (stops[0].get("displayName") or stops[0].get("name")) if stops else ""
        to_st = (stops[-1].get("displayName") or stops[-1].get("name")) if stops else ""
        return {
            "type": "bus",
            "duration": duration,
            "distance": distance,
            "from": from_st,
            "to": to_st,
            "line": line,
            "stationCount": max(0, len(stops) - 1),
            "notes": ["버스는 저상버스·리프트 장착 여부가 노선·차량마다 다릅니다."],
        }

    return None


def collect_naver_step_polyline(step: dict, polyline: list[list[float]]):
    walk_path = (step.get("walkPath") or {}).get("path") or []
    for pt in walk_path:
        if isinstance(pt, list) and len(pt) >= 2:
            push_polyline_point(polyline, pt[0], pt[1])
    for pt in step.get("points") or []:
        if isinstance(pt, dict):
            push_polyline_point(polyline, pt.get("x"), pt.get("y"))


def parse_naver_transit_path(path: dict, from_name: str, to_name: str, idx: int) -> dict:
    duration_ms = path.get("duration") or 0
    walk_ms = path.get("walkingDuration") or 0
    total_min = max(1, round(duration_ms / 60000))
    walk_min = max(0, round(walk_ms / 60000))
    walk_m = max(0, int(walk_min * 80))

    steps: list[dict] = []
    polyline: list[list[float]] = []
    bus_count = 0
    subway_count = 0
    first_stop = ""
    last_stop = ""

    for leg in path.get("legs") or []:
        for step in leg.get("steps") or []:
            parsed = parse_naver_transit_step(step, from_name, to_name)
            if not parsed:
                continue
            if parsed["type"] == "bus":
                bus_count += 1
            if parsed["type"] == "subway":
                subway_count += 1
            if not first_stop and parsed.get("from"):
                first_stop = parsed["from"]
            if parsed.get("to"):
                last_stop = parsed["to"]
            steps.append(parsed)
            collect_naver_step_polyline(step, polyline)

    labels = path.get("pathLabels") or []
    label = labels[0].get("labelText") if labels else "대중교통"
    payment = None
    fare_groups = path.get("fareGroups") or []
    if fare_groups:
        options = (fare_groups[0].get("fareOptions") or [])
        if options:
            payment = options[0].get("fare")

    return {
        "id": idx,
        "summary": {
            "totalMinutes": total_min,
            "payment": payment,
            "transfers": max(0, int(path.get("transferCount") or 0)),
            "walkMeters": walk_m,
            "walkMinutes": walk_min,
            "busCount": bus_count,
            "subwayCount": subway_count,
            "label": label or "대중교통",
            "firstStop": first_stop or from_name,
            "lastStop": last_stop or to_name,
        },
        "steps": steps,
        "polyline": polyline,
    }


def search_transit_naver(sx: float, sy: float, ex: float, ey: float, from_name: str, to_name: str) -> dict:
    q = urllib.parse.urlencode({"start": f"{sx},{sy}", "goal": f"{ex},{ey}"})
    url = f"https://map.naver.com/p/api/directions/transit?{q}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Referer": "https://map.naver.com/", "Accept": "application/json"},
    )
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except Exception as exc:
        return {
            "error": True,
            "code": "NAVER_TRANSIT_ERROR",
            "message": f"대중교통 경로를 불러오지 못했습니다. ({exc})",
        }

    paths = data.get("paths") or []
    routes = []
    for i, path in enumerate(paths[:4]):
        parsed = parse_naver_transit_path(path, from_name, to_name, i)
        if parsed.get("steps"):
            routes.append(parsed)

    if not routes:
        return {
            "error": True,
            "code": "NO_ROUTE",
            "message": "대중교통 경로를 찾지 못했습니다. 출발·도착지를 다시 확인해 주세요.",
        }

    return {"mode": "transit", "routes": routes, "source": "naver"}


def search_transit_odsay(sx: float, sy: float, ex: float, ey: float, profile: str, from_name: str, to_name: str) -> dict:
    key = load_odsay_key()
    if not key:
        return {
            "error": True,
            "code": "ODSAY_KEY_REQUIRED",
            "message": "대중교통 경로는 ODsay API 키가 필요합니다. odsay-config.local.json 파일을 만들어 주세요.",
        }

    opt = 0
    if profile in ("elderly", "visual", "walker"):
        opt = 5
    elif profile in ("wheelchair", "stroller"):
        opt = 4

    q = urllib.parse.urlencode({
        "apiKey": key,
        "SX": sx, "SY": sy, "EX": ex, "EY": ey,
        "OPT": opt,
        "SearchPathType": 0,
    })
    data = fetch_json(f"https://api.odsay.com/v1/api/searchPubTransPathT?{q}")
    if data.get("error"):
        msg = data["error"][0].get("message", "ODsay 오류") if isinstance(data["error"], list) else "ODsay 오류"
        return {"error": True, "code": "ODSAY_ERROR", "message": msg}

    paths = (data.get("result") or {}).get("path") or []
    routes = []
    for i, path in enumerate(paths[:4]):
        parsed = parse_odsay_path(path, from_name, to_name)
        parsed["id"] = i
        routes.append(parsed)

    if not routes:
        return {"error": True, "code": "NO_ROUTE", "message": "대중교통 경로를 찾지 못했습니다. 출발·도착지를 조금 다르게 입력해 보세요."}

    return {"mode": "transit", "routes": routes, "source": "odsay"}


def search_osrm(mode: str, sx: float, sy: float, ex: float, ey: float, from_name: str, to_name: str) -> dict:
    profile_map = {"walk": "foot", "car": "driving", "bicycle": "bike"}
    osrm_profile = profile_map.get(mode, "foot")
    coords = f"{sx},{sy};{ex},{ey}"
    url = f"{OSRM}/{osrm_profile}/{coords}?overview=full&geometries=geojson&steps=true"
    data = fetch_json(url)

    if data.get("code") != "Ok" or not data.get("routes"):
        return {"error": True, "code": "NO_ROUTE", "message": "경로를 찾지 못했습니다."}

    route = data["routes"][0]
    legs = route.get("legs") or []
    steps = []
    for leg in legs:
        for step in leg.get("steps") or []:
            maneuver = step.get("maneuver") or {}
            loc = maneuver.get("location") or [None, None]
            steps.append({
                "type": mode if mode in ("walk", "car", "bicycle") else "walk",
                "duration": max(1, round((step.get("duration") or 0) / 60)),
                "distance": int(step.get("distance") or 0),
                "from": maneuver.get("type") or from_name,
                "to": to_name,
                "line": None,
                "instruction": (maneuver.get("type") or "") + " " + (step.get("name") or ""),
                "notes": [],
            })

    if not steps:
        steps = [{
            "type": mode if mode in ("walk", "car", "bicycle") else "walk",
            "duration": max(1, round((route.get("duration") or 0) / 60)),
            "distance": int(route.get("distance") or 0),
            "from": from_name,
            "to": to_name,
            "line": None,
            "notes": [],
        }]

    coords_list = route.get("geometry", {}).get("coordinates") or []
    polyline = [[pt[1], pt[0]] for pt in coords_list if len(pt) >= 2]

    labels = {"walk": "도보", "car": "자동차", "bicycle": "자전거"}
    total_min = max(1, round((route.get("duration") or 0) / 60))

    return {
        "mode": mode,
        "source": "osrm",
        "routes": [{
            "id": 0,
            "summary": {
                "totalMinutes": total_min,
                "payment": None,
                "transfers": 0,
                "walkMeters": int(route.get("distance") or 0) if mode == "walk" else 0,
                "walkMinutes": total_min if mode == "walk" else 0,
                "busCount": 0,
                "subwayCount": 0,
                "label": labels.get(mode, mode),
                "firstStop": from_name,
                "lastStop": to_name,
            },
            "steps": steps[:12],
            "polyline": polyline,
        }],
    }


def search_route(params: dict) -> dict:
    try:
        sx = float((params.get("fromLng") or ["0"])[0])
        sy = float((params.get("fromLat") or ["0"])[0])
        ex = float((params.get("toLng") or ["0"])[0])
        ey = float((params.get("toLat") or ["0"])[0])
    except ValueError:
        return {"error": True, "code": "BAD_COORDS", "message": "좌표 형식이 올바르지 않습니다."}

    if not (124 <= sx <= 132 and 33 <= sy <= 39 and 124 <= ex <= 132 and 33 <= ey <= 39):
        return {"error": True, "code": "BAD_COORDS", "message": "한국 내 출발·도착 좌표를 선택해 주세요."}

    mode = (params.get("mode") or ["transit"])[0]
    profile = (params.get("profile") or ["wheelchair"])[0]
    from_name = (params.get("fromName") or ["출발"])[0]
    to_name = (params.get("toName") or ["도착"])[0]

    cache_key = f"{mode}|{profile}|{sx:.5f},{sy:.5f}|{ex:.5f},{ey:.5f}"
    now = time.time()
    cached = _route_cache.get(cache_key)
    if cached and now - cached[0] < 600:
        return cached[1]

    if mode == "transit":
        key = load_odsay_key()
        if key:
            result = search_transit_odsay(sx, sy, ex, ey, profile, from_name, to_name)
            if not result.get("error"):
                _route_cache[cache_key] = (now, result)
                return result
        result = search_transit_naver(sx, sy, ex, ey, from_name, to_name)
    elif mode in ("walk", "car", "bicycle"):
        result = search_osrm(mode, sx, sy, ex, ey, from_name, to_name)
    else:
        result = {"error": True, "code": "BAD_MODE", "message": "지원하지 않는 이동 수단입니다."}

    if not result.get("error"):
        _route_cache[cache_key] = (now, result)
    return result


def normalize_api_path(path: str) -> str:
    p = (path or "").split("?")[0]
    if not p.startswith("/"):
        p = "/" + p
    if p.startswith("/api/"):
        return p
    return "/api" + p if p != "/api" else p


def resolve_api(path: str, params: dict) -> tuple[int, str, bytes]:
    """Return (status, content_type, body) for API routes used by local + Vercel handlers."""
    path = normalize_api_path(path)

    if path == "/api/place-photo/img":
        result = serve_place_image(params)
        if not result:
            return 404, "application/json; charset=utf-8", json_body({"error": True, "message": "이미지를 찾지 못했습니다."})
        data, content_type = result
        return 200, content_type, data

    if path == "/api/place-photo":
        name = (params.get("name") or params.get("q") or [""])[0].strip()
        address = (params.get("address") or [""])[0].strip()
        lat = lng = None
        try:
            if params.get("lat") and params.get("lng"):
                lat = float(params.get("lat", ["0"])[0])
                lng = float(params.get("lng", ["0"])[0])
        except ValueError:
            lat = lng = None
        if not name:
            return 400, "application/json; charset=utf-8", json_body({"error": True, "message": "name 또는 q 파라미터가 필요합니다."})
        src = (params.get("src") or [""])[0].strip()
        proxy = photo_proxy_path(name, address, lat, lng, src)
        remote = src if is_allowed_image_url(src) else fetch_place_photo(name, address, lat, lng)
        if not remote:
            return 404, "application/json; charset=utf-8", json_body({"error": True, "name": name, "url": ""})
        return 200, "application/json; charset=utf-8", json_body({"name": name, "url": proxy, "remote": remote})

    if path == "/api/transit-search":
        q = (params.get("q") or [""])[0]
        limit = min(int((params.get("limit") or ["8"])[0]), 15)
        items = search_naver_places(q, limit)
        return 200, "application/json; charset=utf-8", json_body({"query": q, "items": items})

    if path == "/api/nearby-places-all":
        try:
            lat = float((params.get("lat") or ["0"])[0])
            lng = float((params.get("lng") or ["0"])[0])
        except ValueError:
            return 400, "application/json; charset=utf-8", json_body({"error": True, "message": "좌표 형식이 올바르지 않습니다."})
        try:
            radius = min(max(float((params.get("radius") or ["5"])[0]), 1.0), 10.0)
        except ValueError:
            radius = 5.0
        limit = min(int((params.get("limit") or ["20"])[0]), 25)
        if not (124 <= lng <= 132 and 33 <= lat <= 39):
            return 400, "application/json; charset=utf-8", json_body({"error": True, "message": "한국 내 좌표만 지원합니다."})
        payload = {
            "lat": lat,
            "lng": lng,
            "radiusKm": radius,
            **search_naver_nearby_all(lat, lng, radius, limit),
        }
        return 200, "application/json; charset=utf-8", json_body(payload)

    if path == "/api/nearby-places":
        try:
            lat = float((params.get("lat") or ["0"])[0])
            lng = float((params.get("lng") or ["0"])[0])
        except ValueError:
            return 400, "application/json; charset=utf-8", json_body({"error": True, "message": "좌표 형식이 올바르지 않습니다."})
        kind = (params.get("kind") or ["cafe"])[0]
        try:
            radius = min(max(float((params.get("radius") or ["5"])[0]), 1.0), 10.0)
        except ValueError:
            radius = 5.0
        limit = min(int((params.get("limit") or ["20"])[0]), 25)
        if not (124 <= lng <= 132 and 33 <= lat <= 39):
            return 400, "application/json; charset=utf-8", json_body({"error": True, "message": "한국 내 좌표만 지원합니다."})
        items = search_naver_nearby(lat, lng, kind, radius, limit)
        return 200, "application/json; charset=utf-8", json_body({"lat": lat, "lng": lng, "kind": kind, "radiusKm": radius, "items": items})

    if path == "/api/geocode":
        q = (params.get("q") or [""])[0]
        point = geocode_point(q)
        if not point:
            return 404, "application/json; charset=utf-8", json_body({"error": True, "message": "위치를 찾지 못했습니다. 지역명 + 아파트명으로 입력해 보세요.", "query": q})
        return 200, "application/json; charset=utf-8", json_body({"query": q, "point": point})

    if path == "/api/nearby-bus-stops":
        try:
            lat = float((params.get("lat") or ["0"])[0])
            lng = float((params.get("lng") or ["0"])[0])
        except ValueError:
            return 400, "application/json; charset=utf-8", json_body({"error": True, "message": "좌표 형식이 올바르지 않습니다."})
        try:
            radius = min(max(float((params.get("radius") or ["0.8"])[0]), 0.3), 2.0)
        except ValueError:
            radius = 0.8
        limit = min(max(int((params.get("limit") or ["8"])[0]), 3), 15)
        if not (124 <= lng <= 132 and 33 <= lat <= 39):
            return 400, "application/json; charset=utf-8", json_body({"error": True, "message": "한국 내 좌표만 지원합니다."})
        items = search_nearby_bus_stops(lat, lng, radius, limit)
        return 200, "application/json; charset=utf-8", json_body({
            "lat": lat,
            "lng": lng,
            "radiusKm": radius,
            "items": items,
        })

    if path == "/api/kric/station-mobility":
        result = get_station_mobility(params)
        if result.get("error") and not result.get("fallback"):
            return 503, "application/json; charset=utf-8", json_body(result)
        return 200, "application/json; charset=utf-8", json_body(result)

    if path == "/api/transit-route":
        result = search_route(params)
        if result.get("error"):
            code = result.get("code", "ERROR")
            status = 503 if code == "ODSAY_KEY_REQUIRED" else 400
            return status, "application/json; charset=utf-8", json_body(result)
        return 200, "application/json; charset=utf-8", json_body(result)

    return 404, "application/json; charset=utf-8", json_body({"error": True, "message": "Not found"})
