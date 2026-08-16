import fs from "node:fs/promises";
import path from "node:path";
import MarkdownIt from "markdown-it";

const root = process.cwd();
const outputDir = path.join(root, "site");
const ignoredDirectories = new Set([".git", ".github", "node_modules", "site", "scripts"]);
const ignoredFiles = new Set([".gitignore", "package.json", "package-lock.json"]);

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

function addClass(token, className) {
  const existing = token.attrGet("class");
  token.attrSet("class", [existing, className].filter(Boolean).join(" "));
}

function makeMarkdown() {
  const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true });
  const rules = markdown.renderer.rules;

  rules.heading_open = (tokens, index, options, env, self) => {
    const sizes = { h1: "mt-8 text-3xl font-bold tracking-tight first:mt-0", h2: "mt-10 border-b border-base-300 pb-2 text-2xl font-bold tracking-tight", h3: "mt-8 text-xl font-bold", h4: "mt-6 text-lg font-semibold" };
    addClass(tokens[index], sizes[tokens[index].tag] ?? "mt-6 font-semibold");
    return self.renderToken(tokens, index, options);
  };

  rules.paragraph_open = (tokens, index, options, env, self) => {
    addClass(tokens[index], "my-4 leading-7");
    return self.renderToken(tokens, index, options);
  };

  rules.bullet_list_open = (tokens, index, options, env, self) => {
    addClass(tokens[index], "my-4 list-disc space-y-2 ps-6");
    return self.renderToken(tokens, index, options);
  };

  rules.ordered_list_open = (tokens, index, options, env, self) => {
    addClass(tokens[index], "my-4 list-decimal space-y-2 ps-6");
    return self.renderToken(tokens, index, options);
  };

  rules.list_item_open = (tokens, index, options, env, self) => {
    addClass(tokens[index], "ps-1");
    return self.renderToken(tokens, index, options);
  };

  rules.blockquote_open = (tokens, index, options, env, self) => {
    addClass(tokens[index], "my-6 border-s-4 border-primary bg-base-200 p-4 italic");
    return self.renderToken(tokens, index, options);
  };

  rules.link_open = (tokens, index, options, env, self) => {
    addClass(tokens[index], "link link-primary");
    return self.renderToken(tokens, index, options);
  };

  rules.image = (tokens, index, options, env, self) => {
    addClass(tokens[index], "max-w-full rounded-box");
    return self.renderToken(tokens, index, options);
  };

  rules.hr = (tokens, index, options, env, self) => {
    addClass(tokens[index], "my-8 border-base-300");
    return self.renderToken(tokens, index, options);
  };

  rules.code_inline = (tokens, index) => `<code class="rounded bg-base-200 px-1.5 py-0.5 font-mono text-sm">${escapeHtml(tokens[index].content)}</code>`;
  rules.softbreak = () => "<br>\n";
  rules.fence = (tokens, index) => `<div class="mockup-code my-6 overflow-x-auto"><pre data-prefix="$"><code>${escapeHtml(tokens[index].content)}</code></pre></div>`;

  rules.table_open = () => '<div class="my-6 overflow-x-auto"><table class="table table-zebra">';
  rules.table_close = () => "</table></div>";
  rules.thead_open = () => "<thead>";
  rules.thead_close = () => "</thead>";
  rules.tbody_open = () => "<tbody>";
  rules.tbody_close = () => "</tbody>";
  rules.tr_open = () => "<tr>";
  rules.tr_close = () => "</tr>";
  rules.th_open = () => '<th class="whitespace-nowrap">';
  rules.th_close = () => "</th>";
  rules.td_open = () => "<td>";
  rules.td_close = () => "</td>";

  return markdown;
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
    const sourcePath = entry.sourcePath ?? entry;
    const directory = path.posix.dirname(sourcePath);
    if (!groups.has(directory)) groups.set(directory, []);
    groups.get(directory).push(entry);
  }
  return groups;
}

