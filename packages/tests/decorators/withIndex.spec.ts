import { afterEach, describe, expect, it, vi } from 'vitest';
import { Base, getInstance, registerComponents, type BaseConfig } from '@studiometa/js-toolkit';
import { mount, resetDom } from '@studiometa/js-toolkit/test';
import {
  Indexable,
  INDEXABLE_BOUNDARIES,
  INDEXABLE_INSTRUCTIONS,
  type IndexableInstruction,
} from '#private/Indexable/Indexable.js';
import { withIndex } from '#private/decorators/withIndex.js';
import { Transition } from '#private/Transition/Transition.js';

/**
 * A consumer declaring no index options of its own — the whole point of the
 * mixin carrying them.
 */
class IndexProbe extends withIndex(Base) {
  static config: BaseConfig = { name: 'IndexProbe' };
}

/**
 * The case the class form cannot serve, and the reason the mixin exists: a
 * component that **already extends something else** — here `Transition`, which
 * is itself `withTransition(Base)` — and still needs an index. `Indexable`
 * could never have been its base class.
 */
class TransitionGallery extends withIndex(Transition) {
  static config: BaseConfig = { name: 'TransitionGallery' };
}

/** A consumer deriving its length from its content instead of the option. */
class LengthProbe extends withIndex(Base) {
  static config: BaseConfig = { name: 'LengthProbe', refs: ['item[]'] };

  get length(): number {
    return (this.$refs.item as HTMLElement[]).length;
  }
}

registerComponents(Indexable, IndexProbe, TransitionGallery, LengthProbe);

afterEach(resetDom);

/** The probes are asserted on directly, so the wrapper is unwrapped here. */
async function render(name: string, attributes = '', inner = ''): Promise<HTMLElement> {
  const root = await mount(`<div data-component="${name}" ${attributes}>${inner}</div>`);
  return root.firstElementChild as HTMLElement;
}

async function instanceOf<T extends Base>(name: string, attributes = '', inner = ''): Promise<T> {
  const el = await render(name, attributes, inner);
  return getInstance<T>(el, name)!;
}

describe('withIndex and Indexable share one implementation', () => {
  /**
   * `Indexable` is `withIndex(Base)` and the component name, nothing else. If
   * the behaviour were ever copied back into the class, these own members would
   * reappear here — which is exactly the drift this assertion exists to catch.
   */
  it('leaves every member on the mixin, so the class only names the component', () => {
    expect(Object.getOwnPropertyNames(Indexable.prototype)).toEqual(['constructor']);
    expect(Indexable.config).toEqual({ name: 'Indexable' });
  });

  it('inherits the same members a fresh application of the mixin produces', () => {
    const Fresh = withIndex(Base);
    const inherited = Object.getOwnPropertyNames(
      Object.getPrototypeOf(Indexable.prototype) as object,
    ).toSorted();

    expect(inherited).toEqual(Object.getOwnPropertyNames(Fresh.prototype).toSorted());
    expect(inherited).toEqual(
      expect.arrayContaining([
        'boundary',
        'currentIndex',
        'direction',
        'firstIndex',
        'goNext',
        'goPrev',
        'goTo',
        'isReverse',
        'lastIndex',
        'length',
        'loopIndex',
        'maxIndex',
        'minIndex',
        'nextIndex',
        'normalizeIndex',
        'prevIndex',
        'step',
      ]),
    );
  });

  /** Same markup, same sequence, same result through either form. */
  it('behaves identically through the class and through the mixin', async () => {
    const attributes = 'data-option-total="4" data-option-boundary="loop"';
    const indexable = await instanceOf<Indexable>('Indexable', attributes);
    const probe = await instanceOf<IndexProbe>('IndexProbe', attributes);

    for (const target of [indexable, probe]) {
      await target.goPrev();
      await target.goTo(INDEXABLE_INSTRUCTIONS.NEXT);
      await target.goTo(1);
    }

    expect(probe.currentIndex).toBe(indexable.currentIndex);
    expect(probe.maxIndex).toBe(indexable.maxIndex);
    expect(probe.boundary).toBe(indexable.boundary);
  });
});

describe('withIndex config merging', () => {
  /**
   * js-toolkit's `resolveConfig()` is internal and not published, so the merged
   * option set is asserted through `$options`, which is built from it.
   */
  it('gives a consumer the index options without it declaring any', async () => {
    const probe = await instanceOf<IndexProbe>('IndexProbe', 'data-option-total="4"');

    expect(Object.keys(probe.$options)).toEqual(
      expect.arrayContaining(['boundary', 'reverse', 'total']),
    );
    expect(probe.$options.total).toBe(4);
    expect(probe.maxIndex).toBe(3);
    expect(probe.boundary).toBe(INDEXABLE_BOUNDARIES.CLAMP);
  });

  /**
   * The mixin's config carries no `name`, so it must contribute to the
   * consumer's config without replacing its identity — otherwise every
   * consumer would register under one shared name.
   */
  it('does not take over the consumer name', async () => {
    const probe = await render('IndexProbe');
    const indexable = await render('Indexable');

    expect(getInstance(probe, 'IndexProbe')).toBeInstanceOf(IndexProbe);
    expect(getInstance(indexable, 'Indexable')).toBeInstanceOf(Indexable);
  });
});

