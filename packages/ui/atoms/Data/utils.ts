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
