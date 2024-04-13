// ==UserScript==
// @run-at document-end
// @match https://gist.github.com/*
// @grant GM_setClipboard
// @grant window.onurlchange
// ==/UserScript==

function noop() {}

function createCopyButton(fileElement: HTMLElement) {
  const fileActionElement = fileElement.querySelector('.file-actions');
  const source = fileActionElement?.querySelector(
    'a.Button'
  ) as HTMLAnchorElement;

  const url = source?.href;
  if (!url) {
    return noop;
  }

  const dummy = document.createElement('div');
  dummy.innerHTML = `
  <a href="${url}" class="Button--secondary Button--small Button">
    <span class="Button-content">
      <span class="Button-label">Copy</span>
    </span>
  </a>
  `;

  const button = dummy.firstElementChild as HTMLElement;

  const rawContent = (
    fileElement.querySelector('.blob-code-content') as HTMLElement
  )?.innerText;

  const content = rawContent
    .split('\n')
    .map((line) => line.replace(/^\t/, ''))
    .join('\n');

  if (!content) {
    return noop;
  }

  fileActionElement.appendChild(button);
  let lockedTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const copyHandler = (e: Event) => {
    if (lockedTimeoutId) {
      return;
    }
    e.preventDefault();
    GM_setClipboard(content, { type: 'text', mimetype: 'text/plain' });

    button.style.filter = 'brightness(0.8)';
    button.innerText = 'Copied!';
    lockedTimeoutId = setTimeout(() => {
      button.style.filter = '';
      button.innerText = 'Copy';
      lockedTimeoutId = null;
    }, 1500);
  };

  button.addEventListener('click', copyHandler);

  return () => {
    button.removeEventListener('click', copyHandler);
    if (lockedTimeoutId) {
      clearTimeout(lockedTimeoutId);
    }
    button.remove();
  };
}

function run() {
  function tryCreateCopyButtons() {
    const fileElements = [...document.querySelectorAll('.file')];
    const removeListeners = fileElements.map(createCopyButton);
    return () => {
      removeListeners.map((f) => f());
    };
  }

  let removeAllListeners = tryCreateCopyButtons();

  window.addEventListener('urlchange', () => {
    removeAllListeners();
    removeAllListeners = tryCreateCopyButtons();
  });
}

run();
