// public/interactions.js

// A simple type effect function
function typeText(el, text, i = 0, callback) {
  if (i < text.length) {
    el.textContent += text.charAt(i);
    setTimeout(() => typeText(el, text, i + 1, callback), 40);
  } else {
    if (callback) callback();
  }
}

// For radio-based forms (like gender)
function enableAutoSubmitRadio(form) {
  const radios = form.querySelectorAll('input[type="radio"]');
  if (!radios.length) return;

  radios.forEach(radio => {
    radio.addEventListener('change', () => form.submit());
  });
}

// For DOB forms or other select-based forms
function enableAutoSubmitDOB(form) {
  const month = form.querySelector('select[name="dobMonth"]');
  const day   = form.querySelector('select[name="dobDay"]');
  const year  = form.querySelector('select[name="dobYear"]');
  if (!month || !day || !year) return;

  function maybeSubmit() {
    if (month.value && day.value && year.value) {
      form.submit();
    }
  }

  [month, day, year].forEach(sel => sel.addEventListener('change', maybeSubmit));
}

// A minimal approach for monthly or name forms
function enableAutoSubmitText(form) {
  const textarea = form.querySelector('textarea');
  if (!textarea) return;

  // Check if it's the monthly form
  const questionText = form.dataset.question || '';
  const isMonthly = questionText.toLowerCase().includes('invest monthly');

  if (isMonthly) {
    // On input, format the monthly value with $ prefix, thousand separators
    textarea.addEventListener('input', () => {
      let val = textarea.value.replace(/^\$\s*/, '').replace(/,/g, '');
      if (!val) {
        textarea.value = '$ ';
        return;
      }
      val = val.replace(/[^\d]/g, '');
      let num = parseInt(val, 10);
      if (isNaN(num)) {
        num = '';
      }
      let formatted = num ? num.toLocaleString('en-US') : '';
      textarea.value = '$ ' + formatted;
    });
  } else {
    // For other text forms (e.g., Name), do a simple camel-case approach
    textarea.addEventListener('input', () => {
      const pos = textarea.selectionStart;
      if (textarea.value.length) {
        textarea.value =
          textarea.value.charAt(0).toUpperCase() + textarea.value.slice(1).toLowerCase();
        textarea.setSelectionRange(pos, pos);
      }
    });
  }

  // Submit on Enter
  textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.submit();
    }
  });
}

// Helper to move cursor at the end of the field
function setCursorToEnd(el) {
  const len = el.value.length;
  el.focus();
  el.setSelectionRange(len, len);
}

document.addEventListener('DOMContentLoaded', () => {
  const questionEl = document.querySelector('.question');
  if (!questionEl) return;

  const forms = document.querySelectorAll('.form');
  forms.forEach(form => {
    if (form.dataset.typed === 'true') return;

    // Build question from data-question or data-gender/name
    let questionText = form.dataset.question || '';
    if (!questionText && form.dataset.gender) {
      const g = form.dataset.gender.toLowerCase();
      questionText = `What’s your ${g}’s name?`;
    } else if (!questionText && form.dataset.name) {
      const n = form.dataset.name;
      questionText = `When was ${n} born?`;
    }

    // Type the question
    questionEl.textContent = '';
    typeText(questionEl, questionText, 0, () => {
      // Once done typing, show the form
      form.classList.add('show');

      // A short delay ensures the form is fully visible before we move the cursor
      setTimeout(() => {
        // Focus the first field
        const firstField = form.querySelector('input, textarea, select');
        if (firstField) {
          firstField.focus();

          // If it's the monthly form, place the cursor at the end if it starts with "$ "
          if (questionText.toLowerCase().includes('invest monthly')) {
            if (firstField.value.startsWith('$ ')) {
              setCursorToEnd(firstField);
            }
          }
        }
      }, 0);

      // Attach auto-submits
      enableAutoSubmitRadio(form);
      enableAutoSubmitText(form);
      enableAutoSubmitDOB(form);

      // Mark typed
      form.dataset.typed = 'true';
    });
  });
});