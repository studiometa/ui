import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps, MountedReturn } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/Transition.js';
import { ViewTransition } from '../ViewTransition/ViewTransition.js';
import type { Transitionable } from '../decorators/withTransition.js';

/**
 * When a tab becomes the selected one.
 *
 * The WAI-ARIA Authoring Practices Guide asks for the choice to be made
 * deliberately: automatic activation selects a tab as soon as it takes focus,
 * manual activation waits for `Enter` or `Space`. Automatic is the default
 * because every panel is already in the markup, so switching costs nothing;
 * a panel that loads its content on demand — one holding a `Defer` or a
 * `Fetch` — is the case manual activation exists for.
 */
export const TABS_ACTIVATIONS = Object.freeze({
  AUTOMATIC: 'automatic',
  MANUAL: 'manual',
} as const);

/** One of {@link TABS_ACTIVATIONS}. */
export type TabsActivation = (typeof TABS_ACTIVATIONS)[keyof typeof TABS_ACTIVATIONS];

/** The tab and the panel a `tabs-enable` or `tabs-disable` event is about. */
export interface TabsEventPayload {
  index: number;
  btn: HTMLElement;
  content: HTMLElement;
}

export type TabsProps = BaseProps & {
  $refs: {
    list: HTMLElement;
    btn: HTMLElement[];
    content: HTMLElement[];
  };
  $options: {
    activation: TabsActivation;
  };
  /**
   * The `tabs-` prefix is the family namespace the package settled on with
   * `Defer` (`defer-*`), `Fetch` (`fetch-*`) and `Disclosure`
   * (`disclosure-*`). `$emit()` bubbles, so a bare `enable`/`disable` would
   * reach every ancestor listener under a name generic enough to collide with
   * anything.
   */
  $emits: {
    'tabs-enable': TabsEventPayload;
    'tabs-disable': TabsEventPayload;
  };
};

/** Keys read straight off the event, because the toolkit's `KEYS` has no `Home`/`End`. */
const KEY_HOME = 'Home';
const KEY_END = 'End';
const KEY_NEXT = { horizontal: 'ArrowRight', vertical: 'ArrowDown' } as const;
const KEY_PREVIOUS = { horizontal: 'ArrowLeft', vertical: 'ArrowUp' } as const;

/**
 * An accessible tab set: one `tablist`, n `tab` buttons and n `tabpanel`
 * panels, paired by position.
 *
 * The whole APG contract lives here: the three roles, `aria-selected`,
 * `aria-controls`, `aria-labelledby`, a roving `tabindex` and the keyboard
 * interaction. The `list` ref exists to carry the `tablist` role.
 *
 * **Appearance is left to CSS.** Visibility is the platform's `hidden`
 * property, the way `Disclosure` does it, and styling keys on
 * `[aria-selected="true"]`. Animation is a nested `Transition` or
 * `ViewTransition`, which is what `Dialog` and `Disclosure` already ask for.
 *
 * The initially selected tab is the first button carrying
 * `aria-selected="true"`, or the first button. That is a convention rather
 * than an option: the markup already has to state which tab is selected for
 * the pre-hydration render to be correct.
 *
 * @link https://ui.studiometa.dev/reference/items/Tabs/
 */
export class Tabs<T extends BaseProps = BaseProps> extends Base<T & TabsProps> {
  static config: BaseConfig = {
    name: 'Tabs',
    components: { Transition, ViewTransition },
    refs: ['list', 'btn[]', 'content[]'],
    options: {
      activation: {
        type: String,
        default: TABS_ACTIVATIONS.AUTOMATIC,
      },
    },
  };

  /**
   * The selected index.
   *
   * A field and not an option: `$options` is a read-only view over the
   * attributes, and the markup states the initial selection through
   * `aria-selected` instead.
   * @private
   */
  __index = 0;

  /**
   * Monotonically increasing operation identifier, so a transition that
   * finishes after the user has switched again cannot hide the panel that
   * became visible in the meantime.
   * @private
   */
  __operation = 0;

  /** The index of the selected tab. */
  get currentIndex(): number {
    return this.__index;
  }

  /** How many tabs the component drives, which is the number of `btn` refs. */
  get length(): number {
    return this.$refs.btn.length;
  }

