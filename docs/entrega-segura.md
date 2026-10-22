# Página de obrigado e entrega do ebook

A página fica em `https://mundocriativo.joaolucasqueirozag.workers.dev/obrigado/`. Ela reutiliza fontes, cores, logotipo e estilos do Mundo Criativo. A capa é a primeira página real do PDF fornecido. O botão entrega o PDF completo, sem aula, módulo, cadastro ou oferta adicional.

## Estado da entrega

O fluxo de **link individual de um pedido aprovado → autorização → download** foi implementado e validado localmente com o ebook completo. Para operar em produção, é necessário aplicar a migration no Jotafy, configurar um segredo compartilhado somente nos servidores, criar o R2 privado e fazer o upload do arquivo.

**O redirecionamento automático com identificação do comprador na Cakto ainda depende de confirmar o mecanismo suportado pela plataforma.** Não conhecemos um token assinado ou parâmetro de retorno comprovado para este checkout. Não foi inventado um parâmetro de URL para aprovar compras. A alternativa implementada é gerar o link individual no Jotafy para um pedido já aprovado e entregá-lo ao comprador pelo canal de atendimento/entrega existente. O código não envia e-mails ou mensagens automaticamente.

O acesso à URL base, um ID de pedido, uma UTM ou `paid=true` não libera o arquivo. Se você cadastrar apenas a URL base como redirecionamento, o comprador ainda precisará abrir seu link individual para obter a autorização. Não trate essa configuração isolada como entrega automática concluída.

## Arquivo fornecido

| Item                       | Valor                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| Original                   | `Pequenos_Construtores_Coletanea_Completa_131_Modelos_compressed.pdf` |
| Conteúdo                   | Um PDF com 191 páginas e a coleção de 131 projetos                    |
| Tamanho                    | 14.131.954 bytes, aproximadamente 13,5 MiB                            |
| SHA-256                    | `ea78d7d502c6aefc4af0e032a62398b501fac7865caf55e9d0392024c513ed4e`    |
| Cópia local neste ambiente | `private/pequenos-construtores-131-projetos.pdf`                      |
| Bucket R2                  | `mundo-criativo-materiais`                                            |
| Objeto R2                  | `pequenos-construtores/colecao-131.pdf`                               |

O PDF é único, portanto não é necessário criar um ZIP. A cópia local está ignorada pelo Git e fora de `public/` e `dist/`. Não coloque o PDF integral no GitHub nem habilite acesso público, domínio público ou `r2.dev` para esse bucket. `public/images/ebook-cover.webp` é somente a capa, não o ebook.

## 1. Preparar o Jotafy

Use a conexão de produção já existente no ambiente seguro do Jotafy. Não substitua a `ENCRYPTION_KEY` original. Execute uma vez, a partir do repositório `jotafy`:

```sh
npm run db:migrate
```

A migration `006_delivery_access.sql` adiciona apenas a tabela de acessos. O fluxo existente de webhooks continua autenticando o segredo da Cakto, validando o pagamento e registrando os pedidos de forma idempotente. A entrega consulta esses pedidos; não confia na página de obrigado nem cria novas vendas.

Configure `DELIVERY_SERVICE_SECRET` como um segredo hexadecimal aleatório de 64 caracteres. O mesmo valor deve estar nos dois Workers, Jotafy e Mundo Criativo. Não é o token da Meta nem o segredo da Cakto. Não é necessário cadastrar essa variável no Render.

No PowerShell, este comando gera o valor e o copia para a área de transferência, sem exibi-lo:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$deliverySecret = ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
$deliverySecret | Set-Clipboard
```

No Worker `jotafy`, cadastre o valor como **Secret** em Settings → Variables and Secrets, ou use o prompt interativo a partir do repositório Jotafy:

```sh
npx wrangler secret put DELIVERY_SERVICE_SECRET
```

Opcionais no Jotafy, com padrões já configurados para esta operação:

| Variável                        | Padrão / finalidade                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DELIVERY_WORKSPACE_PUBLIC_KEY` | Chave pública do workspace Mundo Criativo já usada no site; restringe a entrega a esse workspace            |
| `DELIVERY_PRODUCT_NAME`         | `Pequenos Construtores — 131 Projetos Criativos`; precisa corresponder exatamente ao nome gravado no pedido |
| `MUNDO_CRIATIVO_ORIGIN`         | `https://mundocriativo.joaolucasqueirozag.workers.dev`; origem HTTPS usada nos links individuais            |

Publique o Jotafy com as rotas de entrega depois da migration. Somente o painel autenticado do vendedor consegue emitir links; a rota interna entre Workers exige o segredo do serviço.

## 2. Armazenar o material no R2 privado

