import { Base } from '@studiometa/js-toolkit';
import { clamp, inertiaFinalValue, nextFrame } from '@studiometa/js-toolkit/utils';
import Draggable from '../../primitives/Draggable/Draggable.js';
import SliderItem from './SliderItem.js';

/**
 * Orchestrate the slider items state transition.
 * @todo a11y
 * @todo better state management with `mode` option
 */
export default class Slider extends Base {
  static config = {
    name: 'Slider',
    refs: ['wrapper'],
    components: {
      SliderItem,
      Draggable,
    },
    options: {
      mode: { type: String, default: 'left' },
      fitBounds: Boolean,
      sensitivity: { type: Number, default: 1 },
    },
  };

  __distanceX = 0;

  __initialX = 0;

  currentIndex = 0;

  states = [];

  get currentState() {
    return this.states[this.currentIndex];
  }

  get firstState() {
    return this.states[0];
  }

  get lastState() {
    return this.states[this.states.length - 1];
  }

  get indexMax() {
    return this.$children.SliderItem.length - 1;
  }

  get currentSliderItem() {
    return this.$children.SliderItem[this.currentIndex];
  }

  /**
   * @todo save value for every available modes to avoid recalculation when switching
   */
  getStates() {
    const { wrapper } = this.$refs;
    const originRect = wrapper.getBoundingClientRect();

    let origin = originRect.left;
    const origins = {
      left: originRect.left,
      center: originRect.x + originRect.width / 2,
      right: originRect.x + originRect.width,
    };

    return this.$children.SliderItem.map((item) => {
      return {
        x: {
          left: (item.rect.x - origins.left) * -1,
          center: (item.rect.x + item.rect.width / 2 - origins.center) * -1,
          right: (item.rect.x + item.rect.width - origins.right) * -1,
        },
      };
    });
  }

  getStateValueByMode(state, mode) {
    return state[mode ?? this.$options.mode];
  }

  mounted() {
    this.states = this.getStates();
    this.prepareInvisibleItems();
    this.goTo(this.currentIndex);
  }

  resized() {
    nextFrame(() => {
      this.states = this.getStates();
      nextFrame(() => {
        const state = this.states[this.currentIndex];
        this.getVisibleItems(this.getStateValueByMode(state)).forEach((item) => {
          item.moveInstantly(state.x);
        });
        this.prepareInvisibleItems();
      });
    });
  }

  goNext() {
    if (this.currentIndex + 1 > this.indexMax) {
      return;
    }

    this.goTo(this.currentIndex + 1);
  }

  goPrev() {
    if (this.currentIndex - 1 < 0) {
      return;
    }

    this.goTo(this.currentIndex - 1);
  }

  /**
   * Go to
   * @param {number} index
   */
  goTo(index) {
    if (index < 0 || index > this.indexMax) {
      throw new Error('Index out of bound.');
    }

    const state = this.getStateValueByMode(this.states[index].x);
    const itemsToMove = this.getVisibleItems(state);

    if (index < this.currentIndex) {
      itemsToMove.reverse();
    }

    itemsToMove.forEach((item) => {
      nextFrame(() => item.move(state));
    });

    this.currentIndex = index;
    this.$emit('goto', index);
  }

  onDraggableStart() {
    this.__initialX = this.currentSliderItem ? this.currentSliderItem.x : 0;
  }

  onDraggableDrag(props) {
    if (Math.abs(props.delta.y) > Math.abs(props.delta.x)) {
      return;
    }

    this.__distanceX = this.__initialX + props.distance.x * this.$options.sensitivity;

    this.getVisibleItems(this.__distanceX).forEach((item) => {
      item.moveInstantly(this.__distanceX);
    });
  }

  onDraggableDrop(props) {
    if (Math.abs(props.delta.y) > Math.abs(props.delta.x)) {
      return;
    }

    const finalX = clamp(
      inertiaFinalValue(this.__distanceX, props.delta.x * this.$options.sensitivity),
      0,
      this.lastState.x
    );

    const absoluteDifferencesBetweenDistanceAndState = this.states.map((state) =>
      Math.abs(finalX - this.getStateValueByMode(state.x))
    );
    const minimumDifference = Math.min(...absoluteDifferencesBetweenDistanceAndState);
    const closestIndex = absoluteDifferencesBetweenDistanceAndState.findIndex(
      (number) => number === minimumDifference
    );

    if (this.$options.fitBounds) {
      this.goTo(closestIndex);
    } else {
      this.$children.SliderItem.forEach((item, i) => {
        item.move(finalX);
      });
      this.currentIndex = closestIndex;
    }
  }

  /**
   * Prepare invisible items.
   * @returns {void}
   */
  prepareInvisibleItems() {
    const state = this.states[this.currentIndex];
    const nextItemsToPrepare = [];
    const previousItemsToPrepare = [];

    this.getInvisibleItems(this.getStateValueByMode(state)).forEach((item, i) => {
      if (i > this.currentIndex) {
        nextItemsToPrepare.push(item);
        return;
      }

      if (i < this.currentIndex) {
        previousItemsToPrepare.push(item);
      }
    });

    nextItemsToPrepare.forEach((item) => {
      const invisibleState = this.getStateWhereItemWillBeInvisible(item);
      if (invisibleState) {
        item.moveInstantly(invisibleState.x);
      }
    });

    previousItemsToPrepare.forEach((item) => {
      const invisibleState = this.getStateWhereItemWillBeInvisible(item, { reversed: true });
      if (invisibleState) {
        item.moveInstantly(invisibleState.x);
      }
    });
  }

  /**
   * Get the state where the given item will be visible.
   *
   * @param   {SliderItem} item
   * @returns {{ x: number }}
   */
  getStateWhereItemWillBeInvisible(item, { reversed = false } = {}) {
    const visibleStates = this.states.filter((state) => item.willBeVisible(state.x));
    const firstVisibleState = visibleStates[0];
    const lastVisibleState = visibleStates[visibleStates.length - 1];
    const firstVisibleStateIndex = this.states.findIndex(
      (state) => this.getStateValueByMode(state.x) === this.getStateValueByMode(firstVisibleState.x)
    );
    const lastVisibleStateIndex = this.states.findIndex((state) => state.x === lastVisibleState.x);

    return reversed
      ? this.states[lastVisibleStateIndex + 1]
      : this.states[firstVisibleStateIndex - 1];
  }

  getVisibleItems(target) {
    return this.$children.SliderItem.filter((item) => item.isVisible || item.willBeVisible(target));
  }

  getInvisibleItems(target) {
    return this.$children.SliderItem.filter(item => !item.isVisible && !item.willBeVisible(target));
  }
}
