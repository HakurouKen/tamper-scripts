// ==UserScript==
// @run-at document-start
// @noframes
// @match *://*/*
// ==/UserScript==

function run() {
  if (navigator.maxTouchPoints < 1) {
    return;
  }

  window.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      screen.orientation.lock('landscape');
    } else {
      screen.orientation.unlock();
    }
  });
}

run();
