import { getScript, setScript } from '../store/index.js';
import Editor from './Editor.js';

export default class HtmlEditor extends Editor {
  get language(): string {
    return 'javascript';
  }

  get initialValue(): string {
    return getScript();
  }

  onContentChange(value) {
    setScript(value);
  }
}
