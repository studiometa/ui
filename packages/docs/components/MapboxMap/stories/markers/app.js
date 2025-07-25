import { Base, createApp } from '@studiometa/js-toolkit';
import { createElement, randomInt, randomItem } from '@studiometa/js-toolkit/utils';
import { MapboxMap } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['add', 'remove'],
    components: {
      MapboxMap,
    },
  };

  onAddClick() {
    this.$children.MapboxMap[0].$el.append(
      createElement('template', {
        dataComponent: 'MapboxMarker',
        dataOptionLngLat: JSON.stringify([randomInt(-50, 50), randomInt(-50, 50)]),
      }),
    );
    this.$children.MapboxMap[0].$update();
  }

  onRemoveClick() {
    const marker = randomItem(this.$children.MapboxMap[0].$children.MapboxMarker);
    marker?.$el.remove();
  }
}

createApp(App);
