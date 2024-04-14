// ==UserScript==
// @run-at document-end
// @match https://gist.github.com/*
// @grant GM_setClipboard
// @grant window.onurlchange
// ==/UserScript==

function noop() {}

function debounce<T extends (...args: any[]) => void>(f: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      f.apply(this, args);
    }, delay);
  } as T;
}

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
  <a class="Button--secondary Button--small Button gist-copy-button">
    <span class="Button-content">
      <span class="Button-label">Copy</span>
    </span>
  </a>
  `;

  const button = dummy.firstElementChild.cloneNode(true) as HTMLElement;

  let lockedTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const copyHandler = (e: Event) => {
    if (lockedTimeoutId) {
      return;
    }
    e.preventDefault();

    const rawContent =
      (fileElement.querySelector('.blob-code-content') as HTMLElement)
        ?.innerText || '';

    const content = rawContent
      .split('\n')
      .map((line) => line.replace(/^\t/, ''))
      .join('\n');

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
  fileActionElement.prepend(button);

  return () => {
    button.removeEventListener('click', copyHandler);
    if (lockedTimeoutId) {
      clearTimeout(lockedTimeoutId);
    }
    button.remove();
  };
}

function run() {
  let removeAllListeners = noop;

  function tryCreateCopyButtons() {
    removeAllListeners();
    const fileElements = [...document.querySelectorAll('.file')];
    const removeListeners = fileElements.map(createCopyButton);
    removeAllListeners = () => {
      removeListeners.map((f) => f());
      [...document.querySelectorAll('.gist-copy-button')].forEach((el) => {
        el.remove();
      });
    };
  }

  window.addEventListener('urlchange', debounce(tryCreateCopyButtons, 16));
}

run();
