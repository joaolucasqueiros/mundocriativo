import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

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
