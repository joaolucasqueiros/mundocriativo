# Mundo Criativo · página de vendas

Página estática em `public/`, sem framework ou compilação. Fundo branco, títulos arredondados em destaque, elementos coloridos e animação automática. A página reúne oferta, depoimentos, como funciona, categorias com páginas reais, galeria, garantia e FAQ. Seções e textos repetidos foram removidos para reduzir a rolagem.

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
- `public/assets/colecao-folheando.mp4`: mesmos 203 quadros do GIF enviado, mesma resolução (200 × 356) e duração (16,24 s), sem áudio. Loop automático, sem controles. Arquivo de 424.479 bytes em vez dos 4.127.078 bytes do GIF (cerca de 90% menor). Poster pré-carregado; o GIF original é usado como alternativa se o navegador bloquear a reprodução ou não suportar o vídeo.
- `public/tracking.js`: medição automática por Meta e Jotafy, sem aviso na entrada. O rodapé permite desativar ou ativar. Recusas anteriores, GPC e DNT são respeitados. O Jotafy recebe `collectionMode: automatic` sem consentimento fictício; `consent: true` só é enviado quando a pessoa ativa expressamente nas preferências. Preserva UTMs e fbclid nos CTAs. PageView, ViewContent e InitiateCheckout; Scroll50 e Scroll90 como eventos personalizados Meta. Purchase vem da integração Cakto.

## Decisões desta revisão
- Fundo branco, elementos em roxo, rosa, amarelo e verde. Fontes normais, sem itálico. Títulos, preço e CTA recebem o maior destaque.
- Sombras suaves, reflexo no botão e movimentos discretos em detalhes decorativos. Esses efeitos respeitam redução de movimento; o GIF original continua automático, conforme solicitado.
- Comparação de rotina, níveis e relatos de texto adicionais foram retirados desta versão para evitar repetição. As oito categorias e as quatro prévias adicionais do PDF continuam disponíveis.
- Depoimentos em coluna no celular, com prints completos e trechos reais em fonte de 21px fora da imagem, mais botão de ampliação em 16px. Desktop usa três colunas.
- O botão principal permanece na primeira tela de celular. Os blocos repetitivos continuam removidos; a área de relatos foi ampliada para priorizar legibilidade.
- Pagamento, garantia e compra segura mantêm no mínimo 14px e cor escura. Produto digital, vendedor, termos, privacidade e contato continuam acessíveis.
- Checkout, UTMs, Pixel e entrega do ebook foram preservados. Nenhuma venda fictícia é disparada pela página.
- Lighthouse mobile local (Chrome, servidor estático): 74 antes; 94 após a otimização. LCP local caiu de 24,9 s para 3,0 s. O relatório online fornecido pelo proprietário não pôde ser acessado devido ao bloqueio de rede deste ambiente. São medições de laboratório; confirmar na URL pública com Meta e Jotafy funcionando em produção.

## Pendências do proprietário
- Manter preço e contagens em `config.js` coerentes com o produto; se mudarem, substituir também o GIF que contém texto gravado na mídia.
- Manter as autorizações dos relatos e retirar qualquer arquivo se uma autorização for revogada.
- Conferir o commit atual em Cloudflare e a entrega real dos eventos na Meta/Cakto; testes locais não enviam vendas.
- Caso necessários, fornecer os dados legais completos para os termos. Nome e e-mail publicados são os informados pelo proprietário.

Local: `npm run dev` (porta 5173). Testes: `npm test` (17 testes passaram, incluindo modal de conversa, galeria, contraste AA, configuração, checkout/UTMs, privacidade, eventos e download). A entrega pública do ebook está descrita em [docs/entrega-publica.md](docs/entrega-publica.md).