describe('withIndex on a class that already extends something else', () => {
  it('keeps the base class behaviour and adds the index behaviour', async () => {
    const gallery = await instanceOf<TransitionGallery>(
      'TransitionGallery',
      'data-option-total="3" data-option-enter-to="on" data-option-enter-keep="true"',
    );

    // Still a `Transition`: the mixin extended it rather than replacing it.
    expect(gallery).toBeInstanceOf(Transition);

    // Both option sets merged into one config.
    expect(Object.keys(gallery.$options)).toEqual(
      expect.arrayContaining(['boundary', 'total', 'enterTo', 'enterKeep']),
    );

    // The index behaviour works…
    await gallery.goNext();
    expect(gallery.currentIndex).toBe(1);

    // …and so does the behaviour it already had.
    await gallery.enter();
    expect(gallery.state).toBe('entering');
    expect(gallery.$el.classList.contains('on')).toBe(true);
  });

  it('lets a consumer derive the length from its content', async () => {
    const probe = await instanceOf<LengthProbe>(
      'LengthProbe',
      '',
      '<span data-ref="item[]"></span><span data-ref="item[]"></span>',
    );

    expect(probe.length).toBe(2);
    expect(probe.maxIndex).toBe(1);

    await probe.goTo(INDEXABLE_INSTRUCTIONS.LAST);
    expect(probe.currentIndex).toBe(1);
  });
});

describe('withIndex behaviour', () => {
  it('clamps at both bounds by default', async () => {
    const probe = await instanceOf<IndexProbe>('IndexProbe', 'data-option-total="3"');

    await probe.goPrev();
    expect(probe.currentIndex).toBe(0);

    await probe.goTo(99);
    expect(probe.currentIndex).toBe(2);
  });

  it('wraps around with the `loop` boundary', async () => {
    const probe = await instanceOf<IndexProbe>(
      'IndexProbe',
      'data-option-total="3" data-option-boundary="loop"',
    );

    await probe.goPrev();
    expect(probe.currentIndex).toBe(2);

    await probe.goNext();
    expect(probe.currentIndex).toBe(0);
  });

  /**
   * v1 flips `isReverse` by writing `$options.reverse`; `$options` is read-only
   * in v4, so the flag is private state seeded from the option instead. The
   * observable behaviour is unchanged, which is what this asserts.
   */
  it('reflects the travel direction at a bound with the `bounce` boundary', async () => {
    const probe = await instanceOf<IndexProbe>(
      'IndexProbe',
      'data-option-total="3" data-option-boundary="bounce"',
    );

    await probe.goNext();
    await probe.goNext();
    expect(probe.currentIndex).toBe(2);
    expect(probe.isReverse).toBe(false);

    await probe.goNext();
    expect(probe.currentIndex).toBe(1);
    expect(probe.isReverse).toBe(true);
  });

  it('starts at the far end and travels backwards when reversed', async () => {
    const probe = await instanceOf<IndexProbe>(
      'IndexProbe',
      'data-option-total="4" data-option-reverse="true"',
    );

    expect(probe.isReverse).toBe(true);
    expect(probe.firstIndex).toBe(3);
    expect(probe.lastIndex).toBe(0);

    await probe.goTo(INDEXABLE_INSTRUCTIONS.FIRST);
    expect(probe.currentIndex).toBe(3);

    await probe.goNext();
    expect(probe.currentIndex).toBe(2);
  });

  it('follows the `random` instruction inside the bounds', async () => {
    const probe = await instanceOf<IndexProbe>('IndexProbe', 'data-option-total="5"');

    await probe.goTo(INDEXABLE_INSTRUCTIONS.RANDOM);

    expect(probe.currentIndex).toBeGreaterThanOrEqual(0);
    expect(probe.currentIndex).toBeLessThanOrEqual(4);
  });

  it('emits a bubbling `index` event carrying the new index, and only on a change', async () => {
    const probe = await instanceOf<IndexProbe>('IndexProbe', 'data-option-total="3"');
    const indexes: number[] = [];
    // Listened for on the parent, which is what "bubbles" means here.
    probe.$el.parentElement!.addEventListener('index', (event) => {
      indexes.push((event as CustomEvent<{ index: number }>).detail.index);
    });

    await probe.goNext();
    await probe.goTo(1);
    await probe.goNext();

    expect(indexes).toEqual([1, 2]);
  });

  it('warns and stays put on an unknown instruction or a non-finite index', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const probe = await instanceOf<IndexProbe>('IndexProbe', 'data-option-total="3"');

    await probe.goTo('sideways' as IndexableInstruction);
    await probe.goTo(Number.NaN);

    expect(probe.currentIndex).toBe(0);
    expect(consoleWarn.mock.calls.map(([message]) => message as string)).toEqual([
      expect.stringContaining('indexable.invalid-instruction'),
      expect.stringContaining('indexable.invalid-index'),
    ]);
    consoleWarn.mockRestore();
  });
});
