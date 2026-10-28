"""Recorta a logo gerada por IA (fundo verde chroma) e salva em assets/img.

    python tools/recortar_logo.py ../_logo-ia/v7-reto.png   (logo atual: v7 endireitada)

Saída: assets/img/marca.webp (720 px, sobra pro topo e rodapé em tela retina)
e o recorte em tamanho cheio ao lado do original (*-recorte.png).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent


def recortar(caminho):
    rgb = np.asarray(Image.open(caminho).convert("RGB")).astype(np.float32)
    fundo = np.median(np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3)]), axis=0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    verde = g - np.maximum(r, b)              # quanto o pixel puxa pro verde
    alfa = 1 - np.clip((verde - 40) / 90, 0, 1)
    # separa a cor da tinta do verde nos pixels meio transparentes
    a = np.maximum(alfa, .05)[..., None]
    rgb = np.clip((rgb - (1 - a) * fundo) / a, 0, 255)
    # nada na logo puxa pro verde: o que sobrou é contaminação do fundo
    rgb[..., 1] = np.minimum(rgb[..., 1], np.maximum(rgb[..., 0], rgb[..., 2]))
    img = np.dstack([rgb, alfa * 255]).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(img, "RGBA")
    caixa = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    m = 6
    return im.crop((max(caixa[0] - m, 0), max(caixa[1] - m, 0), caixa[2] + m, caixa[3] + m))


if __name__ == "__main__":
    origem = Image.open(sys.argv[1])
    saida = RAIZ / "assets" / "img"
    if origem.mode == "RGBA":  # já sem fundo (ex.: _logo-ia/v7-reto.png, saída do endireitar.py)
        im = origem
    else:
        im = recortar(sys.argv[1])
        im.save(Path(sys.argv[1]).with_name(Path(sys.argv[1]).stem + "-recorte.png"), optimize=True)
    w = 720
    im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(saida / "marca.webp", quality=90, method=6)
    print(im.size, "->", saida / "marca.webp")
