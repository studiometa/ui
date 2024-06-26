import { describe, it, expect, jest, beforeAll, afterEach } from '@jest/globals';
import { AnchorNav, AnchorNavLink } from '@studiometa/ui';
import { wait } from '@studiometa/js-toolkit/utils';
import {
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
  mockIsIntersecting,
} from '../__utils__/mockIntersectionObserver.js';

beforeAll(() => {
  intersectionObserverBeforeAllCallback();
});

afterEach(() => {
  intersectionObserverAfterEachCallback();
});

function getContext() {
  const mountedFn = jest.fn();
  const destroyedFn = jest.fn();
  const enterFn = jest.fn();
  const leaveFn = jest.fn();

  class AnchorNavLinkTest extends AnchorNavLink {
    enter(...args) {
      enterFn();
      return super.enter(...args);
    }

    leave(...args) {
      leaveFn();
      return super.leave(...args);
    }
  }

  class AnchorNavTest extends AnchorNav {
    static config = {
      ...AnchorNav.config,
      components: {
        ...AnchorNav.config.components,
        AnchorNavLink: AnchorNavLinkTest,
      },
    };

    onAnchorNavTargetMounted(...args) {
      mountedFn();
      super.onAnchorNavTargetMounted(...args);
    }

    onAnchorNavTargetDestroyed(...args) {
      destroyedFn();
      super.onAnchorNavTargetDestroyed(...args);
    }
  }

  const div = document.createElement('div');
  div.innerHTML = `
    <a href="#one" data-component="AnchorNavLink">link one</a>
    <a href="#two" data-component="AnchorNavLink">link two</a>

    <section id="one" data-component="AnchorNavTarget">target one</section>
    <section id="two" data-component="AnchorNavTarget">target two</section>
    `;
  const linkOne = div.querySelector('a[href="#one"]');
  const targetOne = div.querySelector('#one');

  const anchorNavTest = new AnchorNavTest(div);
  anchorNavTest.$mount();

  return {
    mountedFn,
    enterFn,
    leaveFn,
    destroyedFn,
    targetOne,
    anchorNavTest,
    linkOne,
  };
}

describe('The `AnchorNav` component', () => {
  it('should listen to mounted and destroyed event on child AnchorNavTarget', async () => {
    const { mountedFn, destroyedFn, targetOne } = getContext();
    expect(mountedFn).toHaveBeenCalledTimes(0);
    expect(destroyedFn).toHaveBeenCalledTimes(0);

    mockIsIntersecting(targetOne, true);

    expect(mountedFn).toHaveBeenCalledTimes(1);
    expect(destroyedFn).toHaveBeenCalledTimes(0);

    mockIsIntersecting(targetOne, false);
    await wait(1);

    expect(destroyedFn).toHaveBeenCalledTimes(1);
  });

  it('should trigger the enter and leave method on AnchorNavLink', async () => {
    const { enterFn, leaveFn, targetOne } = getContext();
    expect(enterFn).toHaveBeenCalledTimes(0);
    expect(leaveFn).toHaveBeenCalledTimes(0);

    mockIsIntersecting(targetOne, true);

    expect(enterFn).toHaveBeenCalledTimes(1);
    expect(leaveFn).toHaveBeenCalledTimes(0);

    mockIsIntersecting(targetOne, false);
    await wait(1);

    expect(leaveFn).toHaveBeenCalledTimes(1);
  });
});
