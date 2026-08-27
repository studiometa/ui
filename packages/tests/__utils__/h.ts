const { isArray } = Array;

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

  if ((Array.isArray(attributes) || typeof attributes === 'string') && children === null) {
    children = attributes;
    attributes = {};
  }

  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(
      name.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
      typeof value === 'string' ? value : JSON.stringify(value),
    );
  }

  if (children) {
    if (isArray(children)) {
      el.append(...children);
    } else {
      el.append(children);
    }
  }

  return el;
}
