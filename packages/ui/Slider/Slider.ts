import { Base } from '@studiometa/js-toolkit';
import type {
  BaseProps,
  BaseConfig,
  DragServiceProps,
  KeyServiceProps,
} from '@studiometa/js-toolkit';
import { clamp, inertiaFinalValue, nextFrame } from '@studiometa/js-toolkit/utils';
import { SliderDrag } from './SliderDrag.js';
import { SliderItem } from './SliderItem.js';

export type SliderModes = 'left' | 'center' | 'right';

type SliderState = { x: Record<SliderModes, number> };

export interface SliderProps extends BaseProps {
  $refs: {
    wrapper: HTMLElement;
  };
  $children: {
    SliderItem: SliderItem[];
    SliderDrag: SliderDrag[];
  };
  $options: {
    mode: SliderModes;
    fitBounds: boolean;
    contain: boolean;
    sensitivity: number;
    dropSensitivity: number;
  };
}

/**
 * Slider class.
 * @see https://ui.studiometa.dev/-/components/Slider/
 * @todo a11y
 */
export class Slider<T extends BaseProps = BaseProps> extends Base<T & SliderProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Slider',
    refs: ['wrapper'],
    emits: ['goto', 'index'],
    components: {
      SliderItem,
      SliderDrag,
    },
    options: {
      mode: { type: String, default: 'left' },
      fitBounds: Boolean,
      contain: Boolean,
      sensitivity: { type: Number, default: 1 },
      dropSensitivity: { type: Number, default: 2 },
    },
  };

  /**
   * Distance on the x axis.
   * @private
   */
  __distanceX = 0;

  /**
   * Initial x position.
   * @private
   */
  __initialX = 0;

  /**
   * Index of the current active slide.
   * @private
   */
  __currentIndex = 0;

  /**
   * Drag state.
   * @private
   */
  __isDragging = false;

  /**
   * Store all the states.
   */
  states: SliderState[] = [];

  /**
   * Origins for the different modes.
   */
  origins: Record<SliderModes, number> = {
    left: 0,
    center: 0,
    right: 0,
  };

  /**
   * Wether or not the wrapper is focused.
   */
  hasFocus = false;

  /**
   * Get the current index.
   */
  get currentIndex() {
    return this.__currentIndex;
  }

  /**
   * Set the current index and emit the `index` event.
   */
  set currentIndex(value: number) {
    this.currentSliderItem.disactivate();
    this.$emit('index', value);
    this.__currentIndex = value;
    this.currentSliderItem.activate();
  }

  /**
   * Get the current state.
   */
  get currentState() {
    return this.states[this.currentIndex];
  }

  /**
   * Get the first state.
   */
  get firstState() {
    return this.states[0];
  }

  /**
   * Get the last state.
   */
  get lastState() {
    return this.states.at(-1);
  }

  /**
   * Get the minimal contain state value.
   */
  get containMinState(): number {
    return this.getStateValueByMode(this.firstState.x, 'left');
  }

  /**
   * Get the maximal contain state value.
   */
  get containMaxState(): number {
    return this.getStateValueByMode(this.lastState.x, 'right');
  }

  /**
   * Get the last index.
   */
  get indexMax(): number {
    return this.$children.SliderItem.length - 1;
  }

  /**
   * Get the current SliderItem
   */
  get currentSliderItem() {
    return this.$children.SliderItem[this.currentIndex];
  }

  /**
   * Get the states for each SliderItem.
   */
  getStates(): SliderState[] {
    const { wrapper } = this.$refs;
    const originRect = wrapper.getBoundingClientRect();

    this.origins = {
      left: originRect.left,
      center: originRect.x + originRect.width / 2,
      right: originRect.x + originRect.width,
    };

    const states: SliderState[] = this.$children.SliderItem.map((item) => ({
      x: {
        left: (item.rect.x - this.origins.left) * -1,
        center: (item.rect.x + item.rect.width / 2 - this.origins.center) * -1,
        right: (item.rect.x + item.rect.width - this.origins.right) * -1,
      },
    }));

    if (this.$options.contain) {
      const { mode } = this.$options;
      // Find state where last child has passed the wrapper bound completely
      if (mode === 'left') {
        const lastChild = this.$children.SliderItem.at(-1);

        const maxState = states.find((state) => {
          const lastChildPosition =
            lastChild.rect.x - this.origins.left + lastChild.rect.width + state.x.left;
          const diffWithWrapperBound = originRect.width - lastChildPosition;
          if (diffWithWrapperBound > 0) {
            state.x.left = Math.min(state.x.left + diffWithWrapperBound, 0);
            return true;
          }

          return false;
        });

        if (maxState) {
          return states.map((state) => {
            state.x.left = Math.max(state.x.left, maxState.x.left);
            return state;
          });
        }
      }

      if (mode === 'right') {
        const maxStateIndex = states.findIndex((state) => state.x.right <= 0);
        const maxState = maxStateIndex < 0 ? states.at(-1) : states[maxStateIndex - 1];

        return states.map((state) => {
          state.x.right = maxStateIndex < 0 ? maxState.x.right : Math.min(state.x.right, 0);
          return state;
        });
      }

      if (mode === 'center') {
        this.$warn('The `center` mode is not yet compatible with the `contain` mode.');
      }
    }

    return states;
  }

  /**
   * Get an origin by mode.
   */
  getOriginByMode(mode?: SliderModes) {
    return this.origins[mode ?? this.$options.mode];
  }

  /**
   * Get a state value according to the given mode.
   */
  getStateValueByMode(state: SliderState['x'], mode?: SliderModes) {
    return state[mode ?? this.$options.mode];
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.states = this.getStates();
    this.setAccessibilityAttributes();
    this.goTo(this.currentIndex);
  }

  /**
   * Resized hook.
   */
  resized() {
    nextFrame(() => {
      this.states = this.getStates();
      nextFrame(() => {
        this.goTo(this.currentIndex);
      });
    });
  }

  /**
   * Set accessibility attributes for the component
   */
  setAccessibilityAttributes() {
    this.$el.setAttribute('role', 'group');
    this.$el.setAttribute('aria-roledescription', 'carousel');
  }

  /**
   * Go to the next slide.
   */
  goNext() {
    if (this.currentIndex + 1 > this.indexMax) {
      return;
    }

    this.goTo(this.currentIndex + 1);
  }

  /**
   * Go to the previous slide.
   */
  goPrev() {
    if (this.currentIndex - 1 < 0) {
      return;
    }

    this.goTo(this.currentIndex - 1);
  }

  /**
   * Go to the given index.
   */
  goTo(index: number, { withInstantMove = true } = {}) {
    if (index < 0 || index > this.indexMax) {
      throw new Error('Index out of bound.');
    }

    const currentState = this.getStateValueByMode(this.currentState.x);
    const state = this.getStateValueByMode(this.states[index].x);

    for (const item of this.$children.SliderItem) {
      // Better perfs when going fast through the slides
      if (currentState !== state && withInstantMove) {
        item.moveInstantly(currentState);
      }
      nextFrame(() => item.move(state));
    }

    this.currentIndex = index;
    this.$emit('goto', index);
  }

  /**
   * Listen to the Draggable `start` event.
   */
  onSliderDragStart() {
    this.__initialX = this.currentSliderItem ? this.currentSliderItem.x : 0;
    this.__distanceX = this.__initialX;

    this.__isDragging = true;
  }

  /**
   * Listen to the Draggable `drag` event.
   */
  onSliderDragDrag({ args: [props] }: { args: [DragServiceProps] }) {
    if (Math.abs(props.delta.y) > Math.abs(props.delta.x)) {
      return;
    }

    this.__distanceX = this.__initialX + props.distance.x * this.$options.sensitivity;

    for (const item of this.$children.SliderItem) {
      item.moveInstantly(this.__distanceX);
    }
  }

  /**
   * Listen to the Draggable `drop` event and find the new active slide.
   */
  onSliderDragDrop({ args: [props] }: { args: [DragServiceProps] }) {
    if (!this.__isDragging) {
      return;
    }
    this.__isDragging = false;

    if (Math.abs(props.delta.y) > Math.abs(props.delta.x)) {
      return;
    }

    let finalX = clamp(
      inertiaFinalValue(this.__distanceX, props.delta.x * this.$options.dropSensitivity),
      this.getStateValueByMode(this.firstState.x),
      this.getStateValueByMode(this.lastState.x),
    );

    const absoluteDifferencesBetweenDistanceAndState = this.states.map((state) =>
      Math.abs(finalX - this.getStateValueByMode(state.x)),
    );
    const minimumDifference = Math.min(...absoluteDifferencesBetweenDistanceAndState);
    const closestIndex = absoluteDifferencesBetweenDistanceAndState.indexOf(minimumDifference);

    if (this.$options.fitBounds) {
      this.goTo(closestIndex, { withInstantMove: false });
    } else {
      if (this.$options.contain) {
        finalX = Math.min(this.containMinState, finalX);
        finalX = Math.max(this.containMaxState, finalX);
      }
      for (const item of this.$children.SliderItem) {
        item.move(finalX);
      }
      this.currentIndex = closestIndex;
    }
  }

  /**
   * Enable focus.
   */
  onWrapperFocus() {
    this.hasFocus = true;
  }

  /**
   * Disable focus.
   */
  onWrapperBlur() {
    this.hasFocus = false;
  }

  /**
   * Go prev or next when focus is on the wrapper and pressing arrow keys.
   */
  keyed({ LEFT, RIGHT, isDown }: KeyServiceProps) {
    if (this.hasFocus && isDown) {
      if (LEFT) {
        this.goPrev();
      } else if (RIGHT) {
        this.goNext();
      }
    }
  }
}
