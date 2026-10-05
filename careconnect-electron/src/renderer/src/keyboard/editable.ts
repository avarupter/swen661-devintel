/** Whether key presses at `target` are typing (so single-key shortcuts must stay out of the way). */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  if (target instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file', 'image'].includes(target.type)
  }
  return target.getAttribute('role') === 'textbox' || target.getAttribute('role') === 'combobox'
}
