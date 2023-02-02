import { domScheduler } from '@studiometa/js-toolkit/utils';
import type { BaseConfig } from '@studiometa/js-toolkit';
import Switcher from './Switcher.js';
import { setTheme, getTheme } from '../store/index.js';
import type { Themes } from '../store/index.js';

export default class ThemeSwitcher extends Switcher {
  static config: BaseConfig = {
    name: 'ThemeSwitcher',
  };

  mounted() {
    domScheduler.read(() => {
      const value = getTheme();
      const input = this.$refs.inputs.find((i) => i.value === value);

      domScheduler.write(() => {
        if (input) {
          input.checked = true;
        }
      });
    });
  }

  switch(value: Themes) {
    setTheme(value);
  }
}
