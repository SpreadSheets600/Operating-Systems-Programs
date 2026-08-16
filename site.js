(() => {
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
})();