Na conta Cloudflare que já hospeda os dois Workers, crie um bucket R2 privado chamado `mundo-criativo-materiais`. A ativação do R2 na conta pode exigir uma etapa de cadastro/faturamento da própria Cloudflare; confira o plano antes de aceitar condições. O código não contrata recursos pagos automaticamente.

Pelo Wrangler autenticado, a criação é:

```sh
npx wrangler r2 bucket create mundo-criativo-materiais
```

A partir do repositório Mundo Criativo, confira e envie o arquivo:

```sh
node scripts/upload-material.mjs private/pequenos-construtores-131-projetos.pdf --verify-only
node scripts/upload-material.mjs private/pequenos-construtores-131-projetos.pdf
```

Em outra máquina, passe o caminho do PDF original comprimido. O script recusa um arquivo com SHA-256 diferente e usa autenticação local do Wrangler. Não há credenciais embutidas no script. No dashboard, a alternativa é fazer upload no bucket usando exatamente a chave `pequenos-construtores/colecao-131.pdf`, com tipo `application/pdf`.

## 3. Ativar o Worker de entrega

O Worker padrão e o ambiente `delivery` usam o nome `mundocriativo`, correspondente ao endereço público. O Wrangler executa o build Vite automaticamente antes de publicar; o resultado deve incluir `dist/obrigado/index.html`. A página de obrigado deve abrir mesmo antes de ativar o R2, mantendo o download bloqueado. Um HTTP 404 indica que a página não está no deploy ativo, e não uma recusa de autorização.

Em Workers Builds, selecione o repositório `joaolucasqueiros/mundocriativo`, branch `main`, raiz do repositório e comando de deploy `npm run deploy` (ou `npm run deploy:delivery` depois de preparar o R2). Reexecute o deploy do último commit e confira se ele terminou com sucesso no Worker `mundocriativo`. Não é necessário mudar o checkout Cakto para publicar a página.

O ambiente `delivery` de `wrangler.jsonc` aponta para o Worker existente `mundocriativo`, recebe os assets em `ASSETS`, acessa o Worker `jotafy` pelo binding `JOTAFY` e o R2 pelo binding `MATERIAL`.

Depois de preparar o R2, use o prompt para cadastrar o mesmo segredo no Worker da loja e publique a configuração completa:

```sh
npx wrangler secret put DELIVERY_SERVICE_SECRET --env delivery
npm run deploy:delivery
```

O comando de deploy da integração Git/Cloudflare da loja deve continuar usando `--env delivery` nos próximos deploys. Sem esse ambiente, o deploy padrão não exige o novo bucket e a entrega permanece indisponível. Isso permite revisar/configurar os recursos antes da ativação, sem tornar o PDF público.

Não ative o bucket público para contornar uma falha de configuração. A aplicação verifica a existência do objeto antes de habilitar o botão e retorna mensagens amigáveis se um serviço estiver indisponível.

## 4. Entregar o link individual

No Jotafy, abra **Vendas → detalhes do pedido Pequenos Construtores aprovado → Gerar link do material**. Copie o link no campo exibido e entregue somente ao comprador.

O link tem o formato `/obrigado/#acesso=...`; o fragmento não é enviado no endereço da requisição HTTP nem no referrer. Ele vale 24 horas e pode ser trocado por autorização uma única vez. O backend confere workspace, produto, autenticação do serviço e situação real do pedido. Após a troca, o fragmento é removido e um cookie `HttpOnly`, `Secure`, `SameSite=Lax` mantém o acesso naquele navegador por 30 dias. A validação de desenvolvimento em loopback usa uma variante local sem `Secure`; produção exige o cookie protegido.

O botão solicita um ticket assinado que vale 60 segundos, vinculado ao cookie. Antes de cada download, a autorização consulta novamente a situação do pedido. Reembolso ou chargeback bloqueiam novos downloads, inclusive com um ticket emitido antes da mudança. Um arquivo já baixado no dispositivo não pode ser revogado remotamente.

Antes da troca do link, a página estabelece um cookie aleatório de identificação do navegador, que sozinho não autoriza nada. A troca é idempotente para esse mesmo cookie: se a resposta se perder depois de o backend aprovar, uma nova tentativa recupera a autorização sem consumir outro link. Um navegador com outro cookie continua impedido de reutilizar o link já trocado.

Para outro aparelho, link expirado ou navegador sem o cookie, gere outro link individual no mesmo pedido aprovado. Recarregar a página ou baixar de novo não cria pedidos, receitas nem eventos `Purchase`.

## 5. URL de redirecionamento da Cakto

A URL base preparada para a configuração de página de obrigado/redirecionamento externo do produto é:

```text
https://mundocriativo.joaolucasqueirozag.workers.dev/obrigado/
```

