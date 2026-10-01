/* Montador de deck: lista → mesa com as artes → seletor de arte → encomenda. */
import { C, $, $$, h, icon, toast, estimar, copiar, contato, store, reduced } from "./util.js?v=5";
import { Catalogo, imagem, ROTULOS } from "./catalogo.js?v=5";
import { lerLista } from "./parser.js?v=5";
import { Pedido, artesDaCasa, codigoPedido, gerarLink, linhaTexto } from "./pedido-dados.js?v=5";

const T0 = Date.now();
const pedido = Pedido.carregar();
let cat = null;
let filtro = "todas", ordem = "lista";

$$("[data-bind]").forEach((el) => {
  const v = el.dataset.bind.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  el.textContent = v || "";
});

/* =====================================================================
   CATÁLOGO
   ===================================================================== */
const loader = $("[data-loader]");
async function iniciar() {
  $("[data-loader-erro]").hidden = true;
  $("[data-loader-bar]").style.width = "0%";
  try {
    cat = await Catalogo.carregar((rec, tot) => {
      const pct = tot ? Math.min(100, (rec / tot) * 100) : 50;
      $("[data-loader-bar]").style.width = `${pct}%`;
      $("[data-loader-sub]").textContent = tot > 1 ? `${(rec / 1048576).toFixed(1)} de ${(tot / 1048576).toFixed(1)} MB · só na primeira visita` : "Abrindo…";
    });
  } catch (e) {
    console.error(e);
    $("[data-loader-tit]").textContent = "Catálogo indisponível";
    $("[data-loader-erro]").hidden = false;
    return;
  }
  loader.classList.add("is-out");
  setTimeout(() => (loader.hidden = true), reduced ? 0 : 450);
  // descarta itens salvos que não existem mais no catálogo
  pedido.itens = pedido.itens.filter((i) => i.n < 0 || i.n < cat.total);
  const pendente = store.get("goblins-lista-importar");
  if (pendente) {
    store.del("goblins-lista-importar");
    const r = pedido.adicionar(cat, lerLista(pendente));
    if (r.novos) toast(`${r.novos} ${r.novos === 1 ? "carta adicionada" : "cartas adicionadas"} da sua lista`);
  }
  renderTudo();
}
$("[data-loader-retry]").addEventListener("click", iniciar);
iniciar();

/* =====================================================================
   MESA
   ===================================================================== */
const grade = $("[data-grade]");
const vazio = $("[data-vazio]");
const lis = new Map();

function visiveis() {
  let l = pedido.itens.slice();
  if (filtro === "foil") l = l.filter((i) => i.foil);
  if (filtro === "faltando") l = l.filter((i) => i.n < 0);
  if (ordem === "nome") l.sort((a, b) => nomeDe(a).localeCompare(nomeDe(b)));
  return l;
}
const nomeDe = (i) => (i.n >= 0 ? cat.nomes[i.n] : i.nome);

function renderTudo() {
  if (!cat) return;
  lis.clear();
  const l = visiveis();
  grade.replaceChildren(...l.map((i, x) => { const li = cartaLi(i); li.style.setProperty("--i", Math.min(x, 12)); lis.set(i.k, li); return li; }));
  vazio.hidden = pedido.itens.length > 0;
  if (pedido.itens.length && !l.length) grade.append(h("li", { class: "grade__nada", text: filtro === "foil" ? "Nenhuma carta marcada como foil." : "Todas as cartas foram encontradas." }));
  resumo();
}

function renderItem(k) {
  const i = pedido.item(k), velho = lis.get(k);
  if (!i || !velho) return renderTudo();
  const novo = cartaLi(i);
  novo.classList.add("is-pronto");
  velho.replaceWith(novo);
  lis.set(k, novo);
  resumo();
}

pedido.ouvir((info) => (info.tipo === "item" ? renderItem(info.k) : renderTudo()));

