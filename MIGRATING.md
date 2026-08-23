# Migrating Or Creating New Content

The site builder is intentionally content-agnostic: it turns a folder of Markdown documents into a modern Astro-powered website with a file-tree explorer, full-text search (⌘K), and light/dark themes. The root `README.md` is special—it is both the repository README and the generated homepage.

## 1. Add or update the root README

Put a `README.md` in the repository root. Give it one `#` heading and add the overview, links, and navigation you want visitors to see. Do not edit `site/index.html`; it is generated from this file.

```md
# Algorithms Notes

A working archive of examples and explanations.

## Topics

- [Sorting](notes/sorting.md)
- [Graphs](notes/graphs.md)
```

## 2. Keep your existing folders

No special date format is required. Store Markdown files wherever the structure makes sense for the project.

```text
project/
├── README.md
├── notes/
│   ├── sorting.md
│   └── graphs.md
└── solutions/
    └── exercise-01.md
```

The sidebar becomes a `tree(1)`-style explorer automatically. Every `.md` file gets its own page. Files such as images, PDFs, and archives are copied to the generated site, appear in the same tree, and render as preview cards beside the documents they sit next to.

## 3. Use normal Markdown links

Keep links pointing to Markdown source files:

```md
[Read the sorting notes](notes/sorting.md)
```

During the build, local links between Markdown documents are rewritten to their site routes. Anchors continue to work:

```md
[Jump to complexity](notes/sorting.md#complexity)
```

## 4. Format commands with fenced blocks

Use a language after the opening fence when possible. Blocks are rendered as terminal panes with syntax highlighting (Shiki) and a copy button; shell-like blocks get a `$` prompt per line.

````md
```bash
npm run build:site
npm run preview
```

```text
Build complete
```
````

## 5. Build locally

Clone the shared engine into your repository and run it from there:

```bash
git clone https://github.com/SpreadSheets600/markdown-archive-engine .engine
cd .engine
npm install
npm run dev        # live preview — reads content from the parent folder
npm run build      # astro build + pagefind search index -> dist/
```

Or skip the local setup entirely: keep the included GitHub Actions
workflow and the site builds on every push to `main`.

## Notes

- The generated `dist/` directory is disposable; only ever edit Markdown in this repository.
- Tables, headings, images, lists, blockquotes, inline code, fenced code, and local Markdown links are styled by the theme in `src/styles/global.css`.
- New file types get sensible preview cards out of the box; extend the registry in `src/components/AssetGrid.astro` to customize them.
- Search is powered by Pagefind and indexes the built output — no configuration needed.
- The visual system is generic. Rename the root README heading to rename the site.
