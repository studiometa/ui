import Figure from './Figure.js';

/**
 * @typedef {import('./Figure.js').FigureInterface} FigureInterface
 */

/**
 * @typedef {FigureTwicPics & FigureInterface & {
 *   $options: {
 *     transform: string,
 *     step: number,
 *   }
 * }} FigureTwicPicsInterface
 */

/**
 * Normalize the given size to the step option.
 * @param   {FigureTwicPicsInterface} that
 * @param   {string} prop
 * @returns {number}
 */
function normalizeSize(that, prop) {
  const { step } = that.$options;
  return Math.ceil(that.$refs.img[prop] / step) * step;
}

/**
 * Figure class.
 *
 * Manager lazyloading image sources.
 */
export default class FigureTwicPics extends Figure {
  /**
   * Config.
   */
  static config = {
    ...Figure.config,
    name: 'FigureTwicPics',
    options: {
      ...Figure.config.options,
      transform: String,
      step: {
        type: Number,
        default: 50,
      },
      mode: {
        type: String,
        default: 'cover',
      },
    },
  };

  /**
   * Get the TwicPics domain.
   *
   * @this {FigureTwicPicsInterface}
   * @returns {string}
   */
  get domain() {
    const url = new URL(this.$refs.img.dataset.src);
    return url.host;
  }

  /**
   * Add TwicPics transforms and domain to the URL.
   *
   * @this {FigureTwicPicsInterface}
   * @param   {string} value
   * @returns {void}
   */
  set src(value) {
    const url = new URL(value, window.location.origin);
    url.host = this.domain;

    const width = normalizeSize(this, 'offsetWidth');
    const height = normalizeSize(this, 'offsetHeight');

    url.searchParams.set(
      'twic',
      ['v1', this.$options.transform, `${this.$options.mode}=${width}x${height}`]
        .filter(Boolean)
        .join('/')
    );

    url.search = decodeURIComponent(url.search);

    super.src = url.toString();
  }

  /**
   * Reassign the source from the original on resized.
   *
   * @this {FigureTwicPicsInterface}
   * @returns {void}
   */
  resized() {
    this.src = this.$refs.img.dataset.src;
  }
}
