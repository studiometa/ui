import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Dialog } from '../Dialog/index.js';
import type { Transition } from '../Transition/index.js';
import type { ViewTransition } from '../ViewTransition/index.js';

export type DrawerPosition = 'top' | 'right' | 'bottom' | 'left';

export interface DrawerProps extends BaseProps {
  $options: {
    /**
     * The edge the drawer slides in from.
     */
    position: DrawerPosition;
  };
}

const DEFAULT_POSITION: DrawerPosition = 'right';

/**
 * Drawer class.
 *
 * A `Dialog` whose panel slides in from an edge. The `position` option is the
 * only thing it adds: it picks the Tailwind translate class fed to the panel's
 * transition as its hidden state — there is no matrix/geometry maths.
 *
 * The panel is the transition child flagged with `data-drawer-panel`; its slide
 * class is injected into the child's hidden-state transition options (and its
 * initial class) on mount. For smooth sliding in Firefox the panel should use
 * the `ViewTransition` component, which animates a snapshot in the
 * view-transition overlay and so sidesteps a top-layer transform bug;
 * `Transition` remains the fallback.
 *
 * @link https://ui.studiometa.dev/components/Drawer/
 */
export class Drawer<T extends BaseProps = BaseProps> extends Dialog<T & DrawerProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Drawer',
    options: {
      position: {
        type: String,
        default: DEFAULT_POSITION,
      },
    },
  };

  /**
   * The translate class hiding the panel offscreen, per position.
   */
  static slideClasses: Record<DrawerPosition, string> = {
    top: '-translate-y-full',
    right: 'translate-x-full',
    bottom: 'translate-y-full',
    left: '-translate-x-full',
  };

  /**
   * Get the slide class for the current position.
   */
  get slideClass(): string {
    return Drawer.slideClasses[this.$options.position] ?? Drawer.slideClasses[DEFAULT_POSITION];
  }

  /**
   * Get the transition children flagged as panels.
   */
  get panels(): Array<Transition | ViewTransition> {
    return this.transitions.filter((transition) => transition.$el.hasAttribute('data-drawer-panel'));
  }

  /**
   * Feed the slide class to each panel's transition on mount.
   */
  mounted() {
    const { slideClass } = this;

    for (const panel of this.panels) {
      panel.$el.classList.add(...slideClass.split(' '));

      // Append the slide class to whichever hidden-state options the child
      // exposes: `leaveTo` (both `Transition` and `ViewTransition`) and
      // `enterFrom` (`Transition` only).
      const options = panel.$options as Record<string, unknown>;
      for (const key of ['leaveTo', 'enterFrom']) {
        if (typeof options[key] === 'string') {
          options[key] = [options[key], slideClass].filter(Boolean).join(' ');
        }
      }
    }
  }
}
