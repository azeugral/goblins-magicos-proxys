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
    miniProvas: ["Retirada em Americana, Santa Bárbara e Piracicaba"],
    // cartas do leque em volta do goblin (exemplos/destaques; a vitrine fica com fotos reais)
    cartas: [
      { nome: "Black Lotus", imagem: "assets/img/cartas/black-lotus.webp", foil: false },
      { nome: "The One Ring", imagem: "assets/img/cartas/the-one-ring.webp", foil: true },
      { nome: "Krark's Thumb", imagem: "assets/img/cartas/kraks-thumb.webp", foil: false },
    ],
  },

  /* ---------- Faixa de selos (rola sozinha) ---------- */
  selos: [
    "Tamanho oficial 63×88 mm",
    "Papel cartão 300 g ou fotográfico 260 g",
    "Embaralha junto com as originais",
    "Cabe em qualquer sleeve",
    "Foil aplicado sobre carta original",
    "Deck completo pela sua lista",
    "Deck completo em 14 dias",
  ],

  /* ---------- Vitrine ----------
     imagem: caminho da foto (ex.: "assets/img/cartas/krark.webp").
             Deixe "" para mostrar uma carta de exemplo no lugar.
     tags:   usadas nos filtros. Crie as que quiser.
     foil:   true = ganha o brilho holográfico animado. */
  vitrine: [
    { nome: "Black Lotus", imagem: "assets/img/cartas/black-lotus.webp", tags: ["Clássica", "Moldura antiga"], foil: false },
    { nome: "The One Ring", imagem: "assets/img/cartas/the-one-ring.webp", tags: ["Foil", "Borderless"], foil: true },
    { nome: "Krark's Thumb", imagem: "assets/img/cartas/kraks-thumb.webp", tags: ["Borderless", "Arte alternativa"], foil: false },
  ],

  /* ---------- Qualidade de perto ---------- */
  qualidade: {
    titulo: "Papel, corte e acabamento",
    texto: "Cada carta é impressa no tamanho oficial, em papel cartão 300 g ou papel fotográfico 260 g. No foil, o adesivo vinílico holográfico vai aplicado sobre uma carta verdadeira, então o verso é o original.",
    itens: [
      { titulo: "Papel", texto: "Papel cartão 300 g ou papel fotográfico 260 g, cortado em 63×88 mm.", foto: "" },
      { titulo: "Foil", texto: "Adesivo vinílico aplicado sobre uma carta verdadeira: o verso é de carta original.", foto: "" },
    ],
    // Comparação lado a lado (arraste). Deixe "" para mostrar exemplo.
    comparacao: { original: "assets/img/cartas/the-one-ring.webp", proxy: "assets/img/cartas/the-one-ring.webp", proxyFoil: true, legendaOriginal: "Original", legendaProxy: "Goblins Mágicos" },
  },

  /* ---------- Como funciona ----------
     imagem (opcional): mostra uma carta pequena no canto do passo. */
  passos: [
    { titulo: "Monte o deck", imagem: "assets/img/cartas/black-lotus.webp", texto: "Cole a lista no montador ou busque carta por carta. Escolha a arte de cada uma e marque o que é foil." },
    { titulo: "Envie a encomenda", texto: "Deixe seu contato e envie. O pedido chega pra gente com todas as artes escolhidas, e você fica com o link." },
    { titulo: "Orçamento e pagamento", texto: "A gente confirma o valor com você. O pagamento é só por Pix, completo antes da produção." },
    { titulo: "Produção e retirada", texto: "O deck completo fica pronto em 14 dias. Por enquanto a entrega é só na região, nas lojas parceiras." },
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
      { id: "deck", titulo: "Deck pronto", imagem: "assets/img/cartas/the-one-ring.webp", valor: 180, unidade: "99 cartas + comandante", descricao: "Commander completo pela sua lista. O comandante vai em foil, de brinde. Dupla face (MDFC): + R$ 1,80 cada.", destaque: true, selo: "Comandante foil de brinde" },
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
    exemploLista: "1 Black Lotus\n1 The One Ring\n1 Krark's Thumb\n1 Sol Ring",
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

  /* ---------- Onde retirar ----------
     Lojas parceiras onde o pedido é entregue. aCombinar: true mostra o selo "a combinar".
     O botão "Ver no mapa" abre o endereço no Google Maps. */
  entrega: {
    texto: "Por enquanto a entrega é só na região. Você retira o pedido numa das lojas parceiras, e em Campinas a entrega é combinada com você.",
    pontos: [
      { nome: "Gold House TCG", cidade: "Santa Bárbara d'Oeste", endereco: "Av. Sabato Ronsini, 401 - Vila Garrido" },
      { nome: "Geek Collections House", cidade: "Americana", endereco: "R. Mal. Floriano Peixoto, 87 - Centro" },
      { nome: "Geek Collections House", cidade: "Piracicaba", endereco: "R. Benjamin Constant, 2410 - Centro" },
      { nome: "Barão Geek House", cidade: "Campinas · Barão Geraldo", endereco: "R. Germano Casellatto, 44 - Jd. Santa Genebra II", aCombinar: true },
      { nome: "Mont", cidade: "Campinas · Barão Geraldo", endereco: "R. Roxo Moreira, 1624 - Cidade Universitária", aCombinar: true },
    ],
  },

  /* ---------- Depoimentos ---------- */
  depoimentos: [],   // vazio = a seção de avaliações não aparece. Ex.: { texto: "…", autor: "@cliente" }

  /* ---------- Perguntas frequentes ---------- */
  faq: [
    { p: "Posso usar em torneio?", r: "Em torneio oficial (sancionado), não: lá só vale carta original. Em mesa casual, Commander entre amigos e playtest, depende só do combinado da mesa." },
    { p: "Qual o prazo?", r: "O deck completo leva 14 dias de produção. Quando fica pronto, a gente combina a retirada com você." },
    { p: "Como faço o pagamento?", r: "Só por Pix, com o pagamento completo antes da produção." },
    { p: "Vocês enviam pra minha cidade?", r: "Por enquanto, só entrega e retirada na região: na Gold House (Santa Bárbara d'Oeste) e na Geek Collections House (Americana e Piracicaba). Em Campinas, na Mont e na Barão Geek House, a combinar." },
    { p: "Posso pedir arte personalizada?", r: "Sim. A arte personalizada é feita sob orçamento: chame no Instagram e conte a ideia." },
  ],

  /* ---------- Rodapé ---------- */
  rodape: {
    aviso: "Proxies para uso casual e playtest. Não são cartas oficiais e não têm vínculo com as editoras dos jogos.",
  },
};
