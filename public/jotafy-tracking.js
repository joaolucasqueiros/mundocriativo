(() => {
  if (window.MUNDINHO_TRACKING_BRIDGE) return;
  window.MUNDINHO_TRACKING_BRIDGE = true;
  const consentKey = "mundocriativo.tracking-consent.v1";
  const attributionKey = "mundocriativo.attribution.v1";
  const config = window.MUNDINHO_CONFIG?.jotafy;
  const banner = document.querySelector(".tracking-consent");
  let attribution;
  let pageSent = false;
  const originals = new Map();
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable. */ }
  }
  function endpoint() {
    if (config?.origin !== "https://jotafy.joaolucasqueirozag.workers.dev" || !/^[a-f0-9]{64}$/.test(config.publicKey)) return;
    return `${config.origin}/api/tracking?key=${config.publicKey}`;
  }
  function send(event, eventId) {
    if (!window.MUNDINHO_TRACKING_ALLOWED || !attribution || !endpoint()) return;
    // Same contract as Jotafy's public pixel; no SDK race before checkout navigation.
    // Query strings are omitted from the page URL; only explicit campaign fields are sent.
    fetch(endpoint(), {
      method: "POST", credentials: "omit", keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...attribution, expires: undefined, key: config.publicKey,
        consent: true, event, eventId, url: location.origin + location.pathname }),
    }).then((response) => {
      if (!response.ok) console.warn("Jotafy: evento não recebido (HTTP %s).", response.status);
    }).catch(() => { console.warn("Jotafy: não foi possível enviar o evento."); });
  }
  function decorate(link) {
    if (!window.MUNDINHO_TRACKING_ALLOWED || !attribution || !endpoint()) return;
    if (!originals.has(link)) originals.set(link, link.href);
    const url = new URL(originals.get(link));
    if (url.origin !== "https://pay.cakto.com.br") return;
    for (const field of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      if (attribution[field]) url.searchParams.set(field, attribution[field]);
    }
    url.searchParams.set("mt_click", attribution.clickId);
    link.href = url.href;
  }
  function start() {
    const params = new URLSearchParams(location.search);
    const saved = read(attributionKey);
    attribution ||= !params.has("fbclid") && !params.has("utm_campaign") && saved?.expires > Date.now()
      ? saved : { clickId: crypto.randomUUID(), expires: Date.now() + 90 * 86400000 };
    if (attribution !== saved) {
      for (const field of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
        const value = params.get(field);
        if (value) attribution[field] = value.slice(0, field === "utm_source" || field === "utm_medium" ? 200 : 100);
      }
      const fbclid = params.get("fbclid");
      if (fbclid) attribution.fbc = `fb.1.${Date.now()}.${fbclid}`.slice(0, 500);
      const fbp = document.cookie.split("; ").find((value) => value.startsWith("_fbp="))?.slice(5);
      if (fbp) attribution.fbp = fbp.slice(0, 500);
    }
    store(attributionKey, attribution);
    if (!pageSent) {
      send("PageView", (window.MUNDINHO_PAGEVIEW_EVENT_ID ||= crypto.randomUUID()));
      pageSent = true;
    }
    document.querySelectorAll("a[data-checkout][href]").forEach(decorate);
  }
  function choose(choice, persist = true) {
    window.MUNDINHO_TRACKING_ALLOWED = choice === "granted";
    if (persist) store(consentKey, choice);
    if (banner) banner.hidden = true;
    window.dispatchEvent(new CustomEvent("mundinho:tracking-consent", { detail: window.MUNDINHO_TRACKING_ALLOWED }));
    if (window.MUNDINHO_TRACKING_ALLOWED) start();
    else {
      attribution = undefined;
      try { localStorage.removeItem(attributionKey); } catch { /* Storage may be unavailable. */ }
      originals.forEach((href, link) => { link.href = href; });
      originals.clear();
      window.fbq?.("consent", "revoke");
    }
    if (window.MUNDINHO_TRACKING_ALLOWED) window.fbq?.("consent", "grant");
  }
  document.querySelectorAll("[data-tracking-choice]").forEach((button) => {
    button.addEventListener("click", () => choose(button.dataset.trackingChoice));
  });
  document.querySelector("[data-tracking-settings]")?.addEventListener("click", () => {
    banner.hidden = false;
    banner.querySelector("button")?.focus();
  });
  // Capture ensures attribution is applied before the existing CTA click handler runs.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-checkout][href]");
    if (link) decorate(link);
  }, true);
  window.addEventListener("mundinho:checkout", ({ detail }) => send("InitiateCheckout", detail.eventId));
  const saved = read(consentKey);
  if (saved === "granted" || saved === "denied") choose(saved, false);
  else if (banner) banner.hidden = false;
})();
