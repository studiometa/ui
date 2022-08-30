import { Base } from '@studiometa/js-toolkit';
import type { BaseTypeParameter, BaseInterface } from '@studiometa/js-toolkit';

export interface LazyIncludeInterface extends BaseTypeParameter {
  $refs: {
    loading: HTMLElement;
    error: HTMLElement;
  };
  $options: {
    src: string;
    terminateOnLoad: boolean;
  };
}

/**
 * LazyInclude class.
 */
export class LazyInclude<T extends BaseTypeParameter = BaseTypeParameter> extends Base<
  T & LazyIncludeInterface
> implements BaseInterface {
  /**
   * Config.
   */
  static config = {
    name: 'LazyInclude',
    refs: ['loading', 'error'],
    emits: ['content', 'error', 'always'],
    options: {
      src: String,
      terminateOnLoad: Boolean,
    },
  };

  /**
   * Load the lazy content on mount.
   */
  mounted() {
    if (!this.$options.src) {
      this.$log('The `src` option is missing. Define it with the `data-option-src` attribute');
      return;
    }

    fetch(this.$options.src)
      .then((response) => response.text())
      .then((content) => {
        this.$emit('content', content);
      })
      .catch((error) => {
        this.$emit('error', error);
      })
      .finally(() => {
        this.$emit('always');
      });
  }

  /**
   * Set content.
   */
  onContent(content:string) {
    this.$refs.loading.style.display = 'none';
    this.$el.innerHTML = content;
  }

  /**
   * Set error.
   */
  onError() {
    this.$refs.error.style.display = 'block';
  }

  /**
   * Always.
   */
  onAlways() {
    if (this.$options.terminateOnLoad) {
      this.$terminate();
    }
  }
}
