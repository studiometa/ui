import {
  UI_COMPONENT_NAMES,
  isBaseSubclass,
  isImportedFromUI,
  type Node,
  type RuleContext,
  createRule,
} from '../utils/ast.ts';

export const preferUiComponent = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer importing components from @studiometa/ui over reimplementing them from scratch',
    },
    messages: {
      preferImport:
        '"{{name}}" is available in @studiometa/ui. ' +
        'Extend it instead of reimplementing from Base: import { {{name}} } from \'@studiometa/ui\'.',
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
  const name: string = node.id?.name ?? '';
  if (!name || !UI_COMPONENT_NAMES.has(name)) return;
  if (!isBaseSubclass(node, context)) return;
  // Already importing it from @studiometa/ui — they're extending it properly
  if (isImportedFromUI(name, context)) return;

  context.report({ node: node.id ?? node, messageId: 'preferImport', data: { name } });
}
