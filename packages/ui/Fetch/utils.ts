export function adoptNewScripts(
  newScripts: Set<HTMLScriptElement>,
  oldScripts: Set<HTMLScriptElement>,
) {
  for (const script of newScripts) {
    if (oldScripts.has(script)) continue;
    adoptNewScript(script);
  }
}

export function adoptNewScript(script: HTMLScriptElement) {
  const newScript = document.createElement('script');

  for (const attribute of script.getAttributeNames()) {
    newScript.setAttribute(attribute, script.getAttribute(attribute));
  }

  if (script.textContent) {
    newScript.textContent = script.textContent;
  }

  script.replaceWith(newScript);
}
