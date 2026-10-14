import { useId } from 'react'
import type { Preferences } from '../../../../shared/model'
import { keyLabel, type KeyPlatform } from '../../../../shared/shortcuts'
import { useAnnounce } from '../../a11y/Announcer'
import { Dialog } from '../../components/Dialog'
import { useAppDispatch, useAppState, useWorkspace } from '../../state/AppStateProvider'
import './settings.css'

interface SwitchSetting {
  key: keyof Preferences
  label: string
  /** How the change is announced: "<spoken> on" / "<spoken> off". */
  spoken: string
  /** What the switch does, with key names for this computer where it mentions a key. */
  hint: string | ((platform: KeyPlatform) => string)
}

const DISPLAY_SETTINGS: readonly SwitchSetting[] = [
  {
    key: 'showShortcutHints',
    label: 'Show shortcut hints',
    spoken: 'Shortcut hints',
    // The native menus always show their own keys, so this is only about the hints in the window.
    hint: (platform) => `Shows shortcut keys beside buttons and the search field. Hold ${keyLabel('Alt', platform)} to see them at any time.`
  },
  {
    key: 'highContrast',
    label: 'High contrast theme',
    spoken: 'High contrast theme',
    hint: 'Black text and borders, with a black focus ring on yellow.'
  },
  { key: 'reduceMotion', label: 'Reduce motion', spoken: 'Reduce motion', hint: 'Turns off animations and transitions.' }
]

const KEYBOARD_SETTINGS: readonly SwitchSetting[] = [
  {
    key: 'singleKeyShortcuts',
    label: 'Single-key shortcuts',
    spoken: 'Single-key shortcuts',
    // WCAG 2.1.4 Character Key Shortcuts: single-character shortcuts must be possible to turn off.
    hint: (platform) =>
      `E, N, M, R, / and G-key sequences. Turn off if you use speech recognition, so spoken words never trigger commands. ${platform === 'mac' ? '⌘' : 'Ctrl'} shortcuts and function keys always work.`
  }
]

const NOTIFICATION_SETTINGS: readonly SwitchSetting[] = [
  {
    key: 'notifications',
    label: 'Desktop notifications for follow-ups due today',
    spoken: 'Desktop notifications',
    hint: 'One notification when CareConnect opens, listing patients with a follow-up due today.'
  }
]

function SettingSwitch({
  setting,
  platform,
  checked,
  onChange
}: {
  setting: SwitchSetting
  platform: KeyPlatform
  checked: boolean
  onChange(value: boolean): void
}): React.JSX.Element {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="settings__row">
      <label htmlFor={id} className="settings__label">
        {setting.label}
      </label>
      <span className="settings__control">
        <span className="settings__state" aria-hidden="true">
          {checked ? 'On' : 'Off'}
        </span>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="settings__switch"
          checked={checked}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.checked)}
        />
      </span>
      <p id={hintId} className="field__hint settings__hint">
        {typeof setting.hint === 'function' ? setting.hint(platform) : setting.hint}
      </p>
    </div>
  )
}

/**
 * Settings (Ctrl+, or the gear): display and notification preferences as
 * switches. Every change applies and saves at once and is announced, so
 * there is nothing to confirm; Done just closes.
 */
export function SettingsDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const { preferences } = useWorkspace()
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const announce = useAnnounce()

  const change = (setting: SwitchSetting, value: boolean): void => {
    dispatch({ type: 'preferences/changed', changes: { [setting.key]: value } })
    announce(`${setting.spoken} ${value ? 'on' : 'off'}`, 'polite')
  }

  const renderSwitch = (setting: SwitchSetting): React.JSX.Element => (
    <SettingSwitch
      key={setting.key}
      setting={setting}
      platform={ui.platform}
      checked={preferences[setting.key]}
      onChange={(value) => change(setting, value)}
    />
  )

  return (
    <Dialog
      title="Settings"
      icon="settings"
      size="small"
      onClose={onClose}
      className="settings"
      footer={
        <button type="button" className="button button--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <fieldset className="settings__group">
        <legend className="settings__legend">Display</legend>
        {DISPLAY_SETTINGS.map(renderSwitch)}
        <div className="settings__system">
          <p>Windows High Contrast: {ui.systemHighContrast ? 'On' : 'Off'}</p>
          <p className="field__hint">CareConnect follows the Windows contrast theme automatically. Change it in Windows Settings.</p>
        </div>
      </fieldset>
      <fieldset className="settings__group">
        <legend className="settings__legend">Keyboard</legend>
        {KEYBOARD_SETTINGS.map(renderSwitch)}
      </fieldset>
      <fieldset className="settings__group">
        <legend className="settings__legend">Notifications</legend>
        {NOTIFICATION_SETTINGS.map(renderSwitch)}
      </fieldset>
    </Dialog>
  )
}
