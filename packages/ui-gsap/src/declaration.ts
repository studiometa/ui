import type { Base } from '@studiometa/js-toolkit/Base';
import type { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * The options that declare one tween, shared by `Gsap` and `GsapStep`.
 */
export interface TweenDeclarationOptions {
  targets: string;
  set: Record<string, unknown>;
  from: Record<string, unknown>;
  to: Record<string, unknown>;
}

/**
 * One tween, ready to give to GSAP. `method` is `null` when the declaration
 * only has `set` variables.
 */
export interface TweenDeclaration {
  targets: Element[];
  set: gsap.TweenVars | null;
  method: 'fromTo' | 'from' | 'to' | null;
  from: gsap.TweenVars | null;
  to: gsap.TweenVars | null;
}

/** The value of a `scrollTrigger` option. */
export type ScrollTriggerOption = boolean | Record<string, unknown>;

/**
 * Keys that the package controls. JSON cannot hold a function, and the
 * package owns the playback state and the lifecycle callbacks of the
 * animations it builds.
 */
const RESERVED_KEYS = new Set(['paused', 'scrollTrigger', 'callbackScope']);

/** Keys of a `scrollTrigger` object that the package controls. */
const RESERVED_SCROLL_TRIGGER_KEYS = new Set(['animation', 'callbackScope', 'containerAnimation']);

/** `ScrollTrigger` keys that take an element, resolved inside the root. */
const SCROLL_TRIGGER_ELEMENT_KEYS = ['trigger', 'endTrigger', 'pin'] as const;

function isCallbackKey(key: string): boolean {
  return /^on[A-Z]/.test(key);
}

function isEmpty(value: Record<string, unknown>): boolean {
  return Object.keys(value).length === 0;
}

/**
 * Copy variables and remove the reserved keys, with a diagnostic that names
 * them.
 */
function sanitize<T>(
  component: Base,
  name: string,
  value: Record<string, unknown>,
  reserved: Set<string>,
): T {
  const copy = structuredClone(value);
  const removed = Object.keys(copy).filter((key) => reserved.has(key) || isCallbackKey(key));

  if (removed.length > 0) {
    for (const key of removed) {
      delete copy[key];
    }

    component.$warn(
      'gsap.unsupported-vars',
      `The \`${name}\` option cannot set ${removed.map((key) => `\`${key}\``).join(', ')}: the component controls ${removed.length > 1 ? 'these keys' : 'this key'}.`,
    );
  }

  return copy as T;
}

/**
 * Copy the variables of an option, without the reserved keys.
 */
export function readVars<T = gsap.TweenVars>(
  component: Base,
  name: string,
  value: Record<string, unknown>,
): T | null {
  return isEmpty(value) ? null : sanitize<T>(component, name, value, RESERVED_KEYS);
}

/**
 * Resolve a selector inside the root element. An empty selector targets the
 * root itself. Returns `null` with a diagnostic when the selector is not
 * valid or matches nothing.
 */
export function resolveTargets(
  component: Base,
  root: HTMLElement,
  selector: string,
): Element[] | null {
  if (!selector.trim()) {
    return [root];
  }

  let targets: Element[];

  try {
    targets = Array.from(root.querySelectorAll(selector));
  } catch {
    component.$warn(
      'gsap.invalid-targets',
      `The \`targets\` selector \`${selector}\` is not valid.`,
    );
    return null;
  }

  if (targets.length === 0) {
    component.$warn(
      'gsap.invalid-targets',
      `The \`targets\` selector \`${selector}\` matches no element inside the component.`,
    );
    return null;
  }

  return targets;
}

/**
 * Read the tween that the options declare. Returns `null` when the targets
 * cannot be resolved, or when the declaration is empty.
 */
export function readDeclaration(
  component: Base,
  root: HTMLElement,
  options: TweenDeclarationOptions,
): TweenDeclaration | null {
  const set = readVars(component, 'set', options.set);
  const from = readVars(component, 'from', options.from);
  const to = readVars(component, 'to', options.to);

  if (!set && !from && !to) {
    component.$warn(
      'gsap.empty-declaration',
      'The component declares no `set`, `from` or `to` variables, so it has nothing to animate.',
    );
    return null;
  }

  const targets = resolveTargets(component, root, options.targets);

  if (!targets) {
    return null;
  }

  let method: TweenDeclaration['method'] = null;
  if (from && to) {
    method = 'fromTo';
  } else if (from) {
    method = 'from';
  } else if (to) {
    method = 'to';
  }

  return { targets, set, method, from, to };
}

/**
 * Add a declaration to a timeline at a position. The `set` variables go at
 * the position, and the tween starts with them.
 */
export function addDeclaration(
  timeline: gsap.core.Timeline,
  declaration: TweenDeclaration,
  position?: gsap.Position,
): void {
  const { targets, set, method, from, to } = declaration;
  let at = position;

  if (set) {
    timeline.set(targets, set, at);
    at = '<';
  }

  if (method === 'fromTo') {
    timeline.fromTo(targets, from!, to!, at);
  } else if (method === 'from') {
    timeline.from(targets, from!, at);
  } else if (method === 'to') {
    timeline.to(targets, to!, at);
  }
}

/**
 * Create the standalone tween of a declaration. The `set` variables are
 * applied first. Returns `null` when the declaration only has `set`
 * variables.
 */
export function createTween(
  core: typeof gsap,
  declaration: TweenDeclaration,
  vars: gsap.TweenVars,
): gsap.core.Tween | null {
  const { targets, set, method, from, to } = declaration;

  if (set) {
    core.set(targets, set);
  }

  if (method === 'fromTo') {
    return core.fromTo(targets, from!, { ...to, ...vars });
  }

  if (method === 'from') {
    return core.from(targets, { ...from, ...vars });
  }

  if (method === 'to') {
    return core.to(targets, { ...to, ...vars });
  }

  return null;
}

/**
 * Read a GSAP position: a number, or a label or relative position string.
 * An empty value returns `undefined`, which appends to the timeline.
 */
export function readPosition(value: string): gsap.Position | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const number = Number(trimmed);
  return Number.isFinite(number) ? number : trimmed;
}

/**
 * Read the `scrollTrigger` option. `true` uses the root as trigger. Element
 * selectors resolve inside the root. Returns `false` when the option is off,
 * and `null` with a diagnostic when a selector cannot be resolved.
 */
export function readScrollTrigger(
  component: Base,
  root: HTMLElement,
  value: ScrollTriggerOption,
): ScrollTrigger.Vars | false | null {
  if (value === false) {
    return false;
  }

  const vars: Record<string, unknown> =
    value === true ? {} : sanitize(component, 'scrollTrigger', value, RESERVED_SCROLL_TRIGGER_KEYS);

  for (const key of SCROLL_TRIGGER_ELEMENT_KEYS) {
    const selector = vars[key];

    if (typeof selector !== 'string') {
      continue;
    }

    let element: Element | null = null;
    try {
      element = root.querySelector(selector);
    } catch {
      // An invalid selector is reported below, as a selector without a match.
    }

    if (!element) {
      component.$warn(
        'gsap.invalid-targets',
        `The \`scrollTrigger.${key}\` selector \`${selector}\` matches no element inside the component.`,
      );
      return null;
    }

    vars[key] = element;
  }

  vars.trigger ??= root;

  return vars as ScrollTrigger.Vars;
}
