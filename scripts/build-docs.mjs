import path from "node:path";
import fs from "node:fs/promises";
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

const outputPathFor = (relativePath) => relativePath.replace(/\.md$/i, ".html");

function hrefFrom(activePath, targetPath) {
    const fromDirectory = path.posix.dirname(activePath || "index.html");
    return (
        path.posix.relative(fromDirectory, targetPath) ||
        path.posix.basename(targetPath)
    );
}

function addClass(token, className) {
    const existing = token.attrGet("class");
    token.attrSet("class", [existing, className].filter(Boolean).join(" "));
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

function sourceLabel(sourcePath) {
    const directory = path.posix.dirname(sourcePath);
    return directory === "." ? "Root notes" : directory;
}

function archiveTimestamp(sourcePath) {
    const date = sourcePath.match(/(?:^|\/)(\d{2})-(\d{2})-(\d{4})(?:\/|$)/);
    if (!date) return 0;
    return Date.UTC(Number(date[3]), Number(date[2]) - 1, Number(date[1]));
}

function readableDate(sourcePath) {
    const date = sourcePath.match(/(?:^|\/)(\d{2})-(\d{2})-(\d{4})(?:\/|$)/);
    if (!date) return sourceLabel(sourcePath);
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(
        new Date(
            Date.UTC(Number(date[3]), Number(date[2]) - 1, Number(date[1])),
        ),
    );
}

function documentTitle(source, sourcePath) {
    const heading = source.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return heading || sourcePath.replace(/\.md$/i, "").split("/").at(-1);
}

function isShellLanguage(language) {
    return ["bash", "shell", "sh", "zsh", "console", "terminal"].includes(
        language.toLowerCase(),
    );
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
        const inline = tokens[index + 1];
        const source = inline?.content ?? "section";
        const baseId = slugify(source);
        const count = (env.headingIds.get(baseId) ?? 0) + 1;
        const id = count === 1 ? baseId : `${baseId}-${count}`;
        env.headingIds.set(baseId, count);
        token.attrSet("id", id);

        const sizes = {
            h1: "mt-8 text-3xl font-bold tracking-tight first:mt-0",
            h2: "mt-12 scroll-mt-24 border-b border-base-300 pb-3 text-2xl font-semibold tracking-tight sm:text-3xl",
            h3: "mt-9 scroll-mt-24 text-xl font-semibold tracking-tight",
            h4: "mt-7 scroll-mt-24 text-lg font-semibold",
        };
        addClass(token, sizes[token.tag] ?? "mt-6 scroll-mt-24 font-semibold");

        if (token.tag !== "h1")
            env.headings.push({
                id,
                text: source.replace(/[`*_]/g, ""),
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
            const candidate = path.posix.normalize(
                path.posix.join(path.posix.dirname(env.sourcePath), linkPath),
            );
            if (documentPaths.has(candidate))
                token.attrSet(
                    "href",
                    `${hrefFrom(env.outputPath, outputPathFor(candidate))}${suffix}`,
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
        const prefix = isShellLanguage(language) ? ' data-prefix="$"' : "";
        return `<div class="mockup-code my-7 overflow-x-auto border border-base-300 text-sm shadow-none"><pre${prefix}><code class="language-${escapeHtml(language)}">${escapeHtml(tokens[index].content)}</code></pre></div>`;
    };
    rules.table_open = () =>
        '<div class="my-7 overflow-x-auto rounded-box border border-base-300"><table class="table table-zebra">';
    rules.table_close = () => "</table></div>";
    rules.th_open = () => '<th class="whitespace-nowrap font-semibold">';

    return markdown;
}

function icon(name, className = "size-4") {
    const paths = {
        archive: '<path d="M4 7h16v13H4z"/><path d="M3 3h18v4H3zM9 12h6"/>',
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
    const documentNavigation = [...documentGroups.entries()]
        .map(
            ([directory, entries]) => `<li>
    <span class="menu-title">${escapeHtml(readableDate(`${directory}/`))}</span>
    <ul>${entries.map((document) => `<li><a class="${activePath === document.outputPath ? "menu-active" : ""}" href="${escapeHtml(hrefFrom(activePath, document.outputPath))}">${icon("book")}<span class="truncate">${escapeHtml(document.title)}</span></a></li>`).join("\n")}</ul>
  </li>`,
        )
        .join("\n");
    const assetNavigation = assetFiles.length
        ? `<li class="mt-4 border-t border-base-300 pt-3"><span class="menu-title">Files</span><ul>${[
              ...assetGroups.values(),
          ]
              .flat()
              .map(
                  (assetPath) =>
                      `<li><a href="${escapeHtml(hrefFrom(activePath, assetPath))}">${icon("file")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></a></li>`,
              )
              .join("\n")}</ul></li>`
        : "";

    return `<aside class="min-h-full w-72 border-e border-base-300 bg-base-100 p-4">
    <a class="mb-6 flex items-center gap-3 px-2" href="${escapeHtml(hrefFrom(activePath, "index.html"))}">
      <span class="flex size-9 items-center justify-center rounded-field bg-primary text-primary-content">${icon("archive", "size-4")}</span>
      <span><span class="block text-sm font-semibold">OS Lab Archive</span><span class="block font-mono text-[11px] text-base-content/55">course notebook</span></span>
    </a>
    <ul class="menu menu-sm w-full gap-1">
      <li><a class="${!activePath ? "menu-active" : ""}" href="${escapeHtml(hrefFrom(activePath, "index.html"))}">${icon("folder")}All lab notes</a></li>
      ${documentNavigation}
      ${assetNavigation}
    </ul>
  </aside>`;
}

function pageTemplate({ title, body, activePath = "", documents, assetFiles }) {
    const rootPrefix = activePath
        ? "../".repeat(activePath.split("/").length - 1)
        : "";
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Operating systems lab programs and course notes.">
  <title>${escapeHtml(title)} · OS Lab Archive</title>
  <link rel="stylesheet" href="${rootPrefix}styles.css">
</head>
<body class="min-h-screen bg-base-100 text-base-content">
  <div class="drawer lg:drawer-open">
    <input id="site-drawer" type="checkbox" class="drawer-toggle">
    <div class="drawer-content flex min-h-screen flex-col">
      <header class="navbar sticky top-0 z-30 min-h-15 border-b border-base-300 bg-base-100/95 px-4 backdrop-blur sm:px-8">
        <div class="navbar-start gap-3"><label for="site-drawer" aria-label="Open navigation" class="btn btn-square btn-ghost btn-sm drawer-button lg:hidden">${icon("menu")}</label><a href="${rootPrefix}index.html" class="font-mono text-xs font-medium tracking-wide text-base-content/70 sm:text-sm">~/os-lab/archive</a></div>
        <div class="navbar-end"><label class="swap swap-rotate btn btn-circle btn-ghost btn-sm" title="Toggle dark theme"><input type="checkbox" value="dark" class="theme-controller" aria-label="Toggle dark theme">${icon("sun", "swap-off size-4")} ${icon("moon", "swap-on size-4")}</label></div>
      </header>
      ${body}
      <footer class="footer footer-center mt-auto border-t border-base-300 bg-base-100 px-6 py-5 text-xs text-base-content/55 sm:footer-horizontal sm:justify-between sm:px-8"><aside>OS Lab Archive · Markdown-first course record</aside><nav><a class="link link-hover" href="https://github.com/SpreadSheets600/Operating-Systems-Programs">Source repository ${icon("arrow", "inline size-3")}</a></nav></footer>
    </div>
    <div class="drawer-side z-40"><label for="site-drawer" aria-label="Close navigation" class="drawer-overlay"></label>${sidebarMarkup({ activePath, documents, assetFiles })}</div>
  </div>
</body>
</html>`;
}

function tableOfContents(headings) {
    if (!headings.length) return "";
    return `<nav class="rounded-box border border-base-300 bg-base-100 p-4 xl:sticky xl:top-24" aria-label="On this page">
    <div class="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-base-content/55">On this page</div>
    <ol class="space-y-2 text-sm">${headings.map((heading) => `<li class="${heading.level === 3 ? "ps-3" : heading.level > 3 ? "ps-6" : ""}"><a class="link link-hover text-base-content/70" href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`).join("")}</ol>
  </nav>`;
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const allFiles = await walk(root);
const markdownFiles = allFiles.filter((file) => /\.md$/i.test(file));
const assetFiles = allFiles
    .filter((file) => !/\.md$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const documentPaths = new Set(markdownFiles);
const markdown = makeMarkdown(documentPaths);
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
        title: documentTitle(source, sourcePath),
        rendered,
        headings: env.headings,
    });
}

documents.sort(
    (a, b) =>
        archiveTimestamp(b.sourcePath) - archiveTimestamp(a.sourcePath) ||
        a.sourcePath.localeCompare(b.sourcePath),
);

for (const document of documents) {
    const relatedAssets = assetFiles.filter(
        (assetPath) =>
            path.posix.dirname(assetPath) ===
            path.posix.dirname(document.sourcePath),
    );
    const attachments = relatedAssets.length
        ? `<section class="mt-14 border-t border-base-300 pt-8">
    <p class="font-mono text-xs uppercase tracking-wider text-base-content/55">Attachments</p>
    <div class="mt-4 grid gap-3">${relatedAssets.map((assetPath) => `<a class="card card-border bg-base-100 transition-colors hover:border-primary" href="${escapeHtml(hrefFrom(document.outputPath, assetPath))}"><div class="card-body flex-row items-center justify-between gap-4 p-4"><span class="flex min-w-0 items-center gap-3 font-medium">${icon("file", "size-4 shrink-0 text-primary")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></span><span class="shrink-0 text-sm text-base-content/55">Open ${icon("arrow", "inline size-3")}</span></div></a>`).join("\n")}</div>
  </section>`
        : "";
    const body = `<main class="mx-auto w-full max-w-7xl grow px-4 py-8 sm:px-8 sm:py-12">
    <div class="mb-8 flex items-center gap-2 text-xs text-base-content/60"><a class="link link-hover" href="${hrefFrom(document.outputPath, "index.html")}">Archive</a><span>/</span><span class="font-mono">${escapeHtml(document.sourcePath)}</span></div>
    <div class="mb-12 max-w-3xl border-b border-base-300 pb-9"><p class="mb-3 font-mono text-xs uppercase tracking-wider text-primary">Lab note · ${escapeHtml(readableDate(document.sourcePath))}</p><h1 class="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">${escapeHtml(document.title)}</h1></div>
    <div class="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_15rem]"><article class="min-w-0 max-w-3xl">${document.rendered}${attachments}</article><aside>${tableOfContents(document.headings)}</aside></div>
  </main>`;
    await fs.mkdir(path.dirname(path.join(outputDir, document.outputPath)), {
        recursive: true,
    });
    await fs.writeFile(
        path.join(outputDir, document.outputPath),
        pageTemplate({
            title: document.title,
            body,
            activePath: document.outputPath,
            documents,
            assetFiles,
        }),
    );
}

const documentGroups = groupedByDirectory(documents);
const groups = [...documentGroups.entries()]
    .map(
        ([
            groupName,
            entries,
        ]) => `<section class="border-t border-base-300 py-8 first:border-t-0 first:pt-0">
  <div class="mb-5 flex items-baseline justify-between gap-4"><h3 class="font-mono text-sm font-medium">${escapeHtml(readableDate(`${groupName}/`))}</h3><span class="text-xs text-base-content/50">${entries.length} ${entries.length === 1 ? "note" : "notes"}</span></div>
  <div class="grid gap-3">${entries.map((document) => `<a class="card card-border bg-base-100 transition-colors hover:border-primary" href="${escapeHtml(document.outputPath)}"><div class="card-body gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div class="min-w-0"><div class="mb-2 flex items-center gap-2 text-xs text-base-content/55">${icon("book", "size-3.5 text-primary")}<span class="font-mono">${escapeHtml(document.sourcePath)}</span></div><h4 class="text-lg font-semibold tracking-tight">${escapeHtml(document.title)}</h4></div><span class="shrink-0 text-sm font-medium text-primary">Read note ${icon("arrow", "inline size-3.5")}</span></div></a>`).join("\n")}</div>
</section>`,
    )
    .join("\n");

const assetGroups = groupedByDirectory(assetFiles);
const assets = [...assetGroups.entries()]
    .map(
        ([groupName, entries]) =>
            `<div><p class="mb-3 font-mono text-xs text-base-content/55">${escapeHtml(groupName === "." ? "Root files" : groupName)}</p><div class="grid gap-3 sm:grid-cols-2">${entries.map((assetPath) => `<a class="card card-border bg-base-100 transition-colors hover:border-primary" href="${escapeHtml(assetPath)}"><div class="card-body flex-row items-center justify-between gap-3 p-4"><span class="flex min-w-0 items-center gap-3 font-medium">${icon("file", "size-4 shrink-0 text-primary")}<span class="truncate">${escapeHtml(path.posix.basename(assetPath))}</span></span>${icon("arrow", "size-4 shrink-0 text-base-content/50")}</div></a>`).join("\n")}</div></div>`,
    )
    .join("\n");

const latest = documents[0];
const indexBody = `<main class="mx-auto w-full max-w-6xl grow px-4 py-10 sm:px-8 sm:py-16">
  <section class="border-y border-base-300 py-10 sm:py-14">
    <div class="max-w-3xl"><div class="badge badge-outline mb-5 font-mono text-xs">Operating systems · lab archive</div><h1 class="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Coursework, kept readable.</h1><p class="mt-5 max-w-2xl leading-8 text-base-content/70 sm:text-lg">A quiet index of operating-systems experiments, commands, and results—rendered from the original Markdown, without the folder hunt.</p></div>
    <div class="stats stats-vertical mt-9 w-full border border-base-300 bg-base-100 shadow-none sm:stats-horizontal sm:w-auto"><div class="stat py-4"><div class="stat-title">Lab notes</div><div class="stat-value text-3xl text-primary">${documents.length}</div><div class="stat-desc">Markdown records</div></div><div class="stat py-4"><div class="stat-title">Attachments</div><div class="stat-value text-3xl">${assetFiles.length}</div><div class="stat-desc">Files alongside notes</div></div></div>
  </section>
  <section id="experiments" class="py-12 sm:py-16"><div class="mb-8 flex items-end justify-between gap-4"><div><p class="font-mono text-xs uppercase tracking-wider text-base-content/55">Notebook index</p><h2 class="mt-2 text-3xl font-semibold tracking-tight">Lab notes</h2></div>${latest ? `<span class="hidden text-right text-xs text-base-content/55 sm:block">Latest record<br><strong class="font-medium text-base-content">${escapeHtml(readableDate(latest.sourcePath))}</strong></span>` : ""}</div>${groups || '<p class="text-base-content/60">No lab notes have been added yet.</p>'}</section>
  ${assets ? `<section class="border-t border-base-300 py-12 sm:py-16"><p class="font-mono text-xs uppercase tracking-wider text-base-content/55">Supporting material</p><h2 class="mt-2 text-3xl font-semibold tracking-tight">Files</h2><div class="mt-8 space-y-7">${assets}</div></section>` : ""}
</main>`;

await fs.writeFile(
    path.join(outputDir, "index.html"),
    pageTemplate({ title: "Home", body: indexBody, documents, assetFiles }),
);
await fs.writeFile(path.join(outputDir, ".nojekyll"), "");

for (const relativePath of assetFiles) {
    const destination = path.join(outputDir, relativePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(root, relativePath), destination);
}

console.log(
    `Built ${documents.length} Markdown document(s) and ${assetFiles.length} asset(s) into ${path.relative(root, outputDir)}/`,
);
