# Accessibility demo script (Assignment 8, Part 3)

A 12–15 minute recording plan showing keyboard-only use, NVDA, and Windows
High Contrast. Each segment lists what to press and what you should hear or
see, so the narration matches the app. All data shown is synthetic.

## Before recording

1. **Install.** Install `CareConnect-Setup-1.0.0.exe` and start CareConnect from the Start menu.
2. **Set up NVDA.**
   - Start NVDA (`Ctrl+Alt+N`).
   - Speech viewer on: NVDA menu → Tools → Speech viewer. This lets viewers read what NVDA says.
   - Turn on NVDA → Preferences → Settings → Vision → "Highlight focus".
3. **Prepare the windows.** Maximize CareConnect and close other windows.
4. **Reset the data (optional).** To start from the demo data, quit CareConnect and delete `%APPDATA%\CareConnect\careconnect-workspace.json`.
5. **Mouse.** Don't touch it. Say so on camera.

## 0:00–1:00 Introduction

- Say what CareConnect is: a clinical workspace for care coordinators, with synthetic demo data.
- Say how the video runs: everything is done from the keyboard, with NVDA running, then repeated in High Contrast.
- Press `NVDA+T`. NVDA reads the window title, "Patients · CareConnect — Clinical workspace".

## 1:00–3:00 Getting around: skip links, landmarks, regions

1. **Skip links.**
   - Press `Tab` once. The skip links appear: *Skip to main workspace*, *Skip to patient list*, *Skip to status*.
   - Press `Enter` on *Skip to patient list*. Focus jumps to the list.
2. **Regions (F6).**
   - Press `F6` repeatedly. Focus moves Navigation → Toolbar → Patient list → Detail pane → Status, and wraps back to the start.
   - Press `Shift+F6` to go backwards.
   - Point out that every stop keeps the visible teal focus ring.
3. **Landmarks list.**
   - Press `NVDA+F7`, then *Landmarks*.
   - Show the named landmarks: banner, navigation "Workspace", main, region "Recent patients", search "Patient list", region "Care summary", complementary "Recent activity", content info "Status".
   - Press `Esc`.
4. **Native menus.**
   - Press `Alt`. The access keys appear (F, E, V, N, P, C, H).
   - Open the menus with `Alt+F`, then the arrow keys. NVDA reads each item with its shortcut, for example "New Patient… Ctrl+N".
   - Press `Esc` twice.

## 3:00–5:30 Patient list with NVDA

1. **Read a patient.**
   - Focus the patient list (`F6`).
   - NVDA reads "Recent patients list, Avery Park, Wellness follow-up · 10:30. Needs review, selected, 1 of 28".
2. **Move through the list.**
   - Press `↓` and `↑`. Selection follows focus and the detail pane updates. Explain that each status is announced as a word, never as colour alone.
   - Press `Home` and `End`.
3. **Search.**
   - Press `/`. Focus moves to *Search list*.
   - Type `riley`. NVDA announces "1 result" without moving focus.
   - Press `Esc` to clear the search, then `Esc` again to return to the list.
4. **Filter.**
   - Press `Ctrl+Shift+L`. A native menu opens with *All patients / Needs review / Open / Completed*.
   - Choose *Needs review*. NVDA announces "Showing Needs review patients, … results".
   - Mention why Alt+F wasn't used: on Windows, Alt+F opens the File menu, and CareConnect never overrides reserved keys.
5. **Context menu.**
   - On a patient, press `Shift+F10` (or the Menu key). The native context menu opens.
   - Show the items with their shortcuts, then press `Esc`.

## 5:30–8:00 Detail pane, dialogs, errors and recovery

1. **Read the detail pane.**
   - Press `F6` to reach the detail pane.
   - Tab through *Message Avery Park*, *More actions for Avery Park*, the care team disclosure ("4 members, collapsed"), and *Edit care summary for Avery Park*.
