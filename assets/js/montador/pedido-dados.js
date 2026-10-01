/* Estado do pedido, artes da casa e o link compactado (#p=…).
   Nada vai pra servidor: o pedido inteiro viaja dentro do link. */
import { C, store } from "./util.js?v=5";

const CHAVE = "goblins-montador";
let uid = 0;
export const novaChave = () => `${Date.now().toString(36)}${(uid++).toString(36)}`;

/* ---------- Artes da casa (config.artesDaCasa) ---------- */
export function artesDaCasa(cat, n) {
  const lista = (C.artesDaCasa || []).map((a, i) => ({ ...a, i })).filter((a) => cat.acharNome(a.carta || "") === n);
  return lista.map((a) => {
    if (a.imagem) return { pi: -1, n, set: "casa", cn: String(a.i), id: `casa:${a.imagem}`, f: "", casa: true, nota: a.nota || "" };
    const ed = cat.porSetENum(a.set || "", a.num || "");
    return ed && ed.n === n ? { ...ed, casa: true, nota: a.nota || "" } : null;
  }).filter(Boolean);
}

export function edicaoPorSetNum(cat, set, cn) {
  if (set === "casa") {
    const a = (C.artesDaCasa || [])[+cn];
    if (!a) return null;
    const n = cat.acharNome(a.carta || "");
    if (n < 0) return null;
    return a.imagem ? { pi: -1, n, set: "casa", cn: String(cn), id: `casa:${a.imagem}`, f: "", casa: true, nota: a.nota || "" } : cat.porSetENum(a.set, a.num);
  }
  return cat.porSetENum(set, cn);
}

export function edicaoPadrao(cat, n) {
  const casa = artesDaCasa(cat, n);
  return casa[0] || cat.padrao(n);
}

/* ---------- Estado ---------- */
export class Pedido {
  constructor() { this.itens = []; this.ouvintes = new Set(); }

  static carregar() {
    const p = new Pedido();
    try { const s = JSON.parse(store.get(CHAVE) || "null"); if (s && Array.isArray(s.itens)) p.itens = s.itens; } catch { /* vazio */ }
    return p;
  }
  salvar() { store.set(CHAVE, JSON.stringify({ itens: this.itens })); }
  mudou(info) { this.salvar(); this.ouvintes.forEach((f) => f(info)); }
  ouvir(f) { this.ouvintes.add(f); }

  get total() { return this.itens.reduce((s, i) => s + (i.n >= 0 ? i.q : 0), 0); }
  get foils() { return this.itens.reduce((s, i) => s + (i.n >= 0 && i.foil ? i.q : 0), 0); }
  get infoPreco() {
    const v = this.validos;
    return {
      total: this.total,
      foils: this.foils,
      dfc: v.reduce((s, i) => s + ((i.f || "").includes("d") ? i.q : 0), 0),
      cmdFoil: v.reduce((s, i) => s + (i.sec === "cmd" && i.foil ? i.q : 0), 0),
    };
  }
  get validos() { return this.itens.filter((i) => i.n >= 0); }
  get faltando() { return this.itens.filter((i) => i.n < 0); }

  /* Junta itens iguais (mesma edição + foil + seção) */
  adicionar(cat, linhas) {
    let novos = 0, erros = 0;
    for (const l of linhas) {
      const n = cat.acharNome(l.nome);
      if (n < 0) { this.itens.push({ k: novaChave(), n: -1, nome: l.nome, q: l.q, foil: l.foil, sec: l.sec }); erros++; continue; }
      let ed = l.set ? edicaoPorSetNum(cat, l.set, l.cn) : null;
      if (ed && ed.n !== n) ed = null;
      if (!ed && l.set) {
        const doSet = cat.edicoes(n).filter((e) => e.set === l.set);
        ed = doSet.find((e) => !/[bfseP]/.test(e.f)) || doSet[0] || null;
      }
      if (!ed) ed = edicaoPadrao(cat, n);
      const igual = this.itens.find((i) => i.n === n && i.set === ed.set && i.cn === ed.cn && !!i.foil === !!l.foil && i.sec === l.sec);
      if (igual) igual.q = Math.min(999, igual.q + l.q);
      else this.itens.push({ k: novaChave(), n, q: l.q, set: ed.set, cn: ed.cn, id: ed.id, f: ed.f, foil: !!l.foil, sec: l.sec || "main" });
      novos += l.q;
    }
    this.ordenar();
    this.mudou({ tipo: "lista" });
    return { novos, erros };
  }

