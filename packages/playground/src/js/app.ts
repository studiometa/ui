import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { domScheduler } from '@studiometa/js-toolkit/utils';
import Iframe from './components/Iframe.js';
import HtmlEditor from './components/HtmlEditor.js';
import ScriptEditor from './components/ScriptEditor.js';
import LayoutSwitcher from './components/LayoutSwitcher.js';
import LayoutReactive from './components/LayoutReactive.js';
import ThemeSwitcher from './components/ThemeSwitcher.js';
import Resizable from './components/Resizable.js';
import Editors from './components/Editors.js';

export interface AppProps extends BaseProps {
  $children: {
    Iframe: Iframe[];
    LayoutSwitcher: LayoutSwitcher[];
    LayoutReactive: LayoutReactive[];
    Resizable: Resizable[];
    Editors: Editors[];
    HtmlEditor: HtmlEditor[];
    ScriptEditor: ScriptEditor[];
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
      Iframe,
      ThemeSwitcher,
      LayoutSwitcher,
      LayoutReactive,
      Resizable,
      Editors,
      HtmlEditor,
      ScriptEditor,
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

  maybeToggleEditorsContainer() {
    if (!this.$refs.htmlVisibility.checked && !this.$refs.scriptVisibility.checked) {
      this.editors.hide();
    } else {
      this.editors.show();
    }
  }

  onHtmlEditorContentChange() {
    this.iframe.updateHtml();
  }

  onScriptEditorContentChange() {
    this.iframe.updateScript();
  }

  onResizableDragged(props) {
    if (props.mode === 'start') {
      domScheduler.write(() => {
        document.body.classList.add('select-none');
        this.iframe.$el.parentElement.classList.add('pointer-events-none');
      });
    }

    if (props.mode === 'drop') {
      domScheduler.write(() => {
        document.body.classList.remove('select-none');
        this.iframe.$el.parentElement.classList.remove('pointer-events-none');
      });
    }
  }
}

const app = new App(document.body);
app.$mount();

export default app;
