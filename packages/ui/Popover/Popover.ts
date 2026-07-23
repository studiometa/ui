import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/index.js';
import { ViewTransition } from '../ViewTransition/index.js';

/**
 * A `toggle` event as dispatched by the native Popover API. Declared locally so
 * the component does not depend on the DOM lib shipping `ToggleEvent` yet.
 */
type PopoverToggleEvent = Event & { newState: 'open' | 'closed' };

export interface PopoverProps extends BaseProps {
  $el: HTMLElement;
  $children: {
    Transition: Transition[];
    ViewTransition: ViewTransition[];
  };
}

/**
 * Popover class.
 *
 * A headless wrapper around the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API):
 * the non-modal sibling of [`Dialog`](https://ui.studiometa.dev/components/Dialog/).
 * The `[popover]` element gives top-layer stacking, <kbd>Esc</kbd> and — with
 * `popover="auto"` — light-dismiss for free; this class only orchestrates the
 * transitions, fanning `enter()`/`leave()` out to every `Transition` /
 * `ViewTransition` child (a dropdown panel, a tooltip, …).
 *
 * It ships no markup and owns no triggers: wire opening and closing from your
 * HTML with [`Action`](https://ui.studiometa.dev/components/Action/) — e.g.
 * `data-on:click="Popover(#menu)->target.toggle()"` for a dropdown, or
 * `data-on:mouseenter`/`data-on:mouseleave` for a tooltip. Positioning is
 * entirely author-controlled (native CSS anchor positioning, `position: fixed`,
 * …); the library ships no positioning opinion.
 *
 * @link https://ui.studiometa.dev/components/Popover/
 */
export class Popover<T extends BaseProps = BaseProps> extends Base<T & PopoverProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Popover',
    components: { Transition, ViewTransition },
    emits: ['open', 'close'],
  };

  /**
   * Whether the popover is open, mirroring the platform state.
   * @private
   */
  __isOpen = false;

  /**
   * Get the native `[popover]` element.
   */
  get popover(): HTMLElement {
    return this.$el;
  }

  /**
   * Get every transition child to orchestrate, `Transition` and
   * `ViewTransition` alike. With none, open/close are instant.
   */
  get transitions(): Array<Transition | ViewTransition> {
    const { Transition: transitions = [], ViewTransition: viewTransitions = [] } = this.$children;
    return [...transitions, ...viewTransitions] as Array<Transition | ViewTransition>;
  }

  /**
   * Keep the internal state in sync when the platform toggles the popover on
   * its own — a light-dismiss (outside click) or <kbd>Esc</kbd> on a
   * `popover="auto"` element closes it natively, without going through
   * `close()`, so the leave transition is skipped (an instant close, like the
   * native <kbd>Esc</kbd> path of `Dialog`). Our own `showPopover()` /
   * `hidePopover()` calls are ignored here because they never disagree with the
   * flag we just set.
   * @private
   */
  __onToggle = (event: Event) => {
    const { newState } = event as PopoverToggleEvent;
    if (newState === 'closed' && this.__isOpen) {
      this.__isOpen = false;
      this.$emit('close');
    } else if (newState === 'open' && !this.__isOpen) {
      this.__isOpen = true;
      this.$emit('open');
    }
  };

  /**
   * Listen for platform-driven toggles.
   */
  mounted() {
    this.$el.addEventListener('toggle', this.__onToggle);
  }

  /**
   * Stop listening for platform-driven toggles.
   */
  destroyed() {
    this.$el.removeEventListener('toggle', this.__onToggle);
  }

  /**
   * Open the popover: show it in the top layer, emit `open`, then run every
   * child's `enter()`. A no-op if already open. Resolves once the enter
   * transitions have finished.
   */
  async open(): Promise<void> {
    if (this.__isOpen) {
      return;
    }

    this.__isOpen = true;
    this.popover.showPopover();
    this.$emit('open');
    await Promise.all(this.transitions.map((transition) => transition.enter()));
  }

  /**
   * Close the popover: emit `close`, run every child's `leave()`, **then** hide
   * it — so the popover is still painted while its children animate out. A
   * no-op if already closed. Resolves once hidden.
   */
  async close(): Promise<void> {
    if (!this.__isOpen) {
      return;
    }

    this.__isOpen = false;
    this.$emit('close');
    await Promise.all(this.transitions.map((transition) => transition.leave()));
    this.popover.hidePopover();
  }

  /**
   * Toggle the popover open or closed.
   */
  toggle(): Promise<void> {
    return this.__isOpen ? this.close() : this.open();
  }
}
