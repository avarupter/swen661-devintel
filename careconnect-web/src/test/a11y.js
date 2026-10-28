/**
 * Accessibility checks shared by the component tests. Not a test file itself:
 * Jest only runs files under __tests__ named *.test.js(x), and coverage skips
 * src/test/.
 */

/**
 * The text nodes inside `element` that a screen reader reaches, in document
 * order. Anything under aria-hidden="true" is skipped, and so is whitespace.
 *
 * Use it to check the R15 pattern (src/components/Labelled.jsx): a control
 * whose name differs from its visible text must give a screen reader exactly
 * ONE text node, the whole name, inside the one .cc-sr-only span. jsdom joins
 * the pieces of a split name with no space, so an accessible-name assertion
 * passes on the split form too; Chromium, which renders .cc-sr-only as
 * position: absolute, does not, and names it "I'm ready : Video call…". This
 * check fails on the split form, because it sees two nodes.
 *
 * @param {Element} element
 * @returns {Text[]}
 */
export function readableTextNodes(element) {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent.trim() && !node.parentElement.closest('[aria-hidden="true"]')) {
      nodes.push(node);
    }
  }
  return nodes;
}
