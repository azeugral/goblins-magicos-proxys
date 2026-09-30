/* =====================================================================
   GOBLINS MÁGICOS PROXYS — CONFIGURAÇÃO DO SITE
   ---------------------------------------------------------------------
   Tudo o que aparece no site sai daqui. Edite só os textos entre aspas.
   Qualquer texto que comece com "[" aparece no site marcado como
   "a preencher" (borda tracejada), para você achar fácil o que falta.
   Veja o LEIA-ME.md para o passo a passo.
   ===================================================================== */

window.SITE = {

  /* ---------- Marca e contato ---------- */
  marca: {
    nome: "Goblins Mágicos Proxys",
    instagram: "[seu_usuario]",          // só o @, sem o "@". Ex.: "goblinsmagicos"
    whatsapp: "",                         // opcional. Só números com DDI+DDD. Ex.: "5511999999999". Vazio = esconde o botão
    cidade: "[Sua cidade — UF]",
    email: "",                            // opcional
  },

  /* ---------- Topo da página ---------- */
  hero: {
    selo: "Encomendas abertas · [Sua cidade]",
    titulo: ["Proxies de TCG", "para mesa casual", "e playtest"],   // até 3 linhas; a 2ª ganha destaque
    subtitulo: "Cartas impressas e cortadas em 63×88 mm, com opção de foil. Mande a lista do seu deck pelo Instagram e receba o orçamento.",
    ctaPrincipal: "Encomendar no Instagram",
    ctaSecundario: "Ver a vitrine",
    miniProvas: ["[000+ cartas entregues]", "[Papel 000g]", "Envio pra todo o Brasil"],
  },

  /* ---------- Faixa de selos (rola sozinha) ---------- */
  selos: [
    "Tamanho oficial 63×88 mm",
    "[Papel / gramatura]",
    "Embaralha junto com as originais",
    "Cabe em qualquer sleeve",
    "[Acabamento foil]",
    "Deck completo pela sua lista",
    "[Prazo de produção]",
  ],

  /* ---------- Vitrine ----------
     imagem: caminho da foto (ex.: "assets/img/cartas/krark.webp").
             Deixe "" para mostrar uma carta de exemplo no lugar.
     tags:   usadas nos filtros. Crie as que quiser.
     foil:   true = ganha o brilho holográfico animado. */
  vitrine: [
    { nome: "[Nome da carta 01]", imagem: "", tags: ["Foil", "Borderless"], foil: true },
    { nome: "[Nome da carta 02]", imagem: "", tags: ["Arte alternativa"], foil: false },
    { nome: "[Nome da carta 03]", imagem: "", tags: ["Foil", "Frente e verso"], foil: true },
    { nome: "[Nome da carta 04]", imagem: "", tags: ["Clássica"], foil: false },
    { nome: "[Nome da carta 05]", imagem: "", tags: ["Foil", "Showcase"], foil: true },
    { nome: "[Nome da carta 06]", imagem: "", tags: ["Arte alternativa", "Custom"], foil: false },
    { nome: "[Nome da carta 07]", imagem: "", tags: ["Borderless"], foil: false },
    { nome: "[Nome da carta 08]", imagem: "", tags: ["Foil", "Showcase"], foil: true },
    { nome: "[Nome da carta 09]", imagem: "", tags: ["Frente e verso"], foil: false },
    { nome: "[Nome da carta 10]", imagem: "", tags: ["Custom"], foil: true },
    { nome: "[Nome da carta 11]", imagem: "", tags: ["Clássica"], foil: false },
    { nome: "[Nome da carta 12]", imagem: "", tags: ["Foil", "Borderless"], foil: true },
  ],

  /* ---------- Qualidade de perto ---------- */
  qualidade: {
    titulo: "Papel, corte e acabamento",
    texto: "[Explique aqui o seu processo: papel, impressão, corte, acabamento. Duas ou três frases bastam.]",
    itens: [
      { titulo: "Papel", texto: "[Tipo de papel, gramatura, se é black core…]", foto: "" },
      { titulo: "Corte", texto: "[Como é o corte e o arredondamento dos cantos]", foto: "" },
      { titulo: "Foil", texto: "[Como é feito o brilho holográfico]", foto: "" },
      { titulo: "No sleeve", texto: "[Espessura, se passa despercebida no deck]", foto: "" },
    ],
    // Comparação lado a lado (arraste). Deixe "" para mostrar exemplo.
    comparacao: { original: "", proxy: "", legendaOriginal: "Original", legendaProxy: "Goblins Mágicos" },
  },

  /* ---------- Como funciona ---------- */
  passos: [
    { titulo: "Monte a lista", texto: "Use Moxfield, Archidekt, LigaMagic ou o montador aqui embaixo. Uma carta por linha." },
    { titulo: "Mande na DM", texto: "O botão copia seu pedido pronto. É só colar na conversa do Instagram." },
    { titulo: "Orçamento e pagamento", texto: "[Como você passa o valor e quais formas de pagamento aceita]" },
    { titulo: "Produção e envio", texto: "[Prazo de produção e como envia]" },
  ],

  /* ---------- Preços ----------
     valor: número (ex.: 3.5) ou texto (ex.: "[R$ 0,00]"). */
  precos: {
    moeda: "R$",
    avisoEstimativa: "Valores de referência. O orçamento final sai na DM.",
    planos: [
      { id: "avulsa", titulo: "Avulsa", valor: "[0,00]", unidade: "por carta", descricao: "[Carta comum, sem foil]", destaque: false },
      { id: "foil", titulo: "Foil / especial", valor: "[0,00]", unidade: "por carta", descricao: "[Foil, borderless, showcase…]", destaque: false },
      { id: "deck", titulo: "Deck completo", valor: "[000,00]", unidade: "100 cartas", descricao: "[Commander pela sua lista. Sai mais barato por carta.]", destaque: true, selo: "Mais pedido" },
      { id: "kit", titulo: "Kits", valor: "[00,00]", unidade: "por kit", descricao: "[Sets de terrenos, staples…]", destaque: false },
    ],
  },

  /* ---------- Montador de pedido ----------
     Os números abaixo servem só para a ESTIMATIVA automática.
     Deixe null para não mostrar valor (aparece "orçamento na DM"). */
  montador: {
    precoAvulsa: null,       // ex.: 3.5
    precoFoil: null,         // ex.: 6
    precoDeck100: null,      // ex.: 250 (aplicado quando o pedido tem 100 cartas ou mais)
    exemploLista: "1 Sol Ring\n1 Arcane Signet\n1 Command Tower\n4 Lightning Bolt",
  },

  /* ---------- Depoimentos ---------- */
  depoimentos: [
    { texto: "[Depoimento de cliente — uma ou duas frases.]", autor: "[@cliente]" },
    { texto: "[Depoimento de cliente — uma ou duas frases.]", autor: "[@cliente]" },
    { texto: "[Depoimento de cliente — uma ou duas frases.]", autor: "[@cliente]" },
    { texto: "[Depoimento de cliente — uma ou duas frases.]", autor: "[@cliente]" },
  ],

  /* ---------- Perguntas frequentes ---------- */
  faq: [
    { p: "Posso usar em torneio?", r: "Em torneio oficial (sancionado), não: lá só vale carta original. Em mesa casual, Commander entre amigos e playtest, depende só do combinado da mesa." },
    { p: "Qual o prazo?", r: "[Prazo de produção + prazo de envio]" },
    { p: "Como faço o pagamento?", r: "[Pix, cartão, etc.]" },
    { p: "Vocês enviam pra minha cidade?", r: "[Formas de envio e se tem retirada]" },
    { p: "Posso pedir arte personalizada?", r: "[Sim/não e como funciona]" },
    { p: "Faz de outros jogos além de Magic?", r: "[Pokémon, One Piece, Lorcana…]" },
  ],

  /* ---------- Rodapé ---------- */
  rodape: {
    aviso: "Proxies para uso casual e playtest. Não são cartas oficiais e não têm vínculo com as editoras dos jogos.",
  },
};
