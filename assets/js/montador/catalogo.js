/* Catálogo próprio de cartas (gerado por tools/catalogo.py).
   Baixa uma vez, guarda no IndexedDB e só baixa de novo quando a versão muda. */

const BASE = new URL("../../../data/", import.meta.url).href;
const DB = "goblins-magicos", ST = "arquivos";

function idb() {
  return new Promise((ok, erro) => {
    if (!("indexedDB" in window)) return erro(new Error("sem indexedDB"));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
}
export async function idbGet(k) {
  try {
    const db = await idb();
    return await new Promise((ok) => { const q = db.transaction(ST).objectStore(ST).get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); });
  } catch { return undefined; }
}
export async function idbSet(k, v) {
  try {
    const db = await idb();
    await new Promise((ok) => { const t = db.transaction(ST, "readwrite"); t.objectStore(ST).put(v, k); t.oncomplete = ok; t.onerror = ok; });
  } catch { /* sem cache: segue funcionando */ }
}
export async function idbDel(k) {
  try {
    const db = await idb();
    await new Promise((ok) => { const t = db.transaction(ST, "readwrite"); t.objectStore(ST).delete(k); t.oncomplete = ok; t.onerror = ok; });
  } catch { /* nada */ }
}

async function baixarComProgresso(url, onProg) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  const total = +r.headers.get("content-length") || 0;
  if (!r.body || !onProg) return new Uint8Array(await r.arrayBuffer());
  const leitor = r.body.getReader();
  const partes = []; let rec = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    partes.push(value); rec += value.length;
    onProg(rec, total);
  }
  const out = new Uint8Array(rec); let o = 0;
  partes.forEach((p) => { out.set(p, o); o += p.length; });
  return out;
}

async function lerJson(bytes) {
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(s).text());
  }
  return JSON.parse(new TextDecoder().decode(bytes)); // servidor já descompactou
}

async function arquivo(nome, versao, onProg) {
  const chave = `${nome}@${versao}`;
  let bytes = await idbGet(chave);
  if (!bytes) {
    bytes = await baixarComProgresso(`${BASE}${nome}?v=${versao}`, onProg);
    await idbSet(chave, bytes);
    const velho = await idbGet(`${nome}@atual`);
    if (velho && velho !== versao) idbDel(`${nome}@${velho}`);
    await idbSet(`${nome}@atual`, versao);
  } else if (onProg) onProg(1, 1);
  return lerJson(bytes);
}

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").trim();

export class Catalogo {
  static async carregar(onProg = () => {}) {
    let versao;
    try {
      const r = await fetch(`${BASE}versao.json`, { cache: "no-cache" });
      versao = (await r.json()).v;
    } catch {
      versao = await idbGet("catalogo.json.gz@atual"); // offline: usa o que tiver
      if (!versao) throw new Error("Sem conexão e sem catálogo salvo.");
    }
    const [nomes, cat] = await Promise.all([
      arquivo("nomes.json.gz", versao),
      arquivo("catalogo.json.gz", versao, onProg),
    ]);
    return new Catalogo(nomes, cat);
  }

  constructor(nomes, cat) {
    this.v = cat.v;
    this.nomes = nomes.n;
    this.sets = cat.s;
    this.ini = cat.i;
    this.pad = cat.d;
    this.p = cat.p;
    this.idx = new Map();
    this.nomes.forEach((n, i) => this.idx.set(norm(n), i));
    Object.entries(nomes.a || {}).forEach(([a, i]) => { if (!this.idx.has(norm(a))) this.idx.set(norm(a), i); });
    this.porSetNum = null;
    this.chaves = this.nomes.map(norm);
  }

  get total() { return this.nomes.length; }

  acharNome(nome) {
    const k = norm(nome.replace(/\s*\/\/?\s*/g, (m) => (m.includes("//") ? " // " : m)));
    if (this.idx.has(k)) return this.idx.get(k);
    const semBarra = k.split(" // ")[0];
    return this.idx.has(semBarra) ? this.idx.get(semBarra) : -1;
  }

  _ed(pi) {
    const r = this.p[pi];
    return { pi, n: r[0], set: r[1], cn: r[2], id: r[3], f: r[4] };
  }

  edicoes(n) {
    const fim = n + 1 < this.ini.length ? this.ini[n + 1] : this.p.length;
    const out = [];
    for (let i = this.ini[n]; i < fim; i++) out.push(this._ed(i));
    return out;
  }

  padrao(n) { return this._ed(this.ini[n] + (this.pad[n] || 0)); }

  porSetENum(set, cn) {
    if (!this.porSetNum) {
      this.porSetNum = new Map();
      this.p.forEach((r, i) => this.porSetNum.set(`${r[1]}|${r[2]}`.toLowerCase(), i));
    }
    const i = this.porSetNum.get(`${set}|${cn}`.toLowerCase());
    return i == null ? null : this._ed(i);
  }

  nomeSet(code) { const s = this.sets[code]; return s ? s[0] : code.toUpperCase(); }
  anoSet(code) { const s = this.sets[code]; return s && s[1] ? s[1].slice(0, 4) : ""; }

  /* Autocomplete: começa com > palavra começa com > contém */
  sugerir(q, max = 8) {
    const k = norm(q);
    if (k.length < 2) return [];
    const a = [], b = [], c = [];
    for (let i = 0; i < this.chaves.length && a.length < max; i++) {
      const s = this.chaves[i];
      if (s.startsWith(k)) a.push(i);
      else if (b.length < max && s.includes(" " + k)) b.push(i);
      else if (c.length < max && k.length > 3 && s.includes(k)) c.push(i);
    }
    return [...a, ...b, ...c].slice(0, max);
  }

  /* "Você quis dizer…": distância de edição com corte */
  parecidos(nome, max = 3) {
    const k = norm(nome);
    if (!k) return [];
    const lim = Math.max(2, Math.floor(k.length / 4));
    const out = [];
    for (let i = 0; i < this.chaves.length; i++) {
      const s = this.chaves[i];
      if (Math.abs(s.length - k.length) > lim) continue;
      const d = dist(k, s, lim);
      if (d <= lim) out.push([d, i]);
    }
    if (!out.length) this.sugerir(k.split(" ")[0], max).forEach((i) => out.push([9, i]));
    return out.sort((x, y) => x[0] - y[0]).slice(0, max).map((x) => x[1]);
  }
}

function dist(a, b, lim) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < menor) menor = cur[j];
    }
    if (menor > lim) return lim + 1;
    prev = cur;
  }
  return prev[b.length];
}

/* Imagens do CDN do Scryfall a partir do id da edição */
export function imagem(id, tam = "normal", verso = false) {
  if (!id) return "";
  if (id.startsWith("casa:")) return id.slice(5);
  const ext = tam === "png" ? "png" : "jpg";
  return `https://cards.scryfall.io/${tam}/${verso ? "back" : "front"}/${id[0]}/${id[1]}/${id}.${ext}`;
}

export const ROTULOS = { b: "Borderless", f: "Full art", s: "Showcase", e: "Extended", r: "Moldura antiga", d: "Frente e verso", P: "Promo" };
