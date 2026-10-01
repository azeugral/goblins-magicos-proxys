/* Utilidades compartilhadas pelo montador e pelo painel do pedido. */

export const C = window.SITE || {};
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach((k) => k != null && k !== false && el.append(k));
  return el;
}

export const icon = (id) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", `#${id}`);
  s.append(u);
  return s;
};

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem storage */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* sem storage */ } },
};

let toastT;
export function toast(msg) {
  let el = $("[data-toast]");
  if (!el) { el = h("div", { class: "toast", role: "status", "aria-live": "polite", "data-toast": "" }); document.body.append(el); }
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("is-on"), 2800);
}

export const moeda = () => (C.precos && C.precos.moeda) || "R$";
export const brl = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);

/* Estimativa de preço.
   info: { total, foils, dfc (cópias dupla face), cmdFoil (comandantes foil) }
   - pedido com 100+ cartas: preço do deck pronto + avulsas extras; foil paga a diferença,
     e no deck o comandante foil sai de brinde
   - abaixo de 100: avulsa × comuns + foil × foils
   - dupla face soma o acréscimo por cópia */
export function estimar(a, b) {
  const x = typeof a === "object" && a ? a : { total: a, foils: b || 0 };
  const total = x.total || 0, foils = x.foils || 0, dfc = x.dfc || 0, cmdFoil = x.cmdFoil || 0;
  const M = C.montador || {};
  const pa = num(M.precoAvulsa), pf = num(M.precoFoil), pd = num(M.precoDeck100), pdf = num(M.precoDuplaFace) || 0;
  if (!total) return { valor: null, txt: "—", lbl: "estimativa" };
  const deck = pd != null && total >= 100;
  const brinde = deck && M.comandanteFoilBrinde ? Math.min(cmdFoil, 1) : 0;
  const foilsPagos = Math.max(0, foils - brinde);
  if (pa == null || (foilsPagos && pf == null)) return { valor: null, txt: "Sob consulta", lbl: "orçamento" };
  let v = deck
    ? pd + (total - 100) * pa + foilsPagos * ((pf || 0) - pa)
    : (total - foils) * pa + foils * (pf || 0);
  v += dfc * pdf;
  const partes = [deck ? "deck pronto" : "estimativa"];
  if (brinde) partes.push("comandante foil de brinde");
  if (dfc && pdf) partes.push(`${dfc} dupla face`);
  return { valor: v, txt: `${moeda()} ${brl(v)}`, lbl: partes.join(" · ") };
}

export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; }
  catch {
    const t = h("textarea", { style: "position:fixed;opacity:0;top:0;left:0" });
    t.value = texto; document.body.append(t); t.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    t.remove();
    return ok;
  }
}

export function baixar(nome, conteudo, tipo = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo }));
  const a = h("a", { href: url, download: nome });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const isTodo = (v) => typeof v === "string" && v.trim().startsWith("[");
export function contato() {
  const ig = String((C.marca && C.marca.instagram) || "").replace(/^@/, "").trim();
  const wa = String((C.marca && C.marca.whatsapp) || "").replace(/\D/g, "");
  return { ig: ig && !isTodo(ig) ? ig : "", wa, dm: ig && !isTodo(ig) ? `https://ig.me/m/${encodeURIComponent(ig)}` : "" };
}

/* iOS: ativa :active em toque */
document.addEventListener("touchstart", () => {}, { passive: true });
