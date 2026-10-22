const BOOK_KEY = "pequenos-construtores/colecao-131.pdf";
const FILE_NAME = "Pequenos-Construtores-131-Projetos.pdf";
const TOKEN = /^[a-f0-9]{64}$/;
const encoder = new TextEncoder();
const noCache = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const json = (data, status = 200, headers = {}) =>
  Response.json(data, { status, headers: { ...noCache, ...headers } });
class DeliveryError extends Error {
  constructor(status) {
    super("Delivery unavailable");
    this.status = status;
  }
}
function cookieName(request) {
  const url = new URL(request.url);
  return url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname)
    ? "mc_delivery_qa"
    : "__Host-mc_delivery";
}
function sessionCookie(request) {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${cookieName(request)}=`))
    ?.split("=")[1];
  return TOKEN.test(value || "") ? value : null;
}
function setSessionCookie(request, session) {
  return `${cookieName(request)}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${cookieName(request).startsWith("__Host-") ? "; Secure" : ""}`;
}
function newSession() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
function checkOrigin(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new DeliveryError(403);
}
async function readJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new DeliveryError(400);
  let text = "",
    size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2048) {
      await reader.cancel();
      throw new DeliveryError(413);
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    throw new DeliveryError(400);
  }
}
async function authorize(env, body) {
  if (!env.JOTAFY || !TOKEN.test(env.DELIVERY_SERVICE_SECRET || ""))
    throw new DeliveryError(503);
  const response = await env.JOTAFY.fetch(
    new Request("https://jotafy.internal/api/delivery/authorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.DELIVERY_SERVICE_SECRET}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    }),
  );
  if (!response.ok) throw new DeliveryError(503);
  return response.json();
}
async function status(env, session) {
  return session
    ? authorize(env, { action: "status", session })
    : { status: "unconfirmed" };
}
function record(env, ctx, session, event) {
  // These operational events never create orders or invoke the Meta Pixel.
  console.log(JSON.stringify({ event, component: "digital_delivery" }));
  if (session)
    ctx.waitUntil(
      authorize(env, { action: "record", session, event }).catch(() => {
        console.warn("digital_delivery_audit_unavailable");
      }),
    );
}
async function digest(text) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(text)),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
const base64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
const unbase64 = (value) =>
  Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
    c.charCodeAt(0),
  );
async function signingKey(env) {
  if (!TOKEN.test(env.DELIVERY_SERVICE_SECRET || ""))
    throw new DeliveryError(503);
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`mundo-criativo:download:v1:${env.DELIVERY_SERVICE_SECRET}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function createDownloadTicket(env, session, now = Date.now()) {
  const payload = base64(
    encoder.encode(
      JSON.stringify({
        v: 1,
        exp: Math.floor(now / 1000) + 60,
        session: await digest(session),
        nonce: crypto.randomUUID(),
      }),
    ),
  );
  return `${payload}.${base64(await crypto.subtle.sign("HMAC", await signingKey(env), encoder.encode(payload)))}`;
}
export async function validDownloadTicket(
  env,
  ticket,
  session,
  now = Date.now(),
) {
  try {
    if (typeof ticket !== "string" || ticket.length > 700) return false;
    const [payload, signature, extra] = ticket.split(".");
    if (!payload || !signature || extra) return false;
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        await signingKey(env),
        unbase64(signature),
        encoder.encode(payload),
      ))
    )
      return false;
    const value = JSON.parse(new TextDecoder().decode(unbase64(payload)));
    return (
      value.v === 1 &&
      Number.isInteger(value.exp) &&
      value.exp > Math.floor(now / 1000) &&
      value.exp <= Math.floor(now / 1000) + 60 &&
      value.session === (await digest(session))
    );
  } catch {
    return false;
  }
}

export async function handleDelivery(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  let session = sessionCookie(request);
  if (request.method === "GET" && path === "/api/delivery/status") {
    if (!session)
      return json({ status: "unconfirmed", ready: false }, 200, {
        "Set-Cookie": setSessionCookie(request, newSession()),
      });
    const access = await status(env, session);
    const ready =
      access.status === "approved" &&
      !!env.MATERIAL &&
      !!(await env.MATERIAL.head(BOOK_KEY));
    return json({ status: access.status, ready });
  }
  if (request.method === "POST") {
    checkOrigin(request);
    if (path === "/api/delivery/access") {
      const input = await readJson(request);
      if (!TOKEN.test(input?.grant || ""))
        return json({ status: "unconfirmed" });
      if (!session)
        return json({ status: "session_required" }, 409, {
          "Set-Cookie": setSessionCookie(request, newSession()),
        });
      // A return visit can use its current cookie even if the original one-use link was redeemed.
      const existing = await status(env, session);
      if (existing.status === "approved") return json({ status: "approved" });
      const result = await authorize(env, {
        action: "redeem",
        grant: input.grant,
        session,
      });
      if (result.status !== "approved" || result.session !== session)
        return json({ status: "unconfirmed" });
      return json({ status: "approved" }, 200, {
        "Set-Cookie": setSessionCookie(request, session),
      });
    }
    if (path === "/api/delivery/ticket") {
      const access = await status(env, session);
      if (access.status !== "approved")
        return json({ status: "unconfirmed" }, 403);
      if (!env.MATERIAL || !(await env.MATERIAL.head(BOOK_KEY)))
        throw new DeliveryError(503);
      return json({
        url: `/api/delivery/file?ticket=${await createDownloadTicket(env, session)}`,
        expiresIn: 60,
      });
    }
    if (path === "/api/delivery/events") {
      const { event } = await readJson(request);
      if (
        ![
          "thank_you_page_view",
          "purchase_access_verified",
          "download_completed",
          "download_failed",
        ].includes(event)
      )
        throw new DeliveryError(400);
      record(env, ctx, session, event);
      return json({ ok: true });
    }
  }
  if (request.method === "GET" && path === "/api/delivery/file") {
    if (
      !session ||
      !(await validDownloadTicket(env, url.searchParams.get("ticket"), session))
    )
      throw new DeliveryError(403);
    const access = await status(env, session);
    if (access.status !== "approved") throw new DeliveryError(403);
    if (!env.MATERIAL) throw new DeliveryError(503);
    const object = await env.MATERIAL.get(BOOK_KEY);
    if (!object) throw new DeliveryError(503);
    record(env, ctx, session, "download_started");
    return new Response(object.body, {
      headers: {
        ...noCache,
        "Content-Type": "application/pdf",
        "Content-Length": String(object.size),
        "Content-Disposition": `attachment; filename="${FILE_NAME}"`,
      },
    });
  }
  return json({ error: "Acesso não disponível." }, 404);
}

export default {
  async fetch(request, env, ctx) {
    if (!new URL(request.url).pathname.startsWith("/api/delivery/"))
      return env.ASSETS.fetch(request);
    try {
      return await handleDelivery(request, env, ctx);
    } catch (error) {
      return json(
        {
          error:
            "Não foi possível acessar a coleção agora. Tente novamente ou fale com o suporte.",
        },
        error instanceof DeliveryError ? error.status : 503,
      );
    }
  },
};
