# Mundo Criativo · Pequenos Construtores

## Página de obrigado e ebook

A rota `/obrigado/` entrega a coleção após autorização de um pedido aprovado no Jotafy. O PDF comprimido fornecido tem 191 páginas e fica fora da pasta pública e do Git. A capa real aparece na nova página. Consulte [o guia de ativação, armazenamento privado, links individuais, redirecionamento Cakto e testes](docs/entrega-segura.md). A ativação em produção depende de configurar R2, o segredo entre Workers e a migration `006` do Jotafy. O repasse automático da identificação do comprador pela Cakto ainda precisa ser confirmado; o fluxo implementado emite links individuais pelo painel.

O carrossel mantém cada imagem em destaque por **1,5 segundo**, seguida de uma transição suave de **650 ms em órbita 3D**. As imagens mudam de escala e profundidade ao passar pela frente e por trás, desaceleram ao chegar e ficam paradas antes da próxima troca. Swipe, teclado e pausa manual continuam disponíveis.

A primeira tela destaca os 131 projetos, com preço e compra logo após o carrossel e benefícios abaixo do botão. O CTA tem um salto leve periódico. A posição de preço e botão é validada sem rolagem em 360×640, 375×667, 390×844 e 430×932. O acesso ao material ocorre após a aprovação do pagamento; o texto não promete resultados de desenvolvimento infantil.

Página de vendas mobile-first para a coleção digital de 131 projetos, com preço de R$ 14,90. Implementação estática com HTML, CSS e JavaScript, Vite, fontes locais e imagens WebP; sem bibliotecas de interface ou carrossel.

## Desenvolvimento

Requer Node.js 20.19+ ou 22.12+ (validado com Node.js 24.19.0).

```sh
cd /workspace/mundocriativo
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev
```

O servidor usa a porta 5173. Para gerar e servir a versão de produção:

```sh
npm run build
npm run preview
```

Cada tarefa na nuvem já é isolada. Use este checkout; não crie um Git worktree sem solicitação explícita.

## Configuração pública

Edite `public/site-config.js`:

- `metaPixelId`: `1309619167932261`, Pixel da Meta fornecido pelo proprietário. Deixe vazio para desativar a integração.
- `checkoutUrl`: checkout Cakto fornecido pelo proprietário, já configurado. Apenas HTTPS em `pay.cakto.com.br` é aceito. O HTML também contém o link real nos três CTAs, funcionando sem JavaScript. Com JavaScript ativo, uma configuração ausente ou inválida desativa os links e informa o suporte. Ao alterar o checkout, atualize os três hrefs do index.html e este campo para manter o fallback consistente.
- `supportEmail`: `suportecriativo130@gmail.com`, já configurado.
- `seller`: João Lucas Queiroz. Os campos de documento e endereço permanecem vazios, pois não foram fornecidos. Revise e complete as informações legais aplicáveis antes de publicar.
- `testimonials`: três relatos enviados pelo proprietário (Ana, Elisa e Janete), com nome, texto e `authorized: true`. O relato de Janete usa apenas o trecho sobre recomendação às mães do condomínio. Não são usados números de vendas ou fotos inventadas.
- `insidePreviews`: galeria opcional de páginas reais, com objetos `{ src: "/images/arquivo.webp", title: "Descrição real da página", verified: true }`. Exibe no máximo dez imagens, somente após um arquivo válido carregar. Sem material confirmado, a seção fica oculta.
- `categoryPreviews`: caminhos locais das **páginas reais** do PDF, em `/images/`. Chaves: `construcoes`, `animais`, `dragoes`, `dinossauros`, `relevos`, `moldes`, `esculturas`, `avancados`. A página carrega essas imagens sob demanda e mantém os ícones quando uma imagem falha.

Nunca coloque segredos neste arquivo: tudo que está em `public/` será entregue ao navegador.

## Materiais e pendências

