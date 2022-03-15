import { Base } from '@studiometa/js-toolkit';

/**
 * @typedef {{ src: string, terminateOnLoad: boolean }} LazyIncludeOptions
 * @typedef {{ loading: HTMLElement, error: HTMLElement }} LazyIncludeRefs
 * @typedef {LazyInclude & { $refs: LazyIncludeRefs, $options: LazyIncludeOptions }} LazyIncludeInterface
 */

/**
 * LazyInclude class.
 */
export default class LazyInclude extends Base {
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
   *
   * @this {LazyIncludeInterface}
   * @returns {void}
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
   *
   * @this {LazyIncludeInterface}
   * @param   {string} content
   * @returns {void}
   */
  onContent(content) {
    this.$refs.loading.style.display = 'none';
    this.$el.innerHTML = content;
  }

  /**
   * Set error.
   *
   * @this {LazyIncludeInterface}
   * @returns {void}
   */
  onError() {
    this.$refs.error.style.display = 'block';
  }

  /**
   * Always.
   *
   * @this {LazyIncludeInterface}
   * @returns {void}
   */
  onAlways() {
    if (this.$options.terminateOnLoad) {
      this.$terminate();
    }
  }
}
