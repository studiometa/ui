import {
  isBaseSubclass,
  isImportedFromUI,
  getClassMethods,
  type Node,
  type RuleContext,
  createRule,
} from '../utils/ast.ts';

/**
 * Detect classes that extend Base and define both open() and close() methods —
 * a pattern that duplicates what Transition (or Modal) already provides.
 */
export const preferTransition = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer @studiometa/ui Transition over manually implementing open/close logic in a Base subclass',
    },
    messages: {
      preferTransition:
        'This class manually implements open() and close() methods. ' +
        'Consider extending Transition from @studiometa/ui instead, which handles show/hide with CSS class transitions: ' +
        "import { Transition } from '@studiometa/ui'.",
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
  // Already using a @studiometa/ui component as the base
  if (isImportedFromUI(node.superClass?.name, context)) return;

  const methods = getClassMethods(node);
  if (!methods.has('open') || !methods.has('close')) return;

  context.report({ node: node.id ?? node, messageId: 'preferTransition' });
}
