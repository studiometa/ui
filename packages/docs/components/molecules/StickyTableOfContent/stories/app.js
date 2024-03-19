/* eslint-disable max-classes-per-file */
import { Base, createApp } from '@studiometa/js-toolkit';
import {
  StickyTable as StickyTableCore,
  StickyTableItem,
  StickyTableSection,
} from '@studiometa/ui';

/**
 *
 */
class StickyTable extends StickyTableCore {
  static config = {
    components: {
      StickyTableItem,
      StickyTableSection,
    },
  };
}

/**
 *
 */
class App extends Base {
  static config = {
    name: 'App',
    components: {
      StickyTable,
    },
  };
}

createApp(App, document.body);
