"""Gera assets/img/og.jpg (1200x630), a prévia do link no WhatsApp/Instagram/Facebook.
O WhatsApp às vezes corta a prévia em quadrado no centro: selo, cartas e nome ficam no miolo
(x 285-915); preços e detalhes vão nas laterais. Fontes: Almendra/Permanent Marker (Google) +
Unbounded/JetBrains Mono. Uso: python tools/gerar_og.py  (subir o ?v= do og:image nos HTML)"""
import pathlib
from playwright.sync_api import sync_playwright

SITE = pathlib.Path(__file__).resolve().parent.parent
IMG = (SITE / 'assets' / 'img').as_uri()
CARTAS = (SITE / 'assets' / 'img' / 'cartas').as_uri()

HTML = f"""<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Almendra:wght@700&family=Permanent+Marker&family=Unbounded:wght@800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1200px;height:630px;overflow:hidden;background:#120e0c}}
.og{{position:relative;width:1200px;height:630px;overflow:hidden;
  background:radial-gradient(520px 420px at 50% 40%,rgba(222,59,32,.42),transparent 70%),
             radial-gradient(900px 500px at 50% 120%,rgba(169,196,60,.12),transparent 60%),
             linear-gradient(rgba(243,230,200,.035) 1px,transparent 1px) 0 0/42px 42px,
             linear-gradient(90deg,rgba(243,230,200,.035) 1px,transparent 1px) 0 0/42px 42px,#120e0c}}
.carta{{position:absolute;width:190px;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.75)}}
#c1{{left:372px;top:70px;transform:rotate(-17deg)}}
#c3{{left:640px;top:70px;transform:rotate(17deg)}}
#c2{{left:505px;top:32px;box-shadow:0 0 50px rgba(217,164,65,.55),0 24px 60px rgba(0,0,0,.75)}}
#selo{{position:absolute;left:465px;top:138px;width:270px;filter:drop-shadow(0 0 40px rgba(222,59,32,.6)) drop-shadow(0 18px 30px rgba(0,0,0,.7))}}
.nome{{position:absolute;left:0;right:0;top:418px;text-align:center}}
.nome b{{display:block;font:700 78px/1 Almendra,Georgia,serif;color:#d8f1e6;-webkit-text-stroke:1.5px #0d2a26;
  text-shadow:0 5px 0 #0d2a26,0 0 30px rgba(120,220,200,.25)}}
.nome i{{display:block;margin:-6px 0 0 300px;font:400 44px/1 'Permanent Marker',cursive;font-style:normal;letter-spacing:.06em;
  text-transform:uppercase;color:#f3e6c8;transform:rotate(-5deg);text-shadow:3px 3px 0 #3b1d55,-1px -1px 0 #3b1d55}}
.url{{position:absolute;left:0;right:0;top:572px;text-align:center;font:500 22px/1 'JetBrains Mono',monospace;letter-spacing:.14em;color:#f3e6c8;opacity:.8}}
.lado{{position:absolute;top:150px;width:230px;display:grid;gap:22px}}
.lado.e{{left:44px}} .lado.d{{right:44px;text-align:right}}
.k{{font:500 15px/1 'JetBrains Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:#a9c43c}}
.v{{margin-top:8px;font:800 40px/1 Unbounded,sans-serif;color:#f3e6c8;letter-spacing:-.02em}}
.v small{{font-size:22px}}
.fita{{display:inline-block;margin-top:10px;padding:8px 12px;background:#de3b20;color:#fff;font:800 13px/1.15 Unbounded,sans-serif;text-transform:uppercase;box-shadow:4px 4px 0 #8e1d0f}}
</style></head><body><div class="og">
  <div class="lado e">
    <div><div class="k">Avulsa</div><div class="v"><small>R$</small> 2,50</div></div>
    <div><div class="k">Foil</div><div class="v"><small>R$</small> 8</div></div>
    <div><div class="k">63 × 88 mm</div><div class="k" style="color:#f3e6c8;opacity:.7;margin-top:8px">Tamanho oficial</div></div>
  </div>
  <div class="lado d">
    <div><div class="k">Deck pronto</div><div class="v"><small>R$</small> 180</div><div class="fita">Comandante<br>foil de brinde</div></div>
    <div><div class="k">Monte online</div><div class="k" style="color:#f3e6c8;opacity:.7;margin-top:8px">Cole a lista</div></div>
  </div>
  <img class="carta" id="c1" src="{CARTAS}/black-lotus.webp">
  <img class="carta" id="c3" src="{CARTAS}/kraks-thumb.webp">
  <img class="carta" id="c2" src="{CARTAS}/the-one-ring.webp">
  <img id="selo" src="{IMG}/logo-512.webp">
  <div class="nome"><b>Goblins Mágicos</b><i>Proxys</i></div>
  <div class="url">GOBLINSMAGICOS.COM.BR</div>
</div></body></html>"""

if __name__ == '__main__':
    tmp = SITE / 'tools' / '_og.html'
    tmp.write_text(HTML, encoding='utf-8')
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge')
        pg = b.new_page(viewport={'width': 1200, 'height': 630})
        pg.goto(tmp.as_uri()); pg.wait_for_load_state('networkidle'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(500)
        pg.screenshot(path=str(SITE / 'assets' / 'img' / 'og.jpg'), type='jpeg', quality=90)
        b.close()
    tmp.unlink()
    print('og.jpg ok')