function sidebarMarkup({ activePath, documents, assetFiles }) {
  const documentGroups = groupedByDirectory(documents);
  const assetGroups = groupedByDirectory(assetFiles);
  const navGroups = (groups, assets = false) => [...groups.entries()].map(([directory, entries]) => `<li>
    <div class="menu-title is-drawer-close:hidden">${escapeHtml(directory === "." ? (assets ? "Root files" : "Root notes") : directory)}</div>
    <ul>${entries.map((entry) => {
      const targetPath = assets ? entry : entry.outputPath;
      const label = assets ? path.posix.basename(entry) : entry.title;
      return `<li><a class="${activePath === targetPath ? "menu-active" : ""} is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="${escapeHtml(label)}" href="${escapeHtml(hrefFrom(activePath, targetPath))}">${icon(assets ? "file" : "book")}<span class="is-drawer-close:hidden truncate">${escapeHtml(label)}</span></a></li>`;
    }).join("\n")}</ul>
  </li>`).join("\n");

  return `<div class="is-drawer-close:w-16 is-drawer-open:w-72 flex min-h-full flex-col bg-base-100 transition-[width]">
    <div class="flex items-center gap-3 p-3 is-drawer-close:justify-center"><div class="badge badge-primary badge-lg">OS</div><div class="is-drawer-close:hidden"><div class="font-bold">OS Lab Archive</div><div class="text-xs text-base-content/60">course notebook</div></div></div>
    <ul class="menu w-full grow gap-1 px-2">
      <li><a class="${!activePath ? "menu-active" : ""} is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="All experiments" href="${escapeHtml(hrefFrom(activePath, "index.html"))}">${icon("folder")}<span class="is-drawer-close:hidden">All experiments</span></a></li>
      ${navGroups(documentGroups)}
      ${assetFiles.length ? `<li class="mt-3 border-t border-base-300 pt-2">${navGroups(assetGroups, true)}</li>` : ""}
    </ul>
    <div class="p-2"><label for="site-drawer" class="btn btn-ghost btn-circle drawer-button is-drawer-open:rotate-y-180 is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Expand sidebar">${icon("arrow")}</label></div>
  </div>`;
}

function pageTemplate({ title, body, activePath = "", documents, assetFiles }) {
  const rootPrefix = activePath ? "../".repeat(activePath.split("/").length - 1) : "";
  return `<!doctype html>
<html lang="en">
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
    <div class="drawer-content flex min-h-screen flex-col">
      <div class="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur sm:px-8">
        <div class="navbar-start gap-2"><label for="site-drawer" aria-label="Open sidebar" class="btn btn-square btn-ghost drawer-button lg:hidden">${icon("menu")}</label><a href="${rootPrefix}index.html" class="text-sm font-bold sm:text-base">Operating Systems <span class="text-primary">/</span> Programs</a></div>
        <div class="navbar-end"><label class="swap swap-rotate btn btn-circle btn-ghost" title="Toggle dark theme"><input type="checkbox" value="dark" class="theme-controller" aria-label="Toggle dark theme">${icon("sun", "swap-off size-5")} ${icon("moon", "swap-on size-5")}</label></div>
      </div>
      ${body}
      <footer class="footer footer-center border-t border-base-300 bg-base-100 p-6 text-sm text-base-content/60 sm:footer-horizontal sm:justify-between sm:px-8"><aside>Built from Markdown on <code>main</code>.</aside><nav><a class="link link-hover" href="https://github.com/SpreadSheets600/Operating-Systems-Programs">View repository ${icon("arrow", "inline size-3.5")}</a></nav></footer>
    </div>
    <div class="drawer-side is-drawer-close:overflow-visible z-40">
      <label for="site-drawer" aria-label="Close sidebar" class="drawer-overlay"></label>
      ${sidebarMarkup({ activePath, documents, assetFiles })}
    </div>
  </div>
