/* Painel do pedido (para o dono): abre o link #p=…, confere, marca o que já
   foi impresso, troca por arte própria e gera o PDF de impressão. */
import { C, $, $$, h, icon, toast, estimar, copiar, baixar, store } from "./util.js";
import { Catalogo, imagem, ROTULOS, idbGet, idbSet, idbDel } from "./catalogo.js";
import { lerLink, edicaoPorSetNum, linhaTexto } from "./pedido-dados.js";
import { gerarPdf, versoDaCasa } from "./pdf.js";

$$("[data-bind]").forEach((el) => {
  const v = el.dataset.bind.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  el.textContent = v || "";
});

let cat = null, dados = null, itens = [], filtro = "todas";
const proprias = new Map(); // "set|cn" -> objectURL da arte própria
let feitos = new Set();
const chaveFeitos = () => `goblins-feitos-${dados.id}`;

async function abrir() {
  $("[data-loader-erro]").hidden = true;
  try {
    dados = await lerLink(location.hash);
  } catch (e) {
    console.error(e);
    return falha("O link do pedido está incompleto ou foi cortado. Peça o link de novo ao cliente.");
  }
  if (!dados) { $("[data-loader]").hidden = true; $("[data-sem]").hidden = false; return; }
  try {
    cat = await Catalogo.carregar((rec, tot) => { $("[data-loader-bar]").style.width = `${tot ? (rec / tot) * 100 : 50}%`; });
  } catch (e) {
    console.error(e);
    return falha("Não deu pra carregar o catálogo de cartas. Verifique a conexão.");
  }
  itens = dados.e.map((e, x) => {
    const ed = edicaoPorSetNum(cat, e.set, e.cn);
    return ed ? { x, ...e, n: ed.n, id: ed.id, f: ed.f } : { x, ...e, n: -1, nome: `${e.set.toUpperCase()} ${e.cn}` };
  });
  try { feitos = new Set(JSON.parse(store.get(chaveFeitos()) || "[]")); } catch { feitos = new Set(); }
  for (const i of itens) {
    const blob = await idbGet(`arte:${i.set}|${i.cn}`);
    if (blob) proprias.set(`${i.set}|${i.cn}`, URL.createObjectURL(blob));
  }
  $("[data-loader]").classList.add("is-out");
  setTimeout(() => ($("[data-loader]").hidden = true), 450);
  $("[data-painel]").hidden = false;
  topo();
  render();
}
function falha(msg) {
  $("[data-loader-tit]").textContent = "Pedido indisponível";
  $("[data-loader-msg]").textContent = msg;
  $("[data-loader-erro]").hidden = false;
}
$("[data-loader-retry]").addEventListener("click", abrir);
$("[data-colar]").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("input", e.target).value.trim();
  const m = v.match(/#p=[A-Za-z0-9_-]+/);
  if (!m) { toast("Esse link não tem os dados do pedido"); return; }
  location.hash = m[0];
  $("[data-sem]").hidden = true; $("[data-loader]").hidden = false; $("[data-loader]").classList.remove("is-out");
  abrir();
});
window.addEventListener("hashchange", () => location.reload());
abrir();

/* ---------- Topo ---------- */
function topo() {
  const c = dados.c || {};
  document.title = `Pedido ${dados.id} · ${C.marca?.nome || ""}`;
  $("[data-p-data]").textContent = `Pedido ${dados.id} · ${dados.d ? dados.d.split("-").reverse().join("/") : ""}`;
  $("[data-p-tit]").textContent = c.n || "Cliente";
  const lk = { instagram: (v) => `https://instagram.com/${v.replace(/^@/, "")}`, whatsapp: (v) => `https://wa.me/${v.replace(/\D/g, "").replace(/^(?!55)/, "55")}`, email: (v) => `mailto:${v}` };
  const rot = { instagram: "Instagram", whatsapp: "WhatsApp", email: "E-mail" };
  $("[data-p-cli]").replaceChildren(...[
    c.ct ? h("span", {}, `${rot[c.t] || "Contato"}: `, h("a", { href: (lk[c.t] || ((v) => v))(c.ct), target: "_blank", rel: "noopener" }, h("b", { text: c.ct }))) : null,
    c.ci ? h("span", {}, "Cidade: ", h("b", { text: c.ci })) : null,
  ].filter(Boolean));
  const obs = $("[data-p-obs]");
  obs.hidden = !c.o;
  obs.textContent = c.o ? `Obs.: ${c.o}` : "";
  const val = itens.filter((i) => i.n >= 0);
  const tot = val.reduce((s, i) => s + i.q, 0), fo = val.reduce((s, i) => s + (i.foil ? i.q : 0), 0);
  const est = estimar(tot, fo);
  $("[data-p-total]").textContent = tot;
  $("[data-p-unicas]").textContent = new Set(val.map((i) => i.n)).size;
  $("[data-p-foil]").textContent = fo;
  $("[data-p-preco]").textContent = est.txt;
  $("[data-p-preco-lbl]").textContent = est.lbl;
  const falt = [...(dados.x || []), ...itens.filter((i) => i.n < 0).map((i) => ({ q: i.q, nome: i.nome }))];
  $("[data-p-faltando]").hidden = !falt.length;
  $("[data-p-faltando-lista]").replaceChildren(...falt.map((f) => h("li", { text: `${f.q}× ${f.nome}` })));
}

