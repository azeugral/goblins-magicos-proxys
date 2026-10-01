/* Lê listas de deck em qualquer formato comum:
   Arena/Moxfield:  1 Sol Ring (C21) 263 *F*
   MTGO:            SB: 1 Lightning Bolt
   Texto simples:   4x Lightning Bolt  |  Sol Ring
   LigaMagic:       1 Sol Ring [C21]
   Seções:          Commander / Comandante / Deck / Sideboard / Companion */

const SECOES = {
  commander: "cmd", comandante: "cmd", "commanders": "cmd", companion: "side",
  deck: "main", mainboard: "main", main: "main", maindeck: "main",
  sideboard: "side", side: "side", maybeboard: "maybe", considering: "maybe", tokens: "skip", token: "skip",
};

export function lerLista(texto) {
  const itens = [];
  let secao = "main";
  for (const bruta of String(texto || "").split(/\r?\n/)) {
    let l = bruta.trim();
    if (!l || l.startsWith("//") || l.startsWith("#")) continue;
    const cab = l.replace(/[:\s(]+\d*\)?\s*$/, "").toLowerCase();
    if (SECOES[cab] && !/^\d/.test(l)) { secao = SECOES[cab]; continue; }
    if (secao === "skip") continue;
    let sec = secao;
    if (/^SB:\s*/i.test(l)) { sec = "side"; l = l.replace(/^SB:\s*/i, ""); }
    if (/^CMDR?:\s*/i.test(l)) { sec = "cmd"; l = l.replace(/^CMDR?:\s*/i, ""); }

    let foil = false;
    if (/\s\*(F|E)\*\s*$/i.test(l) || /\s\(foil\)\s*$/i.test(l) || /\s\[foil\]\s*$/i.test(l)) {
      foil = true;
      l = l.replace(/\s\*(F|E)\*\s*$/i, "").replace(/\s[([]foil[)\]]\s*$/i, "").trim();
    }
    l = l.replace(/\s\*[A-Z]+\*\s*$/i, "").replace(/\s#\S.*$/, "").trim(); // marcadores e tags do Moxfield

    const m = l.match(/^(\d{1,3})\s*[xX]?\s+(.+)$/);
    const q = m ? parseInt(m[1], 10) : 1;
    let nome = (m ? m[2] : l).trim();
    let set = "", cn = "";
    const ed = nome.match(/\s[([]([A-Za-z0-9]{2,6})[)\]](?:\s+([A-Za-z0-9★\-]+))?\s*$/);
    if (ed) { set = ed[1].toLowerCase(); cn = ed[2] || ""; nome = nome.slice(0, ed.index).trim(); }
    nome = nome.replace(/\s+\/\/?\s+/g, " // ").replace(/\s{2,}/g, " ");
    if (!nome || q < 1) continue;
    itens.push({ q: Math.min(q, 999), nome, set, cn, foil, sec });
  }
  return itens;
}
