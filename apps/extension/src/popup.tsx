import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

const rootElement = document.querySelector('#root')

if (!rootElement) {
  throw new Error('Popup root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
