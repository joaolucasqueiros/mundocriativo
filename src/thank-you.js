import "./fonts.css";
import "./styles.css";
import "./thank-you.css";

// The owner authorized public access to this collection. No purchase validation
// or Meta Purchase event is needed to download the material.
const button = document.querySelector("#download-button");
const message = document.querySelector("#download-message");
button.addEventListener("click", () => {
  message.textContent =
    "Seu download vai começar. Se o PDF abrir no celular, use Compartilhar para salvar em Arquivos ou Downloads.";
});
