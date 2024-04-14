// ==UserScript==
// @run-at document-start
// @match *://*/*
// ==/UserScript==

(function () {
  console.log('Hello <%= it.name %>!');
})();
