import { Base } from '@studiometa/js-toolkit';
import type { BaseProps } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils';
import { getHtml, getScript } from '../store/index.js';
import { twigRender } from '../utils/twigRender.js';

export interface IframeProps extends BaseProps {
  $el: HTMLIFrameElement;
}

/**
 * Iframe class.
 */
export default class Iframe extends Base<IframeProps> {
  /**
   * Config.
   */
  static config = {
    name: 'Iframe',
  };

  script: HTMLScriptElement;

  get window() {
    return this.$el.contentWindow;
  }

  get doc() {
    return this.window?.document;
  }

  async mounted() {
    // Enabel dev mode in render
    // @ts-ignore
    this.window.__DEV__ = true;

    this.doc.documentElement.innerHTML = `
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
</body>`;
    await this.initImportMaps();

    // Add Tailwind CDN
    await this.initTailwind();

    const rendered = await twigRender(getHtml());
    if (rendered) {
      this.doc.body.innerHTML = rendered;
    }

    // Uncomment to enable dark mode in the preview
    // this.doc.documentElement.classList.toggle('dark', themeIsDark());
    // watchTheme((theme) => {
    //   this.doc.documentElement.classList.toggle('dark', theme === 'dark');
    // });

    // Add custom script
    this.script = this.doc.createElement('script');
    this.script.type = 'module';
    this.script.id = 'script';
    this.doc.head.append(this.script.cloneNode());

    await nextTick();
    await this.updateScript(false);

    this.$el.classList.remove('opacity-0');
  }

  initImportMaps() {
    const importMap = this.doc.createElement('script');
    importMap.type = 'importmap';
    importMap.textContent = JSON.stringify({
      imports: {
        '@studiometa/': 'https://cdn.skypack.dev/@studiometa/',
      },
    });
    this.doc.head.append(importMap);
  }

  initTailwind(): Promise<void> {
    return new Promise((resolve) => {
      // Add Tailwind CDN
      const tailwindScript = this.doc.createElement('script');
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      tailwindScript.id = 'tw';
      tailwindScript.addEventListener('load', () => {
        // Add Tailwind config
        const tailwindConfig = this.doc.createElement('script');
        tailwindConfig.textContent = "tailwind.config = { darkMode: 'class' };";
        this.doc.head.append(tailwindConfig);
        resolve();
      });
      this.doc.head.append(tailwindScript);
    });
  }

  async updateHtml() {
    await nextTick();
    const rendered = await twigRender(getHtml());
    if (rendered) {
      this.doc.body.innerHTML = rendered;
    }
    await nextTick();
    await this.updateScript(false);
  }

  async updateScript(resetHtml = true): Promise<void> {
    if (resetHtml) {
      this.doc.body.replaceWith(this.doc.body.cloneNode(true));
      await nextTick();
    }
    await nextTick();

    return new Promise((resolve) => {
      const clone = this.script.cloneNode() as HTMLScriptElement;
      const newScript = getScript();
      clone.textContent = `${newScript}\ndocument.dispatchEvent(new Event("readystatechange"))`;
      // @ts-ignore
      this.window.script.replaceWith(clone);
      resolve();
    });
  }
}