function rotulos(i) {
  const out = [];
  if (i.sec === "cmd") out.push(["cmd", "Comandante"]);
  if (i.sec === "side") out.push(["", "Sideboard"]);
  if (i.set === "casa" || (i.n >= 0 && artesDaCasa(cat, i.n).some((a) => a.set === i.set && a.cn === i.cn))) out.push(["casa", "Arte da casa"]);
  for (const f of i.f || "") if (ROTULOS[f] && f !== "d") out.push(["", ROTULOS[f]]);
  return out;
}

function cartaLi(i) {
  if (i.n < 0) return faltandoLi(i);
  const nome = cat.nomes[i.n];
  const img = h("img", {
    src: imagem(i.id, "normal"),
    srcset: i.set === "casa" ? null : `${imagem(i.id, "small")} 146w, ${imagem(i.id, "normal")} 488w`,
    sizes: "(max-width: 560px) 46vw, 220px",
    alt: nome, loading: "lazy", decoding: "async", width: 488, height: 680,
  });
  img.addEventListener("load", () => img.classList.add("is-ok"), { once: true });
  const temVerso = (i.f || "").includes("d");
  const caixa = h("div", { class: "carta__img" },
    img,
    i.q > 1 ? h("span", { class: "carta__q", text: `${i.q}×` }) : null,
    h("ul", { class: "carta__tags" }, rotulos(i).slice(0, 2).map(([c, t]) => h("li", { class: c, text: t }))),
    temVerso ? h("button", { class: "carta__virar", type: "button", "aria-label": "Ver o verso", onclick: (e) => {
      e.stopPropagation();
      const v = img.dataset.verso === "1";
      img.dataset.verso = v ? "0" : "1";
      img.removeAttribute("srcset");
      img.src = imagem(i.id, "normal", !v);
    } }, icon("i-flip")) : null,
  );
  caixa.addEventListener("click", () => abrirArte(i.k));
  const ed = i.set === "casa" ? "Arte da casa" : `${i.set.toUpperCase()} · ${i.cn}`;
  return h("li", { class: `carta${i.foil ? " is-foil" : ""}`, "data-k": i.k },
    caixa,
    h("div", { class: "carta__info" }, h("b", { text: nome, title: nome }), h("small", { text: ed })),
    h("div", { class: "carta__acoes" },
      h("div", { class: "passo", role: "group", "aria-label": `Quantidade de ${nome}` },
        h("button", { type: "button", "aria-label": "Menos uma", onclick: () => pedido.qtd(i.k, -1) }, icon("i-minus")),
        h("output", { text: i.q }),
        h("button", { type: "button", "aria-label": "Mais uma", onclick: () => pedido.qtd(i.k, 1) }, icon("i-plus"))),
      h("button", { class: "tog", type: "button", "aria-pressed": i.foil ? "true" : "false", onclick: () => pedido.alternarFoil(i.k) }, "Foil"),
      h("button", { class: "tog tog--arte", type: "button", onclick: () => abrirArte(i.k) }, "Arte")),
  );
}

function faltandoLi(i) {
  const sug = cat.parecidos(i.nome, 3);
  return h("li", { class: "carta is-faltando", "data-k": i.k },
    h("div", { class: "carta__img carta__img--falta" }, h("span", { text: "?" })),
    h("div", { class: "carta__info" }, h("b", { text: i.nome, title: i.nome }), h("small", { text: "Não encontrada" })),
    h("div", { class: "carta__sug" },
      sug.length ? h("span", { text: "Você quis dizer:" }) : h("span", { text: "Confira o nome (em inglês)." }),
      sug.map((n) => h("button", { type: "button", class: "sug", onclick: () => { pedido.corrigir(cat, i.k, n); toast(`Trocado por ${cat.nomes[n]}`); } }, cat.nomes[n])),
      h("button", { type: "button", class: "linkbtn", onclick: () => pedido.remover(i.k) }, "Remover")),
  );
}

