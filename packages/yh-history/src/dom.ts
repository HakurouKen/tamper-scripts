type Selector = string | HTMLElement;

export function getById(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function select(
  selector: Selector,
  parent?: HTMLElement
): HTMLElement | null {
  return typeof selector === 'string'
    ? (parent || document).querySelector(selector)
    : selector;
}

export function selectAll(selector: string) {
  return [...document.querySelectorAll(selector)] as HTMLElement[];
}

export function create(tag = 'div', attributes: Record<string, string> = {}) {
  const dom = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    dom.setAttribute(name, value);
  }
  return dom;
}

export function remove(selector: Selector) {
  const dom = select(selector);
  return dom?.parentElement?.removeChild(dom);
}

export function html(target: Selector, html: string) {
  const el = select(target);
  if (el) {
    el.innerHTML = html;
  }
}
