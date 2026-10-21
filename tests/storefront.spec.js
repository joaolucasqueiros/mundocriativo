import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
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
      "no celular!",
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
  await expect(page.locator("[data-sale-status]:visible")).toHaveCount(0);
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
    await expect(page.locator(".hero-offer [data-sale-status]")).toBeVisible();
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
  await page.waitForFunction(() => window.fbq?.queue?.length === 2);
  await page.addScriptTag({ url: "/meta-pixel.js" });
  const calls = await page.evaluate(() =>
    window.fbq.queue.map((call) => Array.from(call)),
  );
  expect(calls).toEqual([
    ["init", "1309619167932261"],
    ["trackSingle", "1309619167932261", "PageView"],
  ]);
  expect(sdkRequests).toHaveLength(1);
});

test("Pixel Meta registra um InitiateCheckout por clique, com valor e eventID", async ({
  page,
}) => {
  await page.goto("/");
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
  await expect
    .poll(() => page.evaluate(() => window.existingMetaCalls.length))
    .toBe(2);
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
