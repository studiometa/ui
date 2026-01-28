import type {
  Base,
  BaseProps,
  BaseConfig,
  BaseInterface,
  BaseDecorator,
  ScrollInViewProps,
} from '@studiometa/js-toolkit';
import { createElement } from '@studiometa/js-toolkit/utils';

/**
 * Debug marker element interface.
 */
interface DebugElements {
  wrapper: HTMLElement;
  startMarker: HTMLElement;
  endMarker: HTMLElement;
  progress: HTMLElement;
  progressBar: HTMLElement;
  progressText: HTMLElement;
}

/**
 * Debug colors for different timelines.
 */
const debugColors = [
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/**
 * Get debug color for a given index.
 */
function getDebugColor(index: number): string {
  return debugColors[(index - 1) % debugColors.length];
}

/**
 * Debug styles.
 */
const debugStyles = `
  .scroll-animation-debug {
    --debug-color: #8b5cf6;
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 80px;
    pointer-events: none;
    z-index: 99999;
    font-family: ui-monospace, monospace;
    font-size: 10px;
  }
  .scroll-animation-debug__marker {
    position: absolute;
    right: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    color: white;
    white-space: nowrap;
    transform: translateY(-50%);
  }
  .scroll-animation-debug__marker::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    width: 100vw;
    height: 1px;
    background: var(--debug-color);
  }
  .scroll-animation-debug__marker--start {
    background: var(--debug-color);
  }
  .scroll-animation-debug__marker--end {
    background: var(--debug-color);
    opacity: 0.7;
  }
  .scroll-animation-debug__outline {
    position: absolute;
    inset: 0;
    border: 2px dashed var(--debug-color);
    pointer-events: none;
    z-index: 99998;
  }
  .scroll-animation-debug-progress-container {
    position: fixed;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    pointer-events: none;
    z-index: 99999;
    font-family: ui-monospace, monospace;
    font-size: 10px;
  }
  .scroll-animation-debug__progress {
    --debug-color: #8b5cf6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .scroll-animation-debug__progress-bar {
    width: 4px;
    height: 60px;
    background: rgba(139, 92, 246, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }
  .scroll-animation-debug__progress-fill {
    width: 100%;
    background: var(--debug-color);
    border-radius: 2px;
    transition: height 0.1s ease-out;
  }
  .scroll-animation-debug__progress-text {
    color: var(--debug-color);
    font-weight: bold;
    width: 3ch;
    text-align: center;
  }
`;

/**
 * Shared style element.
 */
let styleElement: HTMLStyleElement | null = null;

/**
 * Shared progress container.
 */
let progressContainer: HTMLElement | null = null;

/**
 * Debug instance counter.
 */
let debugInstanceCount = 0;

/**
 * Debug ID counter.
 */
let debugIdCounter = 0;

/**
 * Inject debug styles if not already injected.
 */
function injectDebugStyles() {
  if (!styleElement) {
    styleElement = createElement('style', [debugStyles]) as HTMLStyleElement;
    document.head.appendChild(styleElement);
  }
}

/**
 * Remove debug styles if no more instances.
 */
function removeDebugStyles() {
  if (styleElement && debugInstanceCount === 0) {
    styleElement.remove();
    styleElement = null;
  }
}

/**
 * Get or create the shared progress container.
 */
function getProgressContainer(): HTMLElement {
  if (!progressContainer) {
    progressContainer = createElement('div', {
      class: 'scroll-animation-debug-progress-container',
    });
    document.body.appendChild(progressContainer);
  }
  return progressContainer;
}

/**
 * Remove progress container if empty.
 */
function cleanupProgressContainer() {
  if (progressContainer && progressContainer.children.length === 0) {
    progressContainer.remove();
    progressContainer = null;
  }
}

/**
 * Named offset values mapping.
 */
const namedOffsets: Record<string, number> = {
  start: 0,
  center: 0.5,
  end: 1,
};

/**
 * Parse an offset value to a ratio (0-1).
 */
function parseOffsetValue(value: string): number {
  if (namedOffsets[value] !== undefined) {
    return namedOffsets[value];
  }
  if (value.endsWith('%')) {
    return Number.parseFloat(value) / 100;
  }
  return Number.parseFloat(value) || 0;
}

/**
 * Parse the offset option to get viewport positions.
 * Format: "<targetStart> <viewportStart> / <targetEnd> <viewportEnd>"
 */
function parseOffset(offset: string): { viewportStart: number; viewportEnd: number } {
  const parts = offset.split('/').map((part) => part.trim().split(' '));
  const viewportStart = parseOffsetValue(parts[0]?.[1] || 'end');
  const viewportEnd = parseOffsetValue(parts[1]?.[1] || 'start');
  return { viewportStart, viewportEnd };
}

/**
 * Create debug marker elements.
 */
function createDebugElements(color: string): DebugElements {
  const startMarker = createElement(
    'div',
    { class: 'scroll-animation-debug__marker scroll-animation-debug__marker--start' },
    [createElement('span', ['start'])],
  );

  const endMarker = createElement(
    'div',
    { class: 'scroll-animation-debug__marker scroll-animation-debug__marker--end' },
    [createElement('span', ['end'])],
  );

  const wrapper = createElement('div', { class: 'scroll-animation-debug' }, [
    startMarker,
    endMarker,
  ]) as HTMLElement;
  wrapper.style.setProperty('--debug-color', color);

  const progressBar = createElement('div', { class: 'scroll-animation-debug__progress-fill' });
  const progressText = createElement('span', { class: 'scroll-animation-debug__progress-text' }, [
    '0%',
  ]);

  const progress = createElement('div', { class: 'scroll-animation-debug__progress' }, [
    createElement('div', { class: 'scroll-animation-debug__progress-bar' }, [progressBar]),
    progressText,
  ]) as HTMLElement;
  progress.style.setProperty('--debug-color', color);

  return {
    wrapper,
    startMarker,
    endMarker,
    progress,
    progressBar,
    progressText,
  };
}

/**
 * Create outline element for the timeline.
 */
function createOutlineElement(color: string): HTMLElement {
  const outline = createElement('div', {
    class: 'scroll-animation-debug__outline',
  }) as HTMLElement;
  outline.style.setProperty('--debug-color', color);
  return outline;
}

export interface WithScrollAnimationDebugProps extends BaseProps {
  $options: {
    debug: boolean;
    offset: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WithScrollAnimationDebugInterface extends BaseInterface {}

/**
 * Add debug capabilities to a ScrollAnimationTimeline component.
 *
 * @example
 * ```js
 * import { ScrollAnimationTimeline } from '@studiometa/ui';
 * import { withScrollAnimationDebug } from '@studiometa/ui/ScrollAnimation/withScrollAnimationDebug';
 *
 * class App extends Base {
 *   static config = {
 *     name: 'App',
 *     components: {
 *       ScrollAnimationTimeline: withScrollAnimationDebug(ScrollAnimationTimeline),
 *     },
 *   };
 * }
 * ```
 */
export function withScrollAnimationDebug<S extends Base>(
  BaseClass: typeof Base,
): BaseDecorator<WithScrollAnimationDebugInterface, S, WithScrollAnimationDebugProps> {
  /**
   * Class.
   */
  class WithScrollAnimationDebug<T extends BaseProps = BaseProps> extends BaseClass<
    T & WithScrollAnimationDebugProps
  > {
    static config: BaseConfig = {
      ...BaseClass.config,
      name: BaseClass.config.name,
      options: {
        ...BaseClass.config.options,
        debug: Boolean,
      },
    };

    /**
     * Debug elements.
     */
    private __debugElements: DebugElements | null = null;

    /**
     * Debug outline element.
     */
    private __debugOutline: HTMLElement | null = null;

    /**
     * Debug ID.
     */
    private __debugId: string = '';

    /**
     * Mounted hook.
     */
    mounted() {
      // @ts-expect-error - Calling parent method
      if (super.mounted) super.mounted();
      if (this.$options.debug) {
        this.__initDebug();
      }
    }

    /**
     * Destroyed hook.
     */
    destroyed() {
      this.__destroyDebug();
      // @ts-expect-error - Calling parent method
      if (super.destroyed) super.destroyed();
    }

    /**
     * Initialize debug elements.
     */
    __initDebug() {
      debugIdCounter += 1;
      debugInstanceCount += 1;
      this.__debugId = `timeline-${debugIdCounter}`;

      const color = getDebugColor(debugIdCounter);

      // Inject styles
      injectDebugStyles();

      // Create and append debug markers
      this.__debugElements = createDebugElements(color);
      document.body.appendChild(this.__debugElements.wrapper);

      // Append progress to shared container
      const container = getProgressContainer();
      container.appendChild(this.__debugElements.progress);

      // Position markers based on offset option
      const { viewportStart, viewportEnd } = parseOffset(this.$options.offset);
      const viewportHeight = window.innerHeight;

      this.__debugElements.startMarker.style.top = `${viewportStart * viewportHeight}px`;
      this.__debugElements.endMarker.style.top = `${viewportEnd * viewportHeight}px`;

      // Create and append outline
      this.__debugOutline = createOutlineElement(color);
      const position = getComputedStyle(this.$el).position;
      if (position === 'static') {
        (this.$el as HTMLElement).style.position = 'relative';
      }
      this.$el.appendChild(this.__debugOutline);
    }

    /**
     * Destroy debug elements.
     */
    __destroyDebug() {
      if (this.__debugElements) {
        this.__debugElements.wrapper.remove();
        this.__debugElements.progress.remove();
        this.__debugElements = null;
      }

      if (this.__debugOutline) {
        this.__debugOutline.remove();
        this.__debugOutline = null;
      }

      if (this.$options.debug) {
        debugInstanceCount -= 1;
        cleanupProgressContainer();
        removeDebugStyles();
      }
    }

    /**
     * Update debug progress.
     */
    __updateDebug(props: ScrollInViewProps) {
      if (!this.__debugElements) return;

      const { progressBar, progressText } = this.__debugElements;

      // Update progress
      const progress = Math.round(props.dampedProgress.y * 100);
      progressBar.style.height = `${progress}%`;
      progressText.textContent = `${progress}%`;
    }

    /**
     * Scrolled in view hook.
     */
    scrolledInView(props: ScrollInViewProps) {
      if (this.$options.debug) {
        this.__updateDebug(props);
      }

      // @ts-expect-error - Calling parent method
      super.scrolledInView(props);
    }
  }

  // @ts-ignore
  return WithScrollAnimationDebug;
}
