(() => {
  const c = window.config;
  const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: c.currency }).format(value);
  const fill = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  fill("[data-projects]", c.projectsCount);
  fill("[data-pages]", c.pagesCount);
  fill("[data-price]", money(c.price));
  fill("[data-seller]", c.sellerName);
  fill("[data-refund]", c.refundDays);
  fill("[data-support-hours]", c.supportResponseHours);
  document.querySelectorAll("[data-email]").forEach(node => {
    node.textContent = c.supportEmail;
    node.href = `mailto:${c.supportEmail}`;
  });
  fill("#year", new Date().getFullYear());
  let checkout;
  try {
    checkout = new URL(c.checkoutUrl);
    if (checkout.protocol !== "https:" || checkout.hostname !== "pay.cakto.com.br" || checkout.username || checkout.password) throw new Error("invalid checkout");
    const params = new URLSearchParams(location.search);
    params.forEach((value, key) => { if (/^utm_[a-z0-9_]+$/i.test(key) || key === "fbclid") checkout.searchParams.set(key, value); });
  } catch { checkout = null; }
  document.querySelectorAll("[data-checkout]").forEach(link => {
    if (!checkout) { link.setAttribute("aria-disabled", "true"); return; }
    link.href = checkout.href;
    link.addEventListener("click", () => window.dispatchEvent(new CustomEvent("mundinho:checkout", {
      detail: { eventId: crypto.randomUUID(), placement: link.dataset.checkout, product: "Pequenos Construtores", value: c.price, currency: c.currency }
    })));
  });
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  fill("#unit-cost", c.projectsCount > 0 ? `Aproximadamente ${money(c.price / c.projectsCount)} por projeto, considerando a coleção completa.` : "");
  document.querySelector("#assembly-guarantee").hidden = c.assemblyGuarantee !== true;
  c.categories.forEach(category => {
    const card = element("article", "category-card");
    const frame = element("div", "category-image");
    const image = document.createElement("img");
    image.src = `/assets/${category.image}.webp`;
    image.alt = `Página real do PDF: ${category.name}`;
    image.width = 626; image.height = 885; image.loading = "lazy";
    frame.append(image);
    const info = element("div", "category-info");
    info.append(element("h3", "", category.name));
    const count = element("p");
    count.append(element("strong", "", `${category.count} projetos`), document.createTextNode(` · pág. ${category.page}`));
    info.append(count); card.append(frame, info);
    document.querySelector("#category-grid").append(card);
  });
  const conversationDialog = document.querySelector("#conversation-dialog");
  let conversationTrigger;
  function openConversation(item, trigger) {
    conversationTrigger = trigger;
    const full = document.querySelector("#conversation-full");
    full.src = item.imageSrc;
    full.alt = `Conversa autorizada: ${item.quote}`;
    full.height = item.imageHeight || 682;
    fill("#conversation-title", item.firstName ? `Conversa com ${item.firstName}` : "Relato de uma mãe");
    conversationDialog.showModal();
  }
  document.querySelector("#conversation-close").addEventListener("click", () => conversationDialog.close());
  conversationDialog.addEventListener("close", () => conversationTrigger?.focus());
  async function testimonials() {
    try {
      const response = await fetch("/testimonials.json", { cache: "no-cache" });
      if (!response.ok) return;
      const data = await response.json();
      const approved = data.filter(item => item.consentConfirmed === true && typeof item.quote === "string" && item.quote.trim());
      const photos = approved.filter(item => typeof item.imageSrc === "string" && /^\/assets\/[a-z0-9-]+\.webp$/.test(item.imageSrc));
      const order = item => item.imageSrc.includes("familia") ? 0 : item.imageSrc.includes("juliana") ? 1 : 2;
      photos.sort((a, b) => order(a) - order(b));
      for (const item of photos) {
        const card = element("article", "conversation");
        const label = [item.firstName, item.city].filter(Boolean).join(" · ") || "Relato de uma mãe";
        card.append(element("p", "conversation-label", label));
        const previewButton = element("button", "conversation-image");
        previewButton.type = "button";
        previewButton.setAttribute("aria-label", `Ver conversa completa: ${label}`);
        const img = document.createElement("img");
        img.src = item.imageSrc;
        img.alt = `Conversa autorizada${item.firstName ? ` com ${item.firstName}` : " de uma mãe"}: ${item.quote}`;
        img.width = item.imageWidth || 853; img.height = item.imageHeight || 682; img.loading = "lazy";
        previewButton.append(img);
        previewButton.addEventListener("click", () => openConversation(item, previewButton));
        const link = element("button", "conversation-link", "Ampliar o relato →");
        link.type = "button";
        link.addEventListener("click", () => openConversation(item, link));
        card.append(previewButton, link);
        document.querySelector("#testimonials-primary").append(card);
      }
      document.querySelector(".social-section").hidden = photos.length === 0;
      const more = approved.filter(item => !photos.includes(item));
      more.forEach(item => {
        const card = element("blockquote", "quote-card");
        card.append(element("p", "", `“${item.quote}”`), element("cite", "", [item.firstName, item.city].filter(Boolean).join(" · ") || "Relato recebido"));
        document.querySelector("#testimonials-more").append(card);
      });
      document.querySelector("#more-social").hidden = more.length === 0;
    } catch { /* Keep checkout usable when testimonials cannot load. */ }
  }
  void testimonials();
  const carousel = document.querySelector("#page-carousel");
  for (const [id, direction] of [["pages-prev", -1], ["pages-next", 1]]) {
    document.getElementById(id).addEventListener("click", () => carousel.scrollBy({ left: direction * carousel.clientWidth * .8, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
  }
  const sticky = document.querySelector(".sticky-buy");
  new IntersectionObserver(([entry]) => { sticky.hidden = entry.isIntersecting || entry.boundingClientRect.bottom > 0; }, { threshold: 0 }).observe(document.querySelector(".hero"));
  const dialog = document.querySelector("#legal-dialog");
  let previous;
  document.querySelectorAll("[data-legal]").forEach(button => button.addEventListener("click", () => {
    previous = button;
    const terms = button.dataset.legal === "terms";
    fill("#legal-title", terms ? "Termos de uso" : "Política de privacidade");
    const content = document.querySelector("#legal-content");
    content.replaceChildren();
    const paragraphs = terms ? [
      `A coleção Pequenos Construtores contém ${c.projectsCount} projetos em ${c.pagesCount} páginas digitais, por ${money(c.price)}, em pagamento único. Não inclui produto físico, impressora ou materiais. Imagens de caixa são ilustrativas.`,
      "O acesso é disponibilizado após a aprovação do pagamento na Cakto, de acordo com as instruções do pedido. A impressão e a montagem são de responsabilidade do comprador. Supervisione a criança e o uso de ferramentas. Resultados e tempo de montagem variam.",
      "O material é para uso pessoal e familiar. A compra não transfere direitos autorais nem permite revenda ou redistribuição.",
      `Você pode solicitar reembolso em até ${c.refundDays} dias da compra. Para assistência ou cancelamento, contate ${c.supportEmail} ou os canais da Cakto. Responsável pela venda: ${c.sellerName}.`
    ] : [
      `Responsável por esta página: ${c.sellerName}. Contato para dúvidas e exercício de direitos sobre dados: ${c.supportEmail}.`,
      "A página não solicita cadastro. Com sua permissão, Meta e Jotafy recebem eventos de navegação, acesso ao conteúdo, rolagem e cliques de compra, além de dados técnicos como IP, navegador, identificadores de cookies e origem de campanha. Não enviamos nome ou e-mail pelo pixel.",
      "Sua escolha e a atribuição de campanha são armazenadas neste navegador. Os parâmetros de campanha e fbclid são encaminhados ao checkout para identificar a origem do pedido. O pagamento é processado pela Cakto conforme os termos e a política da plataforma.",
      "Você pode alterar sua escolha em Preferências de rastreamento no rodapé. Respeitamos GPC e Do Not Track. A recusa impede novos envios de medição pela página, mas não apaga eventos já enviados. Dados de contato enviados ao suporte são usados para atender sua solicitação e obrigações legais."
    ];
    paragraphs.forEach(text => content.append(element("p", "", text)));
    if (!terms) {
      const link = element("a", "", "Política de privacidade da Meta"); link.href = "https://www.facebook.com/privacy/policy/"; content.append(link);
    }
    dialog.showModal();
  }));
  document.querySelector("#legal-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => previous?.focus());
})();
