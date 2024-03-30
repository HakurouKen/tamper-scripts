// ==UserScript==
// @name __NAME__
// @namespace __NAMESPACE__
// @version __VERSION__
// @description __DESCRIPTION__
// @author __AUTHOR__
// @homepage __HOMEPAGE__
// @homepageURL __HOMEPAGE__
// @updateURL __UPDATE_URL__
// @downloadURL __DOWNLOAD_URL__
// @supportURL __SUPPORT_URL__
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
