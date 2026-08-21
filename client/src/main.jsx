import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './productsPageFixes.css'
import App from './App.jsx'


// ============================================================
// API BASE URL COMPATIBILITY LAYER
// ============================================================
// Existing frontend files use the local backend URL directly.
// During production deployment, VITE_API_URL is used to redirect
// those requests to the deployed backend without changing the UI.

const configuredApiUrl =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:5000';

const originalFetch = window.fetch.bind(window);

window.fetch = (input, init) => {

  if (
    configuredApiUrl !== 'http://localhost:5000' &&
    typeof input === 'string' &&
    input.startsWith('http://localhost:5000')
  ) {

    input =
      configuredApiUrl +
      input.slice('http://localhost:5000'.length);

  }

  return originalFetch(input, init);
};


// ============================================================
// DISABLE BROWSER AUTOCOMPLETE / SUGGESTIONS GLOBALLY
// ============================================================

document.addEventListener('focusin', (event) => {

  const element = event.target;

  if (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA'
  ) {

    // Keep OTP autocomplete available
    if (
      element.getAttribute('autocomplete') === 'one-time-code'
    ) {
      return;
    }


    // Disable suggestions for password fields
    if (element.type === 'password') {

      element.setAttribute(
        'autocomplete',
        'new-password'
      );

    } else {

      // Disable browser suggestions for all other fields
      element.setAttribute(
        'autocomplete',
        'off'
      );

    }

  }

});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);