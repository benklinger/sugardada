// public/interactions.js

// Simple type effect for text content
function typeText(el, text, i = 0, callback) {
  if (i < text.length) {
    el.textContent += text.charAt(i);
    setTimeout(() => typeText(el, text, i + 1, callback), 40);
  } else {
    if (callback) callback();
  }
}

/**
 * Enables form interactions by adding event listeners to radio inputs
 * to automatically submit the form upon selection.
 * 
 * @param {HTMLElement} form - The form element to be submitted.
 */
function enableFormInteractions(form) {
  const radioButtons = form.querySelectorAll('input[type="radio"]');

  // Add the 'show' class to trigger fade-in via CSS
  form.classList.add('show');

  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      form.submit();
    });
  });
}

/**
 * Enables auto-submit for text input forms.
 * Automatically submits the form when the user presses Enter.
 * Also camelizes the input regardless of how the user types it.
 * 
 * @param {HTMLElement} form - The form element to be submitted.
 * @param {HTMLElement} input - The input element within the form.
 */
function enableAutoSubmitTextForm(form, input) {
  // Function to camelize input
  function camelize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Listen for input events to camelize
  input.addEventListener('input', () => {
    const cursorPosition = input.selectionStart;
    input.value = camelize(input.value);
    input.setSelectionRange(cursorPosition, cursorPosition);
  });

  // Submit on Enter key press
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.submit();
    }
  });

  // Focus the input field after typewriter effect and form is shown
  form.addEventListener('transitionend', () => {
    input.focus();
  }, { once: true }); // Ensures the event listener runs only once
}

document.addEventListener('DOMContentLoaded', () => {
  const questionEl = document.querySelector('.question');
  const formEl = document.querySelector('.gender-form'); // Only targets forms with 'gender-form' class

  if (!questionEl || !formEl) {
    console.error('Required elements not found in the DOM.');
    return;
  }

  // Determine the page type based on the form's action attribute
  const formAction = formEl.getAttribute('action');

  if (formAction === '/onboarding/1') {
    // Gender Selection Page
    typeText(questionEl, "Are you setting this up for your baby boy or girl?", 0, () => {
      // After typing is complete, enable form interactions
      enableFormInteractions(formEl);
    });
  } else if (formAction === '/onboarding/2') {
    // Baby's Name Input Page
    // Retrieve gender from the data attribute
    const gender = formEl.getAttribute('data-gender') || 'your baby';

    // Convert gender to lowercase for display
    const genderLower = gender.toLowerCase();

    typeText(questionEl, `What’s your ${genderLower}’s name?`, 0, () => {
      // After typing is complete, enable auto-submit for the form
      const inputEl = formEl.querySelector('textarea[name="babyName"]');
      if (inputEl) {
        enableAutoSubmitTextForm(formEl, inputEl);
      } else {
        console.error('Textarea input not found in the form.');
      }

      // Add 'show' class to trigger fade-in via CSS
      formEl.classList.add('show');

      // Focus is handled in enableAutoSubmitTextForm via transitionend
    });
  }
});