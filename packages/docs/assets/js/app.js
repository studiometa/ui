import { Base, createApp } from '@studiometa/js-toolkit';
import * as components from '@studiometa/ui';
import '../css/app.css';

window.__DEV__ = true;

/**
 * Main App class.
 *
 * @todo
 *   Update app with MutationObserver instead of `nextFrame` in preview.js
 * @todo
 *   Fix TailwindCSS path to load the lib/index.js file instead of the
 *   lib/cli.js file
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
  }
}

export default createApp(App, document.documentElement);
