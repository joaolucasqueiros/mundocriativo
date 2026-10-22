import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.route("https://jotafy.joaolucasqueirozag.workers.dev/**", route => route.fulfill({ json: { ok: true } }));
  await page.route("https://connect.facebook.net/**", route => route.abort());
});

for (const width of [390, 1440]) {
  test(`public collection and WhatsApp support at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    const privateCalls = [];
    page.on("request", request => {
      if (request.url().includes("/api/delivery/")) privateCalls.push(request.url());
    });
    await page.goto("/obrigado/");
    await expect(page.locator("h1")).toHaveText("Oba! Sua coleção está pronta! 🎉");
    await expect(page.locator("#support-link")).toHaveAttribute("href", "https://wa.me/5538998146695");
    await expect(page.locator(".ebook-cover img")).toHaveAttribute("src", "/images/product.webp");
    expect(await page.locator(".ebook-cover img").evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const downloading = page.waitForEvent("download");
    await page.locator("#download-button").click();
    const download = await downloading;
    const bytes = await readFile(await download.path());
    expect(bytes.length).toBe(14131954);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe("ea78d7d502c6aefc4af0e032a62398b501fac7865caf55e9d0392024c513ed4e");
    expect(privateCalls).toEqual([]);
  });
}
test("download remains available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/obrigado/");
  await expect(page.locator("#download-button")).toHaveAttribute("href", "/materiais/Pequenos-Construtores-131-Projetos.pdf");
  const downloading = page.waitForEvent("download");
  await page.locator("#download-button").click();
  expect(await (await downloading).failure()).toBeNull();
  await context.close();
});

for (const denied of [false, true]) {
  test(`download click custom event respects privacy: denied=${denied}`, async ({ page }) => {
    await page.addInitScript((denied) => {
      window.metaCalls = [];
      window.fbq = (...args) => window.metaCalls.push(args);
      if (denied) localStorage.setItem("mundocriativo.tracking-consent.v1", JSON.stringify("denied"));
    }, denied);
    await page.goto("/obrigado/");
    const download = page.waitForEvent("download");
    await page.locator("#download-button").click();
    await download;
    const calls = await page.evaluate(() => window.metaCalls);
    const custom = calls.filter(args => args[0] === "trackSingleCustom");
    expect(custom).toHaveLength(denied ? 0 : 1);
    if (!denied) {
      expect(custom[0][1]).toBe("1309619167932261");
      expect(custom[0][2]).toBe("EbookBaixado");
      expect(custom[0][3].event_label).toBe("ebook baixado");
    }
    expect(calls.some(args => args[2] === "Purchase")).toBe(false);
  });
}
