# OS Lab Archive

> A maintained, Markdown-first record of Operating Systems laboratory work, commands, and reference material.

Use this page as the starting point for the archive. It is also the repository README, so any update here appears on both GitHub and the published site.

## Lab notebook

| Date | Practical | Focus |
| --- | --- | --- |
| [03 Aug 2026](03-08-2026/README.md) | [Install CentOS 7 in VirtualBox](03-08-2026/README.md) | Virtual machine setup, storage, and networking |
| [10 Aug 2026](10-08-2026/README.md) | [Linux commands and file management](10-08-2026/README.md) | Users, files, permissions, `vim`, and `grep` |

## Watch alongside the notes

- [Install CentOS in VirtualBox](https://www.youtube.com/watch?v=-zXqZQp5L58)
- [Linux file and folder system](https://www.youtube.com/watch?v=XHfQkmfyHk0)

## How this archive is organised

```text
Operating-Systems-Programs/
├── README.md                  # this page and the published homepage
├── 03-08-2026/
│   └── README.md              # a practical write-up
└── 10-08-2026/
    └── README.md              # a practical write-up
```

Each practical keeps its Markdown write-up and any supporting screenshots, PDFs, or files in the same folder. The website turns that folder structure into the Explorer tree automatically.

## Add a new practical

1. Create a clearly named folder for the session.
2. Add a `README.md` with the aim, requirements, procedure, commands, and result.
3. Add a row to the **Lab notebook** table above.
4. Push to `main` to publish the update.

Use fenced blocks for commands and output so they remain readable on every screen size:

```bash
sudo dnf update
pwd
ls -la
```

## Publishing and migration

GitHub Actions builds the static site from the Markdown files whenever `main` changes. The generated `site/` directory is disposable—edit the Markdown files instead.

Moving another collection of solutions into this format? Read the [migration guide](MIGRATING.md).
