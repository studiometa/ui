import {
  findEnclosingClass,
  isBaseSubclass,
  isImportedFromUI,
  getAncestors,
  type Node,
  type RuleContext,
  createRule,
} from '../utils/ast.ts';

/**
 * Detect manual input/change event listeners that update DOM — suggest DataModel/DataEffect.
 *
 * Signal: addEventListener('input', ...) or an onInput* method that writes to
 * textContent / innerHTML / value on another element inside a Base subclass.
 */
/** Walk up a member expression chain and check if the root is this.$refs / this.$el / this.$children */
function isThisComponentAccess(node: Node): boolean {
  let current = node;
  while (current?.type === 'MemberExpression') {
    if (
      current.object?.type === 'ThisExpression' &&
      (current.property?.name === '$refs' ||
        current.property?.name === '$el' ||
        current.property?.name === '$children')
    ) {
      return true;
    }
    current = current.object;
  }
  return false;
}

export const preferDataModel = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer DataModel/DataEffect from @studiometa/ui over manually syncing input values to the DOM',
    },
    messages: {
      preferDataModel:
        'Manual input→DOM synchronization detected. ' +
        'Consider using DataModel and DataEffect from @studiometa/ui for reactive bindings: ' +
        "import { DataModel, DataEffect } from '@studiometa/ui'.",
    },
  },
  createOnce(context: RuleContext) {
    const classesWithInputListener = new WeakSet<Node>();
    const classesWithDomWrite = new WeakSet<Node>();
    const reported = new WeakSet<Node>();

    function getEnclosingBaseClass(node: Node): Node | null {
      const ancestors = getAncestors(context, node);
      const cls = findEnclosingClass(ancestors);
      if (!cls || !isBaseSubclass(cls, context)) return null;
      if (isImportedFromUI('DataModel', context) || isImportedFromUI('DataEffect', context))
        return null;
      return cls;
    }

    function maybeReport(cls: Node) {
      if (reported.has(cls)) return;
      if (classesWithInputListener.has(cls) && classesWithDomWrite.has(cls)) {
        reported.add(cls);
        context.report({ node: cls.id ?? cls, messageId: 'preferDataModel' });
      }
    }

    return {
      // Detect on-handler methods named onInput*, onChange*, onModelInput, etc.
      MethodDefinition(node: Node) {
        const name: string = node.key?.name ?? '';
        if (!/^on.*(Input|Change|Model)/i.test(name)) return;

        const ancestors = getAncestors(context, node);
        const cls = findEnclosingClass(ancestors);
        if (!cls || !isBaseSubclass(cls, context)) return;
        if (isImportedFromUI('DataModel', context)) return;

        classesWithInputListener.add(cls);
        maybeReport(cls);
      },

      AssignmentExpression(node: Node) {
        const left = node.left;
        if (left.type !== 'MemberExpression') return;

        const prop = left.property?.name;
        const isDomWrite =
          prop === 'textContent' || prop === 'innerHTML' || prop === 'value';
        if (!isDomWrite) return;

        // Must ultimately access this.$refs, this.$el, or this.$children
        if (!isThisComponentAccess(left.object)) return;

        const cls = getEnclosingBaseClass(node);
        if (!cls) return;

        classesWithDomWrite.add(cls);
        maybeReport(cls);
      },
    };
  },
});
