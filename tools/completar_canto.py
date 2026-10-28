"""Completa um pedaço coberto de uma carta recortada usando o scan oficial como referência.

Caso de uso: o Sol Ring da vitrine foi fotografado com outras cartas por cima do canto
inferior esquerdo. O scan do Scryfall tem o mesmo layout, mas é a versão clara (texto preto);
a foto é a foil escura (texto branco). Então:
  1. alinha o scan à foto por homografia (ECC) sobre as bordas, que são iguais nas duas versões;
  2. refaz os tons por região com cores medidas na foto: inverte na caixa de texto, direto na moldura;
  3. preenche só o polígono coberto, com borda suave e o mesmo desfoque da foto.

    python tools/completar_canto.py CARTA.webp SCAN.png "x,y x,y ..."   (polígono coberto, em px da carta)
"""
import sys

import cv2
import numpy as np
from PIL import Image

carta = Image.open(sys.argv[1]).convert("RGBA")
alfa = np.asarray(carta)[..., 3]
foto = cv2.cvtColor(np.asarray(carta)[..., :3], cv2.COLOR_RGB2BGR).astype(np.float32)
scan = cv2.cvtColor(np.asarray(Image.open(sys.argv[2]).convert("RGB")), cv2.COLOR_RGB2BGR).astype(np.float32)
H, W = foto.shape[:2]
scan = cv2.resize(scan, (W, H), interpolation=cv2.INTER_AREA)
poli = np.array([[int(v) for v in p.split(",")] for p in sys.argv[3].split()], np.int32)

buraco = np.zeros((H, W), np.uint8)
cv2.fillPoly(buraco, [poli], 255)


def bordas(bgr):
    g = cv2.GaussianBlur(cv2.cvtColor(bgr.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.5)
    m = cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))
    return m / (m.max() + 1e-6)


# 1. alinhamento: ECC sobre as bordas, fora do buraco e fora da borda da carta
usar = np.zeros((H, W), np.uint8)
usar[30:H - 30, 30:W - 30] = 255
usar[cv2.dilate(buraco, np.ones((41, 41), np.uint8)) > 0] = 0
M = np.eye(3, dtype=np.float32)
_, M = cv2.findTransformECC(bordas(foto), bordas(scan), M, cv2.MOTION_HOMOGRAPHY,
                            (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), usar, 5)
alinhado = cv2.warpPerspective(scan, M, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)

# 2. tons, por região (a foil escura não é só o scan invertido):
#    caixa de texto: fundo claro/letra preta no scan -> fundo escuro/letra branca na foto (inverte)
#    moldura e borda: o tom segue direto (borda preta continua preta, moldura escurece)
lum = cv2.cvtColor(alinhado.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
claro = ((lum > 150).astype(np.uint8) * 255)
# só dentro do retângulo da caixa de texto do layout (fora dele, o claro é moldura ou o rodapé branco)
fora = np.ones((H, W), bool)
fora[int(H * .625):int(H * .918), int(W * .068):int(W * .93)] = False
claro[fora] = 0
caixa = cv2.morphologyEx(claro, cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8))
caixa = (cv2.erode(cv2.dilate(caixa, np.ones((5, 5), np.uint8)), np.ones((5, 5), np.uint8)) > 0) & ~fora
vis = (buraco == 0) & (alfa > 250)
lum_f = cv2.cvtColor(foto.astype(np.uint8), cv2.COLOR_BGR2GRAY)
fundo_txt = np.median(foto[caixa & vis & (lum_f < 90)], axis=0)        # fundo escuro da caixa na foto
letra = np.percentile(foto[caixa & vis & (lum_f > 150)], 70, axis=0)   # letra clara na foto
moldura = np.median(foto[(~caixa) & vis & (lum_f > 25) & (lum_f < 110)][:, :], axis=0)
preto = np.percentile(foto[(~caixa) & vis], 3, axis=0)
lb = np.median(lum[caixa & (lum > 150)])                               # fundo claro da caixa no scan
t_txt = np.clip((lb - lum) / (lb - 40), 0, 1)[..., None]
lm = np.median(lum[(~caixa) & (lum > 60)])                             # moldura no scan
t_mol = np.clip(lum / lm, 0, 1.6)[..., None]
pintado = np.where(caixa[..., None], fundo_txt + (letra - fundo_txt) * t_txt, preto + (moldura - preto) * t_mol)
anel = (cv2.dilate(buraco, np.ones((121, 121), np.uint8)) > 0) & vis

# 3. desfoque parecido com o da foto e emenda suave
pintado = cv2.GaussianBlur(pintado, (0, 0), 1.1)
suave = cv2.GaussianBlur(buraco.astype(np.float32) / 255, (0, 0), 5)[..., None]
final = foto * (1 - suave) + pintado * suave

saida = np.dstack([cv2.cvtColor(final.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB), alfa])
Image.fromarray(saida, "RGBA").save(sys.argv[1], "WEBP", quality=88, method=6)
print("homografia ok; erro médio no anel:", round(float(np.abs(pintado[anel] - foto[anel]).mean()), 1))
