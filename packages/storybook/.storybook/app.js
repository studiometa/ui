import { Base, createApp } from '@studiometa/js-toolkit';
import { nextFrame } from '@studiometa/js-toolkit/utils';
import * as components from '@studiometa/ui';
import './app.css';

window.__DEV__ = true;

/**
 * Main App class.
 *
 * @todo
 *   Update app with MutationObserver instead of `nextFrame` in preview.js
 */
class App extends Base {
  /**
   * App config.
   * @return {Object}
   */
  static config = {
    log: true,
    debug: true,
    name: 'App',
    components: Object.entries(components).reduce((acc, [key, value]) => {
      value.config.debug = true;
      acc[key] = value;
      return acc;
    }, {}),
  };

  /**
   * Log a nice message when app is ready.
   *
   * @return {void}
   */
  mounted() {
    this.$log('mounted 🎉');
    const observer = new MutationObserver(([mutation]) => {
      console.log(this.$children);
      if (mutation.type === 'childList') {
        nextFrame(() => {
          this.$update();
        });
      }
    });

    observer.observe(this.$el, { childList: true, subtree: true });
  }
}

export default createApp(App, document.querySelector('#root'));
