"""Recorta as cartas das fotos do dono (fundo claro) e gera as imagens da vitrine.

Para cada foto: acha as cartas pelo contraste com o fundo, ajusta uma reta em cada lado
(os cantos arredondados ficam de fora do ajuste) e cruza as retas para achar os cantos
de verdade; desfaz a perspectiva em 744×1040 (63×88 mm), corrige o tom de leve, recorta
os cantos arredondados com alfa e salva em WebP.

Uso:
  python tools/recortar_cartas.py --detectar FOTO.jpg     # desenha as cartas achadas em _debug/
  python tools/recortar_cartas.py                         # gera tudo o que está em CARTAS
As fotos ficam fora do repositório, em ../_fotos-dono/<data>/.
"""
import os, sys
import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
FOTOS = os.path.join(os.path.dirname(SITE), '_fotos-dono')
SAIDA = os.path.join(SITE, 'assets', 'img', 'cartas')
W, H, RAIO = 744, 1040, 36

# saída: foto, índice da carta achada (ordem de leitura) e opções:
#   borda=True  aceita carta encostada na borda da foto
#   topo='direita'  a carta foi fotografada deitada, com o título virado para a direita
#   cantos=[(x,y)...]  cantos marcados à mão (sup. esq., sup. dir., inf. dir., inf. esq.), pra foto
#                      em fundo escuro; um canto None (coberto) sai dos outros três, lados paralelos
F = '2026-10-27/'
CARTAS = {
    'propaganda':          (F + '39477c63-image.jpg', 0, {'topo': 'direita'}),
    'sleight-of-hand':     (F + '39477c63-image.jpg', 1, {'topo': 'direita'}),
    'steam-vents':         (F + '39477c63-image.jpg', 2, {'topo': 'direita'}),
    'desolation-of-smaug': (F + '39477c63-image.jpg', 3, {'topo': 'direita'}),
    'goldspan-dragon':     (F + '39477c63-image.jpg', 4, {'topo': 'direita'}),
    'redirect-lightning':  (F + '39477c63-image.jpg', 5, {'topo': 'direita'}),
    'sol-ring':            (F + 'fc4fada7-image.jpg', 0, {}),
    'fellwar-stone':       (F + 'f2b71268-image.jpg', 0, {'topo': 'direita'}),
    'izzet-signet':        (F + 'f9ec7f63-image.jpg', 0, {}),
    # na sleeve vermelha, sobre a mesa escura; o canto inf. esq. está coberto por outras cartas
    'sol-ring-showcase':   ('2026-10-28/sol-ring-showcase.webp', 0, {'cantos': [(73, 122), (583, 36), (692, 752), None]}),
}


def cantos_manuais(c):
    c = list(c)
    i = c.index(None) if None in c else -1
    if i >= 0:  # paralelogramo: o canto que falta é a soma dos vizinhos menos o oposto
        a, b, o = np.array(c[i - 1]), np.array(c[(i + 1) % 4]), np.array(c[(i + 2) % 4])
        c[i] = tuple(a + b - o)
    return np.array(c, dtype=np.float64)