/* ---------- Grade ---------- */
const nomeDe = (i) => (i.n >= 0 ? cat.nomes[i.n] : i.nome);
const srcDe = (i, tam = "normal", verso = false) => (!verso && proprias.get(`${i.set}|${i.cn}`)) || imagem(i.id, tam, verso);

function render() {
  let l = itens.filter((i) => i.n >= 0);
  if (filtro === "foil") l = l.filter((i) => i.foil);
  if (filtro === "falta") l = l.filter((i) => !feitos.has(i.x));
  $("[data-p-grade]").replaceChildren(...l.map(cartaLi));
  const tot = itens.filter((i) => i.n >= 0);
  $("[data-p-feito]").textContent = `${tot.filter((i) => feitos.has(i.x)).length} de ${tot.length} impressas`;
}

function cartaLi(i) {
  const nome = nomeDe(i);
  const prop = proprias.has(`${i.set}|${i.cn}`);
  const img = h("img", { src: srcDe(i), alt: nome, loading: "lazy", decoding: "async", width: 488, height: 680 });
  img.addEventListener("load", () => img.classList.add("is-ok"), { once: true });
  const tags = [];
  if (i.foil) tags.push(["", "Foil"]);
  if (i.sec === "cmd") tags.push(["cmd", "Comandante"]);
  if (prop) tags.push(["casa", "Arte própria"]);
  else if (i.set === "casa") tags.push(["casa", "Arte da casa"]);
  for (const f of i.f || "") if (ROTULOS[f] && f !== "d" && tags.length < 3) tags.push(["", ROTULOS[f]]);
  const temVerso = (i.f || "").includes("d");
  return h("li", { class: `carta${i.foil ? " is-foil" : ""}${feitos.has(i.x) ? " is-feito" : ""}` },
    h("div", { class: "carta__img", style: "cursor:default" },
      img,
      i.q > 1 ? h("span", { class: "carta__q", text: `${i.q}×` }) : null,
      h("ul", { class: "carta__tags" }, tags.map(([c, t]) => h("li", { class: c, text: t }))),
      temVerso ? h("button", { class: "carta__virar", type: "button", "aria-label": "Ver o verso", onclick: () => { const v = img.dataset.v === "1"; img.dataset.v = v ? "0" : "1"; img.src = srcDe(i, "normal", !v); } }, icon("i-flip")) : null,
      h("button", { class: "troca-arte", type: "button", onclick: () => (prop ? tirarPropria(i) : pedirPropria(i)) }, prop ? "Tirar arte própria" : "Arte própria")),
    h("div", { class: "carta__info" }, h("b", { text: nome, title: nome }), h("small", { text: i.set === "casa" ? "Arte da casa" : `${i.set.toUpperCase()} · ${i.cn} · ${cat.nomeSet(i.set)}` })),
    h("div", { class: "carta__acoes" },
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: feitos.has(i.x), onchange: (e) => {
        if (e.target.checked) feitos.add(i.x); else feitos.delete(i.x);
        store.set(chaveFeitos(), JSON.stringify([...feitos]));
        render();
      } }), h("span", { text: "Impressa" }))),
  );
}

$$("[data-p-filtros] .chip").forEach((b) => b.addEventListener("click", () => {
  filtro = b.dataset.f;
  $$("[data-p-filtros] .chip").forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
  render();
}));

