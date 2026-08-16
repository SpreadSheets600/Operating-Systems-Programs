import fs from "node:fs/promises";
import path from "node:path";
import MarkdownIt from "markdown-it";

const root = process.cwd();
const outputDir = path.join(root, "site");
const ignoredDirectories = new Set([
    ".git",
    ".github",
    "node_modules",
    "site",
    "scripts",
]);
const ignoredFiles = new Set([
    ".gitignore",
    "package.json",
    "package-lock.json",
]);

const escapeHtml = (value) =>
    String(value)
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
            if (
                !entry.name.startsWith(".") &&
                !ignoredDirectories.has(entry.name)
            )
                files.push(
                    ...(await walk(
                        path.join(directory, entry.name),
                        relativePath,
                    )),
                );
        } else if (!ignoredFiles.has(entry.name)) {
            files.push(relativePath);
        }
    }
    return files;
}

function outputPathFor(sourcePath) {
    return sourcePath === "README.md"
        ? "index.html"
        : sourcePath.replace(/\.md$/i, ".html");
}

function hrefFrom(activePath, targetPath) {
    const fromDirectory = path.posix.dirname(activePath || "index.html");
    return (
        path.posix.relative(fromDirectory, targetPath) ||
        path.posix.basename(targetPath)
    );
}

function addClass(token, className) {
    token.attrSet(
        "class",
        [token.attrGet("class"), className].filter(Boolean).join(" "),
    );
}