  /**
   * The tab list orientation, read from the `aria-orientation` the markup
   * already has to write for assistive technology rather than from a second
   * option saying the same thing. It decides which arrow keys move the focus.
   */
  get orientation(): 'horizontal' | 'vertical' {
    return this.$refs.list?.getAttribute('aria-orientation') === 'vertical'
      ? 'vertical'
      : 'horizontal';
  }

  /**
   * Wire the ARIA relationships and apply the initial selection.
   */
  mounted(): MountedReturn {
    this.__initializeAccessibility();

    const selected = this.$refs.btn.findIndex(
      (btn) => btn.getAttribute('aria-selected') === 'true',
    );
    this.__index = Math.max(selected, 0);

    for (const [index, btn] of this.$refs.btn.entries()) {
      const content = this.$refs.content[index];
      const isSelected = index === this.__index;
      btn.setAttribute('aria-selected', String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;
      if (content) {
        content.hidden = !isSelected;
        content.inert = false;
      }
    }

    return () => {
      this.__operation += 1;
      for (const content of this.$refs.content) {
        content.inert = false;
      }
    };
  }

  /**
   * Select the clicked tab.
   */
  onBtnClick({ index }: { index: number }): Promise<void> {
    return this.goTo(index);
  }

  /**
   * Roving focus across the tab list.
   *
   * `Enter` and `Space` need no branch: the tabs are native buttons, so the
   * platform turns both into a click, which is the manual activation the APG
   * asks for and which automatic activation has already performed on focus.
   */
  onBtnKeydown({ event, index }: { event: Event; index: number }): void {
    const { key } = event as KeyboardEvent;
    const { orientation } = this;
    let target: number;

    if (key === KEY_NEXT[orientation]) {
      target = this.__wrapIndex(index + 1);
    } else if (key === KEY_PREVIOUS[orientation]) {
      target = this.__wrapIndex(index - 1);
    } else if (key === KEY_HOME) {
      target = 0;
    } else if (key === KEY_END) {
      target = this.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    this.focusTab(target);
  }

  /**
   * Move the focus to a tab, selecting it too under automatic activation.
   */
  focusTab(index: number): void {
    const btn = this.$refs.btn[index];

    if (!btn) {
      return;
    }

    if (this.$options.activation === TABS_ACTIVATIONS.AUTOMATIC) {
      this.goTo(index);
    }

    // Under manual activation the roving `tabindex` follows the focus rather
    // than the selection, so tabbing back into the list returns to where the
    // user left it. Under automatic activation `goTo()` has already set it and
    // this is a no-op.
    this.__syncTabIndexes(index);
    btn.focus();
  }

  /**
   * Select a tab, resolving once the leaving and entering transitions are done.
   */
  goTo(index: number): Promise<void> {
    const target = this.__wrapIndex(index);
    const previous = this.__index;

    if (target === previous || !this.$refs.btn[target]) {
      return Promise.resolve();
    }

    this.__index = target;
    const operation = ++this.__operation;

    this.__setSelected(previous, false);
    this.__setSelected(target, true);
    this.__syncTabIndexes(target);

    return Promise.all([
      this.__runTransitions(previous, false, operation),
      this.__runTransitions(target, true, operation),
    ]).then(() => undefined);
  }

  /** Select the next tab, wrapping past the last one. */
  goNext(): Promise<void> {
    return this.goTo(this.__index + 1);
  }

  /** Select the previous tab, wrapping past the first one. */
  goPrev(): Promise<void> {
    return this.goTo(this.__index - 1);
  }

  /**
   * The transitions a panel owns, a nested `Tabs`' own transitions excluded.
   *
   * The ancestor test names `this.$config.name` rather than the literal
   * `'Tabs'` so a renamed subclass still recognises its own transitions —
   * the same filter `Disclosure.transitions` uses.
   * @private
   */
  __transitionsIn(content: HTMLElement): Transitionable[] {
    const transitions = [
      ...this.$query<Transition>('Transition'),
      ...this.$query<ViewTransition>('ViewTransition'),
    ];

    return transitions.filter(
      (transition) =>
        content.contains(transition.$el) &&
        transition.$closest(this.$config.name) === (this as Base),
    );
  }

  /**
   * Bring an index into `0…length - 1`, wrapping at both ends.
   *
   * Wrapping is the APG's rule for the arrow keys, and applying it to every
   * entry point keeps `goTo()`, `goNext()` and the keyboard in agreement.
   * @private
   */
  __wrapIndex(index: number): number {
    const { length } = this;

    if (length <= 0) {
      return 0;
    }

    return ((index % length) + length) % length;
  }

  /**
   * Apply the selected state of one tab and announce it.
   * @private
   */
  __setSelected(index: number, isSelected: boolean): void {
    const btn = this.$refs.btn[index];
    const content = this.$refs.content[index];

    if (!btn || !content) {
      return;
    }

    btn.setAttribute('aria-selected', String(isSelected));

    if (isSelected) {
      content.hidden = false;
      content.inert = false;
    } else {
      // The panel stays visible while it transitions out, so it is made inert
      // rather than hidden — and anything focused inside it moves to the tab
      // that is taking over, which is where the user is looking.
      if (content.contains(document.activeElement)) {
        this.$refs.btn[this.__index]?.focus();
      }
      content.inert = true;
    }

    this.$emit(isSelected ? 'tabs-enable' : 'tabs-disable', { index, btn, content });
  }

  /**
   * Keep exactly one tab in the page's tab sequence.
   * @private
   */
  __syncTabIndexes(index: number): void {
    for (const [i, btn] of this.$refs.btn.entries()) {
      btn.tabIndex = i === index ? 0 : -1;
    }
  }

  /**
   * Run a panel's transitions, then hide it if it was the one leaving.
   * @private
   */
  async __runTransitions(index: number, isEntering: boolean, operation: number): Promise<void> {
    const content = this.$refs.content[index];

    if (!content) {
      return;
    }

    const transitions = this.__transitionsIn(content);

    if (transitions.length === 0) {
      // No `await` before this point, so a tab set with no transition in it
      // settles synchronously — the panel is hidden by the time the click
      // handler returns.
      if (!isEntering) {
        content.hidden = true;
        content.inert = false;
      }
      return;
    }

    const results = await Promise.allSettled(
      transitions.map((transition) => (isEntering ? transition.enter() : transition.leave())),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        this.$error(
          'tabs.transition-failed',
          'A child transition rejected while the tabs were changing panel.',
          result.reason,
        );
      }
    }

    if (operation !== this.__operation) {
      return;
    }

    if (!isEntering) {
      content.hidden = true;
      content.inert = false;
    }
  }

  /**
   * Create the `tablist` / `tab` / `tabpanel` relationships.
   *
   * The ids are only written when the markup has none (`||=`), so an author's
   * own ids survive: overwriting one would break any `aria-describedby` or
   * fragment link pointing at it.
   * @private
   */
  __initializeAccessibility(): void {
    const { list, btn, content } = this.$refs;

    if (list) {
      list.setAttribute('role', 'tablist');

      if (!list.hasAttribute('aria-label') && !list.hasAttribute('aria-labelledby')) {
        this.$warn(
          'tabs.unnamed-tablist',
          'The `list` ref should carry an `aria-label` or an `aria-labelledby` naming the tab list.',
        );
      }
    } else {
      this.$warn(
        'tabs.missing-list-ref',
        'No `list` ref found: the tab buttons need a wrapper carrying `role="tablist"`.',
      );
    }

    if (btn.length !== content.length) {
      this.$warn(
        'tabs.unpaired-refs',
        `Found ${btn.length} \`btn\` refs and ${content.length} \`content\` refs. Each tab needs its panel at the same position.`,
      );
    }

    for (const [index, tab] of btn.entries()) {
      const panel = content[index];

      if (!panel) {
        continue;
      }

      tab.id ||= `${this.$id}-tab-${index}`;
      panel.id ||= `${this.$id}-panel-${index}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      // The panel is a tab stop so its content stays reachable and scrollable
      // when nothing inside it is focusable, which the APG asks for and which
      // no markup can promise ahead of time.
      panel.tabIndex = 0;
    }
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Tabs`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Tabs;
