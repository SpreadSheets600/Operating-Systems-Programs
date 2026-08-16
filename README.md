# OS Lab Archive

> A maintained record of operating-systems practical work: setup notes, terminal exercises, and results.

This repository is the source of truth. Edit this README to update the website homepage and the repository overview at the same time.

## Start here

- [VirtualBox and CentOS 7 setup](03-08-2026/README.md)
- [Linux commands and file management](10-08-2026/README.md)

## Archive structure

Each practical lives in its own dated folder. Keep the write-up in Markdown and place screenshots, PDFs, and other supporting files beside it.

```text
OS-Lab-Archive/
├── README.md                  # repository README and site homepage
├── 03-08-2026/
│   └── README.md              # one practical
└── 10-08-2026/
    └── README.md              # another practical
```

## Write a practical

Use clear sections so each record is easy to scan:

1. Aim
2. Requirements
3. Procedure or commands
4. Result

Use fenced code blocks for commands and output. The published site keeps every command line readable on desktop and mobile.

```bash
grep -R "TODO" .
git status --short
```

## Publish

Push to `main`. GitHub Actions builds the static site and publishes the Markdown archive to GitHub Pages.

For a different project or an existing collection of solutions, see the [migration guide](MIGRATING.md).
