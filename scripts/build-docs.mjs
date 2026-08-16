import fs from "node:fs/promises";
import path from "node:path";
import MarkdownIt from "markdown-it";

const root = process.cwd();
const outputDir = path.join(root, "site");
const ignoredDirectories = new Set([".git", ".github", "node_modules", "site", "scripts"]);
const ignoredFiles = new Set([".gitignore", "package.json", "package-lock.json"]);
const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true });

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

async function walk(directory, relative = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...await walk(path.join(directory, entry.name), relativePath));
    } else if (!ignoredFiles.has(entry.name)) {
      files.push(relativePath);
    }
  }

  return files;
}

function outputPathFor(relativePath) {
  return relativePath.replace(/\.md$/i, ".html");
}

function hrefFrom(activePath, targetPath) {
  const fromDirectory = path.posix.dirname(activePath || "index.html");
  return path.posix.relative(fromDirectory, targetPath) || path.posix.basename(targetPath);
}

function rewriteMarkdownLinks(html, sourceOutputPath) {
  const sourceDirectory = path.posix.dirname(sourceOutputPath);
  return html.replace(/href="([^"]+)"/g, (fullMatch, href) => {
    if (/^(?:[a-z]+:|\/|#)/i.test(href)) return fullMatch;

    const match = href.match(/^([^?#]*)([?#].*)?$/);
    if (!match || !/\.md$/i.test(match[1])) return fullMatch;

    const targetMarkdownPath = path.posix.normalize(path.posix.join(sourceDirectory, match[1]));
    const targetHtmlPath = outputPathFor(targetMarkdownPath);
    const relativeTarget = path.posix.relative(sourceDirectory, targetHtmlPath) || path.posix.basename(targetHtmlPath);
    return `href="${escapeHtml(relativeTarget + (match[2] ?? ""))}"`;
  });
}

function documentTitle(source, content) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || source.replace(/\.md$/i, "").split("/").at(-1);
}

function icon(name, className = "size-4") {
  const paths = {
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    folder: '<path d="M3 7h5l2 2h11v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  return `<svg aria-hidden="true" class="${className}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function groupedByDirectory(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const directory = path.posix.dirname(entry.sourcePath ?? entry);
    if (!groups.has(directory)) groups.set(directory, []);
    groups.get(directory).push(entry);
  }
  return groups;
}

function sidebarMarkup({ activePath, documents, assetFiles }) {
  const documentGroups = groupedByDirectory(documents);
  const assetGroups = groupedByDirectory(assetFiles);
  const homeActive = !activePath ? "menu-active" : "";
  const docNavigation = [...documentGroups.entries()].map(([directory, entries]) => `<li>
    <div class="menu-title px-3 pt-4 text-[.65rem] uppercase tracking-[.18em] opacity-55">${escapeHtml(directory === "." ? "Root notes" : directory)}</div>
    <ul>${entries.map((document) => `<li><a class="${activePath === document.outputPath ? "menu-active" : ""}" href="${escapeHtml(hrefFrom(activePath, document.outputPath))}">${icon("book", "size-4 shrink-0")}<span class="truncate">${escapeHtml(document.title)}</span></a></li>`).join("\n")}</ul>
  </li>`).join("\n");
  const assetNavigation = [...assetGroups.entries()].map(([directory, entries]) => `<li>
    <div class="menu-title px-3 pt-4 text-[.65rem] uppercase tracking-[.18em] opacity-55">${escapeHtml(directory === "." ? "Root files" : directory)}</div>
    <ul>${entries.map((assetPath) => `<li><a href="${escapeHtml(hrefFrom(activePath, assetPath))}">${icon("file", "size-4 shrink-0 opacity-65")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></a></li>`).join("\n")}</ul>
  </li>`).join("\n");

  return `<aside class="flex min-h-full w-80 flex-col border-r border-base-300 bg-base-100/95 px-4 py-5">
    <div class="mb-7 flex items-center gap-3 px-3">
      <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-content shadow-lg shadow-primary/20">${icon("book", "size-5")}</div>
      <div><div class="font-display text-sm font-bold tracking-tight">OS Lab Archive</div><div class="font-mono text-[.65rem] uppercase tracking-[.16em] opacity-55">course notebook</div></div>
    </div>
    <ul class="menu menu-sm grow gap-1 p-0">
      <li><a class="${homeActive}" href="${escapeHtml(hrefFrom(activePath, "index.html"))}">${icon("folder")}<span>All experiments</span></a></li>
      ${docNavigation}
      ${assetFiles.length ? `<li class="mt-3 border-t border-base-300 pt-2"><div class="menu-title px-3 pt-2 text-[.65rem] uppercase tracking-[.18em] opacity-55">Attachments</div><ul>${assetNavigation}</ul></li>` : ""}
    </ul>
    <div class="mt-8 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-relaxed text-base-content/65"><span class="font-mono text-[.65rem] uppercase tracking-[.16em] text-primary">tip</span><p class="mt-2 mb-0">Push a new Markdown note to <code class="rounded bg-base-200 px-1.5 py-0.5 font-mono text-[.7rem]">main</code> and this archive rebuilds automatically.</p></div>
  </aside>`;
}

function pageTemplate({ title, body, activePath = "", documents, assetFiles }) {
  const rootPrefix = activePath ? "../".repeat(activePath.split("/").length - 1) : "";
  const themeScript = `<script>
    (() => {
      const root = document.documentElement;
      const toggle = () => {
        const theme = root.dataset.theme === "lab-dark" ? "lab-light" : "lab-dark";
        root.dataset.theme = theme;
        localStorage.setItem("os-lab-theme", theme);
        document.querySelectorAll("[data-theme-toggle]").forEach((input) => { input.checked = theme === "lab-dark"; });
      };
      const saved = localStorage.getItem("os-lab-theme");
      root.dataset.theme = saved === "lab-dark" ? "lab-dark" : "lab-light";
      window.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-theme-toggle]").forEach((input) => { input.checked = root.dataset.theme === "lab-dark"; input.addEventListener("change", toggle); });
        document.querySelectorAll(".drawer-side a").forEach((link) => link.addEventListener("click", () => { const drawer = document.getElementById("site-drawer"); if (drawer) drawer.checked = false; }));
      });
    })();
  </script>`;

  return `<!doctype html>
<html lang="en" data-theme="lab-light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Operating systems lab programs and course notes.">
  <title>${escapeHtml(title)} · OS Lab Archive</title>
  <link rel="stylesheet" href="${rootPrefix}styles.css">
</head>
<body class="min-h-screen bg-base-200 text-base-content">
  <div class="drawer lg:drawer-open">
    <input id="site-drawer" type="checkbox" class="drawer-toggle">
    <div class="drawer-content min-h-screen">
      <header class="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/85 px-4 backdrop-blur-xl lg:px-8">
        <div class="flex-none lg:hidden"><label for="site-drawer" aria-label="Open navigation" class="btn btn-square btn-ghost">${icon("menu")}</label></div>
        <div class="flex-1"><a href="${rootPrefix}index.html" class="font-display text-sm font-extrabold tracking-tight sm:text-base">Operating Systems <span class="text-primary">/</span> Programs</a></div>
        <label class="swap swap-rotate btn btn-circle btn-ghost" title="Toggle dark mode"><input type="checkbox" data-theme-toggle aria-label="Toggle dark mode">${icon("sun", "swap-off size-5")} ${icon("moon", "swap-on size-5")}</label>
      </header>
      ${body}
      <footer class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-t border-base-300 px-5 py-8 text-xs text-base-content/55 sm:px-8"><span>Built from Markdown on <code class="font-mono">main</code>.</span><a class="link link-hover" href="https://github.com/SpreadSheets600/Operating-Systems-Programs">View repository ${icon("arrow", "inline size-3.5")}</a></footer>
    </div>
    <div class="drawer-side z-40">
      <label for="site-drawer" aria-label="Close navigation" class="drawer-overlay"></label>
      ${sidebarMarkup({ activePath, documents, assetFiles })}
    </div>
  </div>
  ${themeScript}
</body>
</html>
`;
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const allFiles = await walk(root);
const markdownFiles = allFiles.filter((file) => /\.md$/i.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const assetFiles = allFiles.filter((file) => !/\.md$/i.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const documents = [];

for (const sourcePath of markdownFiles) {
  const source = await fs.readFile(path.join(root, sourcePath), "utf8");
  const outputPath = outputPathFor(sourcePath);
  const title = documentTitle(sourcePath, source);
  const rendered = rewriteMarkdownLinks(markdown.render(source), outputPath).replace(/^\s*<h1>.*?<\/h1>\s*/s, "");
  documents.push({ sourcePath, outputPath, title, rendered });
}

for (const document of documents) {
  const relatedAssets = assetFiles.filter((assetPath) => path.posix.dirname(assetPath) === path.posix.dirname(document.sourcePath));
  const attachments = relatedAssets.length ? `<section class="mt-12 border-t border-base-300 pt-6">
    <h2 class="mb-4 font-mono text-xs font-bold uppercase tracking-[.16em] text-base-content/55">Files in this lab</h2>
    <div class="grid gap-2">${relatedAssets.map((assetPath) => `<a class="card card-compact border border-base-300 bg-base-100 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg" href="${escapeHtml(hrefFrom(document.outputPath, assetPath))}"><div class="card-body flex-row items-center justify-between"><span class="flex min-w-0 items-center gap-3 font-medium">${icon("file", "size-4 shrink-0 text-primary")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></span><span class="font-mono text-[.65rem] uppercase text-base-content/45">open ${icon("arrow", "inline size-3")}</span></div></a>`).join("\n")}</div>
  </section>` : "";
  const body = `<main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16"><article class="mx-auto max-w-4xl">
    <div class="mb-10 border-b border-base-300 pb-8"><div class="mb-3 font-mono text-xs font-bold uppercase tracking-[.18em] text-primary">${escapeHtml(document.sourcePath)}</div><h1 class="font-display text-4xl font-extrabold leading-[1.05] tracking-[-.045em] sm:text-6xl">${escapeHtml(document.title)}</h1></div>
    <div class="prose max-w-none">${document.rendered}</div>
    ${attachments}
  </article></main>`;
  await fs.mkdir(path.dirname(path.join(outputDir, document.outputPath)), { recursive: true });
  await fs.writeFile(path.join(outputDir, document.outputPath), pageTemplate({ title: document.title, body, activePath: document.outputPath, documents, assetFiles }));
}

const documentGroups = groupedByDirectory(documents);
const groups = [...documentGroups.entries()].map(([groupName, entries]) => `<div class="space-y-3"><div class="font-mono text-xs font-bold uppercase tracking-[.16em] text-base-content/50">${escapeHtml(groupName === "." ? "Root notes" : groupName)}</div><div class="grid gap-3">${entries.map((document) => `<a class="card border border-base-300 bg-base-100 transition hover:-translate-y-1 hover:border-primary hover:shadow-xl" href="${escapeHtml(document.outputPath)}"><div class="card-body gap-2 p-5 sm:p-6"><div class="flex items-start justify-between gap-4"><div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">${icon("book", "size-5")}</div><span class="badge badge-ghost font-mono text-[.65rem]">read note</span></div><h3 class="card-title mt-2 font-display text-xl">${escapeHtml(document.title)}</h3><p class="font-mono text-xs text-base-content/50">${escapeHtml(document.sourcePath)}</p></div></a>`).join("\n")}</div></div>`).join("\n");

const assetGroups = groupedByDirectory(assetFiles);
const assets = [...assetGroups.entries()].map(([groupName, entries]) => `<div class="space-y-3"><div class="font-mono text-xs font-bold uppercase tracking-[.16em] text-base-content/50">${escapeHtml(groupName === "." ? "Root files" : groupName)}</div><div class="grid gap-2">${entries.map((assetPath) => `<a class="flex items-center justify-between gap-4 rounded-xl border border-base-300 bg-base-100 px-4 py-3 transition hover:border-primary hover:shadow-md" href="${escapeHtml(assetPath)}"><span class="flex min-w-0 items-center gap-3 font-medium">${icon("file", "size-4 shrink-0 text-primary")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></span><span class="font-mono text-[.65rem] uppercase text-base-content/45">open ${icon("arrow", "inline size-3")}</span></a>`).join("\n")}</div></div>`).join("\n");

const latestDirectory = documents.at(-1)?.sourcePath.split("/")[0] ?? "—";
const indexBody = `<main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
  <section class="hero-grid relative isolate overflow-hidden rounded-[2rem] bg-neutral px-6 py-10 text-neutral-content shadow-2xl shadow-neutral/15 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
    <div class="pointer-events-none absolute -right-20 -top-28 -z-10 size-96 rounded-full bg-primary/25 blur-3xl"></div><div class="pointer-events-none absolute -bottom-40 left-1/3 -z-10 size-80 rounded-full bg-secondary/20 blur-3xl"></div>
    <div class="max-w-3xl"><div class="mb-5 flex flex-wrap items-center gap-2"><span class="badge badge-primary px-3 py-3 font-mono text-[.65rem] uppercase tracking-[.14em]">operating systems</span><span class="font-mono text-xs text-neutral-content/55">/ practical record</span></div><h1 class="font-display text-5xl font-black leading-[.95] tracking-[-.065em] sm:text-7xl">The lab, <span class="text-primary">documented.</span></h1><p class="mt-6 max-w-2xl text-base leading-relaxed text-neutral-content/70 sm:text-lg">A living archive of experiments, commands, and field notes. Read the source material without the folder hunt.</p><a class="btn btn-primary mt-8 gap-2" href="#experiments">Browse experiments ${icon("arrow", "size-4")}</a></div>
  </section>
  <section class="stats stats-vertical mt-6 w-full border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
    <div class="stat"><div class="stat-title font-mono text-[.65rem] uppercase tracking-[.14em]">experiments</div><div class="stat-value font-display text-3xl text-primary">${documents.length}</div><div class="stat-desc">Markdown lab notes</div></div>
    <div class="stat"><div class="stat-title font-mono text-[.65rem] uppercase tracking-[.14em]">lab dates</div><div class="stat-value font-display text-3xl">${new Set(documents.map((document) => path.posix.dirname(document.sourcePath))).size}</div><div class="stat-desc">organized in folders</div></div>
    <div class="stat"><div class="stat-title font-mono text-[.65rem] uppercase tracking-[.14em]">attachments</div><div class="stat-value font-display text-3xl">${assetFiles.length}</div><div class="stat-desc">PDFs and other files</div></div>
    <div class="stat"><div class="stat-title font-mono text-[.65rem] uppercase tracking-[.14em]">latest entry</div><div class="stat-value font-display text-2xl">${escapeHtml(latestDirectory)}</div><div class="stat-desc">most recent folder</div></div>
  </section>
  <section id="experiments" class="mt-16 scroll-mt-24"><div class="mb-7 flex items-end justify-between gap-4"><div><div class="font-mono text-xs font-bold uppercase tracking-[.18em] text-primary">01 / experiments</div><h2 class="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Choose a lab note.</h2></div><span class="hidden font-mono text-xs text-base-content/45 sm:block">${documents.length} records indexed</span></div><div class="space-y-10">${groups || "<p class=\"text-base-content/60\">No experiments yet.</p>"}</div></section>
  ${assets ? `<section class="mt-16 border-t border-base-300 pt-12"><div class="mb-7"><div class="font-mono text-xs font-bold uppercase tracking-[.18em] text-primary">02 / files</div><h2 class="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Reference material.</h2><p class="mt-2 max-w-xl text-base-content/60">PDFs, images, archives, and other files stored alongside the raw notes.</p></div><div class="space-y-8">${assets}</div></section>` : ""}
</main>`;
await fs.writeFile(path.join(outputDir, "index.html"), pageTemplate({ title: "Home", body: indexBody, documents, assetFiles }));
await fs.writeFile(path.join(outputDir, ".nojekyll"), "");

for (const relativePath of assetFiles) {
  const destination = path.join(outputDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(root, relativePath), destination);
}

console.log(`Built ${documents.length} Markdown document(s) and ${assetFiles.length} asset(s) into ${path.relative(root, outputDir)}/`);
