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
    instagram: "goblinsmagicos",          // só o @, sem o "@". Ex.: "goblinsmagicos"
    whatsapp: "5519996224081",            // opcional. Só números com DDI+DDD. Ex.: "5511999999999". Vazio = esconde o botão
    cidade: "Americana - SP",
    email: "",                            // opcional
  },

  /* ---------- Topo da página ---------- */
  hero: {
    selo: "Encomendas abertas · Americana - SP",
    titulo: ["Proxies de TCG", "para mesa casual", "e playtest"],   // até 3 linhas; a 2ª ganha destaque
    subtitulo: "Cartas impressas e cortadas em 63×88 mm, com opção de foil. Mande a lista do seu deck pelo Instagram e receba o orçamento.",
    ctaPrincipal: "Encomendar no Instagram",
    ctaSecundario: "Ver a vitrine",
    miniProvas: ["Envio pra todo o Brasil"],
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
    { nome: "Thorin Oakenshield", imagem: "assets/img/cartas/thorin-oakenshield.webp", tags: ["Clássica"], foil: false },
    { nome: "Thorin Oakenshield", imagem: "assets/img/cartas/thorin-oakenshield.webp", tags: ["Foil"], foil: true },
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
      { titulo: "No sleeve", texto: "[Espessura, se passa despercebida no deck]", foto: "assets/img/cartas/thorin-no-sleeve.webp" },
    ],
    // Comparação lado a lado (arraste). Deixe "" para mostrar exemplo.
    comparacao: { original: "https://cards.scryfall.io/normal/front/c/7/c7e18609-d1ed-4829-be11-f2ce2cfcbc49.jpg", proxy: "assets/img/cartas/thorin-oakenshield.webp", proxyFoil: true, legendaOriginal: "Original", legendaProxy: "Goblins Mágicos" },
  },

  /* ---------- Como funciona ----------
     imagem (opcional): mostra uma carta pequena no canto do passo. */
  passos: [
    { titulo: "Monte o deck", imagem: "assets/img/cartas/thorin-oakenshield.webp", texto: "Cole a lista no montador ou busque carta por carta. Escolha a arte de cada uma e marque o que é foil." },
    { titulo: "Envie a encomenda", texto: "Deixe seu contato e envie. O pedido chega pra gente com todas as artes escolhidas, e você fica com o link." },
    { titulo: "Orçamento e pagamento", texto: "[Como você passa o valor e quais formas de pagamento aceita]" },
    { titulo: "Produção e envio", texto: "[Prazo de produção e como envia]" },
  ],

  /* ---------- Preços ----------
     valor: número (ex.: 2.5) ou texto.
     aPartir: true mostra "a partir de" antes do valor.
     imagem (opcional): mostra uma carta pequena no canto do card. */
  precos: {
    moeda: "R$",
    avisoEstimativa: "Carta dupla face (MDFC) acompanha o valor da original: as duas faces são impressas. O valor final é confirmado com você antes da produção.",
    planos: [
      { id: "avulsa", titulo: "Avulsa", valor: 2.5, unidade: "por carta", descricao: "Carta comum, sem foil. Dupla face (MDFC): R$ 5,00.", destaque: false },
      { id: "deck", titulo: "Deck pronto", imagem: "assets/img/cartas/thorin-oakenshield.webp", valor: 180, unidade: "99 cartas + comandante", descricao: "Commander completo pela sua lista. O comandante vai em foil, de brinde. Dupla face (MDFC): + R$ 1,80 cada.", destaque: true, selo: "Comandante foil de brinde" },
      { id: "foil", titulo: "Foil", valor: 8, unidade: "por carta", descricao: "Acabamento foil. Dupla face (MDFC) foil: R$ 16,00.", destaque: false },
    ],
  },

  /* ---------- Montador de pedido ----------
     Números usados na ESTIMATIVA automática do montador.
     Deixe null para não mostrar valor (aparece "Sob consulta"). */
  montador: {
    precoAvulsa: 2.5,             // carta comum, sem foil
    precoFoil: 8,                 // carta foil
    precoDeck100: 180,            // deck pronto: 99 cartas + comandante (pedidos com 100 cartas ou mais)
    precoAvulsaDuplaFace: 5,      // carta dupla face (MDFC), sem foil
    precoFoilDuplaFace: 16,       // carta dupla face (MDFC), foil
    precoDuplaFaceNoDeck: 1.8,    // acréscimo por carta dupla face dentro do deck pronto
    comandanteFoilBrinde: true,   // no deck pronto, o comandante foil não é cobrado
    exemploLista: "1 Thorin Oakenshield\n1 Sol Ring\n1 Arcane Signet\n4 Lightning Bolt",
  },

  /* ---------- Encomendas pelo montador (montar.html) ----------
     emailEndpoint: URL do Google Apps Script que manda o e-mail pra você
                    (passo a passo no LEIA-ME.md, seção "E-mail das encomendas").
                    Vazio = o cliente recebe só o link do pedido pra mandar na DM. */
  pedidos: {
    emailEndpoint: "",
    respostaTexto: "A gente te chama pelo contato que você deixou com o orçamento e o prazo.",
  },

  /* ---------- Artes da casa ----------
     Artes que você recomenda ou já tem prontas. Aparecem primeiro no seletor
     de arte, com o selo "Arte da casa", e viram a arte padrão da carta.
       Edição oficial:  { carta: "Krark, the Thumbless", set: "cmr", num: "189", nota: "Clássica" }
       Arte própria:    { carta: "Krark, the Thumbless", imagem: "assets/img/artes/krark-hq.png", nota: "Versão HQ" }
     A imagem própria deve ter 63×88 (ideal 744×1040 px ou maior). */
  artesDaCasa: [
  ],

  /* Verso das cartas no PDF de impressão (frente e verso). Vazio = verso gerado com o logo.
     Ex.: "assets/img/verso.png" (63×88, ideal 744×1040 px). */
  versoCarta: "",

  /* ---------- Depoimentos ---------- */
  depoimentos: [],   // vazio = a seção de avaliações não aparece. Ex.: { texto: "…", autor: "@cliente" }

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
