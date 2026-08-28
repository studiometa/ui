import {
  Base,
  swap,
  type BaseConfig,
  type BaseProps,
  type MountedReturn,
} from '@studiometa/js-toolkit';

export type DeferProps = BaseProps & {
  $refs: {
    loading?: HTMLElement;
    error?: HTMLElement;
  };
  $options: {
    src: string;
    terminateOnLoad: boolean;
  };
  $emits: {
    'defer-content': { content: string };
    'defer-error': { error: unknown };
    'defer-always': void;
  };
};

/**
 * Fetches remote HTML from the `src` option on mount and injects it into the
 * element, toggling the `loading` and `error` refs. It emits `defer-content`,
 * `defer-error` and `defer-always`, and can self-terminate once loaded.
 *
 * @link https://ui.studiometa.dev/reference/items/Defer/
 */
export class Defer<T extends BaseProps = BaseProps> extends Base<DeferProps & T> {
  static config: BaseConfig = {
    name: 'Defer',
    refs: ['loading', 'error'],
    options: {
      src: String,
      terminateOnLoad: Boolean,
    },
  };

  /** The content injection in flight, so `defer-always` can wait for it. */
  injection: Promise<void> = Promise.resolve();

  /**
   * Whether `terminateOnLoad` has already been honoured.
   *
   * "Do this once per element" is instance state, not a lifecycle decision:
   * `$unmount()` leaves the instance on its element, so this field survives
   * every move, re-insertion and `swap()` which preserves the element — and
   * an element that is genuinely replaced gets a new instance, which is
   * exactly when the content should be fetched again. The option keeps v3's
   * name, but v4 has no termination to honour: what it records is that the
   * content has been loaded.
   */
  hasLoaded = false;

  /**
   * Bind the component's own announcements, then load the lazy content once
   * per element when asked.
   *
   * The three handlers listen for this component's own events, whose names are
   * hyphenated and therefore outside what the `on<Event>` naming convention
   * can spell. They are subscribed here so the mount cycle owns their release,
   * and in declaration order, which is what keeps `inject()` publishing
   * `this.injection` before `rememberLoad()` reads the option.
   */
  mounted(): MountedReturn {
    const releases = [
      this.$on('defer-content', (event) => {
        this.inject(event as CustomEvent<{ content: string }>);
      }),
      this.$on('defer-error', () => {
        this.showError();
      }),
      this.$on('defer-content', () => {
        this.rememberLoad();
      }),
    ];

    if (this.hasLoaded) {
      return releases;
    }

    if (!this.$options.src) {
      this.$warn(
        'defer.missing-src',
        'The `src` option is missing. Define it with the `data-option-src` attribute.',
      );
      return releases;
    }

    fetch(this.$options.src)
      .then((response) => response.text())
      .then(async (content) => {
        this.$emit('defer-content', { content });
        // `$emit()` dispatches synchronously and returns before an async
        // listener has finished, so the injection is awaited here: `defer-always`,
        // and the `terminateOnLoad` which listens for it, must not arrive on
        // an element whose content has not landed. v3 needs nothing — its
        // handler assigns `innerHTML` inside the dispatch.
        await this.injection;
      })
      .catch((error: unknown) => {
        this.$emit('defer-error', { error });
      })
      .finally(() => {
        this.$emit('defer-always');
      });

    return releases;
  }

  /**
   * Inject the content.
   *
   * v3 assigns `innerHTML`, which leaves a `<script>` in the fragment inert
   * and returns before anything inside it has mounted. `swap()` is this
   * element's exact shape — the children change, the element does not — so it
   * owns both, and the awaited settle is what makes `defer-always` meaningful.
   *
   * The promise is kept because the announcement cannot carry it: an event
   * listener's return value goes nowhere, so the emitter has no other way to
   * know that its own handler is still working.
   */
  inject(event: CustomEvent<{ content: string }>): void {
    const { loading } = this.$refs;
    if (loading) {
      loading.style.display = 'none';
    }
    this.injection = swap(this.$el, event.detail.content);
  }

  /** Reveal the error ref. */
  showError(): void {
    const { error } = this.$refs;
    if (error) {
      error.style.display = 'block';
    }
  }

  /**
   * Remember a **successful** load, so a later mount does not repeat it.
   *
   * `defer-always` fires from the `finally` of the request, so a failed fetch would
   * mark the element as loaded and never try again. v3 has the same defect for
   * the same reason — it terminates from `onAlways()` — and this is the one
   * place the port departs from it: a request that failed is exactly the one
   * worth retrying when the element mounts again.
   */
  rememberLoad(): void {
    this.hasLoaded = this.$options.terminateOnLoad;
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Defer`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Defer;
