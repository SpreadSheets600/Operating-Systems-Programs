# Migrating Or Creating New Content

The site builder is intentionally content-agnostic: it turns a folder of Markdown documents into a responsive daisyUI website. The root `README.md` is special—it is both the repository README and the generated homepage.

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

The sidebar becomes a collapsible folder tree automatically. Every `.md` file gets a matching `.html` page. Files such as images, PDFs, and archives are copied to the generated site and appear in the same tree.

## 3. Use normal Markdown links

Keep links pointing to Markdown source files:

```md
[Read the sorting notes](notes/sorting.md)
```

During the build, local links to known Markdown documents are rewritten to their generated HTML pages. Anchors continue to work:

```md
[Jump to complexity](notes/sorting.md#complexity)
```

## 4. Format commands with fenced blocks

Use a language after the opening fence when possible. Shell-like blocks get a terminal prompt for each line; text and program output stay unprefixed.

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

Install dependencies once, then generate the site:

```bash
npm install
npm run build:site
```

Publish the `site/` directory with any static host, or keep the included GitHub Actions workflow to deploy on pushes to `main`.

## Notes

- The generated `site/` directory is disposable; change the Markdown files and `scripts/` instead.
- Raw HTML in Markdown is displayed as text for safer publishing.
- Tables, headings, images, lists, blockquotes, inline code, fenced code, and local Markdown links are rendered with daisyUI styling.
- The visual system is generic. Rename the root README heading to rename the site.
