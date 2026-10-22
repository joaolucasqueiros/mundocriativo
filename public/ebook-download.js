(() => {
  const button = document.querySelector("#download-button");
  if (!button || button.dataset.downloadTracking === "ready") return;
  button.dataset.downloadTracking = "ready";
  button.addEventListener("click", () => {
    if (!window.MUNDINHO_TRACKING_ALLOWED || typeof window.fbq !== "function") return;
    const pixelId = window.MUNDINHO_CONFIG?.metaPixelId;
    if (typeof pixelId !== "string" || !/^\d+$/.test(pixelId)) return;
    // This records the click requesting the PDF, not a confirmed sale or save.
    window.fbq("trackSingleCustom", pixelId, "EbookBaixado", {
      content_name: "Pequenos Construtores — 131 Projetos Criativos",
      event_label: "ebook baixado",
      action: "download_click",
    }, { eventID: crypto.randomUUID() });
  });
})();
