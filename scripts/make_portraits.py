"""캐릭터 원본 이미지(src/data/characterImages/*.png)에서 얼굴~어깨 초상화를 잘라
src/assets/portraits/{id}.webp 로 저장한다.

사용: python scripts/make_portraits.py   (Pillow 필요)
얼굴 위치가 어긋나면 FACES 의 (x, y) 를 조정한다. 좌표는 원본(폭 1000px) 기준 얼굴 중심.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src/data/characterImages"
OUT = ROOT / "src/assets/portraits"

# name -> (얼굴 중심 x, y, 크롭 폭)
FACES = {
    "나나리": (450, 167, 380),
    "다포딜": (433, 150, 380),
    "라크리모사": (533, 250, 380),
    "링코": (400, 200, 380),
    "민트": (467, 183, 380),
    "백장": (550, 267, 380),
    "사키리": (450, 225, 320),
    "스키아": (467, 200, 420),
    "신쿠": (550, 233, 380),
    "아들러": (483, 183, 380),
    "아카네 린": (450, 167, 380),
    "에드가": (500, 167, 380),
    "우미츠키": (467, 167, 380),
    "일로이": (550, 200, 380),
    "치즈": (500, 200, 380),
    "하니엘": (500, 167, 380),
}
OUT_W, OUT_H = 160, 192  # 5:6, 표시 크기의 2배
FACE_Y = 0.40  # 얼굴 중심이 크롭 상단에서 차지하는 비율


def main() -> None:
    chars = json.loads((ROOT / "src/data/characters.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for c in chars:
        src = SRC / f"{c['name']}.png"
        if c["name"] not in FACES or not src.exists():
            print(f"skip {c['name']}")
            continue
        x, y, w = FACES[c["name"]]
        h = w * OUT_H / OUT_W
        left, top = x - w / 2, y - h * FACE_Y
        im = Image.open(src).convert("RGBA")
        crop = im.crop((round(left), round(top), round(left + w), round(top + h)))
        crop = crop.resize((OUT_W, OUT_H), Image.LANCZOS)
        crop.save(OUT / f"{c['id']}.webp", "WEBP", quality=82, method=6)
        print(f"{c['id']}: ok")


if __name__ == "__main__":
    main()
