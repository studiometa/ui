import { Base, registerComponent } from '@studiometa/js-toolkit';
import { StoreLocator, StoreLocatorItem } from '@studiometa/ui-mapbox';
import { Action, Dialog, ViewTransition } from '@studiometa/ui';

/**
 * Root component driving both the detail panel and the facets.
 *
 * The facets swap the list markup client-side to keep the playground static.
 * A real integration would `Fetch` the new list fragment from the server
 * instead — see the prose in the examples page. Either way, the important part
 * is identical: the DOM of the `data-ref="list"` changes, js-toolkit mounts and
 * terminates the `StoreLocatorItem`s accordingly, and the `StoreLocator`
 * re-derives the map data from the new item set (markers and clusters follow).
 */
class App extends Base {
  static config = {
    name: 'App',
    refs: ['facet[]'],
    components: { StoreLocator, StoreLocatorItem, Dialog, Action, ViewTransition },
  };

  /**
   * The authored markup of every list item, captured once as `{ category, html }`.
   * Each facet rebuilds the list from these snippets so every swap produces
   * **fresh** nodes — exactly like a `Fetch` response would. Reusing the same
   * elements would leave js-toolkit's terminated instances lingering on them and
   * block a clean re-mount.
   */
  __allItems = [];

  /**
   * The store locator child.
   */
  get storeLocator() {
    return this.$query('StoreLocator')[0];
  }

  /**
   * The detail panel Dialog child.
   */
  get panel() {
    return this.$query('Dialog')[0];
  }

  /**
   * Capture the initial (full) item set.
   */
  mounted() {
    const list = this.storeLocator?.$refs.list;
    if (list) {
      this.__allItems = [...list.children].map((item) => ({
        category: item.dataset.category,
        html: item.outerHTML,
      }));
    }
  }

  /**
   * Filter the list to the clicked facet's category.
   * @param {{ index: number }} props
   */
  onFacetClick({ index }) {
    const button = this.$refs.facet[index];
    const { category } = button.dataset;
    const list = this.storeLocator?.$refs.list;

    if (!list) {
      return;
    }

    for (const facet of this.$refs.facet) {
      facet.toggleAttribute('data-active', facet === button);
    }

    // Rebuild the list from fresh markup — the same thing a `Fetch` response
    // does. js-toolkit terminates the old `StoreLocatorItem`s (→ unregister) and
    // mounts the new ones (→ register); the coordinator coalesces the batch into
    // a single map-data update, so markers and clusters follow the new set.
    list.innerHTML = this.__allItems
      .filter((item) => category === 'all' || item.category === category)
      .map((item) => item.html)
      .join('');
  }

  /**
   * Open the drawer with the selected store's detail.
   * @param {{ args: [StoreLocatorItem] }} props
   */
  onStoreLocatorSelect({ args: [item] }) {
    const template = item.$el.querySelector('template');
    const content = this.$el.querySelector('#store-panel-content');

    if (template && content) {
      content.replaceChildren(template.content.cloneNode(true));
    }

    this.panel?.open();
  }
}

registerComponent(App);
