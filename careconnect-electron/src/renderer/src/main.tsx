import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const container = document.getElementById('root')
if (!container) throw new Error('index.html is missing the #root element')

const api = window.careconnect
createRoot(container).render(
  <StrictMode>
    {api ? (
      <App api={api} />
    ) : (
      <p className="app-message" role="alert">
        CareConnect must be started from the desktop app.
      </p>
    )}
  </StrictMode>
)