def achar_cartas(img, borda=False):
    """Devolve a lista de quadriláteros (4×2, em ordem TL, TR, BR, BL) das cartas inteiras."""
    h, w = img.shape[:2]
    esc = 1200 / max(h, w)
    peq = cv2.resize(img, None, fx=esc, fy=esc, interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(peq, cv2.COLOR_BGR2HSV)
    # fundo: claro e pouco saturado (papel branco/cinza)
    fundo = (hsv[..., 1] < 40) & (hsv[..., 2] > 150)
    m = (~fundo).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    ph, pw = peq.shape[:2]
    quads = []
    for c in cnts:
        if cv2.contourArea(c) < 0.03 * ph * pw:
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        if not borda and (x <= 2 or y <= 2 or x + bw >= pw - 2 or y + bh >= ph - 2):
            continue  # carta cortada pela borda da foto
        hull = cv2.convexHull(c)
        per = cv2.arcLength(hull, True)
        ap = None
        for e in np.linspace(0.01, 0.08, 30):
            a = cv2.approxPolyDP(hull, e * per, True)
            if len(a) == 4:
                ap = a.reshape(4, 2).astype(np.float64); break
        if ap is None:
            continue
        q = refinar(c.reshape(-1, 2).astype(np.float64), ordenar(ap))
        if q is not None:
            quads.append(q / esc)
    # ordem de leitura: linhas de cima p/ baixo, depois esquerda p/ direita
    quads.sort(key=lambda q: (round(q[:, 1].mean() / (h * 0.25)), q[:, 0].mean()))
    return quads


def ordenar(p):
    s = p.sum(1); d = np.diff(p, axis=1).ravel()
    return np.array([p[np.argmin(s)], p[np.argmin(d)], p[np.argmax(s)], p[np.argmax(d)]])


def refinar(pts, q):
    """Ajusta uma reta no miolo de cada lado (sem os cantos arredondados) e cruza as retas."""
    retas = []
    for i in range(4):
        a, b = q[i], q[(i + 1) % 4]
        v = b - a; L = np.linalg.norm(v); u = v / L; n = np.array([-u[1], u[0]])
        t = (pts - a) @ u; dist = np.abs((pts - a) @ n)
        sel = pts[(t > 0.15 * L) & (t < 0.85 * L) & (dist < 0.04 * L)]
        if len(sel) < 20:
            return None
        vx, vy, x0, y0 = cv2.fitLine(sel.astype(np.float32), cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        retas.append((np.array([x0, y0]), np.array([vx, vy])))
    cantos = []
    for i in range(4):
        (p1, d1), (p2, d2) = retas[i - 1], retas[i]
        A = np.array([d1, -d2]).T
        t = np.linalg.solve(A, p2 - p1)
        cantos.append(p1 + t[0] * d1)
    return np.array(cantos)


def endireitar(img, q, topo=None):
    if topo == 'direita':  # o canto de cima à esquerda da carta é o de cima à direita da foto
        q = np.roll(q, -1, axis=0)
    # um fio para dentro, para não pegar o fundo na borda
    c = q.mean(0); q = c + (q - c) * 0.99
    M = cv2.getPerspectiveTransform(q.astype(np.float32), np.float32([[0, 0], [W, 0], [W, H], [0, H]]))
    return cv2.warpPerspective(img, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def acabamento(bgr):
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    im = ImageOps.autocontrast(im, cutoff=0.4, preserve_tone=True)
    im = ImageEnhance.Color(im).enhance(1.06)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    alfa = Image.new('L', (W * 4, H * 4), 0)
    ImageDraw.Draw(alfa).rounded_rectangle((0, 0, W * 4 - 1, H * 4 - 1), RAIO * 4, fill=255)
    im.putalpha(alfa.resize((W, H), Image.LANCZOS))
    return im


def main():
    if '--detectar' in sys.argv:
        f = sys.argv[sys.argv.index('--detectar') + 1]
        img = cv2.imread(f)
        qs = achar_cartas(img, '--borda' in sys.argv)
        dbg = img.copy()
        for i, q in enumerate(qs):
            cv2.polylines(dbg, [q.astype(np.int32)], True, (0, 255, 0), 8)
            cv2.putText(dbg, str(i), tuple(q.mean(0).astype(int)), cv2.FONT_HERSHEY_SIMPLEX, 6, (0, 0, 255), 14)
        os.makedirs(os.path.join(FOTOS, '_debug'), exist_ok=True)
        out = os.path.join(FOTOS, '_debug', os.path.basename(f))
        cv2.imwrite(out, cv2.resize(dbg, None, fx=0.3, fy=0.3))
        print(len(qs), 'cartas ->', out)
        return
    cache = {}
    for nome, (foto, idx, op) in CARTAS.items():
        borda = op.get('borda', False)
        if (foto, borda) not in cache:
            img = cv2.imread(os.path.join(FOTOS, foto))
            cache[(foto, borda)] = (img, [] if 'cantos' in op else achar_cartas(img, borda))
        img, qs = cache[(foto, borda)]
        q = cantos_manuais(op['cantos']) if 'cantos' in op else qs[idx]
        im = acabamento(endireitar(img, q, op.get('topo')))
        out = os.path.join(SAIDA, nome + '.webp')
        im.save(out, 'WEBP', quality=88, method=6)
        print(out, round(os.path.getsize(out) / 1024), 'KB')


if __name__ == '__main__':
    main()
