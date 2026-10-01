"""Gera o catálogo de cartas de Magic usado pelo montador.

Baixa o bulk "default_cards" do Scryfall, fica só com as edições em papel
em inglês e grava três arquivos em data/:

  versao.json         versão e totais (o navegador compara pra saber se atualiza)
  nomes.json.gz       nomes + apelidos (faces de cartas duplas) e a arte padrão
  catalogo.json.gz    todas as edições: [nome, set, número, id, flags]

Roda toda semana pelo GitHub Action (.github/workflows/catalogo.yml).
Uso local:  python tools/catalogo.py
"""
import gzip
import json
import os
import sys
import urllib.request
from datetime import date

UA = {"User-Agent": "GoblinsMagicosProxys/1.0 (catalogo)", "Accept": "application/json"}
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "data")

LAYOUTS_FORA = {"token", "double_faced_token", "emblem", "art_series", "vanguard", "scheme", "planar", "reversible_card"}
SETS_FORA = {"memorabilia", "token", "minigame", "alchemy"}
SETS_PADRAO = {"core", "expansion", "masters", "draft_innovation", "commander", "starter"}
SETS_NAO_PADRAO = {"plst", "sld", "mb1", "mb2", "fmb1", "sunf"}  # coleções de reimpressão variada: nunca são a arte padrão


def baixar_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def linhas_bulk():
    info = baixar_json("https://api.scryfall.com/bulk-data/default-cards")
    url = info.get("jsonl_download_uri") or info["download_uri"]
    print("baixando", url, file=sys.stderr)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=600) as r:
        stream = gzip.GzipFile(fileobj=r) if url.endswith(".gz") else r
        for raw in stream:
            linha = raw.decode("utf-8").strip().rstrip(",")
            if linha and linha not in ("[", "]"):
                yield json.loads(linha)


def flags(c):
    fe = c.get("frame_effects") or []
    f = ""
    if c.get("border_color") == "borderless": f += "b"
    if c.get("full_art"): f += "f"
    if "showcase" in fe: f += "s"
    if "extendedart" in fe: f += "e"
    if c.get("frame") in ("1993", "1997"): f += "r"
    if "card_faces" in c and "image_uris" not in c: f += "d"
    if "Basic Land" in (c.get("type_line") or ""): f += "L"
    if c.get("promo") or c.get("set_type") == "promo": f += "P"
    return f


def main():
    sets = {}
    por_nome = {}
    apelidos = {}
    for c in linhas_bulk():
        if c.get("lang") != "en" or "paper" not in c.get("games", []):
            continue
        if c.get("layout") in LAYOUTS_FORA or c.get("oversized") or c.get("set_type") in SETS_FORA:
            continue
        if not c.get("image_uris") and not (c.get("card_faces") and c["card_faces"][0].get("image_uris")):
            continue
        nome = c["name"]
        sets.setdefault(c["set"], [c["set_name"], c.get("released_at", ""), c.get("set_type", "")])
        por_nome.setdefault(nome, []).append(
            [c["set"], c["collector_number"], c["id"], flags(c), c.get("released_at", ""), c.get("set_type", "")]
        )
        if " // " in nome:
            for face in nome.split(" // "):
                apelidos.setdefault(face, nome)

    nomes = sorted(por_nome)
    idx = {n: i for i, n in enumerate(nomes)}
    edicoes, inicio, padrao = [], [], []
    for n in nomes:
        lista = sorted(por_nome[n], key=lambda p: p[4], reverse=True)
        hoje = date.today().isoformat()
        bons = [k for k, p in enumerate(lista) if p[5] in SETS_PADRAO and p[0] not in SETS_NAO_PADRAO and not set("bfseP") & set(p[3]) and p[4] <= hoje]
        lancadas = [k for k, p in enumerate(lista) if p[4] <= hoje]
        padrao.append(bons[0] if bons else (lancadas[0] if lancadas else 0))
        inicio.append(len(edicoes))
        edicoes.extend([idx[n], p[0], p[1], p[2], p[3]] for p in lista)

    ali = {a.lower(): idx[n] for a, n in apelidos.items() if a.lower() not in {x.lower() for x in nomes}}
    v = date.today().strftime("%Y%m%d")
    os.makedirs(SAIDA, exist_ok=True)

    def gravar(nome_arq, obj):
        dados = json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        with open(os.path.join(SAIDA, nome_arq), "wb") as f:
            f.write(gzip.compress(dados, 9, mtime=0))

    gravar("nomes.json.gz", {"v": v, "n": nomes, "a": ali})
    gravar("catalogo.json.gz", {"v": v, "s": sets, "i": inicio, "d": padrao, "p": edicoes})
    with open(os.path.join(SAIDA, "versao.json"), "w", encoding="utf-8") as f:
        json.dump({"v": v, "cartas": len(nomes), "edicoes": len(edicoes)}, f)
    print(f"ok v{v}: {len(nomes)} cartas, {len(edicoes)} edições", file=sys.stderr)


if __name__ == "__main__":
    main()
