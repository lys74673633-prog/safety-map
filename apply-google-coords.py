"""Apply Google-verified / official coordinates for help facilities."""
import re

# Google Maps place coords (!8m2!3dLAT!4dLNG) or official registry
GOOGLE_COORDS = {
    "유성구장애인종합복지관": (36.381389, 127.323333),
    "대전광역시립장애인종합복지관": (36.331585, 127.327685),
    "대덕구장애인종합복지관": (36.418019, 127.422223),
    "성산일출봉": (33.458384, 126.942214),
}

PLACE_PATTERN = re.compile(
    r'(\{\s*name:\s*"([^"]*)",\s*address:\s*"[^"]*",\s*lat:\s*)([\d.]+)(,\s*lng:\s*)([\d.]+)(,\s*type:\s*"[^"]*",\s*category:\s*"[^"]*",\s*description:\s*"[^"]*"\s*\})'
)


def main():
    content = open("places.js", encoding="utf-8").read()
    updated = 0

    def repl(m):
        nonlocal updated
        name = m.group(2)
        if name not in GOOGLE_COORDS:
            return m.group(0)
        lat, lng = GOOGLE_COORDS[name]
        updated += 1
        print(f"Override {name} -> {lat}, {lng}")
        return m.group(1) + str(lat) + m.group(4) + str(lng) + m.group(6)

    new_content = PLACE_PATTERN.sub(repl, content)
    open("places.js", "w", encoding="utf-8").write(new_content)
    print(f"Applied {updated} coordinate overrides.")


if __name__ == "__main__":
    main()
