/**
 * Functional DOM node creation.
 */
export function h<T extends keyof HTMLElementTagNameMap = 'div'>(
  tag: T,
  children?: (string | Node)[],
): HTMLElementTagNameMap[T];
export function h<T extends keyof HTMLElementTagNameMap = 'div'>(
  tag: T,
  attributes?: Record<string, any>,
  children?: (string | Node)[],
): HTMLElementTagNameMap[T];
export function h<T extends keyof HTMLElementTagNameMap = 'div'>(
  tag: T,
  attributes: Record<string, any> = {},
  children: (string | Node)[] = null,
): HTMLElementTagNameMap[T] {
  const el = document.createElement(tag);

  if (Array.isArray(attributes) && children === null) {
    children = attributes;
    attributes = {};
  }

  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(), typeof value === 'string' ? value : JSON.stringify(value));
  }

  if (children) {
    el.append(...children);
  }

  return el;
}

/**
 * Connect the given element to a document instance in order
 * to set its `isConnected` property to `true`.
 */
export function connectElement<T extends Node>(element:T):T {
  const doc = new Document();
  doc.append(element);
  return element;
}

/**
 * Create an HTMLElement and connect it to a document.
 */
export const hConnected: typeof h = (...args) => connectElement(h(...args));
