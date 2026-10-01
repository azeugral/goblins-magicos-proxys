/**
 * Goblins Mágicos Proxys: recebe as encomendas do montador e manda por e-mail.
 *
 * Instalação (uma vez, ~15 min). O passo a passo completo está no LEIA-ME.md:
 *  1. script.google.com → Novo projeto → cole este arquivo inteiro.
 *  2. Ajuste DESTINO abaixo (o e-mail que recebe as encomendas).
 *  3. Implantar → Nova implantação → Tipo "App da Web"
 *       Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 *  4. Autorize, copie a URL que termina em /exec e cole em
 *     assets/js/config.js → pedidos.emailEndpoint
 *  Opcional: crie uma planilha, copie o ID dela (da URL) em PLANILHA_ID
 *  pra cada pedido virar uma linha.
 */

const DESTINO = "seu-email@gmail.com";
const PLANILHA_ID = "";            // opcional
const NOME_LOJA = "Goblins Mágicos Proxys";
const LIMITE_POR_HORA = 30;        // proteção contra spam
const MAX_CARTAS = 1500;

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // anti-spam: campo oculto, tempo mínimo, tamanho e frequência
    if (d.site) return resposta({ ok: true });
    if (!d.t || d.t < 6000) return resposta({ ok: false, erro: "rapido" });
    if (!d.cliente || !d.cliente.n || !d.cliente.ct) return resposta({ ok: false, erro: "dados" });
    if (!Array.isArray(d.itens) || !d.itens.length || d.itens.length > MAX_CARTAS) return resposta({ ok: false, erro: "itens" });
    if (!/^https:\/\/|^http:\/\/localhost/.test(String(d.link || "")) || String(d.link).length > 20000) return resposta({ ok: false, erro: "link" });
    const cache = CacheService.getScriptCache();
    const n = Number(cache.get("envios") || 0);
    if (n >= LIMITE_POR_HORA) return resposta({ ok: false, erro: "limite" });
    cache.put("envios", String(n + 1), 3600);

    enviarEmail(d);
    if (PLANILHA_ID) registrar(d);
    return resposta({ ok: true });
  } catch (err) {
    console.error(err);
    return resposta({ ok: false, erro: "interno" });
  }
}

function doGet() {
  return resposta({ ok: true, servico: NOME_LOJA + " · encomendas" });
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function enviarEmail(d) {
  const c = d.cliente, r = d.resumo || {};
  const tipos = { instagram: "Instagram", whatsapp: "WhatsApp", email: "E-mail" };
  const assunto = `Nova encomenda ${d.codigo} · ${r.total} cartas (${r.foils} foil) · ${c.n}`;

  const cartasHtml = d.itens.map((i) =>
    `<td style="width:25%;padding:6px;vertical-align:top;font:12px Arial,sans-serif;color:#222">
       <img src="${esc(i.img)}" width="120" style="width:120px;border-radius:5px;display:block" alt="">
       <b>${i.q}× ${esc(i.nome)}</b><br>
       <span style="color:#777">${esc(String(i.set).toUpperCase())} · ${esc(i.cn)}</span>
       ${i.foil ? '<br><span style="background:#a9c43c;color:#120e0c;padding:1px 4px;font-weight:bold">FOIL</span>' : ""}
       ${i.sec === "cmd" ? '<br><span style="color:#d2521a;font-weight:bold">Comandante</span>' : ""}
     </td>`);
  const linhas = [];
  for (let k = 0; k < cartasHtml.length; k += 4) linhas.push(`<tr>${cartasHtml.slice(k, k + 4).join("")}</tr>`);

  const faltando = (d.faltando || []).length
    ? `<p style="color:#b33"><b>Não encontradas (o cliente digitou):</b><br>${d.faltando.map((f) => `${f.q}× ${esc(f.nome)}`).join("<br>")}</p>` : "";

  const html = `
  <div style="max-width:640px;margin:auto;font:14px Arial,sans-serif;color:#222">
    <h2 style="margin:0 0 4px">Encomenda ${esc(d.codigo)}</h2>
    <p style="margin:0 0 16px;color:#666">${new Date().toLocaleString("pt-BR")}</p>
    <table style="border-collapse:collapse;margin-bottom:16px">
      <tr><td style="padding:2px 12px 2px 0;color:#666">Cliente</td><td><b>${esc(c.n)}</b></td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#666">${esc(tipos[c.t] || "Contato")}</td><td><b>${esc(c.ct)}</b></td></tr>
      ${c.ci ? `<tr><td style="padding:2px 12px 2px 0;color:#666">Cidade</td><td>${esc(c.ci)}</td></tr>` : ""}
      ${c.o ? `<tr><td style="padding:2px 12px 2px 0;color:#666">Obs.</td><td>${esc(c.o)}</td></tr>` : ""}
      <tr><td style="padding:2px 12px 2px 0;color:#666">Resumo</td><td>${r.total} cartas · ${r.unicas} diferentes · ${r.foils} foil · ${esc(r.estimativa)}</td></tr>
    </table>
    <p><a href="${esc(d.link)}" style="display:inline-block;background:#de3b20;color:#fff;padding:12px 18px;text-decoration:none;font-weight:bold">Abrir o pedido completo</a></p>
    <p style="color:#666;font-size:12px">No painel do pedido você confere as artes, marca o que já imprimiu e gera o PDF de impressão.</p>
    ${faltando}
    <table style="border-collapse:collapse;width:100%">${linhas.join("")}</table>
    <h3>Lista em texto</h3>
    <pre style="background:#f4f1ea;padding:12px;font:12px monospace;white-space:pre-wrap">${esc(d.texto)}</pre>
  </div>`;

  const texto = `Encomenda ${d.codigo}\nCliente: ${c.n} (${tipos[c.t] || "contato"}: ${c.ct})\n${c.ci ? "Cidade: " + c.ci + "\n" : ""}${c.o ? "Obs.: " + c.o + "\n" : ""}${r.total} cartas · ${r.foils} foil · ${r.estimativa}\n\nPedido completo: ${d.link}\n\n${d.texto}`;
  const anexo = Utilities.newBlob(texto, "text/plain", `pedido-${d.codigo}.txt`);
  const opcoes = { htmlBody: html, attachments: [anexo], name: NOME_LOJA };
  if (c.t === "email" && /^\S+@\S+\.\S+$/.test(c.ct)) opcoes.replyTo = c.ct;
  MailApp.sendEmail(DESTINO, assunto, texto, opcoes);
}

function registrar(d) {
  const aba = SpreadsheetApp.openById(PLANILHA_ID).getSheets()[0];
  if (aba.getLastRow() === 0) aba.appendRow(["Data", "Pedido", "Cliente", "Contato", "Cidade", "Cartas", "Foil", "Estimativa", "Link", "Obs."]);
  const c = d.cliente, r = d.resumo || {};
  aba.appendRow([new Date(), d.codigo, c.n, `${c.t}: ${c.ct}`, c.ci || "", r.total, r.foils, r.estimativa, d.link, c.o || ""]);
}
