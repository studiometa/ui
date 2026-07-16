import { describe, expect, it } from 'vitest';
import { DataBind, DataComputed, DataEffect, DataModel, DataScope } from '@studiometa/ui';
import { nextTick } from '@studiometa/js-toolkit/utils';
import { destroy, hConnected as h, mount } from '#test-utils';

describe('The DataScope component', () => {
  it('should inherit its default group while allowing explicit overrides', async () => {
    const root = h('div');
    const inheritedAElement = h('div');
    const inheritedBElement = h('div');
    const overriddenElement = h('div', { dataOptionGroup: 'other' });
    root.append(inheritedAElement, inheritedBElement, overriddenElement);

    const scope = new DataScope(root);
    const inheritedA = new DataBind(inheritedAElement);
    const inheritedB = new DataBind(inheritedBElement);
    const overridden = new DataBind(overriddenElement);
    await mount(scope, inheritedA, inheritedB, overridden);

    expect(scope.$options.group).toBe('default');
    expect(inheritedA.group).toBe('default');
    expect(inheritedA.$group).toBe(inheritedB.$group);
    expect(overridden.group).toBe('other');
    expect(overridden.$group).not.toBe(inheritedA.$group);

    await destroy(scope, inheritedA, inheritedB, overridden);
  });

  it('should isolate sibling scopes and use the nearest nested scope', async () => {
    const outerRoot = h('div', { dataOptionGroup: 'shared' });
    const outerElement = h('div');
    const nestedRoot = h('div', { dataOptionGroup: 'shared' });
    const nestedElement = h('div');
    nestedRoot.append(nestedElement);
    outerRoot.append(outerElement, nestedRoot);

    const siblingRoot = h('div', { dataOptionGroup: 'shared' });
    const siblingElement = h('div');
    siblingRoot.append(siblingElement);

    const outerScope = new DataScope(outerRoot);
    const nestedScope = new DataScope(nestedRoot);
    const siblingScope = new DataScope(siblingRoot);
    const outer = new DataBind(outerElement);
    const nested = new DataBind(nestedElement);
    const sibling = new DataBind(siblingElement);
    await mount(outerScope, nestedScope, siblingScope, outer, nested, sibling);

    expect(outer.$group).not.toBe(nested.$group);
    expect(outer.$group).not.toBe(sibling.$group);
    expect(nested.dataScope).toBe(nestedScope);

    outer.set('outer');
    expect(nested.value).toBe('');
    expect(sibling.value).toBe('');

    await destroy(outerScope, nestedScope, siblingScope, outer, nested, sibling);
  });

  it('should keep keyed values independent and synchronize equal keys', async () => {
    const root = h('div', { dataOptionGroup: 'person' });
    const firstInput = h('input', { name: 'first', value: 'Ada' });
    const lastInput = h('input', { name: 'last', value: 'Lovelace' });
    const firstOutput = h('div', { dataOptionKey: 'first' });
    root.append(firstInput, lastInput, firstOutput);

    const scope = new DataScope(root);
    const first = new DataModel(firstInput);
    const last = new DataModel(lastInput);
    const output = new DataBind(firstOutput);
    await mount(scope, first, last, output);

    firstInput.value = 'Grace';
    firstInput.dispatchEvent(new Event('input'));
    expect(first.value).toBe('Grace');
    expect(output.value).toBe('Grace');
    expect(last.value).toBe('Lovelace');
    expect(first.$data).toEqual({ first: 'Grace' });
    expect(Object.isFrozen(first.$data)).toBe(true);

    await destroy(scope, first, last, output);
  });

  it('should remove keyed data when its last source is destroyed', async () => {
    const root = h('div', { dataOptionGroup: 'person' });
    const primaryInput = h('input', {
      name: 'first',
      value: 'Ada',
      dataOptionImmediate: true,
    });
    const secondaryInput = h('input', {
      name: 'first',
      value: 'Ada',
      dataOptionImmediate: true,
    });
    root.append(primaryInput, secondaryInput);

    const scope = new DataScope(root);
    const primary = new DataModel(primaryInput);
    const secondary = new DataModel(secondaryInput);
    await mount(scope, primary, secondary);
    await nextTick();
    expect(scope.getData('person')).toEqual({ first: 'Ada' });

    await destroy(primary);
    expect(scope.getData('person')).toEqual({ first: 'Ada' });

    await destroy(secondary);
    expect(scope.getData('person')).toEqual({});

    await destroy(scope);
  });

  it('should track only actual keyed sources during teardown', async () => {
    const root = h('div', { dataOptionGroup: 'person' });
    const input = h('input', {
      name: 'first',
      value: 'Ada',
      dataOptionImmediate: true,
    });
    const outputA = h('div', { dataOptionKey: 'first' });
    const outputB = h('div', { dataOptionKey: 'first' });
    root.append(input, outputA, outputB);

    const scope = new DataScope(root);
    const source = new DataModel(input);
    const subscriberA = new DataBind(outputA);
    const subscriberB = new DataBind(outputB);
    await mount(scope, source, subscriberA, subscriberB);
    await nextTick();
    expect(outputB.textContent).toBe('Ada');

    await destroy(subscriberA);
    expect(scope.getData('person')).toEqual({ first: 'Ada' });

    await destroy(source);
    expect(scope.getData('person')).toEqual({});
    expect(outputB.textContent).toBe('');

    await destroy(scope, subscriberB);
  });

  it('should recompute multiple values when a checkbox source is removed', async () => {
    const root = h('div', { dataOptionGroup: 'choices[]' });
    const firstElement = h('input', {
      type: 'checkbox',
      name: 'items',
      value: 'first',
      dataOptionImmediate: true,
    });
    const secondElement = h('input', {
      type: 'checkbox',
      name: 'items',
      value: 'second',
      dataOptionImmediate: true,
    });
    firstElement.checked = true;
    secondElement.checked = true;
    const computedElement = h('div', {
      dataOptionCompute: '$data.items?.join(", ") ?? ""',
    });
    root.append(firstElement, secondElement, computedElement);

    const scope = new DataScope(root);
    const first = new DataModel(firstElement);
    const second = new DataModel(secondElement);
    const computed = new DataComputed(computedElement);
    await mount(scope, first, second, computed);
    await nextTick();
    expect(scope.getData('choices[]')).toEqual({ items: ['first', 'second'] });
    expect(computed.value).toBe('first, second');

    secondElement.remove();
    expect(scope.getData('choices[]')).toEqual({ items: ['first'] });
    expect(computed.value).toBe('first');

    await destroy(first);
    expect(scope.getData('choices[]')).toEqual({});
    expect(computed.value).toBe('');

    await destroy(scope, second, computed);
  });

  it('should remove keyed values from disconnected sources', async () => {
    const root = h('div', { dataOptionGroup: 'person' });
    const input = h('input', {
      name: 'first',
      value: 'Ada',
      dataOptionImmediate: true,
    });
    const computedElement = h('div', {
      dataOptionCompute: '$data.first ?? "missing"',
    });
    root.append(input, computedElement);

    const scope = new DataScope(root);
    const source = new DataModel(input);
    const computed = new DataComputed(computedElement);
    await mount(scope, source, computed);
    await nextTick();
    expect(scope.getData('person')).toEqual({ first: 'Ada' });
    expect(computed.value).toBe('Ada');

    input.remove();
    expect(scope.getData('person')).toEqual({});
    expect(computed.value).toBe('missing');

    await destroy(scope, source, computed);
  });

  it('should recompute subscribers when the last keyed source is destroyed', async () => {
    const root = h('div', { dataOptionGroup: 'person' });
    const input = h('input', {
      name: 'first',
      value: 'Ada',
      dataOptionImmediate: true,
    });
    const computedElement = h('div', {
      dataOptionCompute: '$data.first ?? "missing"',
    });
    const effectElement = h('div', {
      dataOptionEffect: 'target.dataset.value = $data.first ?? "missing"',
    });
    root.append(input, computedElement, effectElement);

    const scope = new DataScope(root);
    const source = new DataModel(input);
    const computed = new DataComputed(computedElement);
    const effect = new DataEffect(effectElement);
    await mount(scope, source, computed, effect);
    await nextTick();
    expect(computed.value).toBe('Ada');
    expect(effectElement.dataset.value).toBe('Ada');

    await destroy(source);
    expect(scope.getData('person')).toEqual({});
    expect(computed.value).toBe('missing');
    expect(effectElement.dataset.value).toBe('missing');

    await destroy(scope, computed, effect);
  });

  it('should clone and freeze mutable snapshot values', () => {
    const scope = new DataScope(h('div'));
    const items = ['one'];
    const date = new Date('2026-01-01');

    scope.setValue('values', 'items', items);
    scope.setValue('values', 'date', date);
    const data = scope.getData('values');

    expect(data.items).toEqual(items);
    expect(data.items).not.toBe(items);
    expect(Object.isFrozen(data.items)).toBe(true);
    expect(data.date).toEqual(date);
    expect(data.date).not.toBe(date);
    expect(Object.isFrozen(data.date)).toBe(true);

    items.push('two');
    date.setFullYear(2030);
    (data.date as Date).setFullYear(2031);
    scope.setValue('values', 'other', 'value');

    expect(data.items).toEqual(['one']);
    expect(scope.getData('values')).toEqual({
      items: ['one'],
      date: new Date('2026-01-01'),
      other: 'value',
    });
  });

  it('should recompute unkeyed subscribers for every keyed update', async () => {
    const root = h('div', { dataOptionGroup: 'values' });
    const firstInput = h('input', {
      name: 'first',
      value: 'A',
      dataOptionImmediate: true,
    });
    const lastInput = h('input', {
      name: 'last',
      value: 'B',
      dataOptionImmediate: true,
    });
    const computedElement = h('div', {
      dataOptionCompute: '$data.first + $data.last',
    });
    root.append(firstInput, lastInput, computedElement);

    const scope = new DataScope(root);
    const first = new DataModel(firstInput);
    const last = new DataModel(lastInput);
    const computed = new DataComputed(computedElement);
    await mount(scope, first, last, computed);
    await nextTick();
    expect(computed.value).toBe('AB');

    firstInput.value = 'AB';
    firstInput.dispatchEvent(new Event('input'));
    expect(computed.value).toBe('ABB');

    await destroy(scope, first, last, computed);
  });

  it('should hydrate all immediate keyed sources before notifying subscribers', async () => {
    const root = h('div', { dataOptionGroup: 'person' });
    const firstInput = h('input', {
      name: 'first',
      value: 'Ada',
      dataOptionImmediate: true,
    });
    const lastInput = h('input', {
      name: 'last',
      value: 'Lovelace',
      dataOptionImmediate: true,
    });
    const computedElement = h('div', {
      dataOptionCompute: '$data.first + " " + $data.last',
    });
    const effectElement = h('div', {
      dataOptionEffect:
        'target.dataset.values = (target.dataset.values || "") + $data.first + " " + $data.last + "|"; target.dataset.frozen = Object.isFrozen($data)',
    });
    root.append(firstInput, lastInput, computedElement, effectElement);

    const scope = new DataScope(root);
    const first = new DataModel(firstInput);
    const last = new DataModel(lastInput);
    const computed = new DataComputed(computedElement);
    const effect = new DataEffect(effectElement);
    await mount(scope, first, last, computed, effect);
    await nextTick();

    expect(computed.value).toBe('Ada Lovelace');
    expect(effectElement.dataset.values?.split('|').filter(Boolean)).toEqual([
      'Ada Lovelace',
      'Ada Lovelace',
    ]);
    expect(effectElement.dataset.frozen).toBe('true');

    await destroy(scope, first, last, computed, effect);
  });

  it('should hydrate and track only the selected radio', async () => {
    const root = h('div', { dataOptionGroup: 'tabs' });
    const overviewElement = h('input', {
      type: 'radio',
      name: 'tab',
      value: 'overview',
      dataOptionImmediate: true,
    });
    const detailsElement = h('input', {
      type: 'radio',
      name: 'tab',
      value: 'details',
      dataOptionImmediate: true,
    });
    overviewElement.checked = true;
    root.append(overviewElement, detailsElement);

    const scope = new DataScope(root);
    const overview = new DataModel(overviewElement);
    const details = new DataModel(detailsElement);
    await mount(scope, overview, details);
    await nextTick();
    expect(scope.getData('tabs')).toEqual({ tab: 'overview' });

    overview.set('details');
    expect(detailsElement.checked).toBe(true);
    expect(scope.getData('tabs')).toEqual({ tab: 'details' });

    await destroy(overview);
    expect(scope.getData('tabs')).toEqual({ tab: 'details' });

    await destroy(details);
    expect(scope.getData('tabs')).toEqual({});

    await destroy(scope);
  });

  it('should track the initiating radio when values are duplicated', async () => {
    const root = h('div', { dataOptionGroup: 'tabs' });
    const firstElement = h('input', {
      type: 'radio',
      name: 'tab',
      value: 'shared',
    });
    const secondElement = h('input', {
      type: 'radio',
      name: 'tab',
      value: 'shared',
    });
    root.append(firstElement, secondElement);

    const scope = new DataScope(root);
    const first = new DataModel(firstElement);
    const second = new DataModel(secondElement);
    await mount(scope, first, second);

    second.set('shared');
    expect(secondElement.checked).toBe(true);
    expect(scope.getData('tabs')).toEqual({ tab: 'shared' });

    await destroy(second);
    expect(scope.getData('tabs')).toEqual({});

    await destroy(scope, first);
  });

  it('should ignore immediate sources destroyed before hydration', async () => {
    const root = h('div', { dataOptionGroup: 'person' });
    const input = h('input', {
      name: 'first',
      value: 'Ada',
      dataOptionImmediate: true,
    });
    const effectElement = h('div', {
      dataOptionEffect: 'target.dataset.called = "true"',
    });
    root.append(input, effectElement);

    const scope = new DataScope(root);
    const source = new DataModel(input);
    const effect = new DataEffect(effectElement);
    await mount(scope, source, effect);
    await destroy(source);
    await nextTick();

    expect(scope.getData('person')).toEqual({});
    expect(effectElement.dataset.called).toBeUndefined();

    await destroy(scope, effect);
  });

  it('should preserve value and target callback arguments with scoped data', () => {
    const root = h('div');
    const computedElement = h('div', {
      dataOptionCompute: 'value + target.dataset.suffix + Object.isFrozen($data)',
      dataSuffix: '-target-',
    });
    root.append(computedElement);

    new DataScope(root);
    const computed = new DataComputed(computedElement);
    computed.set('value');

    expect(computed.value).toBe('value-target-true');
  });
});
