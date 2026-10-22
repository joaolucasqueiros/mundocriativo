import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => { if (localStorage.getItem("mundocriativo.tracking-consent.v1") === null) localStorage.setItem("mundocriativo.tracking-consent.v1", JSON.stringify("denied")); });
  await page.route("https://jotafy.joaolucasqueirozag.workers.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" }),
  );
  // Never send automated QA visits or clicks to the real advertising account.
  await page.route("https://connect.facebook.net/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "/* Meta SDK intercepted by QA */",
    }),
  );
  await page.route("https://www.facebook.com/**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
});

const checkout = "https://pay.cakto.com.br/vxese7h_1225823";

for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`conteúdo, imagens e ausência de overflow em ${width}px`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page).toHaveTitle("Mundo Criativo | Pequenos Construtores");
    await expect(page.locator(".header .brand")).toHaveAccessibleName(
      "Mundo Criativo, início",
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "brincar longe do celular!",
    );
    await expect(page.locator(".category-card")).toHaveCount(8);
    expect(
      await page
        .locator(".category-card strong")
        .evaluateAll((els) =>
          els.reduce((sum, e) => sum + Number(e.textContent), 0),
        ),
    ).toBe(131);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    // Bring all lazy images into view before checking actual decoding.
    for (const img of await page.locator("img").all()) {
      await img.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
      await expect
        .poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test("todos os CTAs abrem o checkout real e emitem um evento por clique", async ({
  page,
}) => {
  await page.goto("/");
  const buttons = page.locator("[data-checkout]");
  await expect(buttons).toHaveCount(3);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAttribute("href", checkout);
    await expect(button).not.toHaveAttribute("aria-disabled", "true");
  }
  await expect(page.getByText("Vendas em breve.", { exact: true })).toHaveCount(
    0,
  );
  // Intercept payment navigation: validate the destination without making a purchase.
  await page.route(checkout, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<h1>Checkout interceptado pelo teste</h1>",
    }),
  );
  const events = [];
  await page.exposeFunction("recordCheckout", (detail) => events.push(detail));
  await page.evaluate(() =>
    window.addEventListener("mundinho:checkout", (e) =>
      window.recordCheckout(e.detail),
    ),
  );
  await page.locator("[data-checkout=hero]").click();
  await expect(page).toHaveURL(checkout);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    placement: "hero",
    value: 14.9,
    currency: "BRL",
  });
});

test("checkout ausente ou inválido mantém a compra desativada", async ({
  page,
}) => {
  for (const checkoutUrl of [
    "",
    "https://example.com/falso",
    "javascript:alert(1)",
  ]) {
    await page.route("**/site-config.js", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `window.MUNDINHO_CONFIG = ${JSON.stringify({ checkoutUrl })};`,
      }),
    );
    await page.goto("/");
    await expect(page.locator("[data-checkout=hero]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      await page.locator("[data-checkout=hero]").getAttribute("href"),
    ).toBeNull();
    await expect(page.locator("[data-checkout-status]")).toBeVisible();
    await page.unroute("**/site-config.js");
  }
});

