import deepmerge from 'deepmerge';
import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { arrayMerge } from './utils.js';

export interface TrackContextProps extends BaseProps {
  $refs: {
    context?: HTMLScriptElement;
  };
  $options: {
    context: Record<string, unknown>;
  };
}

/**
 * TrackContext class.
 *
 * Provides hierarchical context data that is merged into descendant Track
 * components. The context is resolved from two sources merged together, the
 * `context` ref (a `<script data-ref="context" type="application/json">`
 * element) and the `data-option-context` attribute, and is then merged with
 * the context of every ancestor TrackContext (outermost first, innermost
 * wins).
 *
 * @link https://ui.studiometa.dev/components/Track/js-api.html#trackcontext
 *
 * @example
 * ```html
 * <section
 *   data-component="TrackContext"
 *   data-option-context='{"page_type": "product", "product_id": "123"}'>
 *
 *   <button
 *     data-component="Track"
 *     data-track:click='{"event": "add_to_cart"}'>
 *     Add to Cart
 *   </button>
 *   <!-- Dispatches: { page_type: "product", product_id: "123", event: "add_to_cart" } -->
 * </section>
 * ```
 */
export class TrackContext<T extends BaseProps = BaseProps> extends Base<TrackContextProps & T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'TrackContext',
    refs: ['context'],
    options: {
      context: {
        type: Object,
        default: () => ({}),
      },
    },
  };

  /**
   * Get the data from the optional `context` ref, a
   * `<script data-ref="context" type="application/json">` element.
   */
  get scriptData(): Record<string, unknown> {
    const script = this.$refs.context;

    if (!script) {
      return {};
    }

    try {
      return JSON.parse(script.textContent || '{}') ?? {};
    } catch (err) {
      this.$warn('Invalid JSON in the `context` ref:', err);
      return {};
    }
  }

  /**
   * Get the data from the `data-option-context` attribute.
   *
   * The `OptionsManager` parses the attribute JSON lazily on access and throws
   * on invalid JSON, hence the `try`/`catch`.
   */
  get attrData(): Record<string, unknown> {
    try {
      return this.$options.context ?? {};
    } catch (err) {
      this.$warn('Invalid JSON in the `data-option-context` attribute:', err);
      return {};
    }
  }

  /**
   * Get the component's own context, the `context` ref merged with the
   * `data-option-context` attribute (attribute wins).
   */
  get ownData(): Record<string, unknown> {
    return deepmerge(this.scriptData, this.attrData, { arrayMerge });
  }

  /**
   * Get the full context, the own context merged on top of every ancestor
   * TrackContext context (outermost first, innermost wins).
   *
   * The lookup uses `$closest` which starts from the parent element, so it is
   * recursion-safe (a TrackContext never resolves to itself).
   */
  get context(): Record<string, unknown> {
    const parent = this.$closest<TrackContext>('TrackContext');
    const { ownData } = this;
    return parent ? deepmerge(parent.context, ownData, { arrayMerge }) : ownData;
  }
}
