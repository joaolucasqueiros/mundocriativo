# Entrega pública da coleção

Por solicitação do proprietário, qualquer visitante de `/obrigado/` pode baixar o PDF completo, sem validação de pedido ou pagamento.

O PDF fica em `public/materiais/Pequenos-Construtores-131-Projetos.pdf` e acompanha o build e a publicação padrão (`npm run deploy`). Não requer R2, migração, segredo ou autorização do Jotafy. O arquivo também pode ser acessado diretamente e compartilhado.

A página usa o mockup padrão `/images/product.webp` e suporte WhatsApp https://wa.me/5538998146695. Não dispara Purchase ao acessar ou baixar.

Esta configuração substitui a entrega privada descrita em `entrega-segura.md` para a página de obrigado. As rotas privadas antigas permanecem independentes e não são utilizadas pela página pública.

A página foi reconstruída como HTML independente em `public/obrigado/index.html`, sem JavaScript, consultas de autorização ou dependência do Jotafy. O build copia diretamente a página e o PDF para `dist`.
