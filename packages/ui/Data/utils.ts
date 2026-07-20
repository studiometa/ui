const callbacks = new Map<string, Function>();

export function getCallback(name: string, code: string): Function {
  const key = code + name;

  if (!callbacks.has(key)) {
    callbacks.set(key, new Function('value', 'target', '$data', code));
  }

  return callbacks.get(key);
}
