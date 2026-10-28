"""Completa o que estiver coberto numa carta recortada (dedo, outra carta) usando o scan oficial.

O scan é encaixado na foto por pontos característicos (SIFT + RANSAC, que ignora o que difere,
como o texto de outro idioma) e só o polígono coberto é trocado. A cor do scan é ajustada por
canal no anel visível em volta do buraco, e ele ganha o mesmo desfoque e granulado da foto.
A geometria do recorte não muda. Use quando o scan tem as mesmas cores da foto
(para a foil escura x scan claro, veja completar_canto.py).

    python tools/alinhar_ao_scan.py CARTA.webp SCAN.png "x,y x,y ..." [BORDA]
    polígono coberto em px da CARTA; BORDA (px, opcional) = largura da borda preta à esquerda,
    pintada com a cor da própria borda da foto quando o scan alinhado não chega até ela
"""
import sys

import cv2
import numpy as np
from PIL import Image

img = Image.open(sys.argv[1]).convert("RGBA")
alfa = np.asarray(img)[..., 3]
foto = np.asarray(img)[..., :3].astype(np.float32)
H, W = foto.shape[:2]
scan = cv2.resize(np.asarray(Image.open(sys.argv[2]).convert("RGB")), (W, H), interpolation=cv2.INTER_AREA)
poli = np.array([[int(v) for v in p.split(",")] for p in sys.argv[3].split()], np.int32)
buraco = np.zeros((H, W), np.uint8)
cv2.fillPoly(buraco, [poli], 255)
buraco = cv2.dilate(buraco, np.ones((7, 7), np.uint8))

# 1. encaixe: SIFT fora do buraco, homografia scan -> foto
cinza = lambda a: cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2GRAY)
sift = cv2.SIFT_create(4000)
k1, d1 = sift.detectAndCompute(cinza(foto), cv2.bitwise_not(cv2.dilate(buraco, np.ones((25, 25), np.uint8))))
k2, d2 = sift.detectAndCompute(cinza(scan), None)
pares = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < .75 * b.distance]
M, ok = cv2.findHomography(np.float32([k2[a.trainIdx].pt for a in pares]),
                           np.float32([k1[a.queryIdx].pt for a in pares]), cv2.RANSAC, 3.0)
alinhado = cv2.warpPerspective(scan, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)

# 2. cor: ajuste afim por canal no anel visível em volta do buraco
anel = (cv2.dilate(buraco, np.ones((61, 61), np.uint8)) > 0) & (buraco == 0) & (alfa > 250)
X = np.c_[alinhado[anel], np.ones(anel.sum())]
coef, *_ = np.linalg.lstsq(X, foto[anel], rcond=None)
pintado = np.clip(np.c_[alinhado.reshape(-1, 3), np.ones(H * W)] @ coef, 0, 255).reshape(H, W, 3)

# borda preta da esquerda: o scan alinhado pode não alcançar; usa a cor da borda visível na foto
if len(sys.argv) > 4:
    bw = int(sys.argv[4])
    faixa = np.zeros((H, W), bool)
    faixa[:, :bw] = True
    preto = np.median(foto[faixa & (buraco == 0) & (alfa > 250)], axis=0)
    rampa = np.clip((np.arange(W) - (bw - 4)) / 8, 0, 1)[None, :, None]   # some em 8 px na moldura
    pintado = pintado * rampa + preto * (1 - rampa)

# 3. textura da foto: mesmo desfoque e um granulado leve, pra emenda não aparecer
pintado = cv2.GaussianBlur(pintado, (0, 0), 1.2)
ruido = cv2.GaussianBlur(np.random.default_rng(7).normal(0, 3, (H, W)).astype(np.float32), (0, 0), .8)[..., None]
pintado = np.clip(pintado + ruido, 0, 255)
suave = cv2.GaussianBlur(buraco.astype(np.float32) / 255, (0, 0), 4)[..., None]
final = foto * (1 - suave) + pintado * suave

saida = np.dstack([final.clip(0, 255).astype(np.uint8), alfa])
Image.fromarray(saida, "RGBA").save(sys.argv[1], "WEBP", quality=88, method=6)
print(f"{int(ok.sum())}/{len(pares)} pontos no encaixe; diferença média no anel:",
      round(float(np.abs(pintado[anel] - foto[anel]).mean()), 1))
