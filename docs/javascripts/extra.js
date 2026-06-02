const applyNotesEnhancements = () => {
  const ownHosts = [
    "PME26Elvis.github.io",
    "github.com/PME26Elvis/llm-research-archive",
  ];

  document
    .querySelectorAll('.md-content a[href^="http"]')
    .forEach((link) => {
      const href = link.getAttribute("href") || "";
      const isOwnLink = ownHosts.some((host) => href.includes(host));

      if (!isOwnLink) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
};

if (typeof document$ !== "undefined") {
  document$.subscribe(applyNotesEnhancements);
} else {
  document.addEventListener("DOMContentLoaded", applyNotesEnhancements);
}
