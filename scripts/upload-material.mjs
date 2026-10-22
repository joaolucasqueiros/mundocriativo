import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const file = resolve(
  process.argv[2] || "private/pequenos-construtores-131-projetos.pdf",
);
if (!existsSync(file))
  throw new Error("Informe o caminho local do PDF enviado pelo proprietário.");
const bytes = readFileSync(file);
const digest = createHash("sha256").update(bytes).digest("hex");
if (
  digest !== "ea78d7d502c6aefc4af0e032a62398b501fac7865caf55e9d0392024c513ed4e"
)
  throw new Error(
    "O arquivo não corresponde ao PDF aprovado. Upload cancelado.",
  );
if (process.argv.includes("--verify-only")) {
  console.log(
    `PDF conferido: ${bytes.length} bytes; SHA-256 ${digest}. Nenhum upload realizado.`,
  );
} else {
  // Wrangler authenticates locally; no credentials appear in source or command arguments.
  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      "mundo-criativo-materiais/pequenos-construtores/colecao-131.pdf",
      "--file",
      file,
      "--content-type",
      "application/pdf",
      "--remote",
    ],
    { stdio: "inherit" },
  );
}
