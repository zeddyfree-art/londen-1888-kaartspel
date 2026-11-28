"""Zet een statustextuur die op zuiver zwart is geschilderd om naar een doorzichtige PNG.

Gebruik: python3 -I tools/maak-statuslaag.py <bron.png> art/status/<naam>.png

Zwart wordt doorzichtig: alfa = het helderste kleurkanaal, de kleur wordt daarmee gedeeld
("unscreen"). Zo hoeft het spel geen mix-blend-mode te gebruiken; dat werkt niet binnen
.statuslagen, omdat die laag een eigen stapel vormt. Maximaal 512 px, 256 kleuren.
"""
import sys
import numpy as np
from PIL import Image

bron, doel = sys.argv[1], sys.argv[2]
im = Image.open(bron).convert("RGB")
im.thumbnail((512, 512), Image.LANCZOS)
a = np.asarray(im).astype(float) / 255
alfa = np.clip((a.max(axis=2) - 0.03) / 0.97, 0, 1)  # restje ruis in het zwart weg
kleur = np.where(alfa[..., None] > 0, np.clip(a / np.maximum(alfa[..., None], 1e-6), 0, 1), 0)
uit = np.dstack([kleur * 255, alfa * 255]).astype(np.uint8)
Image.fromarray(uit, "RGBA").quantize(colors=256, method=Image.FASTOCTREE).save(doel, optimize=True)
print(f"{doel}: {im.size[0]}x{im.size[1]}")