</body>
</html>
`;
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const markdown = makeMarkdown();
const allFiles = await walk(root);
const markdownFiles = allFiles.filter((file) => /\.md$/i.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const assetFiles = allFiles.filter((file) => !/\.md$/i.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const documents = [];

for (const sourcePath of markdownFiles) {
  const source = await fs.readFile(path.join(root, sourcePath), "utf8");
  const outputPath = outputPathFor(sourcePath);
  const rendered = markdown.render(source).replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");
  documents.push({ sourcePath, outputPath, title: documentTitle(sourcePath, source), rendered });
}

for (const document of documents) {
  const relatedAssets = assetFiles.filter((assetPath) => path.posix.dirname(assetPath) === path.posix.dirname(document.sourcePath));
  const attachments = relatedAssets.length ? `<section class="mt-12 border-t border-base-300 pt-6">
    <h2 class="mb-4 text-xl font-bold">Files in this lab</h2>
    <div class="grid gap-3">${relatedAssets.map((assetPath) => `<a class="card card-border bg-base-100 transition hover:border-primary" href="${escapeHtml(hrefFrom(document.outputPath, assetPath))}"><div class="card-body flex-row items-center justify-between p-4"><span class="flex min-w-0 items-center gap-3 font-medium">${icon("file", "size-4 shrink-0 text-primary")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></span><span class="text-sm text-base-content/60">Open ${icon("arrow", "inline size-3")}</span></div></a>`).join("\n")}</div>
  </section>` : "";
  const body = `<main class="container mx-auto w-full max-w-5xl grow px-4 py-8 sm:px-8 sm:py-12"><article>
    <div class="mb-10 border-b border-base-300 pb-8"><div class="mb-3 font-mono text-xs uppercase tracking-wider text-primary">${escapeHtml(document.sourcePath)}</div><h1 class="text-4xl font-bold tracking-tight sm:text-6xl">${escapeHtml(document.title)}</h1></div>
    <div class="max-w-none">${document.rendered}</div>
    ${attachments}
  </article></main>`;
  await fs.mkdir(path.dirname(path.join(outputDir, document.outputPath)), { recursive: true });
  await fs.writeFile(path.join(outputDir, document.outputPath), pageTemplate({ title: document.title, body, activePath: document.outputPath, documents, assetFiles }));
}

const documentGroups = groupedByDirectory(documents);
const groups = [...documentGroups.entries()].map(([groupName, entries]) => `<div class="space-y-3"><div class="text-xs font-semibold uppercase tracking-wider text-base-content/60">${escapeHtml(groupName === "." ? "Root notes" : groupName)}</div><div class="grid gap-4 md:grid-cols-2">${entries.map((document) => `<a class="card card-border bg-base-100 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg" href="${escapeHtml(document.outputPath)}"><div class="card-body"><div class="flex items-start justify-between gap-3"><div class="flex size-10 items-center justify-center rounded-box bg-primary/10 text-primary">${icon("book", "size-5")}</div><span class="badge">Read note</span></div><h3 class="card-title mt-2">${escapeHtml(document.title)}</h3><p class="text-sm text-base-content/60">${escapeHtml(document.sourcePath)}</p></div></a>`).join("\n")}</div></div>`).join("\n");

const assetGroups = groupedByDirectory(assetFiles);
const assets = [...assetGroups.entries()].map(([groupName, entries]) => `<div class="space-y-3"><div class="text-xs font-semibold uppercase tracking-wider text-base-content/60">${escapeHtml(groupName === "." ? "Root files" : groupName)}</div><div class="grid gap-3 sm:grid-cols-2">${entries.map((assetPath) => `<a class="card card-border bg-base-100 transition hover:border-primary" href="${escapeHtml(assetPath)}"><div class="card-body flex-row items-center justify-between p-4"><span class="flex min-w-0 items-center gap-3 font-medium">${icon("file", "size-4 shrink-0 text-primary")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></span><span class="text-sm text-base-content/60">Open ${icon("arrow", "inline size-3")}</span></div></a>`).join("\n")}</div></div>`).join("\n");

const latestDirectory = documents.at(-1)?.sourcePath.split("/")[0] ?? "—";
const indexBody = `<main class="container mx-auto w-full max-w-7xl grow px-4 py-8 sm:px-8 sm:py-12">
  <div class="hero rounded-box bg-neutral text-neutral-content shadow-xl"><div class="hero-content w-full flex-col items-start gap-8 py-12 sm:py-16 lg:flex-row lg:items-end lg:justify-between"><div class="max-w-3xl"><div class="badge badge-primary mb-4">Operating systems · practical record</div><h1 class="text-5xl font-bold leading-tight sm:text-7xl">The lab, <span class="text-primary">documented.</span></h1><p class="mt-5 max-w-2xl text-base text-neutral-content/75 sm:text-lg">A living archive of experiments, commands, and field notes. Read the source material without the folder hunt.</p><a class="btn btn-primary mt-7" href="#experiments">Browse experiments ${icon("arrow", "size-4")}</a></div><div class="stats stats-vertical w-full bg-base-100 text-base-content shadow sm:stats-horizontal lg:w-auto"><div class="stat"><div class="stat-title">Experiments</div><div class="stat-value text-primary">${documents.length}</div><div class="stat-desc">Markdown notes</div></div><div class="stat"><div class="stat-title">Attachments</div><div class="stat-value">${assetFiles.length}</div><div class="stat-desc">PDFs & files</div></div></div></div></div>
  <section id="experiments" class="scroll-mt-24 py-14"><div class="mb-8 flex items-end justify-between gap-4"><div><div class="text-sm font-semibold uppercase tracking-wider text-primary">01 / Experiments</div><h2 class="mt-2 text-3xl font-bold sm:text-4xl">Choose a lab note.</h2></div><span class="hidden text-sm text-base-content/60 sm:block">${documents.length} records indexed</span></div><div class="space-y-10">${groups || "<p class=\"text-base-content/60\">No experiments yet.</p>"}</div></section>
  ${assets ? `<section class="border-t border-base-300 py-14"><div class="mb-8"><div class="text-sm font-semibold uppercase tracking-wider text-primary">02 / Files</div><h2 class="mt-2 text-3xl font-bold sm:text-4xl">Reference material.</h2><p class="mt-2 max-w-xl text-base-content/60">PDFs, images, archives, and other files stored alongside the raw notes.</p></div><div class="space-y-8">${assets}</div></section>` : ""}
  <div class="alert mt-4"><span>${icon("folder")}Latest entry: <strong>${escapeHtml(latestDirectory)}</strong></span></div>
</main>`;
await fs.writeFile(path.join(outputDir, "index.html"), pageTemplate({ title: "Home", body: indexBody, documents, assetFiles }));
await fs.writeFile(path.join(outputDir, ".nojekyll"), "");

for (const relativePath of assetFiles) {
  const destination = path.join(outputDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(root, relativePath), destination);
}

console.log(`Built ${documents.length} Markdown document(s) and ${assetFiles.length} asset(s) into ${path.relative(root, outputDir)}/`);
