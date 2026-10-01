/* Goblins Mágicos Proxys — v1.0
   Monta a página a partir do config.js. Não precisa editar este arquivo. */
(() => {
  "use strict";
  const C = window.SITE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  const isTodo = (v) => typeof v === "string" && v.trim().startsWith("[");
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");
  document.addEventListener("touchstart", () => {}, { passive: true }); // ativa :active no iOS

  /* helper para criar elementos */
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") setText(el, v);
      else if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((k) => k != null && el.append(k));
    return el;
  }
  function setText(el, v) {
    el.textContent = v == null ? "" : String(v);
    el.classList.toggle("is-todo", isTodo(v));
  }

  /* ---------- storage seguro ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem storage */ } },
  };

  /* ---------- toast ---------- */
  const toastEl = $("[data-toast]");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-on"), 2800);
  }

  /* ---------- textos simples ---------- */
  $$("[data-bind]").forEach((el) => setText(el, get(el.dataset.bind)));
  $$("[data-list]").forEach((ul) => (get(ul.dataset.list) || []).forEach((t) => ul.append(h("li", { text: t }))));
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  document.title = `${get("marca.nome") || "Goblins Mágicos Proxys"} · Proxies de TCG`;

  /* ---------- Instagram / WhatsApp ---------- */
  const igUser = String(get("marca.instagram") || "").replace(/^@/, "").trim();
  const igOk = igUser && !isTodo(igUser);
  const dmUrl = igOk ? `https://ig.me/m/${encodeURIComponent(igUser)}` : "#";
  $$("[data-ig-dm]").forEach((a) => {
    a.href = dmUrl;
    if (!igOk) {
      a.removeAttribute("target");
      a.addEventListener("click", (e) => { e.preventDefault(); toast("Configure o @ do Instagram no config.js"); });
    }
  });
  $$("[data-ig-handle]").forEach((el) => setText(el, igOk ? `@${igUser}` : "[@seu_usuario]"));
  const wa = String(get("marca.whatsapp") || "").replace(/\D/g, "");

  /* ---------- título do hero ---------- */
  const titleEl = $("[data-hero-title]");
  const lines = get("hero.titulo") || [];
  lines.forEach((t, i) => {
    const cls = "ln" + (i === 1 ? " ln--hl" : "") + (i === 2 ? " ln--sm" : "");
    titleEl.append(h("span", { class: cls }, h("span", { style: `--i:${i}`, text: t })));
  });

  /* ---------- anel do selo ---------- */
  const ring = $("[data-ring]");
  if (ring) {
    ring.textContent = `${get("marca.nome") || ""} ✦ Proxies de TCG ✦ `.toUpperCase();
    ring.setAttribute("textLength", "508");
    ring.setAttribute("lengthAdjust", "spacing");
  }

  /* ---------- faixa de selos ---------- */
  const ticker = $("[data-ticker]");
  const selos = get("selos") || [];
  if (ticker && selos.length) {
    let base = [];
    while (base.length < 10) base = base.concat(selos);
    [...base, ...base].forEach((t) => ticker.append(h("span", { text: t })));
  }

  /* =====================================================================
     CARTA
     ===================================================================== */
  const PALETTES = [
    { f: "#c9382a", f2: "#6f170c", sky: "#4a1a10", sun: "#f47b2a", sx: "72%" },  // vermelho
    { f: "#2f6fb0", f2: "#123a66", sky: "#12304f", sun: "#8fd8ff", sx: "30%" },  // azul
    { f: "#5f8a2a", f2: "#2a4410", sky: "#1f3312", sun: "#d5ef7a", sx: "65%" },  // verde
    { f: "#3a3230", f2: "#141010", sky: "#231b22", sun: "#b36bff", sx: "40%" },  // preto
    { f: "#cdb88a", f2: "#8a7247", sky: "#6b5838", sun: "#fff3c4", sx: "70%" },  // branco
    { f: "#c49a3c", f2: "#6d4d12", sky: "#4a3212", sun: "#ffd66b", sx: "35%" },  // dourado
  ];

  function placeholder(item, i) {
    const p = PALETTES[i % PALETTES.length];
    const ph = h("div", { class: "ph", style: `--f:${p.f};--f2:${p.f2};--sky:${p.sky};--sun:${p.sun};--sx:${p.sx};--artr:${(i * 37) % 30 - 15}deg` });
    ph.append(
      h("div", { class: "ph__bar" }, h("span", { text: String(item.nome || "").replace(/^\[|\]$/g, "") }), h("i")),
      h("div", { class: "ph__art" }, h("img", { src: "assets/img/logo-192.webp", alt: "", loading: "lazy", width: 192, height: 192 })),
      h("div", { class: "ph__type" }),
      h("div", { class: "ph__text" }, h("i"), h("i"), h("i"), h("i")),
      h("div", { class: "ph__foot" }, h("span", { text: "GOBLINS MÁGICOS" }), h("span", { text: String(i + 1).padStart(3, "0") })),
    );
    return ph;
  }

  function makeCard(item, i, { eager = false } = {}) {
    const face = h("div", { class: "tcg__face" });
    if (item.imagem) face.append(h("img", { src: item.imagem, alt: item.nome || "", loading: eager ? "eager" : "lazy", decoding: "async", width: 630, height: 880 }));
    else face.append(placeholder(item, i));
    const card = h("div", { class: "tcg is-idle" + (item.foil ? " is-foil" : "") },
      h("div", { class: "tilt" }, face, h("div", { class: "tcg__foil" }), h("div", { class: "tcg__glare" })));
    if (fine && !reduced) tilt(card);
    return card;
  }

  function tilt(card, strength = 14) {
    let raf = 0;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.classList.add("is-tracking");
        card.classList.remove("is-idle");
        card.style.setProperty("--ry", `${(x - .5) * strength}deg`);
        card.style.setProperty("--rx", `${(.5 - y) * strength}deg`);
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.setProperty("--o", "1");
      });
    });
    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      card.classList.remove("is-tracking");
      card.classList.add("is-idle");
      ["--rx", "--ry", "--mx", "--my", "--o"].forEach((p) => card.style.removeProperty(p));
    });
  }

  /* ---------- leque do hero ---------- */
  const vitrine = get("vitrine") || [];
  const fan = $("[data-fan]");
  const destaques = get("hero.cartas") || [];
  if (fan && (destaques.length || vitrine.length)) {
    const todas = vitrine.map((v, i) => ({ v, i }));
    const pick = destaques.length
      ? destaques.slice(0, 3).map((v, i) => ({ v, i }))
      : [...new Set([...todas.filter((o) => o.v.imagem), ...todas.filter((o) => o.v.foil), ...todas])].slice(0, 3);
    pick.forEach((o, k) => { const c = makeCard(o.v, o.i, { eager: true }); c.style.setProperty("--i", k); fan.append(c); });
  }


  /* =====================================================================
     VITRINE
     ===================================================================== */
  const grid = $("[data-grid]");
  const chipsEl = $("[data-chips]");
  vitrine.forEach((item, i) => {
    const btn = h("button", { class: "card-btn", type: "button", "aria-label": `Ver ${item.nome}` }, makeCard(item, i));
    btn.addEventListener("click", () => openViewer(i));
    const meta = h("div", { class: "card-meta" }, h("b", { text: item.nome }), h("span", { text: item.foil ? "Foil" : (item.tags || [])[0] || "" }));
    const li = h("li", { class: "rv", style: `--i:${i % 6}` }, btn, meta);
    li.dataset.tags = (item.tags || []).join("|");
    grid.append(li);
  });

  const tagCount = {};
  vitrine.forEach((v) => (v.tags || []).forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1)));
  const chipList = [["Todas", vitrine.length], ...Object.entries(tagCount).sort((a, b) => b[1] - a[1])];
  chipList.forEach(([t, n], k) => {
    const b = h("button", { class: "chip", type: "button", "aria-pressed": k === 0 ? "true" : "false" }, t, h("small", { text: n }));
    b.addEventListener("click", () => filterBy(k === 0 ? null : t, b));
    chipsEl.append(b);
  });

  function filterBy(tag, btn) {
    $$(".chip", chipsEl).forEach((c) => c.setAttribute("aria-pressed", c === btn ? "true" : "false"));
    const items = $$("li", grid);
    items.forEach((li) => {
      const show = !tag || li.dataset.tags.split("|").includes(tag);
      clearTimeout(li._t);
      if (show) {
        li.classList.remove("is-gone");
        requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove("is-out")));
      } else {
        li.classList.add("is-out");
        li._t = setTimeout(() => li.classList.add("is-gone"), reduced ? 0 : 320);
      }
    });
  }

  /* ---------- visualizador ---------- */
  const viewer = $("[data-viewer]");
  let vIdx = 0;
  function openViewer(i) {
    vIdx = (i + vitrine.length) % vitrine.length;
    const item = vitrine[vIdx];
    const holder = $("[data-viewer-card]", viewer);
    holder.replaceChildren(makeCard(item, vIdx, { eager: true }));
    setText($("[data-viewer-name]", viewer), item.nome);
    $("[data-viewer-tags]", viewer).replaceChildren(...(item.tags || []).map((t) => h("li", { text: t })));
    if (!viewer.open) {
      viewer.showModal();
      document.body.style.overflow = "hidden";
    }
  }
  function closeViewer() { viewer.close(); }
  viewer.addEventListener("close", () => (document.body.style.overflow = ""));
  viewer.addEventListener("click", (e) => { if (e.target === viewer) closeViewer(); });
  $("[data-viewer-close]").addEventListener("click", closeViewer);
  $("[data-viewer-prev]").addEventListener("click", () => openViewer(vIdx - 1));
  $("[data-viewer-next]").addEventListener("click", () => openViewer(vIdx + 1));
  viewer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") openViewer(vIdx - 1);
    if (e.key === "ArrowRight") openViewer(vIdx + 1);
  });
  // deslizar no celular
  let sx = null;
  viewer.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  viewer.addEventListener("touchend", (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 60) openViewer(vIdx + (dx < 0 ? 1 : -1));
    sx = null;
  });
  $("[data-viewer-add]").addEventListener("click", () => {
    addToList(String(vitrine[vIdx].nome || "").replace(/^\[|\]$/g, ""));
    closeViewer();
  });

  /* =====================================================================
     QUALIDADE
     ===================================================================== */
  const specs = $("[data-specs]");
  (get("qualidade.itens") || []).forEach((it, i) => {
    const img = h("div", { class: "spec__img" });
    if (it.foto) img.append(h("img", { src: it.foto, alt: it.titulo, loading: "lazy" }));
    else img.textContent = `Foto · ${it.titulo}`;
    specs.append(h("li", { class: "spec rv", style: `--i:${i}` }, img,
      h("div", { class: "spec__body" }, h("h3", { text: it.titulo }), h("p", { text: it.texto }))));
  });

  const cmp = get("qualidade.comparacao") || {};
  const cA = $("[data-compare-a]"), cB = $("[data-compare-b]");
  const sample = vitrine.find((v) => v.foil) || vitrine[0] || { nome: "Exemplo" };
  const sIdx = Math.max(0, vitrine.indexOf(sample));
  if (cmp.original) cA.append(makeCard({ nome: cmp.legendaOriginal || "Original", imagem: cmp.original }, sIdx));
  else cA.append(makeCard({ ...sample, foil: false }, sIdx));
  if (cmp.proxy) cB.append(makeCard({ nome: cmp.legendaProxy || "Proxy", imagem: cmp.proxy, foil: !!cmp.proxyFoil }, sIdx));
  else cB.append(makeCard({ ...sample, foil: true }, sIdx));
  const compare = $("[data-compare]");
  const range = $(".compare__range", compare);
  range.addEventListener("input", () => compare.style.setProperty("--p", range.value + "%"));

  /* =====================================================================
     PASSOS / PREÇOS / DEPOIMENTOS / FAQ
     ===================================================================== */
  const steps = $("[data-steps]");
  const miniCarta = (img, cls) => (img ? h("div", { class: cls, "aria-hidden": "true" }, makeCard({ nome: "", imagem: img }, 0, { eager: true })) : null);
  (get("passos") || []).forEach((s, i) => steps.append(h("li", { class: "step rv" + (s.imagem ? " step--carta" : ""), style: `--i:${i}` },
    miniCarta(s.imagem, "step__carta"), h("h3", { text: s.titulo }), h("p", { text: s.texto }))));

  const moeda = get("precos.moeda") || "R$";
  const brl = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plans = $("[data-plans]");
  (get("precos.planos") || []).forEach((p, i) => {
    const val = typeof p.valor === "number" ? brl(p.valor) : p.valor;
    const priceB = h("b", { text: val });
    const cta = p.id === "deck"
      ? h("a", { class: "btn btn--ig", href: "montar.html" }, "Montar meu deck")
      : h("a", { class: "btn btn--ghost", href: dmUrl, target: igOk ? "_blank" : null, rel: "noopener", "data-ig-dm": "" }, "Pedir na DM");
    if (!igOk && p.id !== "deck") cta.addEventListener("click", (e) => { e.preventDefault(); toast("Configure o @ do Instagram no config.js"); });
    plans.append(h("article", { class: "plan rv" + (p.destaque ? " plan--hl" : ""), style: `--i:${i}` },
      p.destaque && p.selo ? h("span", { class: "plan__badge", text: p.selo }) : null,
      miniCarta(p.imagem, "plan__carta"),
      h("h3", { text: p.titulo }),
      p.aPartir ? h("span", { class: "plan__from", text: "a partir de" }) : null,
      h("div", { class: "plan__price" }, h("small", { text: moeda }), priceB),
      h("span", { class: "plan__unit", text: p.unidade }),
      h("p", { text: p.descricao }),
      cta));
  });

  const quotes = $("[data-quotes]");
  const deps = get("depoimentos") || [];
  if (deps.length) {
    const mk = (d, hidden) => h("figure", { class: "quote", "aria-hidden": hidden ? "true" : null }, h("p", { text: d.texto }), h("cite", { text: d.autor }));
    let base = [];
    while (base.length < 6) base = base.concat(deps);
    base.forEach((d) => quotes.append(mk(d, false)));
    if (!reduced) base.forEach((d) => quotes.append(mk(d, true)));
  } else quotes.closest("section").remove();

  const faq = $("[data-faq]");
  (get("faq") || []).forEach((f, i) => {
    const id = `faq-${i}`;
    const q = h("button", { class: "acc__q", type: "button", "aria-expanded": "false", "aria-controls": id }, h("span", { text: f.p }), h("i", { "aria-hidden": "true" }));
    const a = h("div", { class: "acc__a", id, role: "region" }, h("div", {}, h("p", { text: f.r })));
    q.addEventListener("click", () => {
      const open = q.getAttribute("aria-expanded") === "true";
      $$(".acc__q", faq).forEach((o) => o.setAttribute("aria-expanded", "false"));
      q.setAttribute("aria-expanded", open ? "false" : "true");
    });
    faq.append(h("div", { class: "acc__item" }, q, a));
  });

  /* =====================================================================
     LISTA RÁPIDA → MONTADOR (montar.html)
     ===================================================================== */
  const form = $("[data-forge]");
  const ta = $("[data-forge-list]");
  const M = get("montador") || {};
  ta.placeholder = M.exemploLista || "1 Sol Ring";
  const saved = store.get("goblins-lista");
  if (saved) ta.value = saved;

  const SECAO = /^(commander|comandante|deck|mainboard|main|sideboard|side|maybeboard|companion|tokens?)\b.*:?\s*$/i;
  function parse(text) {
    const out = new Map();
    text.split(/\r?\n/).forEach((raw) => {
      let l = raw.trim().replace(/^SB:\s*/i, "");
      if (!l || l.startsWith("//") || l.startsWith("#") || SECAO.test(l) || /:$/.test(l)) return;
      l = l.replace(/\s+[([][A-Za-z0-9]{2,6}[)\]]\s*[\w★-]*\s*(\*[A-Z]\*)?$/i, "").replace(/\s+\*[A-Z]\*$/i, "").trim();
      const m = l.match(/^(\d{1,3})\s*x?\s+(.+)$/i);
      const qty = m ? parseInt(m[1], 10) : 1;
      const name = (m ? m[2] : l).trim();
      if (!name || qty < 1) return;
      const key = name.toLowerCase();
      const cur = out.get(key);
      out.set(key, { name: cur ? cur.name : name, qty: (cur ? cur.qty : 0) + qty });
    });
    return [...out.values()];
  }

  const tTotal = $("[data-t-total]"), tUnique = $("[data-t-unique]"), tPrice = $("[data-t-price]"), tLbl = $("[data-t-price-lbl]");
  const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);
  function estimate(total) {
    const pa = num(M.precoAvulsa), pd = num(M.precoDeck100);
    if (!total) return { txt: "—", lbl: "estimativa" };
    if (pd != null && pa != null && total >= 100) return { txt: `${moeda} ${brl(pd + (total - 100) * pa)}`, lbl: "deck pronto, sem foil" };
    if (pa != null) return { txt: `${moeda} ${brl(pa * total)}`, lbl: "sem foil" };
    return { txt: "Sob consulta", lbl: "orçamento" };
  }

  let last = { total: -1 };
  function update() {
    const list = parse(ta.value);
    const total = list.reduce((s, c) => s + c.qty, 0);
    const est = estimate(total);
    if (total !== last.total) { [tTotal, tUnique].forEach((b) => { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }); }
    tTotal.textContent = total;
    tUnique.textContent = list.length;
    tPrice.textContent = est.txt;
    tLbl.textContent = est.lbl;
    last = { list, total, est };
    store.set("goblins-lista", ta.value);
  }
  ta.addEventListener("input", update);
  update();

  function addToList(name) {
    const lines = ta.value.split(/\r?\n/);
    const idx = lines.findIndex((l) => {
      const m = l.trim().match(/^(\d{1,3})\s*x?\s+(.+)$/i);
      return (m ? m[2] : l.trim()).toLowerCase() === name.toLowerCase();
    });
    if (idx >= 0) {
      const m = lines[idx].trim().match(/^(\d{1,3})\s*x?\s+(.+)$/i);
      lines[idx] = `${(m ? parseInt(m[1], 10) : 1) + 1} ${name}`;
      ta.value = lines.join("\n");
    } else {
      ta.value = (ta.value.trim() ? ta.value.replace(/\s+$/, "") + "\n" : "") + `1 ${name}`;
    }
    update();
    toast(`Adicionada à lista · ${last.total} ${last.total === 1 ? "carta" : "cartas"}`);
  }

  // leva a lista pro montador, onde o cliente escolhe as artes e envia a encomenda
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (last.total) store.set("goblins-lista-importar", ta.value);
    location.href = "montar.html";
  });

  // alternativa: mandar só a lista em texto pela DM
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const t = h("textarea", { style: "position:fixed;opacity:0;top:0;left:0" });
      t.value = text; document.body.append(t); t.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; }
      t.remove(); return ok;
    }
  }
  $("[data-forge-dm]").addEventListener("click", async () => {
    if (!last.total) { toast("Cole sua lista de cartas primeiro"); ta.focus(); return; }
    const msg = [`Olá! Quero encomendar proxies na ${get("marca.nome") || "Goblins Mágicos Proxys"}.`, `${last.total} cartas:`, "", ...last.list.map((c) => `${c.qty} ${c.name}`)].join("\n");
    const win = igOk ? window.open("about:blank", "_blank") : null;
    const ok = await copy(msg);
    if (!igOk) { toast(ok ? "Lista copiada · configure o @ no config.js" : "Não deu pra copiar"); return; }
    toast(ok ? "Lista copiada! Agora é só colar na DM" : "Copie a lista manualmente e cole na DM");
    setTimeout(() => { if (win) win.location.href = dmUrl; else location.href = dmUrl; }, 450);
  });
  $("[data-forge-clear]").addEventListener("click", () => { ta.value = ""; update(); ta.focus(); });

  /* =====================================================================
     NAVEGAÇÃO, TOPO, MENU, DOCK
     ===================================================================== */
  const topbar = $("[data-topbar]");
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    topbar.classList.toggle("is-solid", y > 20);
    const drawerOpen = menuBtn.getAttribute("aria-expanded") === "true";
    topbar.classList.toggle("is-hidden", !drawerOpen && y > 500 && y > lastY + 4);
    if (y < lastY - 4 || y < 500) topbar.classList.remove("is-hidden");
    lastY = y;
  };

  const menuBtn = $("[data-menu-btn]");
  const drawer = $("[data-drawer]");
  $$("nav a", drawer).forEach((a, i) => a.style.setProperty("--i", i));
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add("is-open")); }
    else { drawer.classList.remove("is-open"); setTimeout(() => { if (!drawer.classList.contains("is-open")) drawer.hidden = true; }, 300); }
  }
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") setMenu(false); });
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // link ativo no menu
  const navLinks = $$(".nav a");
  const secObs = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${en.target.id}`));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => secObs.observe(s));

  // barra fixa no celular: aparece depois do hero, some no pedido e no fim
  const dock = $("[data-dock]");
  const vis = new Map();
  const dockObs = new IntersectionObserver((ents) => {
    ents.forEach((en) => vis.set(en.target, en.isIntersecting));
    const hide = [...vis.values()].some(Boolean);
    dock.classList.toggle("is-on", !hide);
  });
  [$(".hero"), $("#pedido .forge__panel"), $(".final"), $(".foot")].forEach((el) => el && dockObs.observe(el));

  /* ---------- revelar ao rolar ---------- */
  const rev = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); rev.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: .05 });
  $$("[data-reveal], .rv").forEach((el) => rev.observe(el));
})();
