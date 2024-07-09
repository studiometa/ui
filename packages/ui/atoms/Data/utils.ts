export function isInput(el: Element): el is HTMLInputElement {
  return el instanceof HTMLInputElement;
}

export function isRadio(el: Element): el is HTMLInputElement {
  return isInput(el) && el.type === 'radio';
}

export function isCheckbox(el: Element): el is HTMLInputElement {
  return isInput(el) && el.type === 'checkbox';
}

export function isSelect(el: Element): el is HTMLSelectElement {
  return el instanceof HTMLSelectElement;
}

const callbacks = new Map<string, Function>();

export function getCallback(name: string, code: string): Function {
  const key = code + name;

  if (!callbacks.has(key)) {
    callbacks.set(key, new Function('value', 'target', code));
  }

  return callbacks.get(key);
}
