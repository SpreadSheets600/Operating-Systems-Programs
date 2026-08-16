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

function pageTemplate({ title, body, activePath = "" }) {
  const homeHref = activePath ? `${"../".repeat(activePath.split("/").length - 1)}index.html` : "index.html";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Operating systems lab programs and course notes.">
  <title>${escapeHtml(title)} · Operating Systems Programs</title>
  <link rel="stylesheet" href="${"../".repeat(activePath.split("/").length - 1)}styles.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="brand" href="${homeHref}"><span class="brand-mark">●</span>Operating Systems Programs</a>
      <span class="header-note">lab notebook / course notes</span>
    </div>
  </header>
  ${body}
  <footer class="site-footer">Built from the Markdown files in this repository.</footer>
</body>
</html>
`;
}

function documentTitle(source, content) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || source.replace(/\.md$/i, "").split("/").at(-1);
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
  const rendered = rewriteMarkdownLinks(markdown.render(source), outputPath);
  const relatedAssets = assetFiles.filter((assetPath) => path.posix.dirname(assetPath) === path.posix.dirname(sourcePath));
  const attachments = relatedAssets.length ? `<section class="attachments">
    <h2>Files in this lab</h2>
    <div class="doc-links">${relatedAssets.map((assetPath) => {
      const assetHref = path.posix.relative(path.posix.dirname(outputPath), assetPath) || path.posix.basename(assetPath);
      return `<a class="doc-link" href="${escapeHtml(assetHref)}"><span class="doc-link-title">${escapeHtml(path.posix.basename(assetPath))}</span><span class="doc-link-path">${escapeHtml(assetPath)}</span></a>`;
    }).join("\n")}</div>
  </section>` : "";
  const body = `<main class="page"><article class="article">
  <div class="article-top"><div class="doc-path">${escapeHtml(sourcePath)}</div><h1>${escapeHtml(title)}</h1></div>
  <div class="markdown-body">${rendered}</div>
  ${attachments}
</article></main>`;

  await fs.mkdir(path.dirname(path.join(outputDir, outputPath)), { recursive: true });
  await fs.writeFile(path.join(outputDir, outputPath), pageTemplate({ title, body, activePath: outputPath }));
  documents.push({ sourcePath, outputPath, title });
}

const grouped = new Map();
for (const document of documents) {
  const groupName = path.posix.dirname(document.sourcePath);
  if (!grouped.has(groupName)) grouped.set(groupName, []);
  grouped.get(groupName).push(document);
}

const groups = [...grouped.entries()].map(([groupName, entries]) => `<section class="doc-group">
  <h2>${escapeHtml(groupName === "." ? "Root notes" : groupName)}</h2>
  <div class="doc-links">${entries.map((document) => `<a class="doc-link" href="${escapeHtml(document.outputPath)}"><span class="doc-link-title">${escapeHtml(document.title)}</span><span class="doc-link-path">${escapeHtml(document.sourcePath)}</span></a>`).join("\n")}</div>
</section>`).join("\n");

const assetGroups = new Map();
for (const assetPath of assetFiles) {
  const groupName = path.posix.dirname(assetPath);
  if (!assetGroups.has(groupName)) assetGroups.set(groupName, []);
  assetGroups.get(groupName).push(assetPath);
}
const assets = [...assetGroups.entries()].map(([groupName, entries]) => `<section class="doc-group">
  <h2>${escapeHtml(groupName === "." ? "Root files" : groupName)}</h2>
  <div class="doc-links">${entries.map((assetPath) => `<a class="doc-link" href="${escapeHtml(assetPath)}"><span class="doc-link-title">${escapeHtml(path.posix.basename(assetPath))}</span><span class="doc-link-path">${escapeHtml(assetPath)}</span></a>`).join("\n")}</div>
</section>`).join("\n");

const indexBody = `<main class="page">
  <section class="hero">
    <div class="eyebrow">Operating systems / practical record</div>
    <h1>Programs, experiments, and lab notes.</h1>
    <p>A small, searchable reading site generated directly from the Markdown files in this repository. New notes appear here automatically when they are pushed to <code>main</code>.</p>
  </section>
  <section class="doc-list" aria-label="Documents">
    <h2 class="section-label">Lab notes</h2>
    ${groups || "<p>No Markdown documents yet.</p>"}
    ${assets ? `<h2 class="section-label">Files and attachments</h2>${assets}` : ""}
  </section>
</main>`;
await fs.writeFile(path.join(outputDir, "index.html"), pageTemplate({ title: "Home", body: indexBody }));
await fs.writeFile(path.join(outputDir, ".nojekyll"), "");
await fs.copyFile(path.join(root, "scripts", "site.css"), path.join(outputDir, "styles.css"));

for (const relativePath of allFiles.filter((file) => !/\.md$/i.test(file))) {
  const destination = path.join(outputDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(root, relativePath), destination);
}

console.log(`Built ${documents.length} Markdown document(s) into ${path.relative(root, outputDir)}/`);
