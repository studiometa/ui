import {
  findEnclosingClass,
  isBaseSubclass,
  isImportedFromUI,
  getAncestors,
  type Node,
  type RuleContext,
  createRule,
} from '../utils/ast.ts';

const DOM_WRITE_METHODS = new Set(['insertAdjacentHTML', 'insertAdjacentElement']);

/**
 * Detect manual fetch() calls inside Base subclasses that also write to innerHTML
 * or use insertAdjacentHTML — suggest using the Fetch component from @studiometa/ui.
 */
export const noManualFetch = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer the Fetch component from @studiometa/ui over manually fetching and injecting HTML',
    },
    messages: {
      preferFetch:
        'Manual fetch() with DOM injection detected. ' +
        "Consider using the Fetch component from @studiometa/ui instead: import { Fetch } from '@studiometa/ui'.",
    },
  },
  createOnce(context: RuleContext) {
    const classesWithFetch = new WeakSet<Node>();
    const classesWithDomWrite = new WeakSet<Node>();
    const reported = new WeakSet<Node>();

    function getEnclosingBaseClass(node: Node): Node | null {
      const ancestors = getAncestors(context, node);
      const cls = findEnclosingClass(ancestors);
      if (!cls || !isBaseSubclass(cls, context)) return null;
      if (isImportedFromUI('Fetch', context)) return null;
      return cls;
    }

    function maybeReport(cls: Node) {
      if (reported.has(cls)) return;
      if (classesWithFetch.has(cls) && classesWithDomWrite.has(cls)) {
        reported.add(cls);
        context.report({ node: cls.id ?? cls, messageId: 'preferFetch' });
      }
    }

    return {
      CallExpression(node: Node) {
        const callee = node.callee;

        // Detect fetch(url)
        const isFetch =
          (callee.type === 'Identifier' && callee.name === 'fetch') ||
          (callee.type === 'MemberExpression' &&
            callee.property?.name === 'fetch' &&
            callee.object?.type === 'ThisExpression');

        // Detect el.insertAdjacentHTML / el.insertAdjacentElement
        const isDomWrite =
          callee.type === 'MemberExpression' &&
          DOM_WRITE_METHODS.has(callee.property?.name);

        if (!isFetch && !isDomWrite) return;

        const cls = getEnclosingBaseClass(node);
        if (!cls) return;

        if (isFetch) classesWithFetch.add(cls);
        if (isDomWrite) classesWithDomWrite.add(cls);

        maybeReport(cls);
      },

      AssignmentExpression(node: Node) {
        const left = node.left;
        if (left.type !== 'MemberExpression') return;
        if (left.property?.name !== 'innerHTML') return;

        const cls = getEnclosingBaseClass(node);
        if (!cls) return;

        classesWithDomWrite.add(cls);
        maybeReport(cls);
      },
    };
  },
});
