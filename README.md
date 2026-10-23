# Mundo Criativo · página de vendas

Página estática em `public/`, sem framework ou compilação. A composição segue a referência do proprietário: painel estreito, chamada direta, GIF original do PDF em loop, preço, compra e relatos completos empilhados. Desktop mantém a composição central, sem transformar o hero em duas colunas.

## Publicar em 5 linhas
1. Conecte `joaolucasqueiros/mundocriativo`, branch `main`, diretório raiz `/`, ao Worker `mundocriativo`.
2. Build: `npm run build` (confere arquivos, não compila).
3. Implantação: `npm run deploy`; Wrangler publica `public/`.
4. Em Cloudflare Pages, use `public` como pasta publicada, sem build.
5. Confira o commit publicado; teste `/`, os botões de compra e `/obrigado/`.

## Arquivos
- `public/index.html`, `styles.css`, `app.js`: layout, valores dinâmicos e interações.
- `public/config.js`: preço, quantidades, checkout, vendedor, contato e Pixel. As opções de categorias, idade e vídeo estão preservadas para eventual uso futuro, mas não aparecem nesta página.
- `public/testimonials.json`: só conversas com `consentConfirmed: true` e imagem fornecida são exibidas. Prints enviados e autorizados pelo proprietário. Não foram inventados nomes, cidades ou depoimentos.
- `public/assets/colecao-folheando.gif`: GIF original enviado, 203 quadros, loop infinito. A animação pode ser pausada e respeita redução de movimento. Nenhuma foto substitui o GIF no hero.
- `public/tracking.js`: consentimento, Meta e Jotafy. Preserva UTMs e fbclid nos CTAs. PageView, ViewContent e InitiateCheckout; Scroll50 e Scroll90 como eventos personalizados Meta. Purchase vem da integração Cakto.

## Decisões desta revisão
- Removidos os blocos de requisitos, materiais, níveis, categorias, comparações e perguntas técnicas.
- Preço, pagamento único, ausência de mensalidade, compra segura e garantia em fonte de pelo menos 14px, com cor escura e contraste AA.
- Relatos completos, sem cortes, cartões de citação ou carrossel lateral.
- Mantidos checkout, rastreamento, informações de produto digital, termos, privacidade e suporte. Página de obrigado e download não foram alterados.
- A página anterior e suas métricas Lighthouse não descrevem este layout. O GIF original pesa cerca de 4 MB; medir também na URL final antes de anunciar um resultado de desempenho.

## Pendências do proprietário
- Manter preço e contagens em `config.js` coerentes com o produto; se mudarem, substituir também o GIF que contém texto gravado na mídia.
- Manter as autorizações dos relatos e retirar qualquer arquivo se uma autorização for revogada.
- Conferir o commit atual em Cloudflare e a entrega real dos eventos na Meta/Cakto; testes locais não enviam vendas.
- Caso necessários, fornecer os dados legais completos para os termos. Nome e e-mail publicados são os informados pelo proprietário.

Local: `npm run dev` (porta 5173). Testes: `npm test`. A entrega pública do ebook está descrita em [docs/entrega-publica.md](docs/entrega-publica.md).
