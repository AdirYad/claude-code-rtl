import { JS_MARKER_START, JS_MARKER_END, RTL_REGEX_SOURCE } from "../constants";

/** Generate auto-detect RTL JavaScript for Claude Code's webview. */
export function generateRtlJs(): string {
  return `
${JS_MARKER_START}
;(function() {
  'use strict';

  var RTL_RE = /${RTL_REGEX_SOURCE}/;
  var BUBBLE_SELECTORS = [
    '[class*="timelineMessage_"]',
    '[class*="userMessageContainer_"]'
  ];
  var observed = new WeakSet();

  function checkAndMark(el) {
    if (observed.has(el)) return;
    var text = el.textContent || '';
    if (RTL_RE.test(text)) {
      el.classList.add('rtl-auto');
      observed.add(el);
      return true;
    }
    return false;
  }

  function scanBubbles(root) {
    BUBBLE_SELECTORS.forEach(function(sel) {
      root.querySelectorAll(sel).forEach(function(el) {
        if (!checkAndMark(el)) watchBubble(el);
      });
    });
  }

  function watchBubble(el) {
    if (observed.has(el)) return;
    var subObs = new MutationObserver(function() {
      if (checkAndMark(el)) subObs.disconnect();
    });
    subObs.observe(el, { childList: true, subtree: true, characterData: true });
    setTimeout(function() { subObs.disconnect(); }, 30000);
  }

  var mainObs = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeType !== 1) continue;
        BUBBLE_SELECTORS.forEach(function(sel) {
          if (node.matches && node.matches(sel)) {
            if (!checkAndMark(node)) watchBubble(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll(sel).forEach(function(el) {
              if (!checkAndMark(el)) watchBubble(el);
            });
          }
        });
      }
    }
  });

  function init() {
    var root = document.getElementById('root');
    if (!root) { setTimeout(init, 200); return; }
    scanBubbles(root);
    mainObs.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
${JS_MARKER_END}`;
}
