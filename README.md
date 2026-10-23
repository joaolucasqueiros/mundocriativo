# Mundo Criativo · página de vendas

Página estática em `public/`, sem framework ou compilação. A composição segue a referência do proprietário: hero central com GIF original em loop, páginas do PDF em uma composição de papéis, tipografia de catálogo impresso e preço/compra visíveis no celular. Abaixo, seções completas com categorias, galeria, depoimentos organizados, oferta, garantia e FAQ. Desktop mantém o hero central e amplia as grades de conteúdo.

## Publicar em 5 linhas
1. Conecte `joaolucasqueiros/mundocriativo`, branch `main`, diretório raiz `/`, ao Worker `mundocriativo`.
2. Build: `npm run build` (confere arquivos, não compila).
3. Implantação: `npm run deploy`; Wrangler publica `public/`.
4. Em Cloudflare Pages, use `public` como pasta publicada, sem build.
5. Confira o commit publicado; teste `/`, os botões de compra e `/obrigado/`.

## Arquivos
- `public/index.html`, `styles.css`, `app.js`: layout, valores dinâmicos e interações.
- `public/config.js`: preço, quantidades, checkout, vendedor, contato e Pixel. Categorias e contagens alimentam a grade de conteúdo. Faixa de idade e vídeo real de montagem não são exibidos porque não foram validados/enviados.
- `public/testimonials.json`: só itens com `consentConfirmed: true` são exibidos. Conversas usam as imagens fornecidas; os relatos adicionais usam o texto autorizado. Prints enviados e autorizados pelo proprietário. Não foram inventados nomes, cidades ou depoimentos.
- `public/assets/colecao-folheando.gif`: GIF original enviado, 203 quadros, loop infinito. A animação toca automaticamente em loop contínuo, sem controle de pausa, conforme a solicitação do proprietário. Nenhuma foto substitui o GIF no hero.
- `public/tracking.js`: consentimento, Meta e Jotafy. Preserva UTMs e fbclid nos CTAs. PageView, ViewContent e InitiateCheckout; Scroll50 e Scroll90 como eventos personalizados Meta. Purchase vem da integração Cakto.

## Decisões desta revisão
- Restauradas as seções de comparação, como funciona, oito categorias, galeria de páginas, tipos de projeto, relatos adicionais, oferta, garantias e FAQ. Os blocos de requisitos e materiais continuam fora da página.
- Identidade de catálogo de oficina: papel marfim, tinta azul, carimbo amarelo, divisórias, fotos/prints sem cortes e oferta em folha destacada. Foram reduzidos os cartões arredondados e as frases genéricas.
- Preço, pagamento único, ausência de mensalidade, compra segura e garantia em fonte de pelo menos 14px, com cor escura e contraste AA.
- Depoimentos com título claro, nome quando fornecido, prévia do print e trecho real em destaque. Os três recortes atualizados mostram fotos e mensagens no formato 853 × 682, sem cabeçalho ou respostas do vendedor. Botões ampliam o relato em um modal; Escape fecha e devolve o foco. Desktop usa três colunas; celular empilha os cartões.
- Mantidos checkout, rastreamento, informações de produto digital, termos, privacidade e suporte. Página de obrigado e download não foram alterados.
- A página anterior e suas métricas Lighthouse não descrevem este layout. O GIF original pesa cerca de 4 MB; medir também na URL final antes de anunciar um resultado de desempenho.

## Pendências do proprietário
- Manter preço e contagens em `config.js` coerentes com o produto; se mudarem, substituir também o GIF que contém texto gravado na mídia.
- Manter as autorizações dos relatos e retirar qualquer arquivo se uma autorização for revogada.
- Conferir o commit atual em Cloudflare e a entrega real dos eventos na Meta/Cakto; testes locais não enviam vendas.
- Caso necessários, fornecer os dados legais completos para os termos. Nome e e-mail publicados são os informados pelo proprietário.

Local: `npm run dev` (porta 5173). Testes: `npm test` (14 testes passaram, incluindo modal de conversa, galeria, contraste AA, configuração, checkout/UTMs, privacidade, eventos e download). A entrega pública do ebook está descrita em [docs/entrega-publica.md](docs/entrega-publica.md).
