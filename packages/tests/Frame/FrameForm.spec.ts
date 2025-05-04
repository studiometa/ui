import { describe, it, expect, vi } from 'vitest';
import { FrameForm } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The FrameForm class', () => {
  it('should have an `method` getter', async () => {
    const formA = new FrameForm(h('form'));
    expect(formA.method).toBe('get');
    const formB = new FrameForm(h('form', { method: 'POST' }));
    expect(formB.method).toBe('post');
  });

  it('should add form data as url search parameters if the method is get', () => {
    const input = h('input', { type: 'text', name: 'foo', value: 'bar' });
    const form = h('form', { action: 'http://localhost/' }, [input]);
    const frameForm = new FrameForm(form);
    expect(frameForm.url.toString()).toBe('http://localhost/?foo=bar');
    form.method = 'POST';
    expect(frameForm.url.toString()).toBe('http://localhost/');
  });

  it('should add form data as body if method is post', async () => {
    const input = h('input', { type: 'text', name: 'foo', value: 'bar' });
    const form = h('form', { action: 'http://localhost/', method: 'POST' }, [input]);
    const frameForm = new FrameForm(form);
    await mount(frameForm);
    expect(frameForm.requestInit.method).toBe('post');
    expect(frameForm.requestInit.body).toEqual(new FormData(form));
    form.method = 'GET';
    expect(frameForm.requestInit.method).toBeUndefined();
    expect(frameForm.requestInit.body).toBeUndefined();
  });

  it('should add headers from the headers[] refs', async () => {
    const input = h('input', {
      type: 'hidden',
      dataRef: 'headers[]',
      dataName: 'x-custom-header',
      value: 'bar',
    });
    const form = h('form', { action: 'http://localhost/', method: 'POST' }, [input]);
    const frameForm = new FrameForm(form);
    await mount(frameForm);
    expect(frameForm.requestInit.headers).toEqual({ 'x-custom-header': 'bar' });
  });

  it('should trigger when the form is submitted in the same target', async () => {
    const form = h('form', { action: 'http://localhost/' });
    const frameForm = new FrameForm(form);
    const fn = vi.fn();
    frameForm.$on('frame-trigger', (event: CustomEvent) => fn(event));
    await mount(frameForm);
    const event = new SubmitEvent('submit')
    const spy = vi.spyOn(event, 'preventDefault');
    form.dispatchEvent(event);
    expect(fn).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledOnce();
    form.target = '_blank';
    form.dispatchEvent(event);
    expect(fn).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledOnce();
  });
});