  ordenar() {
    const peso = { cmd: 0, main: 1, side: 2, maybe: 3 };
    this.itens.sort((a, b) => (peso[a.sec] ?? 1) - (peso[b.sec] ?? 1));
  }

  item(k) { return this.itens.find((i) => i.k === k); }
  remover(k) { this.itens = this.itens.filter((i) => i.k !== k); this.mudou({ tipo: "lista" }); }
  limpar() { this.itens = []; this.mudou({ tipo: "lista" }); }

  qtd(k, delta) {
    const i = this.item(k);
    if (!i) return;
    i.q = Math.max(0, Math.min(999, i.q + delta));
    if (!i.q) this.remover(k); else this.mudou({ tipo: "item", k });
  }
  alternarFoil(k) { const i = this.item(k); if (i) { i.foil = !i.foil; this.mudou({ tipo: "item", k }); } }

  /* Troca a arte; se "todas" for falso e houver mais de uma cópia, separa 1 cópia com a arte nova */
  trocarArte(k, ed, todas = true) {
    const i = this.item(k);
    if (!i) return k;
    const aplicar = (alvo) => Object.assign(alvo, { set: ed.set, cn: ed.cn, id: ed.id, f: ed.f });
    if (todas || i.q <= 1) { aplicar(i); this.mudou({ tipo: "item", k }); return k; }
    i.q -= 1;
    const nova = { ...i, k: novaChave(), q: 1 };
    aplicar(nova);
    this.itens.splice(this.itens.indexOf(i) + 1, 0, nova);
    this.mudou({ tipo: "lista" });
    return nova.k;
  }

  corrigir(cat, k, n) {
    const i = this.item(k);
    if (!i) return;
    const ed = edicaoPadrao(cat, n);
    Object.assign(i, { n, set: ed.set, cn: ed.cn, id: ed.id, f: ed.f, sec: i.sec || "main" });
    delete i.nome;
    this.mudou({ tipo: "lista" });
  }
}

/* ---------- Link compactado ---------- */
const SEC = { cmd: "c", main: "", side: "s", maybe: "m" };
const SEC_INV = { c: "cmd", s: "side", m: "maybe", "": "main" };

async function comprimir(texto) {
  const s = new Blob([texto]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(s).arrayBuffer());
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function descomprimir(b64) {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(s).text();
}

export function codigoPedido() {
  const a = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const r = crypto.getRandomValues(new Uint8Array(6));
  const s = [...r].map((x) => a[x % a.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export async function gerarLink(pedido, cliente, codigo) {
  const dados = {
    v: 1,
    id: codigo,
    d: new Date().toISOString().slice(0, 10),
    c: cliente,
    e: pedido.validos.map((i) => [i.q, i.set, i.cn, i.foil ? 1 : 0, SEC[i.sec] || ""]),
    x: pedido.faltando.map((i) => [i.q, i.nome]),
  };
  const z = await comprimir(JSON.stringify(dados));
  return new URL(`pedido.html#p=${z}`, location.href).href;
}

export async function lerLink(hash) {
  const m = String(hash || "").match(/[#&]p=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const d = JSON.parse(await descomprimir(m[1]));
  return {
    ...d,
    e: (d.e || []).map(([q, set, cn, foil, sec]) => ({ q, set, cn, foil: !!foil, sec: SEC_INV[sec] || "main" })),
    x: (d.x || []).map(([q, nome]) => ({ q, nome })),
  };
}

/* ---------- Saídas em texto ---------- */
export function linhaTexto(cat, i) {
  const nome = i.n >= 0 ? cat.nomes[i.n] : i.nome;
  const ed = i.set && i.set !== "casa" ? ` (${i.set.toUpperCase()}) ${i.cn}` : i.set === "casa" ? " (arte da casa)" : "";
  return `${i.q} ${nome}${ed}${i.foil ? " *F*" : ""}`;
}