/* ---------- Resumo ---------- */
function resumo() {
  const tot = pedido.total, foils = pedido.foils, est = estimar(pedido.infoPreco), falt = pedido.faltando.length;
  $("[data-r-total]").textContent = tot;
  $("[data-r-unicas]").textContent = new Set(pedido.validos.map((i) => i.n)).size;
  $("[data-r-foil]").textContent = foils;
  $("[data-r-preco]").textContent = est.txt;
  $("[data-r-preco-lbl]").textContent = est.lbl;
  $("[data-d-total]").textContent = `${tot} ${tot === 1 ? "carta" : "cartas"}${foils ? ` · ${foils} foil` : ""}`;
  $("[data-d-preco]").textContent = est.txt;
  const fa = $("[data-r-faltando]");
  fa.hidden = !falt;
  fa.textContent = falt ? `${falt} ${falt === 1 ? "nome não foi encontrado" : "nomes não foram encontrados"}. Corrija na mesa ou eles vão como texto.` : "";
  $$("[data-finalizar]").forEach((b) => (b.disabled = !tot));
  const tem = pedido.itens.length > 0;
  $("[data-limpar]").hidden = !tem;
  $("[data-m-barra]").hidden = !tem;
  $("[data-m-conta]").textContent = tem ? `· ${tot} ${tot === 1 ? "carta" : "cartas"}` : "";
  $("[data-app-dock]").classList.toggle("is-on", tot > 0);
}

/* ---------- Lista colada ---------- */
const ta = $("[data-lista]");
ta.value = store.get("goblins-montador-texto") || "";
ta.addEventListener("input", () => store.set("goblins-montador-texto", ta.value));
$("[data-importar]").addEventListener("click", () => {
  if (!cat) return;
  const linhas = lerLista(ta.value);
  if (!linhas.length) { toast("Cole a lista primeiro"); ta.focus(); return; }
  const r = pedido.adicionar(cat, linhas);
  ta.value = ""; store.del("goblins-montador-texto");
  toast(r.erros ? `${r.novos} adicionadas · ${r.erros} ${r.erros === 1 ? "nome não encontrado" : "nomes não encontrados"}` : `${r.novos} ${r.novos === 1 ? "carta adicionada" : "cartas adicionadas"}`);
  if (matchMedia("(max-width: 900px)").matches) $(".mesa").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
});

/* Limpar mesa: confirma no próprio botão (2 toques) e permite desfazer */
const btnLimpar = $("[data-limpar]");
let limparT, backup = null;
const txtLimpar = () => btnLimpar.lastChild;
btnLimpar.addEventListener("click", () => {
  if (!pedido.itens.length) return;
  if (!btnLimpar.classList.contains("is-armado")) {
    btnLimpar.classList.add("is-armado");
    txtLimpar().textContent = "Toque de novo pra limpar";
    clearTimeout(limparT);
    limparT = setTimeout(desarmar, 3000);
    return;
  }
  desarmar();
  backup = JSON.parse(JSON.stringify(pedido.itens));
  pedido.limpar();
  toastDesfazer();
});
function desarmar() { btnLimpar.classList.remove("is-armado"); txtLimpar().textContent = "Limpar mesa"; }
function toastDesfazer() {
  toast("Mesa limpa");
  const el = $("[data-toast]");
  const b = h("button", { class: "toast__acao", type: "button", onclick: () => {
    if (!backup) return;
    pedido.itens = backup; backup = null;
    pedido.mudou({ tipo: "lista" });
    toast("Cartas de volta na mesa");
  } }, "Desfazer");
  el.append(" ", b);
}

$$("[data-filtros] .chip").forEach((b) => b.addEventListener("click", () => {
  filtro = b.dataset.f;
  $$("[data-filtros] .chip").forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
  renderTudo();
}));
$("[data-ordem]").addEventListener("change", (e) => { ordem = e.target.value; renderTudo(); });

