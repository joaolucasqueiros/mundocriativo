const localImage = (src) =>
  typeof src === "string" &&
  /^\/images\/[a-zA-Z0-9_./-]+\.(webp|avif|png|jpe?g)$/.test(src) &&
  !src.includes("..");
const text = (value) => typeof value === "string" && value.trim();

export function renderEvidence(config) {
  const testimonials = Array.isArray(config.testimonials)
    ? config.testimonials
    : [];
  const testimonialGrid = document.querySelector("#testimonial-grid");
  for (const item of testimonials
    .filter(
      (item) =>
        item?.authorized === true && text(item.name) && text(item.quote),
    )
    .slice(0, 6)) {
    const card = document.createElement("figure");
    card.className = "testimonial-card";
    const quote = document.createElement("blockquote");
    quote.textContent = item.quote;
    const caption = document.createElement("figcaption");
    const initial = document.createElement("span");
    initial.className = "testimonial-initial";
    initial.setAttribute("aria-hidden", "true");
    initial.textContent = item.name.trim().charAt(0).toLocaleUpperCase("pt-BR");
    const name = document.createElement("strong");
    name.textContent = item.name;
    caption.append(initial, name);
    card.append(quote, caption);
    testimonialGrid.append(card);
  }
  document.querySelector("#testimonials-section").hidden =
    testimonialGrid.children.length === 0;

  const previews = Array.isArray(config.insidePreviews)
    ? config.insidePreviews
    : [];
  const section = document.querySelector("#inside-section");
  const grid = document.querySelector("#inside-grid");
  const images = [];
  for (const item of previews
    .filter(
      (item) =>
        item?.verified === true && localImage(item.src) && text(item.title),
    )
    .slice(0, 10)) {
    const card = document.createElement("figure");
    card.className = "inside-card";
    const image = new Image();
    image.width = 600;
    image.height = 800;
    image.alt = item.title;
    image.loading = images.length === 0 ? "eager" : "lazy";
    const caption = document.createElement("figcaption");
    caption.textContent = item.title;
    image.onload = () => {
      image.dataset.loaded = "true";
      section.hidden = false;
    };
    image.onerror = () => {
      card.remove();
      if (!grid.querySelector('[data-loaded="true"]')) {
        section.hidden = true;
        const next = images.find(
          (img) => img.isConnected && img !== image && !img.complete,
        );
        if (next) next.loading = "eager";
      }
    };
    card.append(image, caption);
    grid.append(card);
    images.push(image);
    image.src = item.src;
  }
}
