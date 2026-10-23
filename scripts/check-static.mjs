import { access, readFile } from "node:fs/promises";
for (const file of ["index.html", "styles.css", "app.js", "config.js", "testimonials.json", "tracking.js", "assets/colecao-folheando.mp4", "assets/colecao-folheando.gif", "assets/folheando-poster.webp", "obrigado/index.html", "materiais/Pequenos-Construtores-131-Projetos.pdf"]) await access(`public/${file}`);
JSON.parse(await readFile("public/testimonials.json", "utf8"));
console.log("Site estático conferido. Nenhuma compilação é necessária; publique a pasta public.");