/* ---------- Busca com autocomplete ---------- */
const bIn = $("[data-busca-input]"), bLista = $("[data-busca-lista]");
let bSel = -1, bOps = [];
function fecharBusca() { bLista.hidden = true; bIn.setAttribute("aria-expanded", "false"); bSel = -1; }
function marcarBusca() {
  $$("li", bLista).forEach((li, x) => li.setAttribute("aria-selected", x === bSel ? "true" : "false"));
  if (bSel >= 0) bIn.setAttribute("aria-activedescendant", `bop-${bSel}`); else bIn.removeAttribute("aria-activedescendant");
}
function addPorBusca(n) {
  pedido.adicionar(cat, [{ q: 1, nome: cat.nomes[n], set: "", cn: "", foil: false, sec: "main" }]);
  toast(`${cat.nomes[n]} na mesa`);
  bIn.value = ""; fecharBusca();
  const it = pedido.itens.find((i) => i.n === n);
  const li = it && lis.get(it.k);
  if (li) { li.classList.add("is-novo"); li.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }
}
bIn.addEventListener("input", () => {
  if (!cat) return;
  bOps = cat.sugerir(bIn.value, 8);
  bSel = bOps.length ? 0 : -1;
  bLista.replaceChildren(...bOps.map((n, x) => h("li", { id: `bop-${x}`, role: "option", onmousedown: (e) => { e.preventDefault(); addPorBusca(n); } }, cat.nomes[n])));
  bLista.hidden = !bOps.length;
  bIn.setAttribute("aria-expanded", bOps.length ? "true" : "false");
  marcarBusca();
});
bIn.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" && bOps.length) { e.preventDefault(); bSel = (bSel + 1) % bOps.length; marcarBusca(); }
  else if (e.key === "ArrowUp" && bOps.length) { e.preventDefault(); bSel = (bSel - 1 + bOps.length) % bOps.length; marcarBusca(); }
  else if (e.key === "Enter") {
    e.preventDefault();
    if (bSel >= 0) addPorBusca(bOps[bSel]);
    else if (cat && bIn.value.trim()) { const n = cat.acharNome(bIn.value); if (n >= 0) addPorBusca(n); else toast("Carta não encontrada. Use o nome em inglês."); }
  } else if (e.key === "Escape") fecharBusca();
});
bIn.addEventListener("blur", () => setTimeout(fecharBusca, 120));

/* =====================================================================
   SELETOR DE ARTE
   ===================================================================== */
const dlg = $("[data-arte]");
const A = { k: null, ordemK: [], filtro: "todas", ordem: "novo", verso: false };
const FILTROS = [
  ["todas", "Todas", () => true],
  ["casa", "Arte da casa", (e) => e.casa],
  ["b", "Borderless", (e) => e.f.includes("b")],
  ["f", "Full art", (e) => e.f.includes("f")],
  ["s", "Showcase", (e) => e.f.includes("s")],
  ["e", "Extended", (e) => e.f.includes("e")],
  ["c", "Clássica", (e) => !/[bfseP]/.test(e.f) && !e.casa],
  ["r", "Moldura antiga", (e) => e.f.includes("r")],
];

function edicoesDe(n) {
  const casa = artesDaCasa(cat, n);
  const marca = new Set(casa.map((c) => `${c.set}|${c.cn}`));
  return [...casa, ...cat.edicoes(n).filter((e) => !marca.has(`${e.set}|${e.cn}`))];
}

function abrirArte(k) {
  A.ordemK = visiveis().filter((i) => i.n >= 0).map((i) => i.k);
  A.k = k; A.filtro = "todas"; A.verso = false;
  renderArte(true);
  if (!dlg.open) { dlg.showModal(); document.body.classList.add("trava"); }
}
function fecharArte() { dlg.close(); }
dlg.addEventListener("close", () => document.body.classList.remove("trava"));
dlg.addEventListener("click", (e) => { if (e.target === dlg) fecharArte(); });
$("[data-a-fechar]").addEventListener("click", fecharArte);
$("[data-a-ok]").addEventListener("click", fecharArte);

