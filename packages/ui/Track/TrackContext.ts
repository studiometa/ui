import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface TrackContextProps extends BaseProps {
  $options: {
    data: Record<string, unknown>;
  };
}

/**
 * TrackContext class.
 *
 * Provides hierarchical context data that is merged into child Track components.
 *
 * @link https://ui.studiometa.dev/components/Track/js-api.html#trackcontext
 *
 * @example
 * ```html
 * <section
 *   data-component="TrackContext"
 *   data-option-data='{"page_type": "product", "product_id": "123"}'>
 *
 *   <button
 *     data-component="Track"
 *     data-on:click='{"action": "add_to_cart"}'>
 *     Add to Cart
 *   </button>
 *   <!-- Dispatches: { page_type: "product", product_id: "123", action: "add_to_cart" } -->
 * </section>
 * ```
 */
export class TrackContext<T extends BaseProps = BaseProps> extends Base<TrackContextProps & T> {
  static config: BaseConfig = {
    name: 'TrackContext',
    options: {
      data: {
        type: Object,
        default: () => ({}),
      },
    },
  };
}
