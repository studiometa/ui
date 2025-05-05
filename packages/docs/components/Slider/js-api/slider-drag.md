# SliderDrag

This component can be used to add drag capabilities to the slider. It should wrap the slider items, usually placed on the [`wrapper` ref](./slider.md#wrapper).

```html
<div data-component="Slider">
  <div data-ref="wrapper" data-component="SliderDrag">
    <div data-component="SliderItem"></div>
    <div data-component="SliderItem"></div>
    ...
  </div>
```

This component uses the [`withDrag` decorator](https://js-toolkit.studiometa.dev/api/decorators/withDrag.html) and inherits from its APIs.

## Options

### `scrollLockThreshold`

- Type: `number`
- Default: `10`

The scroll distance that will be used to test if the scroll should be prevented.
