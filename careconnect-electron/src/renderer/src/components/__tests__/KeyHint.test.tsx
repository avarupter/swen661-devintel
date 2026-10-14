import { screen } from '@testing-library/react'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import type { CommandId } from '../../../../shared/commands'
import { renderHarness } from '../../state/__tests__/harness'
import { KeyHint } from '../KeyHint'

function Hints({ command, keys, variant }: { command?: CommandId; keys?: string[]; variant?: 'text' | 'keys' }): React.JSX.Element {
  return (
    <p data-testid="hint">
      <KeyHint command={command} keys={keys} variant={variant} />
    </p>
  )
}

const hint = (): HTMLElement => screen.getByTestId('hint')

describe('KeyHint', () => {
  it.each<[CommandId, string]>([
    ['patient.new', 'Ctrl+N'],
    ['message.new', 'Ctrl+Shift+M'],
    ['patient.editSummary', 'E'],
    ['navigate.patients', 'G P'],
    ['region.previous', 'Shift+F6'],
    ['app.help', 'F1']
  ])('shows %s as "%s" on Windows', async (command, text) => {
    await renderHarness(<Hints command={command} />)
    expect(hint()).toHaveTextContent(text)
    expect(hint().querySelector('.key-hint')).toHaveAttribute('aria-hidden', 'true')
  })

  it.each<[CommandId, string]>([
    ['patient.new', '⌘+N'],
    ['message.new', '⌘+⇧+M'],
    ['app.help', 'Fn+F1'],
    ['navigate.inbox', 'G I']
  ])('shows %s as "%s" on a Mac', async (command, text) => {
    await renderHarness(<Hints command={command} />, { api: createMemoryApi({ platform: 'darwin' }) })
    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it('renders keycaps in the keys variant', async () => {
    await renderHarness(<Hints command="message.new" variant="keys" />)
    const caps = Array.from(hint().querySelectorAll('.key-hint--keys kbd'), (kbd) => kbd.textContent)
    expect(caps).toEqual(['Ctrl', 'Shift', 'M'])
    expect(hint().querySelector('.key-hint--keys')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows explicit keys instead of the command’s own', async () => {
    await renderHarness(<Hints command="patient.search" keys={['/']} />)
    expect(hint()).toHaveTextContent(/^\/$/)
  })

  it('joins explicit keys with + when there is no sequence', async () => {
    await renderHarness(<Hints keys={['Ctrl', 'K']} />)
    expect(hint()).toHaveTextContent('Ctrl+K')
  })

  it('renders nothing for a command without a shortcut, or with no keys', async () => {
    await renderHarness(
      <>
        <Hints command="patient.sort" />
        <p data-testid="empty-keys">
          <KeyHint keys={[]} />
        </p>
      </>
    )
    expect(hint()).toBeEmptyDOMElement()
    expect(screen.getByTestId('empty-keys')).toBeEmptyDOMElement()
  })

  it('hides single-key hints while single-key shortcuts are off, and keeps the rest', async () => {
    const api = createMemoryApi()
    api.workspace.preferences.singleKeyShortcuts = false
    await renderHarness(
      <>
        {(['patient.editSummary', 'navigate.patients', 'patient.new', 'app.help'] as const).map((command) => (
          <p key={command} data-testid={command}>
            <KeyHint command={command} />
          </p>
        ))}
        <p data-testid="slash">
          <KeyHint keys={['/']} variant="keys" />
        </p>
      </>,
      { api }
    )
    expect(screen.getByTestId('patient.editSummary')).toBeEmptyDOMElement()
    expect(screen.getByTestId('navigate.patients')).toBeEmptyDOMElement()
    expect(screen.getByTestId('slash')).toBeEmptyDOMElement()
    expect(screen.getByTestId('patient.new')).toHaveTextContent('Ctrl+N')
    expect(screen.getByTestId('app.help')).toHaveTextContent('F1')
  })
})
