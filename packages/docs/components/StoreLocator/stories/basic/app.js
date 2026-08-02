import { Base, registerComponent } from '@studiometa/js-toolkit';
import {
  StoreLocator,
  MapboxMap,
  MapboxCluster,
  MapboxClusterItem,
} from '@studiometa/ui-mapbox';
import { Action, Dialog, ViewTransition } from '@studiometa/ui';

/**
 * Root component wiring the detail panel to the store locator.
 *
 * It declares the whole Mapbox family so a single `registerComponent(App)` call
 * mounts everything without double-registration. The `StoreLocator` stays
 * panel-agnostic: it only emits a `select` event with the chosen item. Here we
 * react to it through the `on<Component><Event>` convention, copy the item's
 * `<template>` detail into the drawer and open it.
 */
class App extends Base {
  static config = {
    name: 'App',
    components: {
      StoreLocator,
      MapboxMap,
      MapboxCluster,
      MapboxClusterItem,
      Dialog,
      Action,
      ViewTransition,
    },
  };

  /**
   * The detail panel Dialog child.
   */
  get panel() {
    return this.$query('Dialog')[0];
  }

  /**
   * Open the drawer with the selected store's detail.
   * @param {{ args: [MapboxClusterItem] }} props
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
