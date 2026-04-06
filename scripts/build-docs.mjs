import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { marked } from 'marked';

const SRC = 'docs/md';
const OUT = 'dist/docs';

mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith('.md'));

const nav = files
    .map((f) => {
        const name = basename(f, '.md');
        return `<a href="${name}.html">${name.replace(/-/g, ' ')}</a>`;
    })
    .join('\n');

for (const file of files) {
    const name = basename(file, '.md');
    const md = readFileSync(join(SRC, file), 'utf8');
    const body = marked(md);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name.replace(/-/g, ' ')} — Torg</title>
  <link rel="icon" href="../favicon.ico" sizes="48x48" />
  <link rel="icon" href="../icon.svg" sizes="any" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="../apple-touch-icon-180x180.png" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #282c34; --bg-alt: #21242b; --fg: #bbc2cf;
      --dim: #5b6268; --blue: #51afef; --green: #98be65;
      --yellow: #ecbe7b; --border: #3f444a;
      font-family: 'JetBrains Mono','Fira Code','Cascadia Code','Consolas',monospace;
    }
    body { background: var(--bg); color: var(--fg); min-height: 100vh; display: flex; flex-direction: column; }
    nav {
      background: var(--bg-alt); border-bottom: 1px solid var(--border);
      padding: 10px 24px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
    }
    nav .brand { color: var(--blue); font-weight: 700; margin-right: 8px; text-decoration: none; }
    nav a { color: var(--dim); font-size: 13px; text-decoration: none; }
    nav a:hover { color: var(--fg); }
    main { max-width: 760px; width: 100%; margin: 0 auto; padding: 40px 24px; flex: 1; }
    h1, h2, h3, h4 { color: var(--blue); margin: 1.6em 0 0.5em; line-height: 1.3; }
    h1 { font-size: 1.6em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
    h2 { font-size: 1.25em; }
    h3 { font-size: 1.05em; color: var(--green); }
    p { margin: 0.75em 0; line-height: 1.7; font-size: 14px; }
    ul, ol { padding-left: 1.5em; margin: 0.6em 0; font-size: 14px; line-height: 1.7; }
    li { margin: 0.2em 0; }
    code { background: var(--bg-alt); color: var(--yellow); padding: 1px 5px; border-radius: 3px; font-size: 13px; }
    pre { background: var(--bg-alt); border: 1px solid var(--border); border-radius: 4px; padding: 14px 16px; overflow-x: auto; margin: 1em 0; }
    pre code { background: none; padding: 0; font-size: 13px; color: var(--fg); }
    a { color: var(--blue); }
    a:hover { color: var(--fg); }
    hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
    blockquote { border-left: 3px solid var(--border); padding-left: 1em; color: var(--dim); margin: 1em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 13px; }
    th, td { border: 1px solid var(--border); padding: 6px 12px; text-align: left; }
    th { background: var(--bg-alt); color: var(--blue); }
    footer { border-top: 1px solid var(--border); padding: 12px 24px; font-size: 11px; color: var(--dim); text-align: center; }
  </style>
</head>
<body>
  <nav>
    <a class="brand" href="../">Torg</a>
    ${nav}
  </nav>
  <main>${body}</main>
  <footer>Torg docs</footer>
</body>
</html>`;

    writeFileSync(join(OUT, `${name}.html`), html);
    console.log(`  docs: ${file} → dist/docs/${name}.html`);
}

console.log(`Built ${files.length} doc page(s).`);
