import { isEditableTarget } from '../editable'

function element(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body.firstElementChild as HTMLElement
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('isEditableTarget', () => {
  it.each(['text', 'search', 'email', 'number', 'password', 'tel', 'url', 'date', 'time'])('treats <input type="%s"> as typing', (type) => {
    expect(isEditableTarget(element(`<input type="${type}" aria-label="Field">`))).toBe(true)
  })

  it('treats an input without a type as text', () => {
    expect(isEditableTarget(element('<input aria-label="Field">'))).toBe(true)
  })

  it.each(['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file', 'image'])(
    'lets single-key shortcuts through on <input type="%s">',
    (type) => {
      expect(isEditableTarget(element(`<input type="${type}" aria-label="Control">`))).toBe(false)
    }
  )

  it('treats textareas, selects and ARIA text boxes and comboboxes as typing', () => {
    expect(isEditableTarget(element('<textarea aria-label="Note"></textarea>'))).toBe(true)
    expect(isEditableTarget(element('<select aria-label="Type"><option>Visit note</option></select>'))).toBe(true)
    expect(isEditableTarget(element('<div role="textbox" tabindex="0" aria-label="Rich text"></div>'))).toBe(true)
    expect(isEditableTarget(element('<div role="combobox" tabindex="0" aria-label="Search commands" aria-expanded="true"></div>'))).toBe(true)
  })

  it('treats contenteditable content as typing', () => {
    const editor = element('<div contenteditable="true" aria-label="Editor"></div>')
    // jsdom does not implement isContentEditable; browsers derive it from the attribute.
    Object.defineProperty(editor, 'isContentEditable', { value: true })
    expect(isEditableTarget(editor)).toBe(true)
  })

  it('does not treat buttons, list options, plain elements or non-elements as typing', () => {
    expect(isEditableTarget(element('<button type="button">Add note</button>'))).toBe(false)
    expect(isEditableTarget(element('<li role="option" tabindex="0" aria-selected="true">Avery Park</li>'))).toBe(false)
    expect(isEditableTarget(element('<div tabindex="-1">Region</div>'))).toBe(false)
    expect(isEditableTarget(document)).toBe(false)
    expect(isEditableTarget(window)).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
