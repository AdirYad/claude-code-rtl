(function () {
  "use strict";

  const BLOCK_SELECTOR = [
    "p", "li", "ul", "ol",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "table", "thead", "tbody", "tr", "td", "th",
    "dt", "dd",
  ].join(",");

  const HEBREW = /[\u0590-\u05FF]/;

  function apply(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(BLOCK_SELECTOR).forEach(function (el) {
      if (el.hasAttribute("dir")) return;
      if (HEBREW.test(el.textContent || "")) {
        el.setAttribute("dir", "auto");
      }
    });
  }

  function init() {
    apply(document);
    new MutationObserver(function (mutations) {
      for (const m of mutations) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) apply(node);
        });
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
