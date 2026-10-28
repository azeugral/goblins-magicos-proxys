"""Gera os números dos passos (assets/img/num/1.svg ... 9.svg): só o contorno, em ouro.

A Cinzel é variável e monta cada algarismo com formas sobrepostas; o contorno por CSS
(-webkit-text-stroke) desenha essas emendas por dentro do número. Aqui a fonte é fixada no
peso 800 com as sobreposições fundidas (skia-pathops), e cada algarismo vira um caminho limpo.
O traço usa non-scaling-stroke: fica com a mesma espessura em qualquer tamanho.

    pip install fonttools skia-pathops
    python tools/gerar_numeros.py ../_fontes/Cinzel[wght].ttf
"""
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "assets" / "img" / "num"
PESO = 800
TRACO = 1.5   # px na tela
FOLGA = 24    # unidades da fonte em volta do número, pro traço não cortar

fonte = instancer.instantiateVariableFont(TTFont(sys.argv[1]), {"wght": PESO}, overlap=instancer.OverlapMode.REMOVE)
glifos = fonte.getGlyphSet()
cmap = fonte.getBestCmap()
SAIDA.mkdir(parents=True, exist_ok=True)

for n in range(1, 10):
    g = glifos[cmap[ord(str(n))]]
    bp = BoundsPen(glifos)
    g.draw(bp)
    x0, y0, x1, y1 = bp.bounds
    pen = SVGPathPen(glifos)
    g.draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))  # y da fonte sobe, o do SVG desce
    vb = f"{x0 - FOLGA:.0f} {-y1 - FOLGA:.0f} {x1 - x0 + 2 * FOLGA:.0f} {y1 - y0 + 2 * FOLGA:.0f}"
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'
           f'<defs><linearGradient id="o" x1="0" y1="{-y1:.0f}" x2="0" y2="{-y0:.0f}" gradientUnits="userSpaceOnUse">'
           '<stop offset="0" stop-color="#f6dc8a"/><stop offset=".55" stop-color="#e3bd55"/><stop offset="1" stop-color="#b08a3c"/>'
           '</linearGradient></defs>'
           f'<path d="{pen.getCommands()}" fill="none" stroke="url(#o)" stroke-width="{TRACO}" '
           'stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>\n')
    (SAIDA / f"{n}.svg").write_text(svg, encoding="utf-8")
    print(n, vb)
