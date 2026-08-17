import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


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