"""Insert FACILITY_IMAGES into disability-access.js and update resolveEntry."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
js_path = ROOT / "disability-access.js"
snippet = (ROOT / "scripts" / "facility-images-snippet.js").read_text(encoding="utf-8")
text = js_path.read_text(encoding="utf-8")

marker = "  ];\n\n  var KIND_CLASS"
if marker not in text:
    raise SystemExit("marker not found")

text = text.replace(
    marker,
    "  ];\n\n" + snippet + "\n\n  var KIND_CLASS",
    1,
)

old_resolve = """  function resolveEntry(entry) {
    return {
      kind: entry.kind,
      name: entry.name,
      address: entry.address || '',
      lat: entry.lat,
      lng: entry.lng,
      image: entry.image || '',
      photoQuery: entry.photoQuery || '',
      audienceFor: entry.audienceFor,
      note: entry.note
    };
  }"""

new_resolve = """  function resolveImage(entry) {
    var naver = FACILITY_IMAGES[entry.name];
    if (naver && entry.photoQuery) return naver;
    if (entry.image) return entry.image;
    return naver || '';
  }

  function resolveEntry(entry) {
    return {
      kind: entry.kind,
      name: entry.name,
      address: entry.address || '',
      lat: entry.lat,
      lng: entry.lng,
      image: resolveImage(entry),
      photoQuery: entry.photoQuery || '',
      audienceFor: entry.audienceFor,
      note: entry.note
    };
  }"""

if old_resolve not in text:
    raise SystemExit("resolveEntry block not found")
text = text.replace(old_resolve, new_resolve, 1)

old_load = """  function loadFacilityPhotos(container) {
    if (typeof PhotoLoader === 'undefined') return;

    container.querySelectorAll('.facility-recommend-row').forEach(function (row) {
      var index = Number(row.getAttribute('data-index'));
      var raw = RECOMMENDATIONS[index];
      if (!raw) return;

      var item = resolveEntry(raw);
      if (item.image) return;

      var searchName = raw.photoQuery || item.name;
      var place = {
        name: searchName,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
        type: 'help',
        category: item.kind
      };

      PhotoLoader.loadRealPhotos(place).then(function (photos) {
        if (photos && photos.length > 0 && photos[0].url) {
          applyPhoto(row, photos[0].url, item.name + ' 사진');
          return;
        }
        var loading = row.querySelector('[data-facility-loading]');
        if (loading) {
          loading.innerHTML = '<span>사진을 찾지 못했습니다</span>';
        }
      }).catch(function () {
        var loading = row.querySelector('[data-facility-loading]');
        if (loading) {
          loading.innerHTML = '<span>사진을 찾지 못했습니다</span>';
        }
      });
    });
  }"""

new_load = """  function loadFacilityPhotos(container) {
    container.querySelectorAll('[data-facility-thumb]').forEach(function (img) {
      img.addEventListener('error', function onErr() {
        img.removeEventListener('error', onErr);
        var row = img.closest('.facility-recommend-row');
        var loading = row && row.querySelector('[data-facility-loading]');
        if (loading) {
          loading.innerHTML = '<span>사진을 불러올 수 없습니다</span>';
          loading.removeAttribute('hidden');
        }
        img.setAttribute('hidden', '');
      }, { once: true });
    });
  }"""

if old_load not in text:
    raise SystemExit("loadFacilityPhotos block not found")
text = text.replace(old_load, new_load, 1)

js_path.write_text(text, encoding="utf-8")
print("Updated", js_path)