/* ---------- Arte própria (fica só neste computador) ---------- */
const up = $("[data-upload]");
let alvo = null;
function pedirPropria(i) { alvo = i; up.value = ""; up.click(); }
up.addEventListener("change", async () => {
  const f = up.files[0];
  if (!f || !alvo) return;
  if (!f.type.startsWith("image/")) { toast("Escolha um arquivo de imagem"); return; }
  await idbSet(`arte:${alvo.set}|${alvo.cn}`, f);
  proprias.set(`${alvo.set}|${alvo.cn}`, URL.createObjectURL(f));
  toast("Arte própria aplicada nesta carta");
  render();
});
async function tirarPropria(i) {
  await idbDel(`arte:${i.set}|${i.cn}`);
  proprias.delete(`${i.set}|${i.cn}`);
  toast("Voltou pra arte original");
  render();
}

/* ---------- Exportar lista ---------- */
const textoLista = () => [...itens.map((i) => linhaTexto(cat, i)), ...(dados.x || []).map((x) => `${x.q} ${x.nome}  // não encontrada`)].join("\n");
$("[data-x-copiar]").addEventListener("click", async () => toast((await copiar(textoLista())) ? "Lista copiada" : "Não deu pra copiar"));
$("[data-x-txt]").addEventListener("click", () => baixar(`pedido-${dados.id}.txt`, `Pedido ${dados.id} · ${dados.c?.n || ""}\n\n${textoLista()}\n`));
$("[data-x-csv]").addEventListener("click", () => {
  const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const linhas = [["quantidade", "carta", "set", "numero", "colecao", "foil", "secao", "impressa"].join(";")];
  itens.forEach((i) => linhas.push([i.q, q(nomeDe(i)), i.set.toUpperCase(), q(i.cn), q(i.set === "casa" ? "Arte da casa" : cat.nomeSet(i.set)), i.foil ? "sim" : "não", i.sec, feitos.has(i.x) ? "sim" : "não"].join(";")));
  baixar(`pedido-${dados.id}.csv`, "﻿" + linhas.join("\n"), "text/csv;charset=utf-8");
});

/* ---------- PDF ---------- */
const fPdf = $("[data-pdf]");
fPdf.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("[data-pdf-btn]");
  const op = {
    papel: fPdf.papel.value, gap: fPdf.gap.value, bleed: fPdf.bleed.value, cantos: fPdf.cantos.value,
    marcas: fPdf.marcas.checked, basicos: fPdf.basicos.checked, foilSep: fPdf.foilSep.checked, versos: fPdf.versos.checked,
    titulo: `Pedido ${dados.id}`,
  };
  let base = itens.filter((i) => i.n >= 0);
  if (fPdf.soFalta.checked) base = base.filter((i) => !feitos.has(i.x));
  const cartas = [];
  base.forEach((i) => {
    const frente = proprias.get(`${i.set}|${i.cn}`) || (i.set === "casa" ? new URL(imagem(i.id), location.href).href : imagem(i.id, "png"));
    const verso = (i.f || "").includes("d") ? imagem(i.id, "png", true) : null;
    for (let k = 0; k < i.q; k++) cartas.push({ frente, verso, foil: i.foil, basico: (i.f || "").includes("L") });
  });
  if (!cartas.length) { toast("Nada pra imprimir com esses filtros"); return; }
  if (op.versos) op.versoCasa = C.versoCarta ? new URL(C.versoCarta, location.href).href : await versoDaCasa("assets/img/logo-512.webp", C.marca?.nome || "");

  btn.disabled = true;
  const prog = $("[data-pdf-prog]");
  prog.hidden = false;
  const bar = $("[data-pdf-bar]"), txt = $("[data-pdf-txt]");
  try {
    const r = await gerarPdf(cartas, op, (p, t) => { bar.style.width = `${Math.round(p * 100)}%`; txt.textContent = t; });
    baixar(`folhas-${dados.id}.pdf`, new Blob([r.bytes], { type: "application/pdf" }));
    txt.textContent = `${r.paginas} ${r.paginas === 1 ? "página" : "páginas"} · ${r.cols}×${r.rows} por folha${r.erros.length ? ` · ${r.erros.length} imagem(ns) falharam (contorno vermelho)` : ""}`;
    toast("PDF pronto");
  } catch (err) {
    console.error(err);
    txt.textContent = "Erro ao gerar o PDF. Tente de novo.";
  } finally {
    btn.disabled = false;
  }
});
