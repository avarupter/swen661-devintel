import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { APP_ENTRY_URL, handleAppProtocol, registerAppScheme } from './protocol'

registerAppScheme()
app.enableSandbox()

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    title: 'CareConnect — Clinical workspace',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.once('ready-to-show', () => win.show())
  const devServerUrl = process.env.ELECTRON_RENDERER_URL
  void win.loadURL(devServerUrl ?? APP_ENTRY_URL)
}

void app.whenReady().then(() => {
  handleAppProtocol(path.join(__dirname, '../renderer'))
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
