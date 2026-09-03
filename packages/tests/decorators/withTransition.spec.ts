import { afterEach, describe, expect, it } from 'vitest';
import { Base, getInstance, registerComponents, type BaseConfig } from '@studiometa/js-toolkit';
import { mount, resetDom, settle } from '@studiometa/js-toolkit/test';
import { Transition } from '#private/Transition/Transition.js';
import { withTransition } from '#private/decorators/withTransition.js';

/**
 * A consumer declaring no transition options of its own — the whole point of
 * the mixin carrying them.
 */
class TransitionProbe extends withTransition(Base) {
  static config: BaseConfig = { name: 'TransitionProbe' };
}

/** A consumer that forces an option, the way `MenuList` forces both keeps. */
class ForcedProbe extends withTransition(Base) {
  static config: BaseConfig = { name: 'ForcedProbe' };

  get transitionOptions() {
    return { ...super.transitionOptions, enterKeep: true };
  }
}

/** A consumer whose visible part is a set of refs, not its own root. */
class MultiProbe extends withTransition(Base) {
  static config: BaseConfig = { name: 'MultiProbe', refs: ['item[]'] };

  get target(): HTMLElement[] {
    return this.$refs.item as HTMLElement[];
  }
}

registerComponents(Transition, TransitionProbe, ForcedProbe, MultiProbe);

afterEach(resetDom);

/** The probes are asserted on directly, so the wrapper is unwrapped here. */
async function render(name: string, attributes = ''): Promise<HTMLElement> {
  const root = await mount(`<div data-component="${name}" ${attributes}></div>`);
  return root.firstElementChild as HTMLElement;
}

describe('withTransition config merging', () => {
  it('gives a consumer the transition options without it declaring any', async () => {
    // js-toolkit's `resolveConfig()` is internal and not published, so the
    // merged option set is asserted through `$options`, which is built from it.
    const el = await render('TransitionProbe', 'data-option-enter-to="on"');
    const instance = getInstance<TransitionProbe>(el, 'TransitionProbe')!;

    expect(Object.keys(instance.$options)).toEqual(
      expect.arrayContaining([
        'enterFrom',
        'enterActive',
        'enterTo',
        'enterKeep',
        'leaveFrom',
        'leaveActive',
        'leaveTo',
        'leaveKeep',
      ]),
    );
    expect(instance.$options.enterTo).toBe('on');
  });

  /**
   * The mixin's config carries no `name`, so it must contribute to the
   * consumer's config without replacing its identity — otherwise every
   * consumer would register under one shared name.
   */
  it('does not take over the consumer name', async () => {
    // Same reason as above: the merged name is read back off the registry,
    // which is what a name is for. A mixin that took the name over would
    // register both classes under one token and `getInstance()` would miss.
    const probe = await render('TransitionProbe');
    const transition = await render('Transition');

    expect(getInstance(probe, 'TransitionProbe')).toBeInstanceOf(TransitionProbe);
    expect(getInstance(transition, 'Transition')).toBeInstanceOf(Transition);
  });
});

describe('withTransition behaviour', () => {
  it('runs the enter transition and keeps its end state when asked', async () => {
    const el = await render(
      'TransitionProbe',
      'data-option-enter-to="visible" data-option-enter-keep="true"',
    );
    const instance = getInstance<TransitionProbe>(el, 'TransitionProbe')!;

    await instance.enter();

    expect(instance.state).toBe('entering');
    expect(el.classList.contains('visible')).toBe(true);
  });

  it('toggles between enter and leave', async () => {
    const el = await render(
      'TransitionProbe',
      'data-option-enter-to="visible" data-option-enter-keep="true" data-option-leave-to="gone" data-option-leave-keep="true"',
    );
    const instance = getInstance<TransitionProbe>(el, 'TransitionProbe')!;

    await instance.toggle();
    expect(el.classList.contains('visible')).toBe(true);

    await instance.toggle();
    expect(instance.state).toBe('leaving');
    expect(el.classList.contains('gone')).toBe(true);
  });

  it('transitions every element when the target getter returns a list', async () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div data-component="MultiProbe" data-option-enter-to="on" data-option-enter-keep="true">
        <span data-ref="item[]"></span>
        <span data-ref="item[]"></span>
      </div>`;
    document.body.append(root);
    await settle();
    const el = root.firstElementChild as HTMLElement;
    const instance = getInstance<MultiProbe>(el, 'MultiProbe')!;
    const items = [...el.querySelectorAll('[data-ref="item[]"]')];

    await instance.enter();

    expect(items.map((item) => item.classList.contains('on'))).toEqual([true, true]);
    // The root itself is not a target here.
    expect(el.classList.contains('on')).toBe(false);
  });

  it('lets one call name its own target, replacing the getter', async () => {
    const el = await render(
      'TransitionProbe',
      'data-option-enter-to="on" data-option-enter-keep="true"',
    );
    const instance = getInstance<TransitionProbe>(el, 'TransitionProbe')!;
    const other = document.createElement('div');
    document.body.append(other);

    await instance.enter(other);

    expect(other.classList.contains('on')).toBe(true);
    // Replaced rather than added to: the default target is untouched.
    expect(el.classList.contains('on')).toBe(false);
  });

  it('passes a named target through toggle, in both directions', async () => {
    const el = await render(
      'TransitionProbe',
      'data-option-enter-to="on" data-option-enter-keep="true" data-option-leave-to="off" data-option-leave-keep="true"',
    );
    const instance = getInstance<TransitionProbe>(el, 'TransitionProbe')!;
    const other = document.createElement('div');
    document.body.append(other);

    await instance.toggle(other);
    expect(other.classList.contains('on')).toBe(true);

    await instance.toggle(other);
    expect(other.classList.contains('off')).toBe(true);
    expect(el.classList.contains('off')).toBe(false);
  });

  /** `transitionOptions` is the only supported way to force a transition option. */
  it('lets a consumer force an option the markup did not ask for', async () => {
    const el = await render('ForcedProbe', 'data-option-enter-to="visible"');
    const instance = getInstance<ForcedProbe>(el, 'ForcedProbe')!;

    expect(instance.$options.enterKeep).toBe(false);
    expect(instance.transitionOptions.enterKeep).toBe(true);

    await instance.enter();

    // Kept, because the forced value won over the absent attribute.
    expect(el.classList.contains('visible')).toBe(true);
  });
});
