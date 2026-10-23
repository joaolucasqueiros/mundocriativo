# Mundo Criativo · Pequenos Construtores

Página de vendas estática, mobile-first. Arquivos publicados em `public/`: `index.html`, `styles.css`, `app.js`, `config.js`, `testimonials.json`, `tracking.js` e `assets/`. Não usa framework, compilador ou CDN de fontes. Os arquivos da versão anterior foram removidos; a fonte atual está em `public/`.

## Publicar em 5 linhas
1. Conecte `joaolucasqueiros/mundocriativo`, branch `main`, diretório raiz `/` ao Worker `mundocriativo`.
2. Comando de build: `npm run build` (apenas valida os arquivos estáticos).
3. Comando de implantação: `npm run deploy`; Wrangler publica diretamente `public/`.
4. Em Cloudflare Pages, publique a pasta `public`, sem comando de build.
5. Confira o commit publicado, abra `/` e `/obrigado/` e teste o checkout e o PDF.

Local: `npm run dev`, porta 5173. `npm test` verifica navegação, rastreamento, privacidade, acessibilidade e download. `npm run test:delivery` verifica as rotas privadas legadas, independentes da entrega pública atual.

## Configuração e pendências do proprietário
- `public/config.js` concentra preço, quantidade de projetos, páginas, categorias/contagens, checkout, e-mail, vendedor, idade, garantias e Pixel. Mantenha as quantidades coerentes com o PDF. A faixa de idade ficou `null` porque não foi validada; a página exibe orientação de supervisão.
- `assemblyGuarantee: false`: a garantia de correção/reembolso de molde fica oculta. Ative apenas se for oferecer esse atendimento. O prazo de suporte de 24h e o reembolso de 7 dias seguem a solicitação do proprietário e precisam ser cumpridos operacionalmente.
- Envie um vídeo real de montagem com poster e legendas `.vtt` em português. Cadastre `assemblyVideo: {src, poster, captions}` em `/assets/`. A seção permanece oculta enquanto faltar algum arquivo. O vídeo existente é o GIF enviado convertido em MP4, explicitamente identificado como prévia das páginas, sem áudio; não é um vídeo de montagem.
- `public/testimonials.json`: só `consentConfirmed: true` é renderizado. Prints enviados e autorizados pelo proprietário nesta conversa; relatos anteriores de Ana, Elisa e Janete já autorizados. Cidades e o nome do terceiro print não foram informados e são omitidos; não invente dados. Acrescente-os somente com confirmação. Substitua/remova qualquer imagem ou relato se a autorização mudar.
- A foto do hero é um recorte sem alteração da região de fotos do print autorizado de Carla. Os prints completos estão em `/assets/relato-*.webp`. As prévias das categorias são renderizações das páginas reais do PDF enviado. Os relatos são experiências individuais, sem promessa de resultados.
- Confira no Gerenciador de Eventos a entrega real do Pixel e a integração de Purchase da Cakto. Os testes locais interceptam Meta e Jotafy e não geram vendas. O evento Purchase nunca parte desta página. Scroll50 e Scroll90 são eventos personalizados exclusivos da Meta; eventos padrão são enviados também ao Jotafy, compartilhando eventID.
- Não há dados legais de documento/endereço fornecidos. Se aplicáveis, acrescente os dados corretos aos termos após confirmação. Contato publicado: nome e e-mail informados pelo proprietário.
- Lighthouse mobile: a meta 90+/LCP <2,5 s/CLS <0,1 deve ser medida também na URL final com a infraestrutura real. Não é garantia de nota em todos os dispositivos/redes. O vídeo só baixa quando solicitado; imagens abaixo da dobra usam lazy loading e fontes locais usam swap.

## Rastreamento e checkout
O visitante escolhe aceitar ou recusar a medição. Preferência persistente, GPC e DNT são respeitados; o rodapé reabre o controle. Nenhum evento de medição é enviado antes da aceitação. UTMs e fbclid da URL atual são anexados aos CTAs, inclusive quando a medição é recusada, conforme solicitado. A atribuição adicional `mt_click` só é anexada com permissão. Não há compra fictícia, contador, estoque limitado ou urgência fabricada.

## Entrega do ebook
A página `/obrigado/` e o PDF público permanecem disponíveis; o botão registra `EbookBaixado` no Pixel conforme as preferências de rastreamento. Veja [entrega pública](docs/entrega-publica.md). O script antigo dessa página conserva compatibilidade com `config.js`. As rotas privadas legadas não são usadas pela entrega pública.

## Validação desta entrega
- 12 testes de navegador: desktop e 390 px, contraste/semântica com axe, links/UTMs, preferências de rastreamento, GPC, eventos compartilhados, rolagem, configuração, relatos autorizados, FAQ/teclado, modal e download com integridade SHA-256.
- Lighthouse 13.5, perfil mobile padrão, Chromium local, servidor estático e sem aceite inicial de rastreamento: desempenho 97, acessibilidade 100, boas práticas 100, SEO 100; LCP 2,481 s; CLS 0,03; TBT 0 ms. Resultado de laboratório, não medição da URL de produção ou garantia com scripts de terceiros ativos.
- Wrangler `deploy --dry-run` validou a configuração. Não houve acesso de implantação à conta Cloudflare nesta sessão.