function slugify(value) {
    return (
        value
            .replace(/<[^>]*>/g, "")
            .replace(/[\[\]*_`]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-") || "section"
    );
}

function titleFrom(source, sourcePath) {
    return (
        source.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
        path.posix.basename(sourcePath, ".md")
    );
}

function isShellLanguage(language) {
    return ["bash", "shell", "sh", "zsh", "console", "terminal"].includes(
        language.toLowerCase(),
    );
}

function icon(name, className = "size-4") {
    const paths = {
        archive: '<path d="M4 7h16v13H4z"/><path d="M3 3h18v4H3zM9 12h6"/>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
        file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
        folder: '<path d="M3 7h5l2 2h11v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4"/>',
        chevron: '<path d="m9 18 6-6-6-6"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
        moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>',
        menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
        arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    };
    return `<svg aria-hidden="true" class="${className}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function makeMarkdown(documentPaths) {
    const markdown = new MarkdownIt({
        html: false,
        linkify: true,
        typographer: true,
    });
    const rules = markdown.renderer.rules;

    rules.heading_open = (tokens, index, options, env, self) => {
        const token = tokens[index];
        const text = tokens[index + 1]?.content ?? "section";
        const baseId = slugify(text);
        const occurrence = (env.headingIds.get(baseId) ?? 0) + 1;
        const id = occurrence === 1 ? baseId : `${baseId}-${occurrence}`;
        env.headingIds.set(baseId, occurrence);
        token.attrSet("id", id);
        const styles = {
            h1: "mt-8 text-3xl font-semibold tracking-tight first:mt-0 sm:text-4xl",
            h2: "mt-12 scroll-mt-24 border-b border-base-300 pb-3 text-2xl font-semibold tracking-tight sm:text-3xl",
            h3: "mt-9 scroll-mt-24 text-xl font-semibold tracking-tight",
            h4: "mt-7 scroll-mt-24 text-lg font-semibold",
        };
        addClass(token, styles[token.tag] ?? "mt-6 scroll-mt-24 font-semibold");
        if (token.tag !== "h1")
            env.headings.push({
                id,
                text: text.replace(/[`*_]/g, ""),
                level: Number(token.tag.slice(1)),
            });
        return self.renderToken(tokens, index, options);
    };
    rules.paragraph_open = (tokens, index, options, env, self) => {
        addClass(tokens[index], "my-5 leading-8 text-base-content/80");
        return self.renderToken(tokens, index, options);
    };
    rules.bullet_list_open = (tokens, index, options, env, self) => {
        addClass(
            tokens[index],
            "my-5 list-disc space-y-2 ps-6 leading-7 text-base-content/80",
        );
        return self.renderToken(tokens, index, options);
    };
    rules.ordered_list_open = (tokens, index, options, env, self) => {
        addClass(
            tokens[index],
            "my-5 list-decimal space-y-2 ps-6 leading-7 text-base-content/80",
        );
        return self.renderToken(tokens, index, options);
    };
    rules.list_item_open = (tokens, index, options, env, self) => {
        addClass(tokens[index], "ps-1");
        return self.renderToken(tokens, index, options);
    };
    rules.blockquote_open = (tokens, index, options, env, self) => {
        addClass(
            tokens[index],
            "my-7 border-s-2 border-primary bg-base-200 px-5 py-1 text-base-content/80",
        );
        return self.renderToken(tokens, index, options);
    };
    rules.link_open = (tokens, index, options, env, self) => {
        const token = tokens[index];
        const href = token.attrGet("href") ?? "";
        const [, linkPath = "", suffix = ""] =
            href.match(/^([^?#]*)([\s\S]*)$/) ?? [];
        if (linkPath && !/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(linkPath)) {
            const target = path.posix.normalize(
                path.posix.join(path.posix.dirname(env.sourcePath), linkPath),
            );
            if (documentPaths.has(target))
                token.attrSet(
                    "href",
                    `${hrefFrom(env.outputPath, outputPathFor(target))}${suffix}`,
                );
        }
        addClass(token, "link link-primary decoration-1 underline-offset-4");
        return self.renderToken(tokens, index, options);
    };
    rules.image = (tokens, index, options, env, self) => {
        tokens[index].attrSet("loading", "lazy");
        addClass(
            tokens[index],
            "my-7 h-auto max-w-full rounded-box border border-base-300",
        );
        return self.renderToken(tokens, index, options);
    };
    rules.hr = (tokens, index, options, env, self) => {
        addClass(tokens[index], "my-10 border-base-300");
        return self.renderToken(tokens, index, options);
    };
    rules.code_inline = (tokens, index) =>
        `<code class="rounded-field bg-base-200 px-1.5 py-0.5 font-mono text-[0.85em] text-base-content">${escapeHtml(tokens[index].content)}</code>`;
    rules.fence = (tokens, index) => {
        const language = tokens[index].info.trim().split(/\s+/)[0] || "text";
        const content = tokens[index].content.replace(/\r?\n$/, "");
        const isShell = isShellLanguage(language);
        const lines = content ? content.split(/\r?\n/) : [""];
        const renderedLines = lines
            .map((line) => {
                const code = `<code class="language-${escapeHtml(language)}">${escapeHtml(line || " ")}</code>`;
                // The prompt is a real inline element before the highlighted
                // code, so highlight.js can never push it onto its own line.
                return isShell
                    ? `<span class="term-prompt" aria-hidden="true">$</span>${code}`
                    : code;
            })
            .join("\n");
        return `<div class="term-block my-7"><div class="term-block-bar"><span class="term-dot"></span><span class="term-dot"></span><span class="term-dot"></span><span class="term-lang">${escapeHtml(language)}</span></div><pre class="term-block-pre">${renderedLines}</pre></div>`;
    };
    rules.table_open = () =>
        '<div class="my-7 overflow-x-auto rounded-box border border-base-300"><table class="table table-zebra">';
    rules.table_close = () => "</table></div>";
    rules.th_open = () => '<th class="whitespace-nowrap font-semibold">';
    return markdown;
}

function makeTree(documents, assets) {
    const rootNode = { folders: new Map(), files: [] };
    const insert = (sourcePath, item, type) => {
        const parts = sourcePath.split("/");
        const name = parts.pop();
        let node = rootNode;
        for (const part of parts) {
            if (!node.folders.has(part))
                node.folders.set(part, { folders: new Map(), files: [] });
            node = node.folders.get(part);
        }
        node.files.push({ name, item, type });
    };
    documents.forEach((document) =>
        insert(document.sourcePath, document, "document"),
    );
    assets.forEach((asset) => insert(asset, asset, "asset"));
    return rootNode;
}

function renderTree(node, activePath, prefix = "") {
    const folders = [...node.folders.entries()].sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true }),
    );
    const files = [...node.files].sort((a, b) =>
        a.name === "README.md"
            ? -1
            : b.name === "README.md"
              ? 1
              : a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    const renderedFolders = folders
        .map(([name, child]) => {
            const folderPath = `${prefix}${name}/`;
            const isActiveBranch = activePath.startsWith(folderPath);
            return `<li><details${isActiveBranch ? " open" : ""}><summary>${icon("folder", "size-4 text-primary")}<span class="truncate">${escapeHtml(name)}</span></summary><ul>${renderTree(child, activePath, folderPath)}</ul></details></li>`;
        })
        .join("");
    const renderedFiles = files
        .map(({ name, item, type }) => {
            const target = type === "document" ? item.outputPath : item;
            const isActive = activePath === target;
            const label = name === "README.md" ? "README.md" : name;
            return `<li><a class="${isActive ? "menu-active" : ""}" href="${escapeHtml(hrefFrom(activePath, target))}" title="${escapeHtml(type === "document" ? item.title : label)}">${icon(type === "document" ? "book" : "file")}<span class="truncate">${escapeHtml(label)}</span></a></li>`;
        })
        .join("");
    return `${renderedFolders}${renderedFiles}`;
}

function sidebarMarkup({ activePath, documents, assets, siteTitle }) {
    return `<aside class="min-h-full w-72 border-e border-base-300 bg-base-100 p-4 sm:p-5">
    <a class="mb-6 flex items-center gap-3 px-2" href="${escapeHtml(hrefFrom(activePath, "index.html"))}">
      <span class="flex size-9 items-center justify-center rounded-field bg-primary text-primary-content">${icon("archive", "size-4")}</span>
      <span class="min-w-0"><span class="block truncate text-sm font-semibold">${escapeHtml(siteTitle)}</span><span class="block font-mono text-[11px] text-base-content/55">Markdown archive</span></span>
    </a>
    <div class="mb-2 px-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-base-content/50">Explorer</div>
    <ul class="menu menu-sm w-full gap-1">${renderTree(makeTree(documents, assets), activePath)}</ul>
  </aside>`;
}

function tableOfContents(
    headings,
    className = "rounded-box border border-base-300 bg-base-100 p-4",
) {
    if (!headings.length) return "";
    return `<nav class="${className}" aria-label="On this page"><p class="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-base-content/55">On this page</p><ol class="space-y-2 text-sm">${headings.map((heading) => `<li class="${heading.level === 3 ? "ps-3" : heading.level > 3 ? "ps-6" : ""}"><a class="link link-hover text-base-content/70" href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`).join("")}</ol></nav>`;
}

const clientScript = `(() => {
  const key = "markdown-site-theme";
  const drawerKey = "markdown-site-drawer";
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const highlightTheme = document.querySelector("#highlight-theme");
  const drawer = document.querySelector("#site-drawer");
  const drawerButtons = document.querySelectorAll("[data-drawer-button]");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) themeToggle.checked = theme === "dark";
    if (highlightTheme) highlightTheme.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/" + (theme === "dark" ? "github-dark" : "github") + ".min.css";
    try { localStorage.setItem(key, theme); } catch {}
  };
  let savedTheme;
  try { savedTheme = localStorage.getItem(key); } catch {}
  setTheme(savedTheme || systemTheme);
  themeToggle?.addEventListener("change", () => setTheme(themeToggle.checked ? "dark" : "light"));
  window.hljs?.highlightAll();
  if (drawer) {
    let savedDrawer;
    try { savedDrawer = localStorage.getItem(drawerKey); } catch {}
    drawer.checked = savedDrawer === null ? window.matchMedia("(min-width: 1024px)").matches : savedDrawer === "open";
    const updateDrawer = () => {
      drawerButtons.forEach((button) => button.setAttribute("aria-expanded", String(drawer.checked)));
      try { localStorage.setItem(drawerKey, drawer.checked ? "open" : "closed"); } catch {}
    };
    drawer.addEventListener("change", updateDrawer);
    updateDrawer();
    document.querySelectorAll(".drawer-side a").forEach((link) => link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1023px)").matches) drawer.checked = false;
      updateDrawer();
    }));
  }
})();`;

function pageTemplate({
    title,
    body,
    activePath,
    documents,
    assets,
    siteTitle,
}) {
    const rootPrefix = activePath
        ? "../".repeat(activePath.split("/").length - 1)
        : "";
    return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(siteTitle)} — a Markdown-powered archive.">
  <title>${escapeHtml(title === siteTitle ? title : `${title} · ${siteTitle}`)}</title>
  <script>try{document.documentElement.dataset.theme=localStorage.getItem("markdown-site-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}</script>
  <link rel="stylesheet" href="${rootPrefix}styles.css">
  <link id="highlight-theme" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js" defer></script>
  <script src="${rootPrefix}site.js" defer></script>
</head>
<body class="min-h-screen bg-base-100 text-base-content">
  <div class="drawer">
    <input id="site-drawer" type="checkbox" class="drawer-toggle">
    <div class="drawer-content flex min-h-screen flex-col">
      <header class="navbar sticky top-0 z-30 min-h-15 border-b border-base-300 bg-base-100/95 px-4 backdrop-blur sm:px-8">
        <div class="navbar-start gap-3"><label for="site-drawer" data-drawer-button aria-label="Toggle explorer" class="btn btn-ghost btn-sm gap-2 drawer-button">${icon("menu")}<span class="hidden sm:inline">Explorer</span></label><a href="${rootPrefix}index.html" class="hidden max-w-64 truncate font-mono text-xs font-medium tracking-wide text-base-content/65 sm:block">${escapeHtml(siteTitle)}</a></div>
        <div class="navbar-end"><label class="swap swap-rotate btn btn-circle btn-ghost btn-sm" title="Toggle theme"><input data-theme-toggle type="checkbox" value="dark" class="theme-controller" aria-label="Toggle dark theme">${icon("sun", "swap-off size-4")} ${icon("moon", "swap-on size-4")}</label></div>
      </header>
      ${body}
    </div>
    <div class="drawer-side z-40"><label for="site-drawer" aria-label="Close explorer" class="drawer-overlay"></label>${sidebarMarkup({ activePath, documents, assets, siteTitle })}</div>
  </div>
</body>
</html>`;
}

function documentBody(document, assets) {
    const relatedAssets = assets.filter(
        (asset) =>
            path.posix.dirname(asset) ===
            path.posix.dirname(document.sourcePath),
    );
    const attachments = relatedAssets.length
        ? `<section class="mt-14 border-t border-base-300 pt-8"><p class="font-mono text-xs uppercase tracking-wider text-base-content/55">Files beside this note</p><ul class="list mt-3">${relatedAssets.map((asset) => `<li class="list-row rounded-box border border-base-300"><span class="flex size-9 items-center justify-center rounded-field bg-base-200 text-primary">${icon("file")}</span><a class="list-col-grow link link-hover font-medium" href="${escapeHtml(hrefFrom(document.outputPath, asset))}">${escapeHtml(path.posix.basename(asset))}</a>${icon("arrow", "size-4 text-base-content/50")}</li>`).join("")}</ul></section>`
        : "";
    const compactToc = document.headings.length
        ? `<div class="collapse collapse-arrow mb-8 border border-base-300 bg-base-100 xl:hidden"><input type="checkbox"><div class="collapse-title min-h-0 py-3 text-sm font-medium">On this page</div><div class="collapse-content">${tableOfContents(document.headings, "p-0")}</div></div>`
        : "";
    const trail =
        document.sourcePath === "README.md" ? "README.md" : document.sourcePath;
    return `<main class="mx-auto w-full max-w-7xl grow px-4 py-9 sm:px-8 sm:py-14">
    <div class="breadcrumbs mb-7 max-w-full text-xs text-base-content/55"><ul><li><a class="link link-hover" href="${hrefFrom(document.outputPath, "index.html")}">Home</a></li><li><span class="font-mono">${escapeHtml(trail)}</span></li></ul></div>
    <header class="mb-10 max-w-3xl border-b border-base-300 pb-8"><p class="mb-3 font-mono text-xs uppercase tracking-wider text-primary">Markdown document</p><h1 class="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">${escapeHtml(document.title)}</h1></header>
    ${compactToc}
    <div class="grid items-start gap-10 xl:grid-cols-[minmax(0,48rem)_15rem] xl:justify-between"><article class="min-w-0 max-w-3xl">${document.rendered}${attachments}</article><aside class="hidden xl:block xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">${tableOfContents(document.headings)}</aside></div>
  </main>`;
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const allFiles = await walk(root);
const markdownFiles = allFiles
    .filter((file) => /\.md$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const assets = allFiles
    .filter((file) => !/\.md$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const markdown = makeMarkdown(new Set(markdownFiles));
const documents = [];

for (const sourcePath of markdownFiles) {
    const source = await fs.readFile(path.join(root, sourcePath), "utf8");
    const outputPath = outputPathFor(sourcePath);
    const env = { sourcePath, outputPath, headings: [], headingIds: new Map() };
    const rendered = markdown
        .render(source, env)
        .replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");
    documents.push({
        sourcePath,
        outputPath,
        title: titleFrom(source, sourcePath),
        rendered,
        headings: env.headings,
    });
}

const homeDocument = documents.find(
    (document) => document.sourcePath === "README.md",
);
if (!homeDocument)
    throw new Error(
        "Add a root README.md. It is rendered as the site homepage and your repository README.",
    );
const siteTitle = homeDocument.title;

for (const document of documents) {
    const destination = path.join(outputDir, document.outputPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(
        destination,
        pageTemplate({
            title: document.title,
            body: documentBody(document, assets),
            activePath: document.outputPath,
            documents,
            assets,
            siteTitle,
        }),
    );
}

for (const asset of assets) {
    const destination = path.join(outputDir, asset);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(root, asset), destination);
}
await fs.writeFile(path.join(outputDir, "site.js"), clientScript);
await fs.writeFile(path.join(outputDir, ".nojekyll"), "");
console.log(
    `Built ${documents.length} Markdown document(s) and ${assets.length} asset(s) into ${path.relative(root, outputDir)}/`,
);