test("teclado e swipe alteram a imagem central", async ({ page }) => {
  await page.goto("/");
  const carousel = page.locator(".carousel");
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-slide="0"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-slide="2"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  await carousel.dispatchEvent("pointerdown", {
    clientX: 260,
    clientY: 120,
    pointerType: "touch",
  });
  await carousel.dispatchEvent("pointerup", {
    clientX: 100,
    clientY: 124,
    pointerType: "touch",
  });
  await expect(page.locator('[data-slide="0"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  await page
    .getByRole("button", { name: "Imagem 2: mais diversão criando" })
    .click();
  await expect(page.locator('[data-slide="1"]')).toHaveAttribute(
    "data-position",
    "center",
  );
});

test("pausa de 1,5 s entre transições orbitais e pausa manual", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await page.mouse.move(1, 1);
  await expect(page.locator(".category-card")).toHaveCount(8);
  await page.clock.runFor(1501);
  await expect(page.locator('[data-slide="0"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  await page.getByRole("button", { name: "Pausar carrossel" }).click();
  await page.mouse.move(1, 1);
  await page.locator("h1").click();
  await page.clock.runFor(7100);
  await expect(page.locator('[data-slide="0"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  // Autoplay must resume even while the pointer and focus remain on the control.
  await page.getByRole("button", { name: "Reproduzir carrossel" }).click();
  await page.clock.runFor(2201);
  await expect(page.locator('[data-slide="1"]')).toHaveAttribute(
    "data-position",
    "center",
  );
});

test("carrossel gira sozinho no celular e retoma após swipe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".category-card")).toHaveCount(8);
  await page.clock.runFor(1501);
  await expect(page.locator('[data-slide="0"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  const carousel = page.locator(".carousel");
  await carousel.focus();
  await carousel.dispatchEvent("pointerdown", {
    clientX: 260,
    clientY: 120,
    pointerType: "touch",
  });
  await carousel.dispatchEvent("pointerup", {
    clientX: 100,
    clientY: 124,
    pointerType: "touch",
  });
  await expect(page.locator('[data-slide="1"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  await page.clock.runFor(2151);
  await expect(page.locator('[data-slide="2"]')).toHaveAttribute(
    "data-position",
    "center",
  );
});

test("órbita mantém pausa de 1,5 segundo antes da troca", async ({ page }) => {
  const start = new Date("2026-10-20T12:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start);
  await page.goto("/");
  await expect(page.locator(".motion-button")).toBeVisible();
  expect(
    await page
      .locator('[data-slide="2"]')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.clock.runFor(1499);
  await expect(page.locator('[data-slide="2"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  await page.clock.runFor(2);
  await expect(page.locator('[data-slide="0"]')).toHaveAttribute(
    "data-position",
    "center",
  );
  await page.clock.runFor(2150);
  await expect(page.locator('[data-slide="1"]')).toHaveAttribute(
    "data-position",
    "center",
  );
});

for (const reducedMotion of ["reduce", "no-preference"]) {
  test(`carrossel troca sozinho em navegador real (${reducedMotion})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await expect(page.locator('[data-slide="2"]')).toHaveAttribute(
      "data-position",
      "center",
    );
    const before = await page
      .locator('[data-slide="0"]')
      .evaluate((el) => getComputedStyle(el).transform);
    await expect(page.locator('[data-slide="0"]')).toHaveAttribute(
      "data-position",
      "center",
      { timeout: 2500 },
    );
    await expect
      .poll(() =>
        page
          .locator('[data-slide="0"]')
          .evaluate((el) => getComputedStyle(el).transform),
      )
      .not.toBe(before);
    await expect(page.locator('[data-slide="1"]')).toHaveAttribute(
      "data-position",
      "center",
      { timeout: 2500 },
    );
  });
}

test("suporte, vendedor e diálogos legais com Escape e retorno do foco", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#support-link")).toHaveAttribute(
    "href",
    "mailto:suportecriativo130@gmail.com",
  );
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="denied"]').click();
  const delivery = page.getByRole("button", { name: "Entrega e vendedor" });
  await delivery.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#seller-details")).toContainText(
    "João Lucas Queiroz",
  );
  await expect(page.locator("#seller-details")).toContainText(
    "suportecriativo130@gmail.com",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(delivery).toBeFocused();
  for (const name of ["Privacidade", "Termos de uso"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
});

test("vitrine horizontal e CTA fixo no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".sticky-buy")).toBeHidden();
  const track = page.locator(".category-track");
  await track.scrollIntoViewIfNeeded();
  await expect(page.locator(".sticky-buy")).toBeVisible();
  const moved = await track.evaluate((el) => {
    el.scrollLeft = 500;
    return el.scrollLeft;
  });
  expect(moved).toBeGreaterThan(0);
  await page.locator(".final-offer").scrollIntoViewIfNeeded();
  await expect(page.locator(".sticky-buy")).toBeHidden();
});

for (const width of [390, 1440]) {
  test(`acessibilidade automatizada WCAG A/AA em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".category-card")).toHaveCount(8);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("prévias reais configuradas carregam sob demanda e falhas preservam o ícone", async ({
  page,
}) => {
  await page.route("**/site-config.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.MUNDINHO_CONFIG = ${JSON.stringify({
        checkoutUrl: checkout,
        categoryPreviews: {
          construcoes: "/images/collection.webp",
          animais: "/images/missing-preview.webp",
        },
      })};`,
    }),
  );
  await page.goto("/");
  const valid = page.locator("[data-category=construcoes]");
  const failed = page.locator("[data-category=animais]");
  await valid.scrollIntoViewIfNeeded();
  await expect(valid.locator("img")).toHaveAttribute("data-loaded", "true");
  await expect(valid.locator("svg")).toHaveCount(0);
  await failed.scrollIntoViewIfNeeded();
  await expect(failed.locator("img")).toHaveCount(0);
  await expect(failed.locator("svg")).toHaveCount(1);
});

test("Pixel Meta inicializa uma vez e reutiliza o carregamento do SDK", async ({
  page,
}) => {
  const sdkRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("connect.facebook.net/en_US/fbevents.js"))
      sdkRequests.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="granted"]').click();
  await page.waitForFunction(() => window.fbq?.queue?.length >= 2);
  await page.addScriptTag({ url: "/meta-pixel.js" });
  const calls = await page.evaluate(() =>
    window.fbq.queue.map((call) => Array.from(call)),
  );
  expect(calls).toEqual([
    ["init", "1309619167932261"],
    ["trackSingle", "1309619167932261", "PageView", {}, { eventID: expect.any(String) }],
    ["consent", "grant"],
  ]);
  expect(sdkRequests).toHaveLength(1);
});

test("Pixel Meta registra um InitiateCheckout por clique, com valor e eventID", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="granted"]').click();
  await page.addScriptTag({ url: "/meta-pixel.js" });
  await page.evaluate(() => {
    window.addEventListener("mundinho:checkout", (event) => {
      window.checkoutEventId = event.detail.eventId;
    });
    document
      .querySelector("[data-checkout=hero]")
      .addEventListener("click", (event) => event.preventDefault());
  });
  await page.locator("[data-checkout=hero]").click();
  const { calls, eventId } = await page.evaluate(() => ({
    calls: window.fbq.queue.map((call) => Array.from(call)),
    eventId: window.checkoutEventId,
  }));
  const checkoutCalls = calls.filter((call) => call[2] === "InitiateCheckout");
  expect(checkoutCalls).toHaveLength(1);
  expect(checkoutCalls[0]).toEqual([
    "trackSingle",
    "1309619167932261",
    "InitiateCheckout",
    {
      content_name: "Pequenos Construtores",
      content_type: "product",
      value: 14.9,
      currency: "BRL",
      num_items: 1,
    },
    { eventID: eventId },
  ]);
  expect(eventId).toMatch(/^[a-f0-9-]{36}$/);
  expect(calls.filter((call) => call[2] === "PageView")).toHaveLength(1);
  expect(calls.some((call) => call[2] === "Purchase")).toBe(false);
});

test("Pixel Meta preserva um fbq já instalado", async ({ page }) => {
  await page.addInitScript(() => {
    window.existingMetaCalls = [];
    window.fbq = (...args) => window.existingMetaCalls.push(args);
    window.fbq.existing = true;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="granted"]').click();
  await expect
    .poll(() => page.evaluate(() => window.existingMetaCalls.length))
    .toBe(4);
  expect(await page.evaluate(() => window.fbq.existing)).toBe(true);
  await expect(
    page.locator(
      'script[src="https://connect.facebook.net/en_US/fbevents.js"]',
    ),
  ).toHaveCount(0);
});

for (const reducedMotion of ["reduce", "no-preference"]) {
  test(`órbita percorre posições intermediárias com profundidade (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    const start = new Date("2026-10-20T12:00:00Z");
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);
    await page.goto("/");
    const card = page.locator('[data-slide="2"]');
    const initial = await card.evaluate((el) => ({
      transform: el.style.transform,
      z: el.style.zIndex,
    }));
    await page.clock.runFor(1499);
    expect(await card.evaluate((el) => el.style.transform)).toBe(
      initial.transform,
    );
    await page.clock.runFor(350);
    const middle = await card.evaluate((el) => ({
      transform: el.style.transform,
      z: el.style.zIndex,
    }));
    expect(middle.transform).not.toBe(initial.transform);
    expect(middle.z).not.toBe(initial.z);
    await page.clock.runFor(350);
    expect(await card.evaluate((el) => el.style.transform)).not.toBe(
      middle.transform,
    );
    const settled = await card.evaluate((el) => el.style.transform);
    await page.clock.runFor(1400);
    expect(await card.evaluate((el) => el.style.transform)).toBe(settled);
    await page.clock.runFor(250);
    expect(await card.evaluate((el) => el.style.transform)).not.toBe(settled);
    await page.getByRole("button", { name: "Pausar carrossel" }).click();
    const stopped = await card.evaluate((el) => el.style.transform);
    await page.clock.runFor(1700);
    expect(await card.evaluate((el) => el.style.transform)).toBe(stopped);
  });
}

for (const [width, height] of [
  [360, 640],
  [375, 667],
  [390, 844],
  [430, 932],
]) {
  test(`preço e compra visíveis sem rolar em ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const button = page.locator('[data-checkout="hero"]');
    const bounds = await button.boundingBox();
    expect(bounds.y).toBeGreaterThan(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
    const price = await page.locator(".hero-offer .price").boundingBox();
    expect(price.y).toBeGreaterThan(0);
    expect(price.y + price.height).toBeLessThan(bounds.y);
    const benefits = await page
      .locator(".hero-offer .benefit-list")
      .boundingBox();
    expect(benefits.y).toBeGreaterThan(bounds.y + bounds.height);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });
}
test("botão principal tem um salto leve e checkout preservado", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-checkout="hero"]')).toHaveAttribute(
    "href",
    checkout,
  );
  expect(
    await page
      .locator('[data-checkout="hero"]')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("cta-hop");
});

test("compra continua funcional sem JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 360, height: 640 },
  });
  const page = await context.newPage();
  await page.route(checkout, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Destino de pagamento interceptado</h1>",
    }),
  );
  await page.goto("/");
  await expect(page.getByText("Vendas em breve.", { exact: true })).toHaveCount(
    0,
  );
  for (const link of await page.locator("[data-checkout]").all())
    await expect(link).toHaveAttribute("href", checkout);
  await expect(page.locator("#support-link")).toHaveAttribute(
    "href",
    "mailto:suportecriativo130@gmail.com",
  );
  await page.locator("[data-checkout=hero]").click();
  await expect(page).toHaveURL(checkout);
  await context.close();
});

test("depoimentos fornecidos aparecem e prévias sem material permanecem ocultas", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#testimonials-section")).toBeVisible();
  await expect(page.locator("#inside-section")).toBeHidden();
  await expect(page.locator(".testimonial-card")).toHaveCount(3);
  for (const name of ["Ana", "Elisa", "Janete"])
    await expect(
      page.locator(".testimonial-card figcaption").filter({ hasText: name }),
    ).toHaveCount(1);
  await expect(page.locator("#public-seller-name")).toHaveText(
    "João Lucas Queiroz",
  );
  await expect(page.locator(".help-link")).toHaveAttribute(
    "href",
    /mailto:suportecriativo130@gmail.com/,
  );
});

test("prova social exige autorização e prévias exigem imagem confirmada", async ({
  page,
}) => {
  await page.route("**/site-config.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.MUNDINHO_CONFIG=${JSON.stringify({
        checkoutUrl: checkout,
        testimonials: [
          {
            name: "Teste autorizado",
            quote: "Texto de fixture <script>não executar</script>",
            authorized: true,
          },
          { name: "Não autorizado", quote: "Não publicar", authorized: false },
        ],
        insidePreviews: [
          {
            src: "/images/collection.webp",
            title: "Imagem usada apenas no teste",
            verified: true,
          },
          {
            src: "/images/missing-preview.webp",
            title: "Arquivo ausente",
            verified: true,
          },
          {
            src: "/images/screen.webp",
            title: "Imagem sem confirmação",
            verified: false,
          },
        ],
      })};`,
    }),
  );
  await page.goto("/");
  await expect(page.locator(".testimonial-card")).toHaveCount(1);
  await expect(page.locator(".testimonial-card blockquote")).toHaveText(
    "Texto de fixture <script>não executar</script>",
  );
  await expect(page.locator(".testimonial-card script")).toHaveCount(0);
  await expect(page.locator("#inside-section")).toBeVisible();
  await page.locator("#inside-section").scrollIntoViewIfNeeded();
  await expect(page.locator(".inside-card")).toHaveCount(1);
  await expect(page.locator(".inside-card img")).toHaveAttribute(
    "data-loaded",
    "true",
  );
});

test("Jotafy respeita consentimento, preserva origem e compartilha IDs com Meta", async ({ page }) => {
  const events = [];
  await page.route("https://jotafy.joaolucasqueirozag.workers.dev/api/tracking?*", async (route) => {
    events.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/?utm_source=meta&utm_campaign=123&utm_term=456&utm_content=789&fbclid=click-test&email=nao-enviar");
  expect(events).toHaveLength(0);
  expect(await page.evaluate(() => typeof window.fbq)).toBe("undefined");
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="granted"]').click();
  await expect.poll(() => events.length).toBe(1);
  expect(events[0]).toMatchObject({ event: "PageView", consent: true, utm_campaign: "123", utm_term: "456", utm_content: "789", url: "http://127.0.0.1:4173/" });
  expect(JSON.stringify(events)).not.toContain("nao-enviar");
  const pageView = await page.evaluate(() => Array.from(window.fbq.queue.find(call => call[2] === "PageView")));
  expect(events[0].eventId).toBe(pageView[4].eventID);
  const button = page.locator('[data-checkout="hero"]');
  const destination = new URL(await button.getAttribute("href"));
  expect(destination.searchParams.get("utm_campaign")).toBe("123");
  expect(destination.searchParams.get("mt_click")).toBe(events[0].clickId);
  await page.evaluate(() => document.querySelector('[data-checkout="hero"]').addEventListener("click", event => event.preventDefault()));
  await button.click();
  await expect.poll(() => events.length).toBe(2);
  const browserCheckout = await page.evaluate(() => Array.from(window.fbq.queue.find(call => call[2] === "InitiateCheckout")));
  expect(events[1]).toMatchObject({ event: "InitiateCheckout", eventId: browserCheckout[4].eventID, clickId: events[0].clickId });
  expect(events.some(event => event.event === "Purchase")).toBe(false);
  await page.reload();
  await expect.poll(() => events.length).toBe(3);
  expect(events[2].clickId).not.toBe(events[0].clickId); // A fresh campaign landing is a new click.
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="denied"]').click();
  await expect(button).toHaveAttribute("href", checkout);
  await page.evaluate(() => document.querySelector('[data-checkout="hero"]').addEventListener("click", event => event.preventDefault()));
  await button.click();
  expect(events).toHaveLength(3);
  await page.reload();
  expect(await page.evaluate(() => typeof window.fbq)).toBe("undefined");
  expect(events).toHaveLength(3);
});

test("recusar rastreamento mantém compra e não cria atribuição", async ({ page }) => {
  await page.goto("/?utm_campaign=123");
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="denied"]').click();
  await expect(page.locator('[data-checkout="hero"]')).toHaveAttribute("href", checkout);
  expect(await page.evaluate(() => localStorage.getItem("mundocriativo.attribution.v1"))).toBeNull();
  await page.reload();
  await expect(page.locator(".tracking-consent")).toBeHidden();
  expect(await page.evaluate(() => typeof window.fbq)).toBe("undefined");
});

test("visita direta consentida fornece identificador para CAPI antes do SDK Meta", async ({ page }) => {
  const events = [];
  await page.route("https://jotafy.joaolucasqueirozag.workers.dev/api/tracking?*", async (route) => {
    events.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/");
  expect((await page.context().cookies()).find(cookie => cookie.name === "_fbp")).toBeUndefined();
  await page.getByRole("button", { name: "Preferências de rastreamento", exact: true }).click();
  await page.locator('[data-tracking-choice="granted"]').click();
  await expect.poll(() => events.length).toBe(1);
  expect(events[0].fbp).toMatch(/^fb\.1\.\d{13}\.\d+$/);
  const cookie = (await page.context().cookies()).find(cookie => cookie.name === "_fbp");
  expect(cookie.value).toBe(events[0].fbp);
  await page.reload();
  await expect.poll(() => events.length).toBe(2);
  expect(events[1].fbp).toBe(events[0].fbp);
  expect(events[1].clickId).toBe(events[0].clickId);
});

test("coleta automática inicia PageView sem aviso e sem alegar consentimento explícito", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("mundocriativo.tracking-consent.v1"));
  const events = [];
  await page.route("https://jotafy.joaolucasqueirozag.workers.dev/api/tracking?*", async route => {
    events.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/?utm_campaign=123");
  await expect.poll(() => events.length).toBe(1);
  await expect(page.locator('.tracking-consent')).toBeHidden();
  expect(events[0]).toMatchObject({ event: "PageView", collectionMode: "automatic", utm_campaign: "123" });
  expect(events[0].consent).toBeUndefined();
  await page.evaluate(() => document.querySelector('[data-checkout="hero"]').addEventListener("click", event => event.preventDefault()));
  await page.locator('[data-checkout="hero"]').click();
  await expect.poll(() => events.length).toBe(2);
  expect(events[1].event).toBe('InitiateCheckout');
  const metaPageView = await page.evaluate(() => Array.from(window.fbq.queue.find(call => call[2] === 'PageView')));
  expect(metaPageView[4].eventID).toBe(events[0].eventId);
});

for (const signal of ['globalPrivacyControl', 'doNotTrack']) {
  test(`coleta automática respeita ${signal}`, async ({ page }) => {
    await page.addInitScript(signal => {
      localStorage.removeItem('mundocriativo.tracking-consent.v1');
      Object.defineProperty(navigator, signal, { value: signal === 'globalPrivacyControl' ? true : '1', configurable: true });
    }, signal);
    let calls = 0;
    page.on('request', request => { if (request.url().includes('/api/tracking')) calls++; });
    await page.goto('/');
    await expect(page.locator('.tracking-consent')).toBeHidden();
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
    expect(calls).toBe(0);
    await expect(page.locator('[data-checkout="hero"]')).toHaveAttribute('href', checkout);
  });
}
