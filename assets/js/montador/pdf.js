/* Gera as folhas de impressão em PDF, inteiramente no navegador.
   Carta 63×88 mm a ~300 DPI, sangria por extensão da borda, marcas de corte
   e verso espelhado para impressão frente e verso (virar pela borda longa). */

const MM = 72 / 25.4;
const PAPEL = { a4: [210, 297], carta: [215.9, 279.4], a3: [297, 420] };
const DPI = 300;
const PX = (mm) => Math.round((mm * DPI) / 25.4);
const CW = 63, CH = 88;

let pdfLib = null;
function carregarPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (pdfLib) return pdfLib;
  pdfLib = new Promise((ok, erro) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    s.onload = () => ok(window.PDFLib);
    s.onerror = () => { pdfLib = null; erro(new Error("Não deu pra carregar o gerador de PDF.")); };
    document.head.append(s);
  });
  return pdfLib;
}

function carregarImagem(src) {
  return new Promise((ok, erro) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.decoding = "async";
    im.onload = () => ok(im);
    im.onerror = () => erro(new Error(`Imagem não carregou: ${src}`));
    im.src = src;
  });
}

/* Desenha a carta com sangria e devolve um JPEG */
async function prepararCarta(src, bleedMm, cantos) {
  const im = await carregarImagem(src);
  const w = PX(CW), hh = PX(CH), b = PX(bleedMm);
  const cv = document.createElement("canvas");
  cv.width = w + 2 * b; cv.height = hh + 2 * b;
  const ctx = cv.getContext("2d");
  // cor dos cantos: preta ou a cor da borda da própria carta
  let fundo = "#000";
  if (cantos !== "preto") {
    const t = document.createElement("canvas");
    t.width = w; t.height = hh;
    const tc = t.getContext("2d", { willReadFrequently: true });
    tc.drawImage(im, 0, 0, w, hh);
    const px = tc.getImageData(Math.round(w * 0.012), Math.round(hh / 2), 1, 1).data;
    if (px[3] > 200) fundo = `rgb(${px[0]},${px[1]},${px[2]})`;
  }
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(im, b, b, w, hh);
  if (b > 0) {
    ctx.drawImage(cv, b, b, 1, hh, 0, b, b, hh);                 // esquerda
    ctx.drawImage(cv, b + w - 1, b, 1, hh, b + w, b, b, hh);     // direita
    ctx.drawImage(cv, 0, b, cv.width, 1, 0, 0, cv.width, b);     // topo
    ctx.drawImage(cv, 0, b + hh - 1, cv.width, 1, 0, b + hh, cv.width, b); // base
  }
  const blob = await new Promise((ok) => cv.toBlob(ok, "image/jpeg", 0.93));
  return new Uint8Array(await blob.arrayBuffer());
}

/* Verso padrão da casa: gerado com o logo, se não houver imagem no config */
export async function versoDaCasa(logoSrc, nome) {
  const w = PX(CW), hh = PX(CH);
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = hh;
  const c = cv.getContext("2d");
  c.fillStyle = "#120e0c"; c.fillRect(0, 0, w, hh);
  const g = c.createRadialGradient(w / 2, hh * 0.45, 10, w / 2, hh * 0.45, hh * 0.6);
  g.addColorStop(0, "rgba(222,59,32,.55)"); g.addColorStop(1, "rgba(222,59,32,0)");
  c.fillStyle = g; c.fillRect(0, 0, w, hh);
  c.strokeStyle = "#f3e6c8"; c.lineWidth = 10; c.strokeRect(34, 34, w - 68, hh - 68);
  c.strokeStyle = "rgba(243,230,200,.35)"; c.lineWidth = 3; c.strokeRect(54, 54, w - 108, hh - 108);
  try {
    const im = await carregarImagem(logoSrc);
    const d = w * 0.62;
    c.save(); c.beginPath(); c.arc(w / 2, hh * 0.45, d / 2, 0, Math.PI * 2); c.clip();
    c.drawImage(im, w / 2 - d / 2, hh * 0.45 - d / 2, d, d); c.restore();
    c.beginPath(); c.arc(w / 2, hh * 0.45, d / 2, 0, Math.PI * 2); c.lineWidth = 12; c.strokeStyle = "#f3e6c8"; c.stroke();
  } catch { /* sem logo */ }
  c.fillStyle = "#f3e6c8"; c.textAlign = "center";
  c.font = "700 46px Unbounded, 'Arial Black', sans-serif";
  (nome || "").toUpperCase().split(" ").reduce((linhas, p) => {
    const l = linhas[linhas.length - 1];
    if (l && (l + " " + p).length <= 16) linhas[linhas.length - 1] = l + " " + p; else linhas.push(p);
    return linhas;
  }, []).forEach((l, i, arr) => c.fillText(l, w / 2, hh * 0.82 + (i - (arr.length - 1) / 2) * 56));
  return cv.toDataURL("image/png");
}

