# Mundo Criativo · Pequenos Construtores

O carrossel mantém cada imagem em destaque por **1,5 segundo**, seguida de uma transição suave de **650 ms em órbita 3D**. As imagens mudam de escala e profundidade ao passar pela frente e por trás, desaceleram ao chegar e ficam paradas antes da próxima troca. Swipe, teclado e pausa manual continuam disponíveis.

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
- `checkoutUrl`: checkout Cakto fornecido pelo proprietário, já configurado. Apenas HTTPS em `pay.cakto.com.br` é aceito. Uma configuração ausente ou inválida deixa as compras desativadas.
- `supportEmail`: `suportecriativo130@gmail.com`, já configurado.
- `seller`: João Lucas Queiroz. Os campos de documento e endereço permanecem vazios, pois não foram fornecidos. Revise e complete as informações legais aplicáveis antes de publicar.
- `categoryPreviews`: caminhos locais das **páginas reais** do PDF, em `/images/`. Chaves: `construcoes`, `animais`, `dragoes`, `dinossauros`, `relevos`, `moldes`, `esculturas`, `avancados`. A página carrega essas imagens sob demanda e mantém os ícones quando uma imagem falha.

Nunca coloque segredos neste arquivo: tudo que está em `public/` será entregue ao navegador.

## Materiais e pendências

As imagens de produto, criança no celular e criança construindo vieram do ZIP `moldes.zip`. Os arquivos originais foram convertidos em WebP, preservando a transparência do mockup principal e evitando duplicatas. As imagens de caixa são identificadas como mockups de um produto digital.

O PDF `Pequenos_Construtores_Coletanea_Completa_131_Modelos.pdf` excede o limite de transferência de 32 MiB da ferramenta disponível. Seu conteúdo não foi examinado, e nenhuma página interna foi inventada. As oito categorias e quantidades seguem o pedido fornecido. Até receber prévias reais, a vitrine exibe ícones simbólicos e informa a ausência das prévias. Para completá-la, exporte oito imagens das páginas reais e cadastre seus caminhos em `categoryPreviews`; não publique o PDF integral em `public/`, pois isso disponibilizaria o produto gratuitamente.

Textos de privacidade, uso, entrega e arrependimento estão em diálogos acessíveis. Revise sua adequação à operação real e complete os dados do vendedor. Nenhum depoimento, certificação, contador ou promessa clínica foi adicionado.

## Validação

```sh
npm test
```

O Playwright compila e inicia o preview automaticamente na porta 4173. Usa `/usr/bin/chromium` quando disponível; em outras máquinas, instale o navegador com `npx playwright install chromium` ou indique `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Os testes cobrem seis larguras entre 360 e 1440 px, carregamento das imagens, total de projetos, destinos dos CTAs, configuração inválida, evento de clique, swipe, teclado, rotação e pausa, movimento reduzido, suporte, diálogos e CTA fixo. A análise axe verifica regras WCAG A/AA em celular e desktop; ela não substitui uma revisão manual de acessibilidade.

A navegação ao checkout é interceptada nos testes: confirma o destino fornecido sem comprar ou testar processamento de pagamentos. O acesso direto à Cakto a partir desta máquina foi bloqueado pela política de rede do ambiente.

## Cloudflare Workers

`wrangler.jsonc` configura Workers Static Assets sobre `dist/`. `_headers` fornece política de conteúdo, cabeçalhos e cache. O site não requer banco de dados, serviços auxiliares ou credenciais em tempo de execução.

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

- `PageView`: uma vez por carregamento da página.
- `InitiateCheckout`: uma vez por clique em um CTA válido, reutilizando o evento `mundinho:checkout` e seu identificador `eventID`. Valor: 14.90; moeda: BRL.
- `Purchase`: não é disparado pela página de vendas. A confirmação de pagamento deve ser configurada na Cakto.

Os eventos usam `trackSingle` para direcionar o rastreamento ao pixel informado, sem acionar outros pixels eventualmente presentes. Não há envio de nome ou e-mail nem integração de correspondência avançada. Os testes interceptam o SDK da Meta para não registrar visitas ou cliques de teste; validam a fila de comandos e a ausência de duplicação, sem confirmar recebimento no Gerenciador de Eventos da Meta.