function moverArte(d) {
  const pos = A.ordemK.indexOf(A.k);
  if (pos < 0 || !A.ordemK.length) return;
  A.k = A.ordemK[(pos + d + A.ordemK.length) % A.ordemK.length];
  A.verso = false;
  renderArte(true);
}
$("[data-a-ant]").addEventListener("click", () => moverArte(-1));
$("[data-a-prox]").addEventListener("click", () => moverArte(1));
dlg.addEventListener("keydown", (e) => {
  if (e.target.matches("select, input")) return;
  if (e.key === "ArrowLeft") moverArte(-1);
  if (e.key === "ArrowRight") moverArte(1);
});
let sx = null, sy = null;
$(".arte__preview").addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
$(".arte__preview").addEventListener("touchend", (e) => {
  if (sx == null) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) moverArte(dx < 0 ? 1 : -1);
  sx = null;
});
$("[data-a-ordem]").addEventListener("change", (e) => { A.ordem = e.target.value; renderArte(false); });
$("[data-a-virar]").addEventListener("click", () => { A.verso = !A.verso; renderPreview(); });

function renderPreview() {
  const i = pedido.item(A.k);
  if (!i) return;
  const nome = cat.nomes[i.n];
  const grande = matchMedia("(min-width: 901px)").matches ? "large" : "normal";
  const img = h("img", { src: imagem(i.id, i.set === "casa" ? "normal" : grande, A.verso), alt: nome, width: 672, height: 936 });
  img.addEventListener("load", () => img.classList.add("is-ok"), { once: true });
  $("[data-a-img]").replaceChildren(img, i.foil ? h("span", { class: "foilfx", "aria-hidden": "true" }) : null);
  $("[data-a-set]").textContent = i.set === "casa" ? "Arte da casa" : `${cat.nomeSet(i.set)} · ${cat.anoSet(i.set)} · nº ${i.cn}`;
  $("[data-a-tags]").textContent = rotulos(i).map((r) => r[1]).join(" · ");
  const v = $("[data-a-virar]");
  v.hidden = !(i.f || "").includes("d");
  v.textContent = A.verso ? "Ver a frente" : "Ver o verso";
}

function renderArte(rolarTopo) {
  const i = pedido.item(A.k);
  if (!i) { fecharArte(); return; }
  const nome = cat.nomes[i.n];
  $("[data-a-nome]").textContent = nome;
  const pos = A.ordemK.indexOf(A.k);
  $("[data-a-pos]").textContent = A.ordemK.length > 1 ? `Carta ${pos + 1} de ${A.ordemK.length} · ← → pra navegar` : "";
  $("[data-a-ant]").disabled = $("[data-a-prox]").disabled = A.ordemK.length < 2;
  const tw = $("[data-a-todas-wrap]");
  tw.hidden = i.q < 2;
  $("[data-a-todas-txt]").textContent = `Aplicar nas ${i.q} cópias`;
  renderPreview();

  const todas = edicoesDe(i.n);
  const fil = FILTROS.filter(([id, , f]) => id === "todas" || todas.some(f));
  if (!fil.some(([id]) => id === A.filtro)) A.filtro = "todas";
  $("[data-a-filtros]").replaceChildren(...fil.map(([id, txt, f]) =>
    h("button", { class: "chip", type: "button", "aria-pressed": A.filtro === id ? "true" : "false", onclick: () => { A.filtro = id; renderArte(true); } },
      txt, h("small", { text: todas.filter(f).length }))));

  const f = (FILTROS.find(([id]) => id === A.filtro) || FILTROS[0])[2];
  let lista = todas.filter(f);
  if (A.ordem === "velho") lista = [...lista.filter((e) => e.casa), ...lista.filter((e) => !e.casa).reverse()];
  const gr = $("[data-a-grade]");
  gr.replaceChildren(...lista.map((e) => {
    const sel = e.set === i.set && e.cn === i.cn;
    const im = h("img", { src: imagem(e.id, e.casa && e.set === "casa" ? "normal" : "small"), alt: "", loading: "lazy", decoding: "async", width: 146, height: 204 });
    im.addEventListener("load", () => im.classList.add("is-ok"), { once: true });
    return h("li", {},
      h("button", { type: "button", class: "op", "aria-pressed": sel ? "true" : "false", "aria-label": `${e.casa ? "Arte da casa" : cat.nomeSet(e.set)} ${e.cn}`, onclick: () => escolher(e) },
        im,
        h("span", { class: "op__lbl" }, e.casa ? (e.nota || "Arte da casa") : `${e.set.toUpperCase()} · ${e.cn}`),
        e.casa ? h("span", { class: "op__casa", text: "Casa" }) : null));
  }));
  if (rolarTopo) gr.scrollTop = 0;
  const atual = $('.op[aria-pressed="true"]', gr);
  if (atual && rolarTopo) atual.scrollIntoView({ block: "nearest" });
}