As imagens de produto, criança no celular e criança construindo vieram do ZIP `moldes.zip`. Os arquivos originais foram convertidos em WebP, preservando a transparência do mockup principal e evitando duplicatas. As imagens de caixa são identificadas como mockups de um produto digital.

O PDF original excedia o limite de transferência de 32 MiB. A versão comprimida enviada posteriormente foi examinada: tem 191 páginas e foi preservada integralmente para entrega privada. A capa foi renderizada em `public/images/ebook-cover.webp` para a página de obrigado. A vitrine atual mantém seus ícones e mockups; o PDF integral fica em `private/`, ignorado pelo Git, e deve ser enviado ao R2 privado conforme o guia. Não o publique em `public/` nem no repositório.

Textos de privacidade, uso, entrega e arrependimento estão em diálogos acessíveis. Revise sua adequação à operação real e complete os dados do vendedor. Os três depoimentos publicados foram fornecidos pelo proprietário em resposta ao pedido de relatos reais com autorização. Não foram adicionadas certificações, contadores, faixas etárias, durações garantidas, alegações de projetos testados ou promessas clínicas. Documento e endereço comercial do vendedor ainda precisam ser fornecidos para completar a identificação pública.

## Validação

```sh
npm test
```

O Playwright compila e inicia o preview automaticamente na porta 4173. Usa `/usr/bin/chromium` quando disponível; em outras máquinas, instale o navegador com `npx playwright install chromium` ou indique `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Os testes cobrem seis larguras entre 360 e 1440 px, carregamento das imagens, total de projetos, destinos dos CTAs, configuração inválida, evento de clique, swipe, teclado, rotação e pausa, movimento reduzido, suporte, diálogos e CTA fixo. A análise axe verifica regras WCAG A/AA em celular e desktop; ela não substitui uma revisão manual de acessibilidade.

A navegação ao checkout é interceptada nos testes: confirma o destino fornecido sem comprar ou testar processamento de pagamentos. Uma consulta pública posterior ao checkout retornou HTTP 200 e confirmou o produto Pequenos Construtores — 131 Projetos Criativos por R$ 14,90. Nenhum pagamento foi realizado, portanto a aprovação e a entrega efetiva não foram validadas.

## Cloudflare Workers

`wrangler.jsonc` publica no Worker `mundocriativo` e executa `npm run build` antes do deploy para gerar as duas páginas, inclusive `dist/obrigado/index.html`. O tratamento de HTML mantém a rota `/obrigado/`. `_headers` fornece política de conteúdo, cabeçalhos e cache. A página de vendas permanece estática. O Worker adicional atende apenas `/api/delivery/*`; o ambiente opcional `delivery` vincula o R2 privado e o Jotafy para autorizar o ebook. Veja o guia acima antes de ativá-lo.

Validação local do pacote, sem publicar:

```sh
npm run build
WRANGLER_LOG_PATH=/tmp/mundinho-wrangler.log WRANGLER_SEND_METRICS=false npx wrangler deploy --dry-run --outdir /tmp/mundinho-worker-dry-run
```

Para executar o simulador local com os cabeçalhos finais nesta máquina:

```sh
WRANGLER_LOG_PATH=/tmp/mundinho-wrangler.log WRANGLER_REGISTRY_PATH=/tmp/mundinho-wrangler-registry WRANGLER_SEND_METRICS=false npx wrangler dev --local --ip 127.0.0.1 --port 8787
```

Os caminhos de log e registro usam `/tmp` porque a pasta pessoal desta máquina não é gravável. O simulador pode avisar que não conseguiu obter os metadados opcionais de `Request.cf`; esta página estática não depende deles. A validação local retornou HTTP 200, aplicou os cabeçalhos e carregou a página e as imagens sem erros de JavaScript. Na validação do Pixel, as requisições da Meta são interceptadas para evitar registros de teste na conta de anúncios.

Para publicar, em uma sessão autenticada com a conta Cloudflare do responsável:

```sh
npm run deploy
```

Nenhuma publicação, compra, envio de e-mail ou push para o GitHub é feito pelos testes ou pelo setup. O código-fonte está preparado para versionamento no repositório `joaolucasqueiros/mundocriativo`.

## Rastreamento

O Pixel da Meta `1309619167932261` está configurado em `public/site-config.js`. O arquivo local `public/meta-pixel.js` carrega o SDK oficial de forma assíncrona, reutiliza um `fbq` existente e impede inicialização, PageView e ouvintes duplicados na mesma página. Os cabeçalhos liberam os destinos necessários da Meta; a política de privacidade informa seu uso.

- `PageView`: uma vez por carregamento da página, automaticamente quando a medição não foi desativada.
- `InitiateCheckout`: uma vez por clique em um CTA válido, reutilizando o evento `mundinho:checkout` e seu identificador `eventID`. Valor: 14.90; moeda: BRL.
- `Purchase`: não é disparado pela página de vendas. A confirmação de pagamento deve ser configurada na Cakto.

Os eventos usam `trackSingle` para direcionar o rastreamento ao pixel informado, sem acionar outros pixels eventualmente presentes. Não há envio de nome ou e-mail nem integração de correspondência avançada. Os testes interceptam o SDK da Meta para não registrar visitas ou cliques de teste; validam a fila de comandos e a ausência de duplicação, sem confirmar recebimento no Gerenciador de Eventos da Meta.


## Integração Jotafy

A chave pública fornecida está em `public/site-config.js`. `public/jotafy-tracking.js` envia diretamente ao contrato `/api/tracking` do Jotafy (sem depender do carregamento remoto de `pixel.js`). Meta e Jotafy iniciam automaticamente, sem aviso na abertura. Preferências de rastreamento no rodapé permite desativar ou reativar a medição. Uma recusa anterior é preservada, assim como os sinais Global Privacy Control e Do Not Track. Desativar mantém a compra disponível, interrompe novos eventos e remove a atribuição local, sem apagar eventos já enviados. O modo automático é identificado como `collectionMode: "automatic"`, sem afirmar consentimento explícito.

PageView e InitiateCheckout compartilham `eventID` entre o Pixel Meta e o envio ao Jotafy. A deduplicação na Meta depende também de o CAPI do Jotafy usar o mesmo Dataset/Pixel e nome de evento. O navegador nunca cria uma venda ou envia Purchase. UTMs e `mt_click` são acrescentados ao checkout quando a medição está ativa. A retenção da atribuição local é de até 90 dias; a URL enviada ao coletor não inclui query string nem fragmento.

**Configuração externa necessária:** no Jotafy → Integrações, autorize a origem exata `https://mundocriativo.joaolucasqueirozag.workers.dev`. Configure o webhook exibido pelo Jotafy na Cakto, com o segredo compartilhado guardado somente nos servidores. Confirme status HTTP e resposta das entregas, incluindo reenvio de aprovações antigas que não chegaram. A preservação de UTMs/mt_click pela Cakto precisa ser confirmada com um pedido real. Sem IDs de campanha/anúncio nas UTMs ou no webhook, vendas podem aparecer sem atribuição e ser excluídas por filtros de campanha.

Os testes interceptam as chamadas ao Jotafy e à Meta para não gerar eventos falsos. Eles validam coleta automática, preferências, sinais de privacidade, IDs, transporte e destino dos links; não confirmam recepção em produção, configuração CAPI, aprovação ou entrega de pedidos. A origem workers.dev do painel retornou 403 no proxy deste ambiente.

Publique primeiro o Jotafy com suporte a `collectionMode: "automatic"` e depois esta página. Em Rastreamento → Eventos recebidos da página, confira PageView, seu eventID, horário, URL e estado de entrega à Meta. A verificação integrada local confirmou o script real com API e banco de QA; o SDK Meta foi interceptado para evitar eventos falsos em produção.
