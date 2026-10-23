# Mundo Criativo · página de vendas

Página estática em `public/`, sem framework ou compilação. Fundo branco, títulos arredondados em destaque, elementos coloridos e GIF automático. A página reúne oferta, depoimentos, como funciona, categorias com páginas reais, galeria, garantia e FAQ. Seções e textos repetidos foram removidos para reduzir a rolagem.

## Publicar em 5 linhas
1. Conecte `joaolucasqueiros/mundocriativo`, branch `main`, diretório raiz `/`, ao Worker `mundocriativo`.
2. Build: `npm run build` (confere arquivos, não compila).
3. Implantação: `npm run deploy`; Wrangler publica `public/`.
4. Em Cloudflare Pages, use `public` como pasta publicada, sem build.
5. Confira o commit publicado; teste `/`, os botões de compra e `/obrigado/`.

## Arquivos
- `public/index.html`, `styles.css`, `app.js`: layout, valores dinâmicos e interações.
- `public/config.js`: preço, quantidades, checkout, vendedor, contato e Pixel. Categorias e contagens alimentam a grade de conteúdo. Faixa de idade e vídeo real de montagem não são exibidos porque não foram validados/enviados.
- `public/testimonials.json`: só prints com `consentConfirmed: true` e imagem fornecida são exibidos nesta versão. Os relatos textuais antigos permanecem no arquivo, mas não aparecem nesta página compacta. Prints enviados e autorizados pelo proprietário. Não foram inventados nomes, cidades ou depoimentos.
- `public/assets/colecao-folheando.gif`: GIF original enviado, 203 quadros, loop infinito. A animação toca automaticamente em loop contínuo, sem controle de pausa, conforme a solicitação do proprietário. Nenhuma foto substitui o GIF no hero.
- `public/tracking.js`: consentimento, Meta e Jotafy. Preserva UTMs e fbclid nos CTAs. PageView, ViewContent e InitiateCheckout; Scroll50 e Scroll90 como eventos personalizados Meta. Purchase vem da integração Cakto.

## Decisões desta revisão
- Fundo branco, elementos em roxo, rosa, amarelo e verde. Fontes normais, sem itálico. Títulos, preço e CTA recebem o maior destaque.
- Sombras suaves, reflexo no botão e movimentos discretos em detalhes decorativos. Esses efeitos respeitam redução de movimento; o GIF original continua automático, conforme solicitado.
- Comparação de rotina, níveis e relatos de texto adicionais foram retirados desta versão para evitar repetição. As oito categorias e as quatro prévias adicionais do PDF continuam disponíveis.
- Depoimentos em carrossel manual no celular, com botões de navegação e ampliação dos prints. Desktop usa três colunas.
- Medição local em 390 × 844: altura da página passou de 11.234 para 5.909 px (47% menor). O botão principal aparece na primeira tela. A altura varia com configuração, fontes e aparelho.
- Pagamento, garantia e compra segura mantêm no mínimo 14px e cor escura. Produto digital, vendedor, termos, privacidade e contato continuam acessíveis.
- Checkout, UTMs, Pixel e entrega do ebook foram preservados. Nenhuma venda fictícia é disparada pela página.
- O GIF original pesa cerca de 4 MB. Medir desempenho também na URL final antes de anunciar nota Lighthouse.

## Pendências do proprietário
- Manter preço e contagens em `config.js` coerentes com o produto; se mudarem, substituir também o GIF que contém texto gravado na mídia.
- Manter as autorizações dos relatos e retirar qualquer arquivo se uma autorização for revogada.
- Conferir o commit atual em Cloudflare e a entrega real dos eventos na Meta/Cakto; testes locais não enviam vendas.
- Caso necessários, fornecer os dados legais completos para os termos. Nome e e-mail publicados são os informados pelo proprietário.

Local: `npm run dev` (porta 5173). Testes: `npm test` (15 testes passaram, incluindo modal de conversa, galeria, contraste AA, configuração, checkout/UTMs, privacidade, eventos e download). A entrega pública do ebook está descrita em [docs/entrega-publica.md](docs/entrega-publica.md).
