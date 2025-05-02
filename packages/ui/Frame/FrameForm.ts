import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AbstractFrameTrigger } from './AbstractFrameTrigger.js';

export interface FrameFormProps extends BaseProps {
  $el: HTMLFormElement;
  $refs: {
    headers: HTMLInputElement[];
  };
}

/**
 * FrameForm class.
 */
export class FrameForm<T extends BaseProps = BaseProps> extends AbstractFrameTrigger<
  T & FrameFormProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'FrameForm',
    refs: ['headers[]'],
  };

  /**
   * Form submission method.
   */
  get method() {
    return this.$el.method.toLowerCase() as 'post' | 'get';
  }

  /**
   * Add params to the requested URL for GET submissions.
   */
  get url(): string | URL {
    const url = new URL(this.$el.action);

    if (this.method === 'get') {
      // @ts-expect-error URLSearchParams accepts FormData as parameter in the browser.
      url.search = new URLSearchParams(new FormData(this.$el)).toString();
    }

    return url;
  }

  /**
   * Add body to the request for POST submissions.
   */
  get requestInit(): RequestInit {
    const requestInit = super.requestInit;
    requestInit.headers ??= {};

    for (const header of this.$refs.headers) {
      requestInit.headers[header.name] = header.value;
    }

    if (this.method === 'post') {
      requestInit.method = this.method;
      requestInit.body = new FormData(this.$el);
    }

    return requestInit;
  }

  /**
   * Prevent submit on forms.
   * @todo test modifier keys on submit
   */
  onSubmit({ event }: { event: SubmitEvent; target: FrameForm }) {
    this.$log('submit', event);
    event.preventDefault();
    this.fetch();
  }
}
