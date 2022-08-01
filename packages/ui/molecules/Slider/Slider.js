import { Base } from '@studiometa/js-toolkit';
import { clamp, inertiaFinalValue, nextFrame } from '@studiometa/js-toolkit/utils';
import SliderDrag from './SliderDrag.js';
import SliderItem from './SliderItem.js';

/**
 * @typedef {'left'|'center'|'right'} SliderModes
 * @typedef {{ x: Record<SliderModes, number> }} SliderState
 */

/**
 * @typedef {Object} SliderChildren
 * @property {SliderItem[]} SliderItem
 * @property {SliderDrag[]} SliderDrag
 */

/**
 * @typedef {Object} SliderOptions
 * @property {SliderModes} mode
 * @property {boolean} fitBounds
 * @property {number} sensitivity
 */

/**
 * @typedef {Object} SliderPrivateInterface
 * @property {{ wrapper: HTMLElement }} $refs
 * @property {SliderChildren} $children
 * @property {SliderOptions} $options
 */

/**
 * @typedef {Slider & SliderPrivateInterface} SliderInterface
 */

/**
 * Orchestrate the slider items state transition.
 * @todo a11y
 */
export default class Slider extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'Slider',
    refs: ['wrapper', 'debug'],
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

  __distanceX = 0;

  __initialX = 0;

  /**
   * Index of the current active slide.
   * @type {number}
   */
  __currentIndex = 0;

  /**
   * Get the current index.
   * @returns {number}
   */
  get currentIndex() {
    return this.__currentIndex;
  }

  /**
   * Set the current index and emit the `index` event.
   * @param   {number} value
   * @returns {void}
   */
  set currentIndex(value) {
    this.currentSliderItem.disactivate();
    this.$emit('index', value);
    this.__currentIndex = value;
    this.currentSliderItem.activate();
  }

  /**
   * Store all the states.
   * @type {SliderState[]}
   */
  states = [];

  /**
   * Origins for the different modes.
   * @type {Record<SliderModes, number>}
   */
  origins = {
    left: 0,
    center: 0,
    right: 0,
  };

  /**
   * Get the current state.
   * @returns {SliderState}
   */
  get currentState() {
    return this.states[this.currentIndex];
  }

  /**
   * Get the first state.
   * @returns {SliderState}
   */
  get firstState() {
    return this.states[0];
  }

  /**
   * Get the last state.
   * @returns {SliderState}
   */
  get lastState() {
    return this.states[this.states.length - 1];
  }

  /**
   * Get the minimal contain state value.
   * @returns {number} [description]
   */
  get containMinState() {
    return this.getStateValueByMode(this.firstState.x, 'left');
  }

  /**
   * Get the maximal contain state value.
   * @returns {number} [description]
   */
  get containMaxState() {
    return this.getStateValueByMode(this.lastState.x, 'right');
  }

  /**
   * Get the last index.
   *
   * @this    {SliderInterface}
   * @returns {number}
   */
  get indexMax() {
    return this.$children.SliderItem.length - 1;
  }

  /**
   * Get the current SliderItem
   *
   * @this    {SliderInterface}
   * @returns {SliderItem}
   */
  get currentSliderItem() {
    return this.$children.SliderItem[this.currentIndex];
  }

  /**
   * Get the states for each SliderItem.
   *
   * @this {SliderInterface}
   */
  getStates() {
    const { wrapper } = this.$refs;
    const originRect = wrapper.getBoundingClientRect();

    this.origins = {
      left: originRect.left,
      center: originRect.x + originRect.width / 2,
      right: originRect.x + originRect.width,
    };

    let states = this.$children.SliderItem.map((item) => ({
      x: {
        left: (item.rect.x - this.origins.left) * -1,
        center: (item.rect.x + item.rect.width / 2 - this.origins.center) * -1,
        right: (item.rect.x + item.rect.width - this.origins.right) * -1,
      },
    }));
    // .map(({ item, state}, index, arr) => {
    //   if (this.$options.contain) {
    //     const { item: lastItem, state: lastState } = arr[arr.length - 1];
    //     const lastItemPosition = Math.abs(lastState.x.left - lastItem.rect.width);
    //     const lastItemDiffWithRightOrigin = this.origins.right - lastItemPosition;
    //     console.log({ lastItemPosition, lastItemDiffWithRightOrigin })
    //     if (lastItemDiffWithRightOrigin < 0) {
    //       state.x.leftContained = { lastItemPosition, lastItemDiffWithRightOrigin };
    //     }
    //   }

    //   return state;
    // });
    if (this.$options.contain) {
      // Find state where last child has passed the wrapper bound completely
      if (this.$options.mode === 'left') {
        const lastChild = this.$children.SliderItem.at(-1);

        const maxState = states.find((state) => {
          const lastChildPosition =
            lastChild.rect.x - this.origins.left + lastChild.rect.width + state.x.left;
          const diffWithWrapperBound = originRect.width - lastChildPosition;
          if (diffWithWrapperBound > 0) {
            state.x.left = Math.min(state.x.left + diffWithWrapperBound, 0);
            return true;
          }
        });

        if (maxState) {
          states = states.map((state) => {
            state.x.left = Math.max(state.x.left, maxState.x.left);
            return state;
          });
        }
      }

      if (this.$options.mode === 'right') {
        const firstChild = this.$children.SliderItem.at(0);

        // @todo manage case where all slides are visible
        const maxState = Array.from(states).find((state) => {
          if (state.x.right < 0) {
            const firstChildPosition = firstChild.rect.x - this.origins.left + state.x.right;
            state.x.right = Math.max(state.x.right + firstChildPosition, 0);
            return true;
          }
        });

        if (maxState) {
          states = states.map((state) => {
            state.x.right = Math.min(state.x.right, maxState.x.right);
            return state;
          });
        }
      }
    }

    this.$refs.debug.innerHTML = JSON.stringify(
      { origins: this.origins, originRect, states },
      null,
      2
    );

    return states;
  }

  /**
   * Get an origin by mode.
   * @param   {SliderOptions['mode']} [mode]
   * @returns {number}
   */
  getOriginByMode(mode) {
    return this.origins[mode ?? this.$options.mode];
  }

  /**
   * Get a state value according to the given mode.
   *
   * @this    {SliderInterface}
   * @param   {SliderState['x']} state
   * @param   {SliderOptions['mode']} [mode]
   * @returns {number}
   */
  getStateValueByMode(state, mode) {
    return state[mode ?? this.$options.mode];
  }

  /**
   * Mounted hook.
   *
   * @returns {void}
   */
  mounted() {
    this.states = this.getStates();
    this.prepareInvisibleItems();
    this.goTo(this.currentIndex);
  }

  /**
   * Resized hook.
   * @returns {void}
   */
  resized() {
    nextFrame(() => {
      this.states = this.getStates();
      nextFrame(() => {
        this.prepareInvisibleItems();
        this.goTo(this.currentIndex);
        // const stateValue = this.getStateValueByMode(this.states[this.currentIndex].x);
        // this.getVisibleItems(stateValue).forEach((item) => {
        //   item.moveInstantly(stateValue);
        // });
      });
    });
  }

  /**
   * Go to the next slide.
   *
   * @returns {void}
   */
  goNext() {
    if (this.currentIndex + 1 > this.indexMax) {
      return;
    }

    this.goTo(this.currentIndex + 1);
  }

  /**
   * Go to the previous slide.
   *
   * @returns {void}
   */
  goPrev() {
    if (this.currentIndex - 1 < 0) {
      return;
    }

    this.goTo(this.currentIndex - 1);
  }

  /**
   * Go to the given index.
   *
   * @this  {SliderInterface}
   * @param {number} index
   * @returns {void}
   */
  goTo(index) {
    if (index < 0 || index > this.indexMax) {
      throw new Error('Index out of bound.');
    }

    let state = this.getStateValueByMode(this.states[index].x);

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

  /**
   * Listen to the Draggable `start` event.
   *
   * @returns {void}
   */
  onSliderDragStart() {
    this.__initialX = this.currentSliderItem ? this.currentSliderItem.x : 0;
  }

  /**
   * Listen to the Draggable `drag` event.
   *
   * @param   {import('@studiometa/js-toolkit/services/drag').DragServiceProps} props
   * @returns {void}
   */
  onSliderDragDrag(props) {
    if (Math.abs(props.delta.y) > Math.abs(props.delta.x)) {
      return;
    }

    this.__distanceX = this.__initialX + props.distance.x * this.$options.sensitivity;

    this.getVisibleItems(this.__distanceX).forEach((item) => {
      item.moveInstantly(this.__distanceX);
    });
  }

  /**
   * Listen to the Draggable `drop` event and find the new active slide.
   *
   * @this    {SliderInterface}
   * @param   {import('@studiometa/js-toolkit/services/drag').DragServiceProps} props
   * @returns {void}
   */
  onSliderDragDrop(props) {
    if (Math.abs(props.delta.y) > Math.abs(props.delta.x)) {
      return;
    }

    let finalX = clamp(
      inertiaFinalValue(this.__distanceX, props.delta.x * this.$options.dropSensitivity),
      0,
      this.getStateValueByMode(this.lastState.x)
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
      if (this.$options.contain) {
        finalX = Math.min(this.containMinState, finalX);
        finalX = Math.max(this.containMaxState, finalX);
      }
      this.$children.SliderItem.forEach((item) => {
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

    this.getInvisibleItems(this.getStateValueByMode(state.x)).forEach((item, i) => {
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
        item.moveInstantly(this.getStateValueByMode(invisibleState.x));
      }
    });

    previousItemsToPrepare.forEach((item) => {
      const invisibleState = this.getStateWhereItemWillBeInvisible(item, { reversed: true });
      if (invisibleState) {
        item.moveInstantly(this.getStateValueByMode(invisibleState.x));
      }
    });
  }

  /**
   * Get the state where the given item will be visible.
   *
   * @param   {SliderItem} item
   * @returns {SliderState}
   */
  getStateWhereItemWillBeInvisible(item, { reversed = false } = {}) {
    const visibleStates = this.states.filter((state) =>
      item.willBeVisible(this.getStateValueByMode(state.x))
    );
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

  /**
   * Get the visible slides for the given position.
   *
   * @this    {SliderInterface}
   * @param   {number} target
   * @returns {SliderItem[]}
   */
  getVisibleItems(target) {
    return this.$children.SliderItem.filter((item) => item.isVisible || item.willBeVisible(target));
  }

  /**
   * Get the invisible slides for the given position.
   *
   * @this    {SliderInterface}
   * @param   {number} target
   * @returns {SliderItem[]}
   */
  getInvisibleItems(target) {
    return this.$children.SliderItem.filter(
      (item) => !item.isVisible && !item.willBeVisible(target)
    );
  }
}
