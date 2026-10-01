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

/* Estimativa: não-foil usa preço de deck quando o pedido tem 100+ cartas. */
export function estimar(total, foils) {
  const M = C.montador || {};
  const pa = num(M.precoAvulsa), pf = num(M.precoFoil), pd = num(M.precoDeck100);
  const comuns = total - foils;
  if (!total) return { valor: null, txt: "—", lbl: "estimativa" };
  const precoComum = total >= 100 && pd != null ? pd / 100 : pa;
  if ((comuns && precoComum == null) || (foils && pf == null)) return { valor: null, txt: "Sob consulta", lbl: "orçamento" };
  const v = comuns * (precoComum || 0) + foils * (pf || 0);
  return { valor: v, txt: `${moeda()} ${brl(v)}`, lbl: total >= 100 && pd != null ? "preço de deck" : "estimativa" };
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
