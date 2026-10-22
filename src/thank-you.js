import "./fonts.css";
import "./styles.css";
import "./thank-you.css";

const button = document.querySelector("#download-button");
const title = document.querySelector("#access-title");
const description = document.querySelector("#access-description");
const caption = document.querySelector("#download-caption");
const message = document.querySelector("#download-message");
const retry = document.querySelector("#access-retry");
let approved = false,
  checking = false,
  downloading = false,
  stopped = false;
let viewVerified = false;
const support = window.MUNDINHO_CONFIG?.supportEmail;
if (typeof support === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support)) {
  document.querySelector("#support-link").href =
    `mailto:${support}?subject=Ajuda%20com%20meu%20acesso`;
}
async function api(path, body) {
  const response = await fetch(`/api/delivery/${path}`, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const error = new Error("access-unavailable");
    error.status = response.status;
    throw error;
  }
  return response.json();
}
function track(event) {
  window.dispatchEvent(new CustomEvent(`mundocriativo:${event}`));
  void api("events", { event }).catch(() => {});
}
function unconfirmed(
  text = "Seu acesso ainda não está disponível. Abra o link individual da sua compra ou fale com nosso suporte.",
) {
  document.body.dataset.accessState = "unconfirmed";
  approved = false;
  button.disabled = true;
  title.textContent = "Seu acesso ainda não foi confirmado";
  description.textContent = text;
  retry.hidden = false;
}
async function verify() {
  if (checking) return;
  checking = true;
  retry.hidden = true;
  message.textContent = "";
  document.body.dataset.accessState = "checking";
  button.disabled = true;
  title.textContent = "Estamos confirmando seu pagamento…";
  description.textContent =
    "Assim que o pagamento for confirmado, você poderá baixar sua coleção aqui.";
  try {
    const fragment = new URLSearchParams(location.hash.slice(1));
    const grant = fragment.get("acesso");
    // Fragments are never sent to the server or in referrers. Preserve the grant
    // through a connection failure, then remove it once the exchange returns.
    if (location.search)
      history.replaceState(null, "", location.pathname + location.hash);
    if (grant) {
      // Establish the protected cookie before redemption so the browser can recover
      // its authorization if a subsequent response is lost in transit.
      await api("status");
      await api("access", { grant });
      history.replaceState(null, "", location.pathname);
    }
    for (let attempt = 0; attempt < 10 && !stopped; attempt++) {
      const access = await api("status");
      if (access.status === "approved") {
        approved = true;
        document.body.dataset.accessState = "approved";
        title.textContent = access.ready
          ? "Oba! Sua coleção está pronta! 🎉"
          : "Seu pagamento foi confirmado!";
        description.textContent = access.ready
          ? "Agora é só baixar os 131 projetos e começar a criar momentos incríveis com seu filho!"
          : "Seu arquivo está temporariamente indisponível. Tente novamente ou fale com nosso suporte.";
        caption.textContent = access.ready
          ? "PDF completo · 13,5 MB · Para celular e computador"
          : "Estamos cuidando do acesso ao seu material.";
        button.disabled = !access.ready;
        retry.hidden = access.ready;
        if (!viewVerified) {
          track("purchase_access_verified");
          viewVerified = true;
        }
        return;
      }
      if (access.status !== "pending") {
        unconfirmed();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    if (!stopped)
      unconfirmed(
        "A confirmação do pagamento ainda não chegou. Confira o status na Cakto e tente novamente em alguns instantes.",
      );
  } catch {
    if (!stopped)
      unconfirmed(
        "Não conseguimos conferir seu acesso agora. Verifique sua conexão e tente novamente aqui.",
      );
  } finally {
    checking = false;
  }
}
retry.addEventListener("click", verify);
button.addEventListener("click", async () => {
  if (!approved || downloading) return;
  downloading = true;
  button.disabled = true;
  button.querySelector("span").textContent = "PREPARANDO SEU PDF…";
  message.classList.remove("is-error");
  message.textContent = "Só um instante. Estamos baixando sua coleção…";
  try {
    const ticket = await api("ticket", {});
    const url = new URL(ticket.url, location.origin);
    if (url.origin !== location.origin || url.pathname !== "/api/delivery/file")
      throw new Error("invalid-download");
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });
    if (response.status === 403) {
      const error = new Error("access-changed");
      error.status = 403;
      throw error;
    }
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("application/pdf")
    )
      throw new Error("download-unavailable");
    const blob = await response.blob();
    const expected = Number(response.headers.get("content-length"));
    if (
      !blob.size ||
      (expected && blob.size !== expected) ||
      (await blob.slice(0, 5).text()) !== "%PDF-"
    )
      throw new Error("incomplete-download");
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "Pequenos-Construtores-131-Projetos.pdf";
    document.body.append(link);
    link.click();
    link.remove();
    // Keep the blob available while mobile browsers open their save sheet.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    message.textContent =
      "Seu PDF foi recebido! Se aparecer uma prévia no celular, use Compartilhar e salve em Arquivos ou Downloads.";
    track("download_completed");
    button.querySelector("span").textContent = "BAIXAR NOVAMENTE";
  } catch (error) {
    message.classList.add("is-error");
    if (error.status === 403) {
      unconfirmed(
        "Não conseguimos autorizar este download. Verifique o status da sua compra ou fale com nosso suporte.",
      );
      message.textContent = "O arquivo não foi liberado.";
      button.querySelector("span").textContent = "BAIXAR MEUS 131 PROJETOS";
    } else {
      message.textContent =
        "O download foi interrompido. Confira sua conexão e tente novamente. Você continua com acesso à coleção.";
      button.querySelector("span").textContent = "TENTAR NOVAMENTE";
    }
    track("download_failed");
  } finally {
    downloading = false;
    button.disabled = !approved;
  }
});
window.addEventListener("pagehide", () => {
  stopped = true;
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    stopped = false;
    void verify();
  }
});
track("thank_you_page_view");
void verify();
