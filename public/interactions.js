// public/interactions.js

// A simple type effect function
function typeText(el, text, i = 0, callback) {
  if (!el) return;
  if (i < text.length) {
    el.textContent += text.charAt(i);
    setTimeout(() => typeText(el, text, i + 1, callback), 40);
  } else {
    if (callback) callback();
  }
}

// For text-based forms (e.g. name), submit on Enter
function enableAutoSubmitText(form) {
  const textarea = form.querySelector('textarea');
  if (!textarea) return;

  // Camelize input on each keystroke
  textarea.addEventListener('input', () => {
    const pos = textarea.selectionStart;
    textarea.value =
      textarea.value.charAt(0).toUpperCase() + textarea.value.slice(1).toLowerCase();
    textarea.setSelectionRange(pos, pos);
  });

  // Submit on Enter
  textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.submit();
    }
  });
}

// For radio-based forms (e.g. gender), submit on radio change
function enableAutoSubmitRadio(form) {
  const radios = form.querySelectorAll('input[type="radio"]');
  if (!radios.length) return;

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      form.submit();
    });
  });
}

// For DOB-based forms (Month/Day/Year selects), submit when all are chosen
function enableAutoSubmitDOB(form) {
  const monthSelect = form.querySelector('select[name="dobMonth"]');
  const daySelect   = form.querySelector('select[name="dobDay"]');
  const yearSelect  = form.querySelector('select[name="dobYear"]');
  if (!monthSelect || !daySelect || !yearSelect) return;

  function maybeSubmit() {
    if (monthSelect.value && daySelect.value && yearSelect.value) {
      form.submit();
    }
  }

  [monthSelect, daySelect, yearSelect].forEach(select => {
    select.addEventListener('change', maybeSubmit);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const questionEl = document.querySelector('.question');
  if (!questionEl) return; // if there's no .question, do nothing

  // Find all .form elements
  const allForms = document.querySelectorAll('.form');

  allForms.forEach(form => {
    // Prevent re-init if you revisit the page or partial reload
    if (form.dataset.typed === 'true') return;

    // Build the question text
    let questionText = form.dataset.question || '';

    // If we have data-gender but no data-question, build a dynamic question for name
    if (!questionText && form.dataset.gender) {
      const g = form.dataset.gender.toLowerCase();
      questionText = `What’s your ${g}’s name?`;
    }

    // If we have data-name but no data-question, handle the DOB question
    if (!questionText && form.dataset.name) {
      const childName = form.dataset.name;
      questionText = `When was ${childName} born?`;
    }

    // Start typing the question
    questionEl.textContent = ''; // clear existing
    typeText(questionEl, questionText, 0, () => {
      // Once done typing, fade in the form
      form.classList.add('show');

      // Focus the first field (radio or textarea or select)
      const firstField = form.querySelector('input, textarea, select');
      if (firstField) firstField.focus();

      // Attach auto-submit logic
      enableAutoSubmitRadio(form);
      enableAutoSubmitText(form);
      enableAutoSubmitDOB(form);

      // Mark as typed
      form.dataset.typed = 'true';
    });
  });
});