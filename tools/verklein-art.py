"""Verkleint alle jpg/png in een map tot een maximale zijde, als jpg (kwaliteit 82).
Gebruik: python3 tools/verklein-art.py <map> <maximale zijde>"""
import os, sys
from PIL import Image

map_, maat = sys.argv[1], int(sys.argv[2])
for f in sorted(os.listdir(map_)):
    if not f.lower().endswith((".jpg", ".jpeg", ".png")):
        continue
    pad = os.path.join(map_, f)
    im = Image.open(pad)
    if max(im.size) > maat:
        im.thumbnail((maat, maat), Image.LANCZOS)
    doel = os.path.splitext(pad)[0] + ".jpg"
    im.convert("RGB").save(doel, "JPEG", quality=82, optimize=True, progressive=True)
    if doel != pad:
        os.remove(pad)
