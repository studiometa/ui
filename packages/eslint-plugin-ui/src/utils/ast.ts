export type Node = Record<string, any>;
export type RuleContext = Record<string, any>;

export type RuleMeta = {
  type?: 'problem' | 'suggestion' | 'layout';
  fixable?: 'code' | 'whitespace';
  hasSuggestions?: boolean;
  docs?: { description?: string };
  messages?: Record<string, string>;
};

export function createRule<V extends Record<string, (node: Node) => unknown>>(rule: {
  meta?: RuleMeta;
  createOnce(context: RuleContext): V;
}): { meta?: RuleMeta; createOnce(context: RuleContext): V } {
  return rule;
}

export const UI_PACKAGE = '@studiometa/ui';
export const TOOLKIT_PACKAGE = '@studiometa/js-toolkit';

/**
 * All component names exported by @studiometa/ui.
 * Keep in sync with packages/ui/index.ts exports.
 */
export const UI_COMPONENT_NAMES = new Set([
  'Accordion',
  'AccordionItem',
  'Action',
  'AnchorNav',
  'AnchorNavLink',
  'AnchorNavTarget',
  'CircularMarquee',
  'Cursor',
  'DataBind',
  'DataComputed',
  'DataEffect',
  'DataModel',
  'DataScope',
  'Draggable',
  'Figure',
  'FigureVideo',
  'Frame',
  'FrameAnchor',
  'FrameForm',
  'FrameTarget',
  'FrameLoader',
  'Hoverable',
  'LargeText',
  'LazyInclude',
  'Menu',
  'MenuBtn',
  'MenuList',
  'Modal',
  'Panel',
  'AbstractPrefetch',
  'PrefetchWhenOver',
  'PrefetchWhenVisible',
  'AbstractScrollAnimation',
  'ScrollAnimationTimeline',
  'ScrollAnimationTarget',
  'ScrollReveal',
  'Sentinel',
  'Slider',
  'SliderItem',
  'SliderDrag',
  'Sticky',
  'Tabs',
  'Transition',
]);

/**
 * Returns the local name of the superclass for a class declaration/expression.
 */
export function getSuperClassName(node: Node): string | null {
  if (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression') return null;
  if (!node.superClass) return null;
  if (node.superClass.type === 'Identifier') return node.superClass.name;
  return null;
}

/**
 * Returns true when a class extends Base (directly or via a toolkit import).
 */
export function isBaseSubclass(node: Node, context: RuleContext): boolean {
  const superName = getSuperClassName(node);
  if (!superName) return false;
  if (superName === 'Base') return true;

  const sourceCode = context.sourceCode ?? context.getSourceCode?.();
  const ast = sourceCode?.ast;
  if (!ast) return false;

  for (const n of ast.body) {
    if (n.type !== 'ImportDeclaration') continue;
    if (n.source.value !== TOOLKIT_PACKAGE) continue;
    for (const specifier of n.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.local.name === superName) return true;
    }
  }

  return false;
}

/**
 * Returns true when a class extends a component imported from @studiometa/ui.
 */
export function isUISubclass(node: Node, context: RuleContext): boolean {
  const superName = getSuperClassName(node);
  if (!superName) return false;

  const sourceCode = context.sourceCode ?? context.getSourceCode?.();
  const ast = sourceCode?.ast;
  if (!ast) return false;

  for (const n of ast.body) {
    if (n.type !== 'ImportDeclaration') continue;
    if (n.source.value !== UI_PACKAGE) continue;
    for (const specifier of n.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.local.name === superName) return true;
    }
  }

  return false;
}

/**
 * Returns true when className is already imported from @studiometa/ui.
 */
export function isImportedFromUI(className: string, context: RuleContext): boolean {
  const sourceCode = context.sourceCode ?? context.getSourceCode?.();
  const ast = sourceCode?.ast;
  if (!ast) return false;

  for (const n of ast.body) {
    if (n.type !== 'ImportDeclaration') continue;
    if (n.source.value !== UI_PACKAGE) continue;
    for (const specifier of n.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.imported?.name === className)
        return true;
    }
  }

  return false;
}

/**
 * Walks up ancestor nodes to find the nearest class declaration/expression.
 */
export function findEnclosingClass(ancestors: Node[]): Node | null {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') return node;
  }
  return null;
}

export function getAncestors(context: RuleContext, node: Node): Node[] {
  return context.getAncestors?.() ?? context.sourceCode?.getAncestors?.(node) ?? [];
}

/**
 * Returns all method definitions in a class body by name.
 */
export function getClassMethods(classNode: Node): Map<string, Node> {
  const methods = new Map<string, Node>();
  for (const member of classNode.body?.body ?? []) {
    if (member.type === 'MethodDefinition' && member.key?.type === 'Identifier') {
      methods.set(member.key.name, member);
    }
  }
  return methods;
}
