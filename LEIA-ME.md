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
5. **Preços:** em `precos.planos`, os valores aparecem como "a partir de".
6. **Estimativa do montador:** em `montador`, coloque os números (ex.: `precoAvulsa: 3.5`). Se deixar `null`, o site mostra "orçamento na DM".
7. **Depoimentos e FAQ:** é só editar a lista.

## Como o pedido chega até você
1. O cliente cola a lista no montador (ou toca em "Colocar no meu pedido" numa carta da vitrine).
2. Ele toca em "Copiar pedido e abrir o Instagram".
3. O pedido já vai copiado e formatado (nome, acabamento, total de cartas e a lista). A sua DM abre, e ele só precisa colar.

## Testar no computador
Abra um terminal dentro da pasta `site/` e rode:

```bash
python -m http.server 8000
```

Depois abra http://localhost:8000.

## Publicar
É um site estático: basta subir a pasta `site/` inteira para qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages, GitHub Pages).
