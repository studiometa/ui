import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { ActionEvent } from './ActionEvent.js';

export interface ActionProps extends BaseProps {
  $options: {
    on: string;
    target: string;
    selector: string;
    effect: string;
  };
}

/**
 * Action class.
 * @link https://ui.studiometa.dev/-/components/Action/
 */
export class Action<T extends BaseProps = BaseProps> extends Base<ActionProps & T> {
  static config: BaseConfig = {
    name: 'Action',
    options: {
      on: {
        type: String,
        default: 'click',
      },
      target: String,
      effect: String,
    },
  };

  /**
   * @private
   */
  __actionEvents: Set<ActionEvent<Action>>;

  get actionEvents() {
    if (this.__actionEvents) {
      return this.__actionEvents;
    }

    const { on } = this.$options;
    this.__actionEvents = new Set();

    // @ts-ignore
    for (const attribute of this.$el.attributes) {
      if (attribute.name.includes('on:')) {
        const name = attribute.name.split('on:').pop();
        this.__actionEvents.add(new ActionEvent(this, name, attribute.value));
      }
    }

    if (on) {
      const { target, effect } = this.$options;
      if (effect) {
        const effectDefinition = target ? `${target}${ActionEvent.effectSeparator}${effect}` : effect;
        this.__actionEvents.add(new ActionEvent(this, on, effectDefinition));
      }
    }

    return this.__actionEvents;
  }

  /**
   * Mounted
   */
  mounted() {
    for (const actionEvent of this.actionEvents) {
      actionEvent.attachEvent();
    }
  }

  /**
   * Destroyed
   */
  destroyed() {
    for (const actionEvent of this.actionEvents) {
      actionEvent.detachEvent();
    }
  }
}
