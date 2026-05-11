import {
  isBaseSubclass,
  getClassMethods,
  isImportedFromUI,
  type Node,
  type RuleContext,
  createRule,
} from '../utils/ast.ts';

/**
 * Simple event handler method names that the Action component already handles.
 * These are on-handler names on this.$el (root element) — if the class body
 * contains ONLY these kinds of methods (plus config), it's a good Action candidate.
 */
const ACTION_EVENT_METHODS = new Set([
  'onClick',
  'onMouseenter',
  'onMouseleave',
  'onMouseover',
  'onMouseout',
  'onFocus',
  'onBlur',
  'onKeydown',
  'onKeyup',
  'onKeypress',
  'onPointerenter',
  'onPointerleave',
  'onPointerdown',
  'onPointerup',
]);

const NON_LOGIC_METHODS = new Set(['mounted', 'destroyed', 'updated']);

/**
 * Detect Base subclasses whose only logic is a single simple event handler
 * (onClick, onMouseenter, etc.) — these can be replaced by the Action component.
 */
export const preferAction = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer the Action component from @studiometa/ui for simple event-triggered effects',
    },
    messages: {
      preferAction:
        'This component only handles "{{method}}" on the root element. ' +
        'Consider using the Action component from @studiometa/ui instead, ' +
        "which declaratively wires events to effects via data attributes: import { Action } from '@studiometa/ui'.",
    },
  },
  createOnce(context: RuleContext) {
    return {
      ClassDeclaration(node: Node) {
        check(node, context);
      },
      ClassExpression(node: Node) {
        check(node, context);
      },
    };
  },
});

function check(node: Node, context: RuleContext) {
  if (!isBaseSubclass(node, context)) return;
  if (isImportedFromUI('Action', context)) return;

  const methods = getClassMethods(node);

  // Find action-handler methods defined in this class
  const actionMethods: string[] = [];
  const otherMethods: string[] = [];

  for (const [name] of methods) {
    if (ACTION_EVENT_METHODS.has(name)) {
      actionMethods.push(name);
    } else if (name !== 'config' && !NON_LOGIC_METHODS.has(name)) {
      otherMethods.push(name);
    }
  }

  // Only flag when: exactly one action method, no other logic methods
  if (actionMethods.length !== 1 || otherMethods.length > 0) return;

  // Check the method body is simple — does not access this.$children or this.$refs
  // to avoid false positives on components that orchestrate children
  const method = methods.get(actionMethods[0])!;
  if (hasComplexBody(method)) return;

  context.report({
    node: node.id ?? node,
    messageId: 'preferAction',
    data: { method: actionMethods[0] },
  });
}

function hasComplexBody(methodNode: Node): boolean {
  let complex = false;

  function walk(n: Node) {
    if (complex) return;
    if (!n || typeof n !== 'object') return;

    // Accessing $children or using await suggests complex logic
    if (
      n.type === 'MemberExpression' &&
      n.object?.type === 'ThisExpression' &&
      (n.property?.name === '$children' || n.property?.name === '$root')
    ) {
      complex = true;
      return;
    }

    for (const key of Object.keys(n)) {
      if (key === 'parent') continue;
      const child = n[key];
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === 'object' && child.type) walk(child);
    }
  }

  walk(methodNode.value ?? methodNode);
  return complex;
}
