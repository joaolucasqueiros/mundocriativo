import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pdf = "%PDF-1.7\nQA download fixture\n%%EOF";
async function delivery(
  page,
  { approved = true, failFirstDownload = false, pending = 0 } = {},
) {
  const events = [];
  let statusCalls = 0,
    downloads = 0;
  await page.route("**/api/delivery/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/events")) {
      events.push(request.postDataJSON().event);
      return route.fulfill({ json: { ok: true } });
    }
    if (path.endsWith("/access"))
      return route.fulfill({
        json: { status: approved ? "approved" : "unconfirmed" },
      });
    if (path.endsWith("/status")) {
      statusCalls++;
      return route.fulfill({
        json: {
          status:
            statusCalls <= pending
              ? "pending"
              : approved
                ? "approved"
                : "unconfirmed",
          ready: approved,
        },
      });
    }
    if (path.endsWith("/ticket"))
      return route.fulfill({
        json: { url: "/api/delivery/file?ticket=qa-only-ticket" },
      });
    if (path.endsWith("/file")) {
      downloads++;
      if (failFirstDownload && downloads === 1) return route.abort("failed");
      return route.fulfill({
        body: pdf,
        contentType: "application/pdf",
        headers: { "Content-Length": String(Buffer.byteLength(pdf)) },
      });
    }
    return route.fulfill({ status: 404 });
  });
  return { events, calls: () => statusCalls };
}

test("a direct visit or forged paid parameter does not confirm a purchase or enable a download", async ({
  page,
}) => {
  const { events } = await delivery(page, { approved: false });
  await page.goto("/obrigado/?paid=true&order=approved");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Seu acesso ainda não foi confirmado",
  );
  await expect(
    page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" }),
  ).toBeDisabled();
  expect(new URL(page.url()).search).toBe("");
  expect(
    await page
      .locator('script[src*="meta-pixel"],script[src*="jotafy-tracking"]')
      .count(),
  ).toBe(0);
  await expect(
    page.getByRole("link", { name: "Falar com o suporte" }),
  ).toHaveAttribute("href", /^mailto:suportecriativo130@gmail.com/);
  expect(events).not.toContain("purchase_access_verified");
});

test("verified access downloads a real attachment, survives reload and keeps credentials out of the page URL", async ({
  page,
}) => {
  const { events } = await delivery(page);
  const grant = "d".repeat(64);
  await page.goto(`/obrigado/#acesso=${grant}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Oba! Sua coleção está pronta! 🎉",
  );
  expect(new URL(page.url()).hash).toBe("");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(
    "Pequenos-Construtores-131-Projetos.pdf",
  );
  expect(await download.failure()).toBeNull();
  await expect.poll(() => events.includes("download_completed")).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" }),
  ).toBeEnabled();
  expect(events.filter((e) => e === "download_completed")).toHaveLength(1);
  expect(events).not.toContain("Purchase");
});

test("a temporary connection failure permits a second download without losing authorization", async ({
  page,
}) => {
  const { events } = await delivery(page, { failFirstDownload: true });
  await page.goto("/obrigado/");
  await page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" }).click();
  await expect(
    page.getByText("O download foi interrompido.", { exact: false }),
  ).toBeVisible();
  const retry = page.getByRole("button", {
    name: "TENTAR NOVAMENTE",
    exact: true,
  });
  await expect(retry).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    retry.click(),
  ]);
  expect(await download.failure()).toBeNull();
  await expect
    .poll(
      () =>
        events.includes("download_failed") &&
        events.includes("download_completed"),
    )
    .toBe(true);
});

test("pending payment stays locked until the backend confirms approval", async ({
  page,
}) => {
  await delivery(page, { pending: 1 });
  await page.goto("/obrigado/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Estamos confirmando seu pagamento…",
  );
  await expect(
    page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" }),
  ).toBeEnabled({ timeout: 7000 });
});

test("an interrupted access exchange can be retried using the original one-use link", async ({
  page,
}) => {
  await delivery(page);
  let calls = 0;
  await page.route("**/api/delivery/access", (route) =>
    ++calls === 1
      ? route.abort("failed")
      : route.fulfill({ json: { status: "approved" } }),
  );
  await page.goto(`/obrigado/#acesso=${"e".repeat(64)}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Seu acesso ainda não foi confirmado",
  );
  expect(new URL(page.url()).hash).toContain("acesso=");
  await page
    .getByRole("button", { name: "Verificar meu acesso novamente" })
    .click();
  await expect(
    page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" }),
  ).toBeEnabled();
  expect(new URL(page.url()).hash).toBe("");
});

test("authorization revoked after the page loads disables the download", async ({
  page,
}) => {
  await delivery(page);
  await page.goto("/obrigado/");
  const button = page.getByRole("button", { name: "BAIXAR MEUS 131 PROJETOS" });
  await expect(button).toBeEnabled();
  await page.route("**/api/delivery/ticket", (route) =>
    route.fulfill({ status: 403, json: { status: "unconfirmed" } }),
  );
  await button.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Seu acesso ainda não foi confirmado",
  );
  await expect(button).toBeDisabled();
});

test("payment polling stops after ten checks and offers a manual retry", async ({
  page,
}) => {
  await page.clock.install();
  const backend = await delivery(page, { pending: 100 });
  await page.goto("/obrigado/");
  await expect.poll(backend.calls).toBe(1);
  for (let call = 2; call <= 10; call++) {
    await page.clock.runFor(3100);
    await expect.poll(backend.calls).toBe(call);
  }
  await page.clock.runFor(3100);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Seu acesso ainda não foi confirmado",
  );
  await expect(
    page.getByRole("button", { name: "Verificar meu acesso novamente" }),
  ).toBeVisible();
  await page.clock.runFor(30000);
  expect(backend.calls()).toBe(10);
});

for (const width of [360, 375, 390, 430, 1440]) {
  test(`thank-you page fits ${width}px and keeps the authorized download visible`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width,
      height: width === 360 ? 640 : width === 375 ? 667 : 900,
    });
    await delivery(page);
    await page.goto("/obrigado/");
    const button = page.getByRole("button", {
      name: "BAIXAR MEUS 131 PROJETOS",
    });
    await expect(button).toBeEnabled();
    const bounds = await button.boundingBox();
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(
      page.viewportSize().height,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (width === 390 || width === 1440) {
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/obrigado-${width}.png`,
        fullPage: true,
      });
    }
  });
}
