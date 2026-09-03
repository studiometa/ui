import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, GlobalEvent } from '@studiometa/js-toolkit';

/** Emits `click-outside` when a document click lands outside its element. */
export class ClickOutside extends Base<{
  $emits: { 'click-outside': { event: MouseEvent } };
}> {
  static config: BaseConfig = {
    name: 'ClickOutside',
  };

  /**
   * `composedPath()` rather than `$el.contains(event.target)`: it is the one
   * that answers correctly for a click inside a shadow root, and for a target
   * the click removed from the DOM before the document heard about it.
   */
  onDocumentClick({ event }: GlobalEvent<MouseEvent>): void {
    if (!event.composedPath().includes(this.$el)) {
      this.$emit('click-outside', { event });
    }
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/ClickOutside`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default ClickOutside;
