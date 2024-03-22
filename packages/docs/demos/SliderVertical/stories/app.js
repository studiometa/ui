import { Base, createApp } from "@studiometa/js-toolkit";
import {
  domScheduler,
  transform,
  clamp,
  map,
  easeInQuad,
  easeInQuart,
  easeInOutQuad,
  easeInOutQuart,
} from "@studiometa/js-toolkit/utils";
import {
  Figure,
  Slider as SliderCore,
  SliderBtn,
  SliderDots,
  SliderDrag,
  SliderItem as SliderItemCore,
} from "@studiometa/ui";

class SliderItem extends SliderItemCore {
  static config = {
    refs: ["inner", "scale"],
  };

  render() {
    domScheduler.read(() => {
      const x = this.rect.x - this.$parent.getOriginByMode() + this.dampedX;
      const scaleProgress = clamp(x / this.rect.width, -1, 1);
      const scale = map(scaleProgress, -1, 1, 1, 1.4);
      const clipProgress = clamp(x / this.rect.width, -1, 0) * -1;
      const clipBottomLeft = map(easeInOutQuad(clipProgress), 1, 0, 0, 100);
      const clipBottomRight = map(easeInOutQuart(clipProgress), 1, 0, 0, 100);
      const clipPath = `polygon(0 0, 100% 0, 100% ${clipBottomRight}%, 0% ${clipBottomLeft}%)`;
      domScheduler.write(() => {
        transform(this.$refs.scale, { scale });
        this.$refs.inner.style.clipPath = clipPath;
      });
    });
  }

  /**
   * Consider slides to always be visible.
   */
  willBeVisible() {
    return true;
  }

  /**
   * Consider slides to always be visible.
   */
  willBeFullyVisible() {
    return true;
  }
}

class Slider extends SliderCore {
  static config = {
    components: {
      SliderBtn,
      SliderDots,
      SliderDrag,
      SliderItem,
    },
  };
}

class App extends Base {
  static config = {
    name: "App",
    components: {
      Figure,
      Slider,
    },
  };
}

createApp(App);
