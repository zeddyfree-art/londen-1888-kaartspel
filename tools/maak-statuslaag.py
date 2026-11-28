"""Zet een statustextuur om naar een doorzichtige PNG.

Gebruik: python3 -I tools/maak-statuslaag.py <bron.png> art/status/<naam>.png [--wit]

Standaard is de textuur op zuiver zwart geschilderd (licht effect: vuur, gloed, runen).
Zwart wordt doorzichtig: alfa = het helderste kleurkanaal, de kleur wordt daarmee gedeeld.
Met --wit is hij op zuiver wit geschilderd (donker effect: inkt, schaduw). Wit wordt
doorzichtig: alfa = 1 - het donkerste kanaal.
Zo hoeft het spel geen mix-blend-mode te gebruiken; dat werkt niet binnen .statuslagen,
omdat die laag een eigen stapel vormt. Maximaal 512 px, 256 kleuren.
"""
import sys
import numpy as np
from PIL import Image

bron, doel = sys.argv[1], sys.argv[2]
wit = "--wit" in sys.argv[3:]
im = Image.open(bron).convert("RGB")
im.thumbnail((512, 512), Image.LANCZOS)
a = np.asarray(im).astype(float) / 255
if wit:
    alfa = np.clip(((1 - a.min(axis=2)) - 0.03) / 0.97, 0, 1)  # restje ruis in het wit weg
    kleur = np.where(alfa[..., None] > 0, np.clip((a - (1 - alfa[..., None])) / np.maximum(alfa[..., None], 1e-6), 0, 1), 0)
else:
    alfa = np.clip((a.max(axis=2) - 0.03) / 0.97, 0, 1)  # restje ruis in het zwart weg
    kleur = np.where(alfa[..., None] > 0, np.clip(a / np.maximum(alfa[..., None], 1e-6), 0, 1), 0)
uit = np.dstack([kleur * 255, alfa * 255]).astype(np.uint8)
Image.fromarray(uit, "RGBA").quantize(colors=256, method=Image.FASTOCTREE).save(doel, optimize=True)
print(f"{doel}: {im.size[0]}x{im.size[1]}")