2. **Error recovery: Add note.**
   - Press `N` (*Add clinical note*). Focus moves into the dialog.
   - Submit with the note empty.
   - Focus moves to the error summary, and NVDA reads "There is a problem: Enter the note text".
   - Activate the link. Focus jumps to the note field, which announces "invalid entry".
3. **Success announcement.**
   - Type a note and save.
   - NVDA announces "Note added for Avery Park.", and focus returns to the control that opened the dialog.
   - The status bar keeps the message until it's dismissed.
4. **Edit care summary.**
   - Press `E`. Add a plan item, remove one, then save.
5. **New patient validation.**
   - Press `Ctrl+N`. Submit the form empty to show the error summary for name, reason and visit date.
   - Show that entered values are kept after a failed submit.
   - Check *Schedule later* to clear the date error.
   - Press `Esc` to cancel.

## 8:00–9:30 Command palette and shortcuts reference

1. **Command palette.**
   - Press `Ctrl+K`. NVDA reads "Command palette dialog, Search commands, edit text".
   - Press `↓`. NVDA reads options such as "Create new patient record, Opens a blank synthetic record form, 2 of 8".
   - Type `inb`. The results update without moving focus, and the count is announced.
   - Press `Enter`. The Inbox opens.
   - Open the palette again and press `Esc`. Focus returns to where it was.
2. **Shortcuts reference.**
   - Press `Ctrl+/`.
   - Show the four tables, read with table navigation (`Ctrl+Alt+arrows`).
   - Press `Ctrl+F` and type `draft` to filter. NVDA announces "1 shortcut".
   - Point out the *Print reference* button.
3. **Help.** Press `F1` to open the help dialog. It describes regions, skip links and screen reader tips.

## 9:30–11:00 Inbox and messaging

1. **Read a message.**
   - Press `G` then `I` to open the Inbox. Select a conversation.
   - The sidebar now reads "Inbox, 3 unread".
2. **Reply.**
   - Press `R` to reply.
   - Press `Ctrl+Shift+A` to attach a document. A native file dialog opens; pick a file, and NVDA announces "<file> attached".
   - Press `Ctrl+S`. NVDA announces "Draft saved".
   - Press `Ctrl+Enter`. NVDA announces "Message sent to …".

## 11:00–13:00 High Contrast, reduced motion and zoom

1. **High Contrast.**
   - Turn on a Windows contrast theme: Settings → Accessibility → Contrast themes → *Night sky*, or `Left Alt+Left Shift+Print Screen`.
   - Show that CareConnect follows the theme:
     - focus is a system Highlight outline
     - status chips keep their icon and word
     - cards and chips have borders
   - Turn the contrast theme off.
2. **In-app theme and reduced motion.**
   - Press `Ctrl+,` (Settings).
   - Toggle *High contrast theme* and *Reduce motion*. Each switch announces its new state.
3. **Zoom.**
   - Press `Ctrl+=` eight times (View → Zoom In) to reach about 200 %. Electron zooms in steps, so eight presses give 207 %.
   - Show the layout reflowing: navigation moves to the top, the panes stack, and nothing is clipped.
   - Press `Ctrl+0` to reset.

## 13:00–14:30 Desktop integration

1. **Window state.** Resize and move the window, then quit with `Alt+F`, `X`. Restart CareConnect: it returns to the same size and position.
2. **Tray.** Show the tray icon menu: Open CareConnect, New Patient…, Open Inbox (N unread), Quit.
3. **Notification.** Point out the launch notification for follow-ups due today. Clicking it opens the patient.
4. **Taskbar.** Point out the unread badge on the taskbar icon.
5. **Jump List.** Right-click the taskbar icon to show the Jump List tasks: New patient, Open inbox.

## 14:30–15:00 Wrap-up

- Recap what was shown:
  - keyboard-only operation throughout
  - named landmarks and regions
  - screen reader announcements
  - error recovery
  - High Contrast
  - persisted window state and data
- Mention that the automated tests (jest-axe and the end-to-end suite) check the same behaviours on every run.