Na edição do produto Cakto, localize o campo de página de obrigado após aprovação. Antes de usar o redirecionamento como única entrega, confirme com a plataforma como um token de acesso autenticado e individual pode ser entregue ao comprador. O campo exato e a substituição dinâmica de valores não foram verificados neste ambiente: o acesso às páginas oficiais foi bloqueado pelo proxy. Não cadastre um mesmo link individual fixo para todos os compradores; ele é de uso único e pertence a um pedido.

O webhook já existente no Jotafy deve continuar recebendo aprovação, reembolso e chargeback. O segredo nativo é autenticado no corpo JSON, conforme o contrato V1 já implementado. Fonte do contrato existente: `https://docs.cakto.com.br/conceitos/webhooks`. A página não consulta a Cakto com credenciais no navegador.

## Eventos e diagnóstico

Eventos operacionais: `thank_you_page_view`, `purchase_access_verified`, `download_started`, `download_completed`, `download_failed`. Os registros do Worker não contêm tokens, cookies, e-mails ou IDs de pedidos. Quando há uma sessão aprovada, os eventos também são registrados no `audit_log` do Jotafy. Visitas anônimas ficam apenas nos logs operacionais do Worker. Consultas indisponíveis no registro de auditoria não impedem o download.

`download_completed` significa que os bytes do PDF foram recebidos pelo navegador e a ação de salvar foi iniciada; o site não consegue comprovar que o usuário concluiu o salvamento no sistema operacional. A página de obrigado não carrega o Pixel Meta nem dispara `Purchase`. A compra continua sendo confirmada pelo webhook autenticado.

## Testes e limites da validação

```sh
# Mundo Criativo
npm run test:delivery
npm test
npm run build

# Jotafy, somente com banco isolado de QA migrado
npm run test:delivery
TEST_BASE_URL=http://localhost:3000 npm run test:integration
npm test
npm run typecheck
```

Foram verificados: aprovação e pendência; acesso direto e parâmetros falsos; token de primeiro acesso expirado/reutilizado; ticket expirado/adulterado/de outro navegador; cookie protegido; retorno e recarga; falhas temporárias com nova tentativa; webhook duplicado sem nova receita; isolamento por workspace/produto; reembolso que revoga o acesso; polling limitado; CTA visível em 360×640, 375×667, 390, 430 e 1440 px; contraste e acessibilidade automatizada em celular e desktop. Um ajuste de contraste encontrado pelo axe foi corrigido e revalidado.

O ensaio integrado usa o webhook real local do Jotafy, banco PostgreSQL isolado, emissão pelo painel, o handler real do Worker e armazenamento local representando o R2. O teste compara os 14.131.954 bytes e o SHA-256 do PDF completo. Não realiza pagamentos ou envia eventos publicitários reais.

Resultados locais: 12 testes de interface da página de obrigado, quatro testes do Worker, uma suíte de integração de autorização com PostgreSQL, 16 verificações da integração existente do Jotafy e 36 testes unitários do painel passaram. Os 38 testes existentes da página de vendas também passaram. O ensaio do PDF completo passou em desktop e nas emulações Chromium de Android e iPhone, incluindo a perda deliberada da resposta de autorização depois do processamento pelo backend. As 191 páginas do PDF foram abertas e analisadas sem erro. Os builds de produção e o empacotamento local do Worker foram verificados; isso não publica nem configura recursos na Cloudflare.

Emulação Chromium de Android e iPhone não substitui um aparelho físico. A instalação de WebKit/Safari para esta validação foi bloqueada por HTTP 403 no download do navegador. O R2 de produção, Safari/iOS real, a compra real completa e a passagem automática Cakto → autorização precisam de validação externa depois da ativação.

## Arquivos principais

| Repositório             | Arquivos                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mundo Criativo          | `obrigado/index.html`, `src/thank-you.js`, `src/thank-you.css`, `public/images/ebook-cover.webp`, `vite.config.js`                                                                     |
| Mundo Criativo, entrega | `worker/index.js`, `worker/delivery.test.mjs`, `scripts/upload-material.mjs`, `wrangler.jsonc`, `public/_headers`, `tests/thank-you.spec.js`                                           |
| Jotafy                  | `db/006_delivery_access.sql`, `src/lib/delivery-access.ts`, `src/app/api/delivery/authorize/route.ts`, `src/app/api/orders/[id]/access/route.ts`, `tests/delivery.integration.test.ts` |
| Jotafy, painel/operação | `src/components/dashboard.tsx`, `src/app/globals.css`, `src/lib/jobs.ts`, `.env.example`, `package.json`                                                                               |

Os arquivos da página de vendas, seu carrossel e seus CTAs não foram alterados. Nenhuma credencial de produção, PDF integral ou autorização de comprador é versionada.
