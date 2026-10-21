import "./fonts.css";
import "./styles.css";
import { createOrbit } from "./orbit.js";

const paths = {
  "arrow-right": '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="m9 5 11 7-11 7Z"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Zm0 0v5h5M8 13h8m-8 4h6"/>',
  download:
    '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
  shield: '<path d="M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Zm-4 9 3 3 5-6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  bag: '<path d="M4 7h16l1 14H3Zm4 1V6a4 4 0 0 1 8 0v2"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  scissors:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8 8 13 13M8 16 21 3m-9 9 2 2"/>',
  sparkles:
    '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6ZM20 2v4m-2-2h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  castle:
    '<path d="M3 21V7h3V3h3v4h6V3h3v4h3v14ZM3 11h18m-12 10v-5a3 3 0 0 1 6 0v5M6 14h.01M18 14h.01"/>',
  animal:
    '<path d="m5 8-2-6 7 3m9 3 2-6-7 3M5 8c-4 5-1 13 7 13S23 13 19 8C16 4 8 4 5 8Z"/><path d="M8 12h.01M16 12h.01m-6 4 2 2 2-2m-2 2v3"/>',
  dragon:
    '<path d="m3 18 4-5-4-8 8 4 3-7 3 6 4 1-3 4 2 4-5-1-2 5-4-3-4 3m7-8 3 1m2-4h.01"/>',
  dinosaur:
    '<path d="M3 18c4 0 4-5 6-6V5l4-2 8 2v5h-7v4l3 3v4h-3l-1-4-3 1-1 3H6v-3H3ZM17 6h.01m-8 6 5 2m-9 1-2-4"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9Zm-10 10 10 6 10-6M2 17l10 6 10-6"/>',
  vector:
    '<rect x="9" y="9" width="6" height="6" rx="1"/><path d="M12 2v7m0 6v7M2 12h7m6 0h7M4 4l5 5m6 6 5 5M4 20l5-5m6-6 5-5"/>',
  puzzle:
    '<path d="M3 3h6v3a3 3 0 1 0 6 0V3h6v6h-3a3 3 0 1 0 0 6h3v6h-6v-3a3 3 0 1 0-6 0v3H3v-6h3a3 3 0 1 0 0-6H3Z"/>',
  rocket:
    '<path d="M8 16c-2-5 2-12 13-13 0 11-8 15-13 13Zm0 0-4 4m5-10H5l-3 5h6m6 0v4l-5 3v-6"/><circle cx="16" cy="8" r="2"/>',
};
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`;
function renderIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    el.outerHTML = icon(el.dataset.icon);
  });
}
const config = window.MUNDINHO_CONFIG || {};
const categories = [
  {
    id: "construcoes",
    name: "Construções e objetos",
    count: 33,
    icon: "castle",
    bg: "#f8ecd3",
    fg: "#aa8241",
  },
  {
    id: "animais",
    name: "Animais e criaturas",
    count: 38,
    icon: "animal",
    bg: "#e9efd9",
    fg: "#758e4e",
  },
  {
    id: "dragoes",
    name: "Dragões 3D",
    count: 10,
    icon: "dragon",
    bg: "#f8e5da",
    fg: "#c18360",
  },
  {
    id: "dinossauros",
    name: "Dinossauros 3D",
    count: 10,
    icon: "dinosaur",
    bg: "#deebe0",
    fg: "#648b6b",
  },
  {
    id: "relevos",
    name: "Relevos em camadas",
    count: 10,
    icon: "layers",
    bg: "#e6e7f3",
    fg: "#8c82af",
  },
  {
    id: "moldes",
    name: "Moldes vetoriais",
    count: 10,
    icon: "vector",
    bg: "#e2edf2",
    fg: "#6891a8",
  },
  {
    id: "esculturas",
    name: "Esculturas de encaixe",
    count: 10,
    icon: "puzzle",
    bg: "#f5e5d6",
    fg: "#b58e68",
  },
  {
    id: "avancados",
    name: "Projetos avançados",
    count: 10,
    icon: "rocket",
    bg: "#f7e8ce",
    fg: "#b99248",
  },
];
const categoryTrack = document.querySelector("#category-track");
categoryTrack.innerHTML = categories
  .map(
    (c) =>
      `<article class="category-card" data-category="${c.id}" style="--card-bg:${c.bg};--card-fg:${c.fg}"><div class="category-art">${icon(c.icon)}</div><h3>${c.name}</h3><p><strong>${c.count}</strong> projetos</p></article>`,
  )
  .join("");
// Only local, genuine page images can replace the symbolic category icons.
let previewsLoaded = 0;
for (const category of categories) {
  const path = config.categoryPreviews?.[category.id];
  if (
    typeof path !== "string" ||
    !/^\/images\/[a-zA-Z0-9_./-]+\.(webp|avif|png|jpe?g)$/.test(path) ||
    path.includes("..")
  )
    continue;
  const img = new Image();
  img.alt = `Prévia de uma página: ${category.name}`;
  img.width = 300;
  img.height = 220;
  img.loading = "lazy";
  const art = document.querySelector(
    `[data-category="${category.id}"] .category-art`,
  );
  img.className = "category-preview";
  img.onload = () => {
    img.dataset.loaded = "true";
    art.querySelector("svg")?.remove();
    previewsLoaded++;
    if (previewsLoaded === categories.length)
      document.querySelector(".preview-note").hidden = true;
  };
  img.onerror = () => img.remove();
  art.append(img);
  img.src = path;
}
renderIcons();

// Checkout links stay unavailable until a genuine, secure Cakto URL is supplied.
let checkout;
try {
  const url = new URL(config.checkoutUrl);
  if (
    url.protocol === "https:" &&
    url.hostname === "pay.cakto.com.br" &&
    url.pathname !== "/" &&
    !url.username &&
    !url.password &&
    !url.port
  )
    checkout = url.href;
} catch {
  /* An absent or invalid public configuration never opens a fake checkout. */
}
if (checkout) {
  document.querySelectorAll("[data-checkout]").forEach((link) => {
    link.href = checkout;
    link.removeAttribute("aria-disabled");
    link.addEventListener("click", () => {
      // One event per click, shared with the Meta Pixel integration.
      window.dispatchEvent(
        new CustomEvent("mundinho:checkout", {
          detail: {
            eventId: crypto.randomUUID(),
            placement: link.dataset.checkout,
            product: "Pequenos Construtores",
            value: 14.9,
            currency: "BRL",
          },
        }),
      );
    });
  });
  document.querySelectorAll("[data-sale-status]").forEach((el) => {
    el.hidden = true;
  });
}
const email =
  typeof config.supportEmail === "string" &&
  /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.supportEmail)
    ? config.supportEmail
    : "";
if (email) {
  const support = document.querySelector("#support-link");
  support.href = `mailto:${email}`;
  support.removeAttribute("aria-disabled");
  document.querySelector("#support-status").textContent = "";
  support.append(document.createTextNode(email));
}
document.querySelector("#year").textContent = String(new Date().getFullYear());

const carousel = document.querySelector(".carousel");
const slides = [...document.querySelectorAll("[data-slide]")];
const dots = [...document.querySelectorAll("[data-go]")];
const motionButton = document.querySelector(".motion-button");
let current = 2;
let manualPause = false;
let pointerStart;
const rotationInterval = 1500;
const orbit = createOrbit(
  document.querySelector(".carousel-stage"),
  slides,
  () => Boolean(pointerStart),
);
let timer;
function showSlide(index) {
  current = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    slide.dataset.position =
      i === current ? "center" : i === (current + 1) % 3 ? "right" : "left";
  });
  dots.forEach((dot, i) => {
    dot.setAttribute("aria-pressed", String(i === current));
  });
}
function syncTimer() {
  clearInterval(timer);
  orbit.stop();
  const stopped = manualPause;
  const label = stopped ? "Reproduzir carrossel" : "Pausar carrossel";
  // Keep the control's DOM stable while a pointer click is being completed.
  if (motionButton.getAttribute("aria-label") !== label) {
    motionButton.setAttribute("aria-label", label);
    motionButton.innerHTML = icon(stopped ? "play" : "pause");
  }
  if (!stopped && !document.hidden) {
    orbit.start();
    timer = setInterval(() => {
      if (!pointerStart) showSlide(current + 1);
    }, rotationInterval);
  }
}
function interact(index) {
  showSlide(index);
  orbit.goTo(current);
  syncTimer();
}
dots.forEach((dot) =>
  dot.addEventListener("click", () => interact(Number(dot.dataset.go))),
);
motionButton.addEventListener("click", () => {
  manualPause = !manualPause;
  syncTimer();
});
carousel.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    interact(current + (e.key === "ArrowRight" ? 1 : -1));
  }
});
carousel.addEventListener("pointerdown", (e) => {
  pointerStart = { x: e.clientX, y: e.clientY };
});
window.addEventListener("pointerup", (e) => {
  if (!pointerStart) return;
  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;
  if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy))
    interact(current + (dx < 0 ? 1 : -1));
  pointerStart = null;
  syncTimer();
});
window.addEventListener("pointercancel", () => {
  if (!pointerStart) return;
  pointerStart = null;
  syncTimer();
});
document.addEventListener("visibilitychange", syncTimer);
showSlide(current);
syncTimer();
document.querySelector(".carousel-stage").classList.add("enter");

const sticky = document.querySelector(".sticky-buy");
let offerVisible = true;
let finalVisible = false;
function syncSticky() {
  sticky.hidden = offerVisible || finalVisible;
}
new IntersectionObserver(
  ([entry]) => {
    offerVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
    syncSticky();
  },
  { threshold: 0 },
).observe(document.querySelector(".hero-offer"));
new IntersectionObserver(
  ([entry]) => {
    finalVisible = entry.isIntersecting;
    syncSticky();
  },
  { threshold: 0.1 },
).observe(document.querySelector(".final-offer"));

const legalContents = {
  privacy: {
    title: "Política de privacidade",
    html: '<p>Esta página apresenta a coleção Pequenos Construtores, da marca Mundo Criativo. Não solicita cadastro e não possui formulário de coleta de dados. Utiliza o Pixel da Meta para medir visitas à página e cliques que iniciam o checkout, avaliar campanhas e apoiar publicidade. A Meta pode receber dados técnicos de navegação, como endereço IP, informações do dispositivo e identificadores de cookies, conforme suas políticas e as configurações do navegador. Não enviamos nome ou e-mail pelo pixel. Consulte a <a href="https://www.facebook.com/privacy/policy/">Política de Privacidade da Meta</a>.</p><h3>Ao realizar uma compra</h3><p>Você será direcionado ao ambiente da Cakto, que processa o pedido e o pagamento conforme suas próprias políticas de privacidade e termos. Consulte essas informações no checkout antes de concluir a compra.</p><h3>Contato por e-mail</h3><p>Se você entrar em contato com o suporte, as informações enviadas serão utilizadas para responder à solicitação e atender às obrigações legais aplicáveis. Não envie dados de cartão ou senhas por e-mail.</p><h3>Seus direitos</h3><p>Você pode entrar em contato para solicitar informações sobre o tratamento de seus dados e exercer os direitos previstos na LGPD, observadas as obrigações legais de conservação. Você também pode gerenciar cookies e bloqueios de rastreamento nas configurações do navegador. Se o site passar a utilizar outras ferramentas, esta política deverá ser atualizada.</p>',
  },
  terms: {
    title: "Termos de uso",
    html: "<p>Pequenos Construtores é uma coleção digital com 131 projetos e ideias criativas em PDF, incluindo moldes, ilustrações e guias de montagem. O preço anunciado é R$ 14,90, em pagamento único, sem assinatura.</p><h3>O que está incluído</h3><p>Acesso aos arquivos digitais após a confirmação do pagamento. Não estão incluídos brinquedos, caixas, impressora, papel, papelão, ferramentas ou outros materiais físicos. Os mockups de caixas são ilustrativos.</p><h3>Uso do material</h3><p>O material é destinado à consulta e impressão para uso pessoal e familiar. A aquisição não transfere direitos autorais nem autoriza revenda ou redistribuição dos arquivos.</p><h3>Montagem e supervisão</h3><p>Alguns projetos podem exigir adaptações. Cabe ao adulto avaliar a adequação de cada atividade à criança e supervisionar o uso de ferramentas e materiais. Não há promessa de mudanças comportamentais nem de benefícios clínicos.</p><h3>Cancelamento e atendimento</h3><p>O consumidor pode exercer o direito de arrependimento no prazo de 7 dias nas compras online, conforme a legislação aplicável. Para dúvidas de acesso ou solicitações sobre o pedido, utilize o suporte informado nesta página ou os canais disponíveis na Cakto.</p>",
  },
  delivery: {
    title: "Entrega digital e vendedor",
    html: '<h3>Como você recebe</h3><p>A entrega é digital, em PDF. Após a confirmação do pagamento pela Cakto, utilize as instruções de acesso disponibilizadas no pedido. A aprovação pode variar conforme o meio de pagamento. Não existe envio pelos Correios.</p><h3>Para começar</h3><p>Você precisará de um dispositivo compatível com PDF e, para os projetos impressos, de impressora ou serviço de impressão. Materiais de montagem são adquiridos separadamente.</p><h3>Responsável pela venda</h3><div id="seller-details"></div>',
  },
};
const dialog = document.querySelector("#legal-dialog");
let previousFocus;
document.querySelectorAll("[data-legal]").forEach((button) =>
  button.addEventListener("click", () => {
    previousFocus = button;
    const content = legalContents[button.dataset.legal];
    document.querySelector("#legal-title").textContent = content.title;
    document.querySelector("#legal-content").innerHTML = content.html;
    const sellerDetails = document.querySelector("#seller-details");
    if (sellerDetails) {
      const values = [
        config.seller?.name,
        config.seller?.document,
        config.seller?.address,
        email,
      ].filter((value) => typeof value === "string" && value.trim());
      if (!values.length)
        values.push("Informações do vendedor disponíveis em breve.");
      values.forEach((value) => {
        const p = document.createElement("p");
        p.textContent = value;
        sellerDetails.append(p);
      });
    }
    dialog.showModal();
  }),
);
document
  .querySelector(".dialog-close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => previousFocus?.focus());
