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
  const age = c.ageRange || "A adequação depende do projeto e da experiência da criança. Um adulto deve escolher o modelo e acompanhar a montagem.";
  fill("#age-copy", c.ageRange ? `Faixa indicada: ${c.ageRange}. Sempre com supervisão de um adulto.` : age);
  fill("#faq-age", c.ageRange ? `Faixa indicada: ${c.ageRange}. Avalie cada modelo e acompanhe a criança durante a atividade.` : age);
  fill("#unit-cost", c.projectsCount > 0 ? `Aproximadamente ${money(c.price / c.projectsCount)} por projeto, considerando a coleção completa.` : "");
  fill("#year", new Date().getFullYear());
  document.querySelector("#assembly-guarantee").hidden = c.assemblyGuarantee !== true;
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
  c.categories.forEach(category => {
    const card = element("article", "category-card");
    const image = document.createElement("img");
    image.src = `/assets/${category.image}.webp`;
    image.alt = `Página real do PDF: ${category.name}`;
    image.width = 631; image.height = 884; image.loading = "lazy";
    const info = element("div", "category-info");
    info.append(element("h3", "", category.name), element("p", "", `${category.count} projetos · prévia da pág. ${category.page}`));
    card.append(image, info);
    document.querySelector("#category-grid").append(card);
  });
  async function testimonials() {
    try {
      const response = await fetch("/testimonials.json", { cache: "no-cache" });
      if (!response.ok) return;
      const data = await response.json();
      const approved = data.filter(item => item.consentConfirmed === true && typeof item.quote === "string" && item.quote.trim());
      const author = item => [item.firstName, item.city].filter(Boolean).join(" · ") || "Relato recebido";
      const photos = approved.filter(item => typeof item.imageSrc === "string" && /^\/assets\/[a-z0-9-]+\.webp$/.test(item.imageSrc));
      for (const item of photos.slice(0, 3)) {
        const card = element("article", "testimonial");
        const toggle = element("button", "conversation-toggle", "Ver conversa completa");
        toggle.type = "button";
        toggle.setAttribute("aria-expanded", "false");
        const img = document.createElement("img");
        img.src = item.imageSrc; img.alt = `Conversa autorizada: ${author(item)}`;
        img.width = 853; img.height = item.imageSrc.includes("familia") ? 682 : 1844; img.loading = "lazy";
        if (img.height === 682) img.style.aspectRatio = "853 / 682";
        toggle.addEventListener("click", () => {
          const expanded = toggle.getAttribute("aria-expanded") !== "true";
          toggle.setAttribute("aria-expanded", String(expanded));
          img.style.aspectRatio = expanded ? "auto" : img.height === 682 ? "853 / 682" : "";
          toggle.textContent = expanded ? "Recolher conversa" : "Ver conversa completa";
        });
        card.append(img, toggle, element("blockquote", "", `“${item.quote}”`), element("cite", "", author(item)));
        document.querySelector("#testimonials-primary").append(card);
      }
      const more = approved.filter(item => !photos.slice(0, 3).includes(item));
      more.forEach(item => {
        const card = element("blockquote", "quote-card");
        card.append(element("p", "", `“${item.quote}”`), element("cite", "", author(item)));
        document.querySelector("#testimonials-more").append(card);
      });
      document.querySelector("#more-social").hidden = more.length === 0;
      document.querySelector(".social-section").hidden = photos.length === 0;
      const mini = approved.find(item => item.firstName === "Elisa") || approved[0];
      if (mini) {
        const target = document.querySelector("#mini-testimonial");
        target.append(element("blockquote", "", `“${mini.quote}”`), element("cite", "", `— ${author(mini)}`));
        target.hidden = false;
      }
    } catch { /* Unavailable testimonials never block the offer or create placeholder claims. */ }
  }
  void testimonials();
  const carousel = document.querySelector("#page-carousel");
  for (const [id, direction] of [["pages-prev", -1], ["pages-next", 1]]) {
    document.getElementById(id).addEventListener("click", () => carousel.scrollBy({ left: direction * carousel.clientWidth * .8, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
  }
  if (c.assemblyVideo?.src && c.assemblyVideo.poster && c.assemblyVideo.captions) {
    const safe = path => typeof path === "string" && path.startsWith("/assets/") && !path.includes("..");
    if ([c.assemblyVideo.src, c.assemblyVideo.poster, c.assemblyVideo.captions].every(safe)) {
      const video = document.querySelector("#assembly-video");
      video.src = c.assemblyVideo.src; video.poster = c.assemblyVideo.poster;
      const track = document.createElement("track");
      track.kind = "captions"; track.src = c.assemblyVideo.captions; track.srclang = "pt-BR"; track.label = "Português"; track.default = true;
      video.append(track);
      document.querySelector("#assembly-section").hidden = false;
    }
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