function escolher(ed) {
  const todas = $("[data-a-todas]").checked;
  const k = pedido.trocarArte(A.k, ed, todas);
  if (k !== A.k) { A.ordemK = visiveis().filter((i) => i.n >= 0).map((i) => i.k); A.k = k; toast("1 cópia separada com a arte nova"); }
  A.verso = false;
  renderArte(false);
}

/* =====================================================================
   FINALIZAR ENCOMENDA
   ===================================================================== */
const fim = $("[data-fim]"), form = $("[data-fim-form]"), ok = $("[data-fim-ok]");
const cfgPedidos = C.pedidos || {};
const ctt = contato();
let ultimo = null;

$$("[data-finalizar]").forEach((b) => b.addEventListener("click", () => {
  if (!pedido.total) return;
  const est = estimar(pedido.infoPreco);
  const falt = pedido.faltando.length;
  $("[data-fim-resumo]").textContent = `${pedido.total} cartas · ${pedido.foils} foil · ${est.txt}${falt ? ` · ${falt} sem identificar` : ""}`;
  form.hidden = false; ok.hidden = true;
  $("[data-fim-erro]").hidden = true;
  fim.showModal();
  document.body.classList.add("trava");
}));
fim.addEventListener("close", () => document.body.classList.remove("trava"));
$("[data-fim-fechar]").addEventListener("click", () => fim.close());
fim.addEventListener("click", (e) => { if (e.target === fim) fim.close(); });

const PH = { instagram: "@seu_usuario", whatsapp: "(11) 90000-0000", email: "voce@email.com" };
form.tipo.addEventListener("change", () => { form.contato.placeholder = PH[form.tipo.value]; });
const salvo = JSON.parse(store.get("goblins-cliente") || "null");
if (salvo) { form.nome.value = salvo.n || ""; form.tipo.value = salvo.t || "instagram"; form.contato.value = salvo.ct || ""; form.cidade.value = salvo.ci || ""; form.contato.placeholder = PH[form.tipo.value]; }

function erroFim(msg, campo) {
  const e = $("[data-fim-erro]");
  e.textContent = msg; e.hidden = false;
  if (campo) campo.focus();
}

