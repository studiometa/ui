import { describe, it, expect, vi } from 'vitest';
import { FrameTarget } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The FrameTarget class', () => {
  it('should have an `id` getter', async () => {
    const div = h('div', { id: 'foo' });
    const frameTarget = new FrameTarget(div);
    await mount(frameTarget);
    expect(frameTarget.id).toBe(div.id);
  });

  it('should be able to append or prepend content', async () => {
    const text = 'Hello world\n';
    const div = h('div', { id: 'foo', dataOptionMode: 'append' }, [text]);
    const frameTarget = new FrameTarget(div);
    await mount(frameTarget);

    await frameTarget.updateContent(
      h('div', { id: 'foo', dataOptionMode: 'append' }, ['Lorem ipsum\n']),
    );
    expect(div.textContent).toBe('Hello world\nLorem ipsum\n');

    div.setAttribute('data-option-mode', 'prepend');
    await frameTarget.updateContent(
      h('div', { id: 'foo', dataOptionMode: 'append' }, ['Lorem ipsum\n']),
    );
    expect(div.textContent).toBe('Lorem ipsum\nHello world\nLorem ipsum\n');
  });

  it('should be able to replace content by default', async () => {
    const textA = 'Hello world\n';
    const textB = 'Hello world\n';
    const div = h('div', { id: 'foo' }, [textA]);
    const frameTarget = new FrameTarget(div);
    await mount(frameTarget);

    await frameTarget.updateContent(h('div', { id: 'foo' }, [textB]));
    expect(div.textContent).toBe(textB);

    await frameTarget.updateContent(h('div', { id: 'foo' }, [textA]));
    expect(div.textContent).toBe(textA);
  });

  it('should do nothing if the given content is null', async () => {
    const text = 'Hello world\n';
    const div = h('div', { id: 'foo' }, [text]);
    const frameTarget = new FrameTarget(div);
    await mount(frameTarget);
    const spy = vi.spyOn(frameTarget, 'leave');

    await frameTarget.updateContent(null);
    expect(spy).not.toHaveBeenCalled();
  });
});
