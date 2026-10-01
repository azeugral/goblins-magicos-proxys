# Goblins Mágicos Proxys: como editar o site

Todo o conteúdo do site sai de um único arquivo: **`assets/js/config.js`**.
Você não precisa mexer no HTML, no CSS nem no `main.js`.

## O que falta preencher
No site, os campos que ainda faltam aparecem com uma **borda laranja tracejada**. No `config.js`, esses campos são os textos que começam com `[`.
Quando você troca o texto, a borda some sozinha.

## Passo a passo
1. **Instagram:** em `marca.instagram`, coloque só o usuário, sem `@`. É isso que faz os botões abrirem a sua DM.
2. **WhatsApp (opcional):** em `marca.whatsapp`, coloque só os números, com 55 + DDD. Se ficar vazio, o botão não aparece.
3. **Cartas da vitrine:**
   - Coloque as fotos em `assets/img/cartas/`. O ideal é uma carta por arquivo, em pé e cortada rente à carta. A proporção é 63×88 (ex.: 630×880 px), em `.webp` ou `.jpg`.
   - Em `vitrine`, preencha `nome` e `imagem` (ex.: `"assets/img/cartas/krark.webp"`). Em `tags`, você cria os filtros. Com `foil: true`, a carta ganha o brilho holográfico.
   - Carta sem `imagem` aparece como uma carta de exemplo com o goblin.
4. **Qualidade:** textos e fotos de perto (papel, corte, foil, sleeve). A comparação "Original × Goblins Mágicos" aceita duas fotos da mesma carta.
5. **Preços:** em `precos.planos` ficam os cards da tabela (hoje: Avulsa R$ 2,50, Deck pronto R$ 180 e Foil R$ 8). Use `aPartir: true` se quiser "a partir de" antes do valor.
6. **Estimativa do montador:** em `montador`. Hoje: `precoAvulsa: 2.5`, `precoFoil: 8`, `precoDeck100: 180` (deck pronto, vale pra pedidos de 100 cartas ou mais), `precoDuplaFace: 1.8` (acréscimo por carta dupla face) e `comandanteFoilBrinde: true` (no deck, o comandante foil não é cobrado). Se algum preço ficar `null`, o site mostra "Sob consulta".
7. **Artes da casa:** em `artesDaCasa`, liste as artes que você recomenda ou já tem prontas. Elas aparecem primeiro no seletor de arte, com o selo "Arte da casa", e viram a arte padrão da carta. Pode ser uma edição oficial (`set` + `num`) ou uma imagem sua (`imagem`).
8. **Depoimentos e FAQ:** é só editar a lista.

## Como o pedido chega até você
1. O cliente abre o **montador** (`montar.html`). Pode colar a lista na página inicial e tocar em "Escolher as artes e encomendar", ou ir direto no botão "Montar deck".
2. No montador ele vê cada carta, troca a arte (todas as edições de Magic, com filtros Borderless, Full art, Showcase…), ajusta quantidades e marca o que é foil.
3. Em "Finalizar encomenda", ele deixa nome e contato e envia.
4. Você recebe um **e-mail** com o resumo, miniaturas das cartas, a lista em texto (também em anexo) e o botão **"Abrir o pedido completo"**.
5. O cliente também fica com o **link do pedido**. Se o e-mail não estiver configurado ou falhar, a tela final pede pra ele mandar o link pela DM ou pelo WhatsApp.

O pedido inteiro vai **dentro do link** (`pedido.html#p=…`). Não tem banco de dados: guarde os links (no e-mail ou na planilha, veja abaixo).

## Painel do pedido (`pedido.html`)
Abrindo o link do pedido no computador você tem:
- a grade com as artes escolhidas, as quantidades, o que é foil e os dados do cliente;
- **"Impressa"** em cada carta, pra ir marcando o que já saiu. Fica salvo no seu navegador;
- **Arte própria**: passe o mouse na carta e troque pela sua imagem (ex.: uma versão HQ). Ela fica guardada só neste computador e entra no PDF;
- **Copiar lista / .txt / .csv**;
- **Folhas de impressão (PDF)**: A4, Carta ou A3, 3×3 por folha, carta em 63×88 mm a ~300 DPI, com sangria, marcas de corte, pular básicos, foil em folhas separadas e frente e verso.
  - **Frente e verso:** as páginas de verso saem espelhadas pra impressão duplex virando pela **borda longa**. Cartas de dupla face levam o verso verdadeiro; as outras levam o verso da casa (gerado com o seu logo, ou a imagem em `versoCarta` no config, se você criar esse campo).
  - **Imprima sempre em escala 100%** ("tamanho real"), nunca "ajustar à página".

## E-mail das encomendas (Google Apps Script, grátis)
Configure uma vez, em uns 15 minutos. Use, de preferência, uma conta Google só da loja.
1. Entre em https://script.google.com → **Novo projeto**.
2. Apague o conteúdo e cole o arquivo **`apps-script/Code.gs`** deste site.
3. No topo do código, troque `DESTINO` pelo e-mail que vai receber as encomendas.
4. (Opcional) Pra registrar cada pedido numa planilha: crie uma planilha no Google Sheets, copie o ID dela (o trecho entre `/d/` e `/edit` na URL) e cole em `PLANILHA_ID`.
5. Clique em **Implantar → Nova implantação → ⚙ → App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Autorize o acesso. O Google mostra um aviso de "app não verificado": clique em **Avançado → Acessar**.
7. Copie a **URL do app da Web** (termina em `/exec`) e cole em `assets/js/config.js` → `pedidos.emailEndpoint`.
8. Faça um pedido de teste no montador.

Limites: o Gmail grátis manda até ~100 e-mails por dia. O script também bloqueia envios rápidos demais e mais de 30 pedidos por hora (proteção contra spam). Se mudar o código depois, use **Implantar → Gerenciar implantações → Editar → Nova versão** pra URL continuar a mesma.

## Catálogo de cartas
O montador usa um catálogo próprio em `data/` (~3 MB), gerado a partir do Scryfall. Ele se **atualiza sozinho toda segunda-feira** pelo GitHub Actions (`.github/workflows/catalogo.yml`). Pra atualizar na hora: no GitHub, aba **Actions → Atualizar catálogo de cartas → Run workflow**. Ou, no computador: `python tools/catalogo.py`.

O cliente baixa o catálogo só na primeira visita. Depois ele fica salvo no navegador e só baixa de novo quando muda.

## Testar no computador
Abra um terminal dentro da pasta `site/` e rode:

```bash
python -m http.server 8000
```

Depois abra http://localhost:8000.

## Publicar
É um site estático: basta subir a pasta `site/` inteira para qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages, GitHub Pages).
