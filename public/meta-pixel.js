(() => {
  function start() {
    const pixelId = window.MUNDINHO_CONFIG?.metaPixelId;
    if (typeof pixelId !== "string" || !/^\d+$/.test(pixelId)) return;

    // Keep initialization and listeners unique even if this file is loaded again.
    const key = Symbol.for("mundinho.metaPixels");
    const initialized = (window[key] ||= new Set());
    if (initialized.has(pixelId)) return;

    if (typeof window.fbq !== "function") {
      const fbq = function () {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };
      window.fbq = fbq;
      window._fbq ||= fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.append(script);
    }

    initialized.add(pixelId);
    window.fbq("init", pixelId);
    window.fbq("trackSingle", pixelId, "PageView", {}, { eventID: (window.MUNDINHO_PAGEVIEW_EVENT_ID ||= crypto.randomUUID()) });

    // Reuse the checkout event rather than adding another listener to each CTA.
    window.addEventListener("mundinho:checkout", ({ detail }) => {
      if (!window.MUNDINHO_TRACKING_ALLOWED) return;
      window.fbq(
        "trackSingle",
        pixelId,
        "InitiateCheckout",
        {
          content_name: detail.product,
          content_type: "product",
          value: detail.value,
          currency: detail.currency,
          num_items: 1,
        },
        { eventID: detail.eventId },
      );
    });
  }
  window.addEventListener("mundinho:tracking-consent", ({ detail }) => {
    if (detail === true) start();
  });
  if (window.MUNDINHO_TRACKING_ALLOWED) start();
})();
