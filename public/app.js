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
  async function testimonials() {
    try {
      const response = await fetch("/testimonials.json", { cache: "no-cache" });
      if (!response.ok) return;
      const data = await response.json();
      const photos = data.filter(item => item.consentConfirmed === true && typeof item.imageSrc === "string" && /^\/assets\/[a-z0-9-]+\.webp$/.test(item.imageSrc));
      const order = item => item.imageSrc.includes("familia") ? 0 : item.imageSrc.includes("juliana") ? 1 : 2;
      photos.sort((a, b) => order(a) - order(b));
      for (const item of photos) {
        const card = element("figure", "conversation");
        const img = document.createElement("img");
        img.src = item.imageSrc;
        img.alt = `Conversa autorizada${item.firstName ? ` com ${item.firstName}` : " de uma mãe"}: ${item.quote}`;
        img.width = 853; img.height = item.imageSrc.includes("familia") ? 682 : 1844; img.loading = "lazy";
        card.append(img);
        document.querySelector("#testimonials-primary").append(card);
      }
      document.querySelector(".social-section").hidden = photos.length === 0;
    } catch { /* Keep checkout usable when testimonials cannot load. */ }
  }
  void testimonials();
  const preview = document.querySelector("#pdf-animation");
  const toggle = document.querySelector("#preview-toggle");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let playing = !reduceMotion.matches;
  function syncPreview() {
    preview.src = playing ? "/assets/colecao-folheando.gif" : "/assets/folheando-poster.webp";
    toggle.innerHTML = playing ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10"/></svg>' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 8 5-8 5Z"/></svg>';
    toggle.setAttribute("aria-label", playing ? "Pausar prévia do PDF" : "Reproduzir prévia do PDF");
  }
  toggle.addEventListener("click", () => { playing = !playing; syncPreview(); });
  reduceMotion.addEventListener("change", () => { playing = !reduceMotion.matches; syncPreview(); });
  if (!playing) syncPreview();
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
