(() => {
  const config = window.config;
  const consentKey = "mundocriativo.tracking-consent.v1";
  const attributionKey = "mundocriativo.attribution.v1";
  const banner = document.querySelector(".tracking-consent");
  let allowed = false, pixelReady = false, viewed = false, attribution;
  const scrollEvents = new Set();
  const optedOut = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Optional storage. */ } };
  function initPixel() {
    if (pixelReady || !/^\d+$/.test(config.metaPixelId)) return;
    if (!window.fbq) {
      const fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      window.fbq = fbq; window._fbq ||= fbq;
      fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0"; fbq.queue = [];
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/fbevents.js"; script.async = true; document.head.append(script);
    }
    window.fbq("consent", "grant");
    window.fbq("init", config.metaPixelId);
    pixelReady = true;
  }
  function initAttribution() {
    const params = new URLSearchParams(location.search);
    const saved = read(attributionKey);
    attribution = saved?.expires > Date.now() && !params.has("fbclid") && !params.has("utm_campaign") ? saved : { clickId: crypto.randomUUID(), expires: Date.now() + 90 * 86400000 };
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) if (params.get(key)) attribution[key] = params.get(key).slice(0, 100);
    const cookie = key => document.cookie.split("; ").find(value => value.startsWith(`${key}=`))?.slice(key.length + 1);
    attribution.fbp ||= cookie("_fbp") || `fb.1.${Date.now()}.${crypto.getRandomValues(new Uint32Array(1))[0]}`;
    if (params.get("fbclid")) attribution.fbc = `fb.1.${Date.now()}.${params.get("fbclid")}`.slice(0, 500);
    else attribution.fbc ||= cookie("_fbc");
    document.cookie = `_fbp=${attribution.fbp}; Path=/; SameSite=Lax; Max-Age=7776000${location.protocol === "https:" ? "; Secure" : ""}`;
    store(attributionKey, attribution);
    document.querySelectorAll("[data-checkout][href]").forEach(link => {
      const url = new URL(link.href); url.searchParams.set("mt_click", attribution.clickId); link.href = url.href;
    });
  }
  function send(name, eventId = crypto.randomUUID(), custom = false, params = {}) {
    if (!allowed) return;
    window.fbq?.(custom ? "trackSingleCustom" : "trackSingle", config.metaPixelId, name, params, { eventID: eventId });
    if (custom) return; // Jotafy accepts only its standard event contract.
    const j = config.jotafy;
    if (j?.origin !== "https://jotafy.joaolucasqueirozag.workers.dev" || !/^[a-f0-9]{64}$/.test(j.publicKey)) return;
    const { expires, ...fields } = attribution;
    fetch(`${j.origin}/api/tracking?key=${j.publicKey}`, {
      method: "POST", credentials: "omit", keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, key: j.publicKey, consent: true, collectionMode: "consented", event: name, eventId, url: location.origin + location.pathname })
    }).catch(() => {});
  }
  function scroll() {
    if (!allowed) return;
    const extent = document.documentElement.scrollHeight - innerHeight;
    if (extent <= 0) return;
    const percent = scrollY / extent * 100;
    for (const threshold of [50, 90]) if (percent >= threshold && !scrollEvents.has(threshold)) {
      scrollEvents.add(threshold); send(`Scroll${threshold}`, undefined, true, { percent: threshold });
    }
  }
  function choose(choice, persist = true) {
    allowed = choice === "granted" && !optedOut();
    window.MUNDINHO_TRACKING_ALLOWED = allowed;
    if (persist) store(consentKey, allowed ? "granted" : "denied");
    banner.hidden = true;
    if (allowed) {
      initPixel(); initAttribution();
      if (!viewed) {
        viewed = true;
        send("PageView");
        send("ViewContent", undefined, false, { content_name: "Pequenos Construtores", content_type: "product", value: config.price, currency: config.currency });
      }
      scroll();
    } else {
      window.fbq?.("consent", "revoke");
      try { localStorage.removeItem(attributionKey); } catch { /* Optional storage. */ }
      for (const name of ["_fbp", "_fbc"]) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      document.querySelectorAll("[data-checkout][href]").forEach(link => { const url = new URL(link.href); url.searchParams.delete("mt_click"); link.href = url.href; });
    }
  }
  document.querySelectorAll("[data-tracking-choice]").forEach(button => button.addEventListener("click", () => choose(button.dataset.trackingChoice)));
  document.querySelectorAll("[data-tracking-settings]").forEach(button => button.addEventListener("click", () => { banner.hidden = false; banner.querySelector("button").focus(); }));
  window.addEventListener("mundinho:checkout", ({ detail }) => {
    if (allowed) initAttribution();
    send("InitiateCheckout", detail.eventId, false, { content_name: detail.product, content_type: "product", value: detail.value, currency: detail.currency, num_items: 1 });
  });
  window.addEventListener("scroll", scroll, { passive: true });
  document.addEventListener("DOMContentLoaded", () => { if (allowed) initAttribution(); });
  const saved = read(consentKey);
  if (optedOut()) choose("denied", false);
  else if (["granted", "denied"].includes(saved)) choose(saved, false);
  else banner.hidden = false;
})();
