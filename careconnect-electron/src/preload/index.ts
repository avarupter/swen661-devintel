import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('careconnect', {
  platform: process.platform
})
