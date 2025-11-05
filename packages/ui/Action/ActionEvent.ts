import { getInstances } from '@studiometa/js-toolkit';
import type { Base } from '@studiometa/js-toolkit';
import { isFunction } from '@studiometa/js-toolkit/utils';

/**
 * Extract component name and an optional additional selector from a string.
 */
const TARGET_REGEX = /([a-zA-Z]+)(\((.*)\))?/;

const effectCache = new Map<string, Function>();

export type Modifiers = 'prevent' | 'stop' | 'once' | 'passive' | 'capture' | 'debounce';

export class ActionEvent<T extends Base> {
  static modifierSeparator = '.';
  static targetSeparator = ' ';
  static effectSeparator = '->';

  /**
   * Timer for debouncing event handling.
   */
  private debounceTimer?: number;

  /**
   * The Action instance.
   */
  action: T;

  /**
   * The event to listen to.
   */
  event: string;

  /**
   * The modifiers to apply to the event.
   */
  modifiers: Modifiers[];

  /**
   * The debounce delay in milliseconds.
   */
  debounceDelay: number = 100;

  /**
   * Target definition.
   * Ex: `Target Target(.selector)`.
   */
  targetDefinition: string;

  /**
   * The content of the effect callback function.
   */
  effectDefinition: string;

  /**
   * Class constructor.
   * @param {T}      action The parent Action instance.
   * @param {string} eventDefinition  The event with its modifiers: `click.prevent.stop`
   * @param {string} effectDefinition The target and effect definition: `Target(.selector)->target.$destroy()`
   */
  constructor(action: T, eventDefinition: string, effectDefinition: string) {
    this.action = action;
    const [event, ...modifiers] = eventDefinition.split(ActionEvent.modifierSeparator);
    this.event = event;

    // Process modifiers and extract debounce delay if present
    const processedModifiers: Modifiers[] = [];
    for (const modifier of modifiers) {
      if (modifier.startsWith('debounce')) {
        processedModifiers.push('debounce');
        this.debounceDelay = parseInt(modifier.replace('debounce', '') || '100');
      } else {
        processedModifiers.push(modifier as Modifiers);
      }
    }

    this.modifiers = processedModifiers;

    let effect = effectDefinition;
    let targetDefinition = '';

    if (effect.includes(ActionEvent.effectSeparator)) {
      [targetDefinition, effect] = effect.split(ActionEvent.effectSeparator);
    }

    this.targetDefinition = targetDefinition.trim();
    this.effectDefinition = effect.trim();
  }

  /**
   * Get the generated function for the defined effect.
   */
  get effect() {
    const { effectDefinition } = this;

    if (!effectCache.has(effectDefinition)) {
      effectCache.set(
        effectDefinition,
        new Function('ctx', 'event', 'target', 'action', 'self', '$el', `return ${effectDefinition}`),
      );
    }

    return effectCache.get(effectDefinition) as Function;
  }

  /**
   * Get the targets object for the defined targets string.
   */
  get targets() {
    const { targetDefinition } = this;

    if (!targetDefinition) {
      return [{ Action: this.action }];
    }

    // Extract component's names and selectors.
    const parts = targetDefinition.split(ActionEvent.targetSeparator).map((part) => {
      const [, name, , selector] = part.match(TARGET_REGEX) ?? [];
      return [name, selector];
    });

    const targets = [] as Array<Record<string, Base>>;

    for (const instance of getInstances()) {
      const { name } = instance.__config;

      for (const part of parts) {
        const shouldPush =
          part[0] === name && (!part[1] || (part[1] && instance.$el.matches(part[1])));
        if (shouldPush) {
          targets.push({ [instance.__config.name]: instance });
        }
      }
    }

    return targets;
  }

  /**
   * Handle the defined event and trigger the effect for each defined target.
   */
  handleEvent(event: Event) {
    const { targets, effect, modifiers } = this;

    if (modifiers.includes('prevent')) {
      event.preventDefault();
    }

    if (modifiers.includes('stop')) {
      event.stopPropagation();
    }

    if (modifiers.includes('debounce')) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        this.executeEffect(targets, effect, event);
      }, this.debounceDelay);
    } else {
      this.executeEffect(targets, effect, event);
    }
  }

  /**
   * Execute the effect for all targets.
   */
  private executeEffect(targets: Array<Record<string, Base>>, effect: Function, event: Event) {
    const { action } = this;

    for (const target of targets) {
      try {
        const [currentTarget] = Object.values(target).flat();
        const args = [target, event, currentTarget, action, action, currentTarget.$el];
        const value = effect.apply(action.$el, args);
        if (isFunction(value)) {
          value.apply(action.$el, args);
        }
      } catch (err) {
        action.$warn(err);
      }
    }
  }

  /**
   * Bind the defined event to the given Action instance root element.
   */
  attachEvent() {
    const { event, modifiers } = this;
    this.action.$el.addEventListener(event, this, {
      capture: modifiers.includes('capture'),
      once: modifiers.includes('once'),
      passive: modifiers.includes('passive'),
    });
  }

  /**
   * Unbind the event from the given Action instance root element.
   */
  detachEvent() {
    clearTimeout(this.debounceTimer);
    this.action.$el.removeEventListener(this.event, this);
  }
}