function mensagemDM(link, cli, est) {
  return [
    `Olá! Encomenda ${ultimo.codigo} · ${C.marca?.nome || "Goblins Mágicos Proxys"}`,
    `${cli.n} · ${pedido.total} cartas (${pedido.foils} foil) · ${est.txt}`,
    `Pedido completo: ${link}`,
  ].join("\n");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (form.site.value) return; // robô
  const cli = { n: form.nome.value.trim(), t: form.tipo.value, ct: form.contato.value.trim(), ci: form.cidade.value.trim(), o: form.obs.value.trim() };
  if (!cli.n) return erroFim("Coloque seu nome.", form.nome);
  if (!cli.ct) return erroFim("Coloque um contato pra combinarmos o pedido.", form.contato);
  if (cli.t === "email" && !/^\S+@\S+\.\S+$/.test(cli.ct)) return erroFim("Esse e-mail parece incompleto.", form.contato);
  if (!form.lgpd.checked) return erroFim("Marque a autorização pra gente poder te responder.", form.lgpd);
  store.set("goblins-cliente", JSON.stringify({ n: cli.n, t: cli.t, ct: cli.ct, ci: cli.ci }));

  const btn = $("[data-fim-enviar]");
  btn.disabled = true; btn.textContent = "Enviando…";
  const codigo = codigoPedido();
  const link = await gerarLink(pedido, cli, codigo);
  const est = estimar(pedido.infoPreco);
  ultimo = { codigo, link };
  let enviado = false;
  if (cfgPedidos.emailEndpoint) {
    try {
      const corpo = {
        codigo, link, cliente: cli, t: Date.now() - T0, site: form.site.value,
        resumo: { total: pedido.total, foils: pedido.foils, unicas: new Set(pedido.validos.map((i) => i.n)).size, estimativa: est.txt },
        itens: pedido.validos.map((i) => ({
          q: i.q, nome: cat.nomes[i.n], set: i.set, setNome: i.set === "casa" ? "Arte da casa" : cat.nomeSet(i.set), cn: i.cn,
          foil: i.foil, sec: i.sec, img: i.set === "casa" ? new URL(imagem(i.id), location.href).href : imagem(i.id, "small"),
        })),
        faltando: pedido.faltando.map((i) => ({ q: i.q, nome: i.nome })),
        texto: pedido.itens.map((i) => linhaTexto(cat, i)).join("\n"),
      };
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(cfgPedidos.emailEndpoint, { method: "POST", body: JSON.stringify(corpo), signal: ctrl.signal });
      clearTimeout(tm);
      const j = await r.json().catch(() => ({}));
      enviado = r.ok && j.ok === true;
    } catch (err) { console.warn("e-mail não enviado", err); }
  }
  btn.disabled = false; btn.textContent = "Enviar encomenda";

  $("[data-ok-selo]").textContent = `Pedido ${codigo}`;
  $("[data-ok-tit]").textContent = enviado ? "Encomenda enviada" : "Falta um passo: mande o link";
  $("[data-ok-txt]").textContent = enviado
    ? `Recebemos seu pedido. ${cfgPedidos.respostaTexto || "A gente te chama pelo contato que você deixou com o orçamento."} Guarde o link abaixo.`
    : "Copie o link do pedido e mande pra gente pelo Instagram ou WhatsApp. Ele tem a lista completa, com as artes que você escolheu.";
  $("[data-ok-link]").value = link;
  const msg = mensagemDM(link, cli, est);
  const waBtn = $("[data-ok-wa]");
  waBtn.hidden = !ctt.wa;
  if (ctt.wa) waBtn.href = `https://wa.me/${ctt.wa}?text=${encodeURIComponent(msg)}`;
  $("[data-ok-ig]").hidden = !ctt.dm && enviado;
  $("[data-ok-ig]").onclick = async () => {
    const c = await copiar(msg);
    if (!ctt.dm) { toast(c ? "Mensagem copiada" : "Copie o link manualmente"); return; }
    toast(c ? "Mensagem copiada. Cole na DM" : "Copie o link e cole na DM");
    setTimeout(() => window.open(ctt.dm, "_blank", "noopener"), 400);
  };
  form.hidden = true; ok.hidden = false;
  form.obs.value = ""; form.lgpd.checked = false;
});

$("[data-ok-copiar]").addEventListener("click", async () => {
  const c = await copiar($("[data-ok-link]").value);
  toast(c ? "Link copiado" : "Selecione e copie o link");
});
$("[data-ok-novo]").addEventListener("click", () => {
  if (confirm("Começar um pedido novo? A mesa atual será limpa.")) { pedido.limpar(); fim.close(); }
});
