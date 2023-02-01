import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { debounce, domScheduler } from '@studiometa/js-toolkit/utils';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { themeIsDark, watchTheme } from '../store/index.js';

export type EditorProps = BaseProps;

/**
 * Editor class.
 */
export default class Editor extends Base<EditorProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Editor',
    emits: ['content-change'],
  };

  /**
   * Editor.
   * @type {editor.IStandaloneCodeEditor}
   */
  editor: editor.IStandaloneCodeEditor;

  /**
   * Initial value for the editor.
   */
  get initialValue() {
    return '';
  }

  /**
   * Language of the editor.
   */
  get language() {
    return '';
  }

  async mounted() {
    const { editor } = await import('monaco-editor/esm/vs/editor/editor.api.js');
    this.editor = editor.create(this.$el, {
      value: this.initialValue,
      language: this.language,
      minimap: { enabled: false },
      automaticLayout: true,
      fontLigatures: true,
      fontFamily: 'JetBrains Mono',
      fontSize: 14,
      tabSize: 2,
      theme: themeIsDark() ? 'vs-dark' : 'vs',
    });

    watchTheme(() => {
      this.editor.updateOptions({
        theme: themeIsDark() ? 'vs-dark' : 'vs',
      });
    });

    this.editor.onDidChangeModelContent(
      debounce(() => {
        this.$emit('content-change', this.editor.getValue());
      }, 500),
    );
  }

  show() {
    domScheduler.write(() => {
      this.$el.style.display = '';
    });
  }

  hide() {
    domScheduler.write(() => {
      this.$el.style.display = 'none';
    });
  }

  toggle(force) {
    if (force === true) {
      this.show();
      return;
    }

    if (force === false) {
      this.hide();
      return;
    }

    domScheduler.read(() => {
      if (this.$el.style.display === 'none') {
        this.show();
      } else {
        this.hide();
      }
    });
  }
}
