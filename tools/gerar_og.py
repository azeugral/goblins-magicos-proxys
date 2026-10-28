"""Gera assets/img/og.jpg (1200x630), a prévia do link no WhatsApp/Instagram/Facebook, na identidade
"estilo Magic" (28/10): fumaça azul do próprio site (tools/og-fumaca.png, capturada do fumaca.js),
Cinzel/JetBrains Mono, ouro e azul de pedra, logo nova (marca.webp) e o selo do goblin.
O WhatsApp às vezes corta a prévia em quadrado no centro: selo, cartas e logo ficam no miolo
(x 285-915); preços e detalhes vão nas laterais. Uso: python tools/gerar_og.py  (subir o ?v= do og:image nos HTML)"""
import pathlib
from playwright.sync_api import sync_playwright

SITE = pathlib.Path(__file__).resolve().parent.parent
IMG = (SITE / 'assets' / 'img').as_uri()
CARTAS = (SITE / 'assets' / 'img' / 'cartas').as_uri()
FUMACA = (SITE / 'tools' / 'og-fumaca.png').as_uri()

HTML = f"""<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1200px;height:630px;overflow:hidden;background:#0f0a07}}
.og{{position:relative;width:1200px;height:630px;overflow:hidden;background:#0f0a07 url({FUMACA}) center/cover}}
.og::before{{content:'';position:absolute;inset:0;background:radial-gradient(460px 380px at 50% 42%,rgba(227,189,85,.2),transparent 70%)}}
.carta{{position:absolute;width:176px;border-radius:11px;box-shadow:0 24px 60px rgba(0,0,0,.75)}}
#c1{{left:392px;top:40px;transform:rotate(-17deg)}}
#c3{{left:632px;top:40px;transform:rotate(17deg)}}
#c2{{left:512px;top:12px;box-shadow:0 0 50px rgba(227,189,85,.55),0 24px 60px rgba(0,0,0,.75)}}
#selo{{position:absolute;left:480px;top:96px;width:240px;filter:drop-shadow(0 0 40px rgba(227,189,85,.45)) drop-shadow(0 18px 30px rgba(0,0,0,.7))}}
#marca{{position:absolute;left:330px;top:340px;width:540px;filter:drop-shadow(0 14px 24px rgba(0,0,0,.75))}}
.url{{position:absolute;left:0;right:0;top:572px;display:flex;justify-content:center;align-items:center;gap:16px;
  font:700 20px/1 'JetBrains Mono',monospace;letter-spacing:.2em;color:#e3bd55}}
.url::before,.url::after{{content:'';width:46px;height:2px;background:linear-gradient(90deg,transparent,#e3bd55)}}
.url::after{{transform:scaleX(-1)}}
.lado{{position:absolute;top:140px;width:240px;display:grid;gap:22px}}
.lado.e{{left:46px}} .lado.d{{right:46px;text-align:right}}
.k{{font:700 14px/1 'JetBrains Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:#e3bd55}}
.v{{margin-top:8px;font:800 44px/1 Cinzel,serif;color:#f1e6cf}}
.v small{{font-size:22px;margin-right:4px}}
.s{{font:700 14px/1.35 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#c7b28e;margin-top:8px}}
.fita{{display:inline-block;margin-top:12px;padding:9px 13px;background:linear-gradient(180deg,#f2d278,#dcae46 55%,#c4922e);color:#1d1107;
  font:800 13px/1.15 Cinzel,serif;text-transform:uppercase;box-shadow:0 0 0 1px #6e4c14 inset,0 12px 24px -10px rgba(227,189,85,.7)}}
</style></head><body><div class="og">
  <div class="lado e">
    <div><div class="k">Avulsa</div><div class="v"><small>R$</small>2,50</div></div>
    <div><div class="k">Foil</div><div class="v"><small>R$</small>8</div></div>
    <div><div class="k">63 × 88 mm</div><div class="s">Tamanho oficial</div></div>
  </div>
  <div class="lado d">
    <div><div class="k">Deck pronto</div><div class="v"><small>R$</small>180</div><div class="fita">Comandante<br>foil de brinde</div></div>
    <div><div class="k">Monte online</div><div class="s">Cole a lista</div></div>
  </div>
  <img class="carta" id="c1" src="{CARTAS}/black-lotus.webp">
  <img class="carta" id="c3" src="{CARTAS}/kraks-thumb.webp">
  <img class="carta" id="c2" src="{CARTAS}/the-one-ring.webp">
  <img id="selo" src="{IMG}/logo-512.webp">
  <img id="marca" src="{IMG}/marca.webp">
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
