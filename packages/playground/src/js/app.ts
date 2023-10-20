import { Base, createApp } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { domScheduler, wait } from '@studiometa/js-toolkit/utils';
import HeaderSwitcher from './components/HeaderSwitcher.js';
import LayoutReactive from './components/LayoutReactive.js';
import LayoutSwitcher from './components/LayoutSwitcher.js';
import ThemeSwitcher from './components/ThemeSwitcher.js';
import type Editors from './components/Editors.js';
import type HtmlEditor from './components/HtmlEditor.js';
import type Iframe from './components/Iframe.js';
import type Resizable from './components/Resizable.js';
import type ScriptEditor from './components/ScriptEditor.js';
import { layoutUpdateDOM, themeUpdateDOM, headerUpdateDOM } from './store/index.js';

layoutUpdateDOM();
themeUpdateDOM();
headerUpdateDOM();

export interface AppProps extends BaseProps {
  $children: {
    LayoutSwitcher: LayoutSwitcher[];
    LayoutReactive: LayoutReactive[];
    HeaderSwitcher: HeaderSwitcher[];
    Iframe: Promise<Iframe>[];
    Resizable: Promise<Resizable>[];
    Editors: Promise<Editors>[];
    HtmlEditor: Promise<HtmlEditor>[];
    ScriptEditor: Promise<ScriptEditor>[];
  };
  $refs: {
    htmlVisibility: HTMLInputElement;
    scriptVisibility: HTMLInputElement;
  };
}

class App extends Base<AppProps> {
  static config: BaseConfig = {
    name: 'App',
    refs: ['htmlVisibility', 'scriptVisibility'],
    components: {
      LayoutReactive,
      LayoutSwitcher,
      ThemeSwitcher,
      HeaderSwitcher,
      Iframe: async () => wait(100).then(() => import('./components/Iframe.js')),
      Resizable: async () => wait(100).then(() => import('./components/Resizable.js')),
      Editors: async () => wait(100).then(() => import('./components/Editors.js')),
      HtmlEditor: async () => wait(100).then(() => import('./components/HtmlEditor.js')),
      ScriptEditor: async () => wait(100).then(() => import('./components/ScriptEditor.js')),
    },
  };

  get iframe() {
    return this.$children.Iframe[0];
  }

  get editors() {
    return this.$children.Editors[0];
  }

  get htmlEditor() {
    return this.$children.HtmlEditor[0];
  }

  get scriptEditor() {
    return this.$children.ScriptEditor[0];
  }

  async mounted() {
    const [htmlEditor, scriptEditor] = await Promise.all([this.htmlEditor, this.scriptEditor]);
    htmlEditor.toggle(this.$refs.htmlVisibility.checked);
    scriptEditor.toggle(this.$refs.scriptVisibility.checked);
    this.maybeToggleEditorsContainer();
  }

  async onHtmlVisibilityInput() {
    const editor = await this.htmlEditor;
    editor.toggle(this.$refs.htmlVisibility.checked);
    this.maybeToggleEditorsContainer();
  }

  async onScriptVisibilityInput() {
    const editor = await this.scriptEditor;
    editor.toggle(this.$refs.scriptVisibility.checked);
    this.maybeToggleEditorsContainer();
  }

  async maybeToggleEditorsContainer() {
    const editors = await this.editors;
    if (!this.$refs.htmlVisibility.checked && !this.$refs.scriptVisibility.checked) {
      editors.hide();
    } else {
      editors.show();
    }
  }

  async onHtmlEditorContentChange() {
    const iframe = await this.iframe;
    iframe.updateHtml();
  }

  async onScriptEditorContentChange() {
    const iframe = await this.iframe;
    iframe.updateScript();
  }

  async onResizableDragged(props) {
    const iframe = await this.iframe;
    if (props.mode === 'start') {
      domScheduler.write(() => {
        document.body.classList.add('select-none');
        iframe.$el.parentElement.classList.add('pointer-events-none');
      });
    }

    if (props.mode === 'drop') {
      domScheduler.write(() => {
        document.body.classList.remove('select-none');
        iframe.$el.parentElement.classList.remove('pointer-events-none');
      });
    }
  }
}

export default createApp(App, {
  features: {
    asyncChildren: true,
  },
});
