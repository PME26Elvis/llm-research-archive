document.addEventListener("DOMContentLoaded", () => {
  const externalLinks = document.querySelectorAll('.md-content a[href^="http"]:not([href*="PME26Elvis.github.io"]):not([href*="github.com/PME26Elvis/llm-research-archive"])');
  externalLinks.forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
});