/* cartas: [{ chave, frente: url, verso: url|null, foil, basico }] já expandidas pela quantidade */
export async function gerarPdf(cartas, op, aoProgresso) {
  const { PDFDocument, rgb } = await carregarPdfLib();
  const [PW, PH] = PAPEL[op.papel] || PAPEL.a4;
  const b = +op.bleed || 0, gap = +op.gap || 0;
  const cw = CW + 2 * b, ch = CH + 2 * b;
  const cols = Math.max(1, Math.floor((PW + gap) / (cw + gap)));
  const rows = Math.max(1, Math.floor((PH + gap) / (ch + gap)));
  const porFolha = cols * rows;
  const ox = (PW - (cols * cw + (cols - 1) * gap)) / 2;
  const oy = (PH - (rows * ch + (rows - 1) * gap)) / 2;

  let lista = cartas.filter((c) => !(op.basicos && c.basico));
  const grupos = op.foilSep ? [lista.filter((c) => !c.foil), lista.filter((c) => c.foil)].filter((g) => g.length) : [lista];

  const doc = await PDFDocument.create();
  doc.setTitle(op.titulo || "Folhas de impressão");
  doc.setCreator("Goblins Mágicos Proxys");

  // prepara cada imagem uma vez só
  const fontes = new Map();
  lista.forEach((c) => { fontes.set(c.frente, null); if (op.versos) fontes.set(c.verso || op.versoCasa, null); });
  const urls = [...fontes.keys()].filter(Boolean);
  let feitas = 0;
  const erros = [];
  const fila = urls.slice();
  async function trabalhador() {
    while (fila.length) {
      const u = fila.shift();
      try { fontes.set(u, await doc.embedJpg(await prepararCarta(u, b, op.cantos))); }
      catch (e) { erros.push(u); console.warn(e); }
      feitas++;
      aoProgresso(feitas / urls.length, `Preparando imagens ${feitas}/${urls.length}`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, trabalhador));

  const pos = (i, espelhar) => {
    const r = Math.floor(i / cols);
    let c = i % cols;
    if (espelhar) c = cols - 1 - c;
    const x = ox + c * (cw + gap);
    const yTopo = oy + r * (ch + gap);
    return { x: x * MM, y: (PH - yTopo - ch) * MM };
  };

  function marcas(pg) {
    const cor = rgb(0, 0, 0), esp = 0.5, L = 4 * MM;
    const xs = [], ys = [];
    for (let c = 0; c < cols; c++) { const x = ox + c * (cw + gap) + b; xs.push(x, x + CW); }
    for (let r = 0; r < rows; r++) { const y = oy + r * (ch + gap) + b; ys.push(y, y + CH); }
    const topo = oy, base = oy + rows * ch + (rows - 1) * gap, esq = ox, dir = ox + cols * cw + (cols - 1) * gap;
    xs.forEach((x) => {
      pg.drawLine({ start: { x: x * MM, y: (PH - topo) * MM + 1 }, end: { x: x * MM, y: (PH - topo) * MM + 1 + Math.min(L, topo * MM - 2) }, thickness: esp, color: cor });
      pg.drawLine({ start: { x: x * MM, y: (PH - base) * MM - 1 }, end: { x: x * MM, y: Math.max(2, (PH - base) * MM - 1 - L) }, thickness: esp, color: cor });
    });
    ys.forEach((y) => {
      pg.drawLine({ start: { x: esq * MM - 1, y: (PH - y) * MM }, end: { x: Math.max(2, esq * MM - 1 - L), y: (PH - y) * MM }, thickness: esp, color: cor });
      pg.drawLine({ start: { x: dir * MM + 1, y: (PH - y) * MM }, end: { x: Math.min(PW * MM - 2, dir * MM + 1 + L), y: (PH - y) * MM }, thickness: esp, color: cor });
    });
  }

  let paginas = 0;
  for (const g of grupos) {
    for (let s = 0; s < g.length; s += porFolha) {
      const folha = g.slice(s, s + porFolha);
      const pg = doc.addPage([PW * MM, PH * MM]);
      folha.forEach((c, i) => {
        const img = fontes.get(c.frente);
        const p = pos(i, false);
        if (img) pg.drawImage(img, { x: p.x, y: p.y, width: cw * MM, height: ch * MM });
        else pg.drawRectangle({ x: p.x, y: p.y, width: cw * MM, height: ch * MM, borderColor: rgb(0.8, 0, 0), borderWidth: 1 });
      });
      if (op.marcas) marcas(pg);
      paginas++;
      if (op.versos) {
        const vs = doc.addPage([PW * MM, PH * MM]);
        folha.forEach((c, i) => {
          const img = fontes.get(c.verso || op.versoCasa);
          const p = pos(i, true);
          if (img) vs.drawImage(img, { x: p.x, y: p.y, width: cw * MM, height: ch * MM });
        });
        if (op.marcas) marcas(vs);
        paginas++;
      }
    }
  }
  aoProgresso(1, "Montando o arquivo…");
  const bytes = await doc.save();
  return { bytes, paginas, cols, rows, erros };
}
