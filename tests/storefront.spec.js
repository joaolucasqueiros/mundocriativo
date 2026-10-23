import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function setup(page, consent = "denied") {
  await page.addInitScript(choice => {
    window.metaCalls = [];
    window.fbq = (...args) => window.metaCalls.push(args);
    if (choice) localStorage.setItem("mundocriativo.tracking-consent.v1", JSON.stringify(choice));
  }, consent);
  const received = [];
  await page.route("https://connect.facebook.net/**", route => route.abort());
  await page.route("https://jotafy.joaolucasqueirozag.workers.dev/**", route => {
    received.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true } });
  });
  await page.route("https://pay.cakto.com.br/**", route => route.fulfill({ body: "Checkout de teste", contentType: "text/html" }));
  return received;
}

for (const width of [390, 1440]) {
  test(`complete design at ${width}px: GIF, PDF previews, conversations and accessibility`, async ({ page }) => {
    await setup(page);
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator(".conversation")).toHaveCount(3);
    await expect(page.locator("h1")).toContainText("longe do celular");
    await expect(page.locator("h1")).toContainText("131 projetos");
    await expect(page.locator(".category-card")).toHaveCount(8);
    await expect(page.locator(".page-carousel img")).toHaveCount(4);
    await expect(page.locator(".materials")).toHaveCount(0);
    await expect(page.locator("#social-title")).toContainText("O que as mães");
    await expect(page.locator(".social-section .eyebrow")).toContainText("DEPOIMENTOS");
    for (const selector of [".price-line", ".trust-line", ".secure"]) {
      expect(await page.locator(selector).first().evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(14);
    }
    await expect(page.locator(".hero-offer .cta")).toContainText("14,90");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/redesign-${width}.png`, fullPage: true });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(n => n.target) }))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("checkout preserves current campaign parameters with tracking refused", async ({ page }) => {
  const received = await setup(page);
  await page.goto("/?utm_source=facebook&utm_campaign=criatividade&utm_content=video&utm_custom=ab&fbclid=qa-click");
  for (const link of await page.locator("[data-checkout]").all()) {
    const url = new URL(await link.getAttribute("href"));
    expect(url.origin).toBe("https://pay.cakto.com.br");
    expect(url.searchParams.get("utm_campaign")).toBe("criatividade");
    expect(url.searchParams.get("utm_custom")).toBe("ab");
    expect(url.searchParams.get("fbclid")).toBe("qa-click");
    expect(url.searchParams.has("mt_click")).toBe(false);
  }
  expect(received).toEqual([]);
  expect(await page.evaluate(() => window.metaCalls.filter(args => args[0].startsWith("track")))).toEqual([]);
});

test("automatic collection, preferences, shared events and revocation", async ({ page }) => {
  const received = await setup(page, null);
  await page.goto("/?utm_campaign=qa-test");
  await expect(page.locator(".tracking-consent")).toBeHidden();
  await expect.poll(() => received.map(item => item.event)).toEqual(["PageView", "ViewContent"]);
  expect(received.every(item => item.collectionMode === "automatic" && !("consent" in item))).toBe(true);
  await page.getByRole("button", { name: "Preferências de rastreamento" }).click();
  await page.getByRole("button", { name: "Ativar", exact: true }).click();
  await expect(page.locator(".hero-offer .cta")).toHaveAttribute("href", /mt_click=/);
  await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * .57));
  await expect.poll(() => page.evaluate(() => window.metaCalls.some(args => args[2] === "Scroll50"))).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.metaCalls.some(args => args[2] === "Scroll90"))).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('[data-checkout="hero"]').evaluate(link => link.addEventListener("click", e => e.preventDefault()));
  await page.locator('[data-checkout="hero"]').click();
  await expect.poll(() => received.filter(item => item.event === "InitiateCheckout").length).toBe(1);
  const calls = await page.evaluate(() => window.metaCalls);
  expect(calls.filter(args => args[2] === "Scroll50")).toHaveLength(1);
  expect(calls.filter(args => args[2] === "Scroll90")).toHaveLength(1);
  const checkout = calls.find(args => args[2] === "InitiateCheckout");
  expect(checkout[4].eventID).toBe(received.find(item => item.event === "InitiateCheckout").eventId);
  expect(calls.some(args => args[2] === "Purchase")).toBe(false);
  await page.getByRole("button", { name: "Preferências de rastreamento" }).click();
  await page.getByRole("button", { name: "Desativar", exact: true }).click();
  await expect(page.locator('[data-checkout="hero"]')).not.toHaveAttribute("href", /mt_click=/);
  const count = received.length;
  await page.locator('[data-checkout="hero"]').click();
  expect(received).toHaveLength(count);
});

test("config drives price and quantities; unapproved screenshots stay hidden", async ({ page }) => {
  await setup(page);
  await page.route("**/config.js", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + '\nwindow.config.price=20;window.config.projectsCount=100;' });
  });
  await page.route("**/testimonials.json", route => route.fulfill({ json: [
    { firstName: "NÃO PUBLICAR", quote: "Sem autorização", imageSrc: "/assets/relato-carla.webp", consentConfirmed: false },
    { firstName: "Relato autorizado", quote: "Projeto em família.", imageSrc: "/assets/relato-familia.webp", consentConfirmed: true }
  ] }));
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("100 projetos");
  await expect(page.locator(".hero-offer .cta")).toContainText("20,00");
  await expect(page.locator(".conversation")).toHaveCount(1);
  await expect(page.locator(".conversation img")).toHaveAttribute("alt", /Relato autorizado/);
});

test("mobile sticky, lightweight automatic animation and legal modal work", async ({ page }) => {
  await setup(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".sticky-buy")).toBeHidden();
  await expect(page.locator("#pdf-animation source")).toHaveAttribute("src", "/assets/colecao-folheando.mp4");
  await expect(page.locator("#preview-toggle")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#pdf-animation source")).toHaveAttribute("src", "/assets/colecao-folheando.mp4");
  await page.evaluate(() => { const hero = document.querySelector(".hero").getBoundingClientRect(); window.scrollTo({ top: scrollY + hero.bottom + 16, behavior: "instant" }); });
  await expect(page.locator(".sticky-buy")).toBeVisible();
  await page.locator('[data-legal="terms"]').click();
  await expect(page.locator("#legal-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#legal-dialog")).not.toBeVisible();
});

test("GPC overrides previously granted permission", async ({ page }) => {
  const received = await setup(page, "granted");
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }));
  await page.goto("/");
  expect(received).toEqual([]);
  expect(await page.evaluate(() => window.MUNDINHO_TRACKING_ALLOWED)).toBe(false);
});

test("full conversations open accessibly and PDF gallery navigates", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".conversation-link").first().click();
  await expect(page.locator("#conversation-dialog")).toBeVisible();
  await expect(page.locator("#conversation-full")).toHaveAttribute("src", /relato-familia/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#conversation-dialog")).not.toBeVisible();
  await expect(page.locator(".conversation-link").first()).toBeFocused();
  await page.locator("#pages-next").click();
  await expect.poll(() => page.locator("#page-carousel").evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  await page.getByText("O que vou receber?", { exact: true }).click();
  await expect(page.locator(".faq details[open]")).toContainText("131 projetos");
});

test("updated testimonial crops are complete and consistently sized", async ({ page }) => {
  await setup(page);
  await page.goto("/");
  await expect(page.locator(".conversation-image img")).toHaveCount(3);
  for (const image of await page.locator(".conversation-image img").all()) {
    await expect(image).toHaveAttribute("src", /-atual.webp$/);
    await expect(image).toHaveAttribute("width", "853");
    await expect(image).toHaveAttribute("height", "682");
  }
});

test("large social proof is stacked and readable on mobile", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".conversation")).toHaveCount(3);
  expect(await page.locator("em").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).fontStyle === "normal"))).toBe(true);
  expect(await page.locator("body").evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(255, 255, 255)");
  await expect(page.locator(".conversation-quote")).toHaveCount(3);
  for (const quote of await page.locator(".conversation-quote").all()) expect(await quote.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(20);
  const positions = await page.locator(".conversation").evaluateAll(nodes => nodes.map(node => ({ top: node.getBoundingClientRect().top, left: node.getBoundingClientRect().left })));
  expect(positions[1].top).toBeGreaterThan(positions[0].top);
  expect(positions[1].left).toBe(positions[0].left);
});

test("animation plays silently in a continuous loop without controls", async ({ page }) => {
  await setup(page);
  await page.goto("/");
  await page.waitForFunction(() => { const v = document.querySelector("video#pdf-animation"); return v && !v.paused && v.currentTime > .1; });
  expect(await page.locator("video#pdf-animation").evaluate(video => ({ loop: video.loop, muted: video.muted, controls: video.controls }))).toEqual({ loop: true, muted: true, controls: false });
});

test("original animated image is used if automatic video playback fails", async ({ page }) => {
  await setup(page);
  await page.route("**/assets/colecao-folheando.mp4", route => route.abort());
  await page.goto("/");
  await expect(page.locator("img#pdf-animation")).toHaveAttribute("src", "/assets/colecao-folheando.gif");
});
