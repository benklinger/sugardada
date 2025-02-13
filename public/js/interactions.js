function typeText(el, text, i = 0, callback) {
  if (i < text.length) {
    el.textContent += text.charAt(i);
    setTimeout(() => typeText(el, text, i + 1, callback), 40);
  } else {
    if (callback) callback();
  }
}

function setCursorToEnd(el) {
  const len = el.value.length;
  el.focus();
  el.setSelectionRange(len, len);
}

function enableAutoSubmitRadio(form) {
  const radios = form.querySelectorAll('input[type="radio"]');
  if (!radios.length) return;
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      form.submit();
    });
  });
}

function enableAutoSubmitDOB(form) {
  const monthSelect = form.querySelector('select[name="dobMonth"]');
  const daySelect   = form.querySelector('select[name="dobDay"]');
  const yearSelect  = form.querySelector('select[name="dobYear"]');
  if(!monthSelect||!daySelect||!yearSelect) return;

  function maybeSubmit(){
    if (monthSelect.value && daySelect.value && yearSelect.value) {
      form.submit();
    }
  }
  [monthSelect,daySelect,yearSelect].forEach(sel=>{
    sel.addEventListener('change', maybeSubmit);
  });
}

function enableAutoSubmitText(form) {
  const textarea = form.querySelector('textarea');
  if (!textarea) return;

  const questionText = (form.dataset.question || '').toLowerCase();

  if(questionText.includes('invest monthly')){
    textarea.addEventListener('input', () => {
      let val = textarea.value.replace(/^\$\s*/, '').replace(/,/g, '');
      if(!val){
        textarea.value = '$ ';
        return;
      }
      val = val.replace(/[^\d]/g, '');
      let num = parseInt(val, 10);
      if(isNaN(num)) num='';
      let formatted = num ? num.toLocaleString('en-US') : '';
      textarea.value = '$ ' + formatted;
    });
  }
  else if(questionText.includes('email')){
    textarea.addEventListener('input', () => {
      const pos = textarea.selectionStart;
      textarea.value = textarea.value.toLowerCase();
      textarea.setSelectionRange(pos, pos);
    });
  }
  else {
    textarea.addEventListener('input', () => {
      const pos = textarea.selectionStart;
      if (textarea.value.length) {
        textarea.value =
          textarea.value.charAt(0).toUpperCase() + textarea.value.slice(1).toLowerCase();
        textarea.setSelectionRange(pos, pos);
      }
    });
  }

  textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.submit();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const questionEl = document.querySelector('.question');
  if(!questionEl) return;

  const forms = document.querySelectorAll('.form');
  forms.forEach(form => {
	  if (form.dataset.typed === 'true') return;

    let questionText = form.dataset.question || '';

    if(!questionText && form.dataset.gender){
      const g = form.dataset.gender.toLowerCase();
      questionText = `What’s your ${g}’s name?`;
    } else if(!questionText && form.dataset.name){
      const n = form.dataset.name;
      questionText = `When was ${n} born?`;
    }

    questionEl.textContent = '';
    typeText(questionEl, questionText, 0, () => {
		form.classList.add('show');

      setTimeout(() => {
		  const firstField = form.querySelector('input, textarea, select');
        if (firstField) {
          firstField.focus();
          if(questionText.toLowerCase().includes('invest monthly')){
            if(firstField.value.startsWith('$ ')){
              setCursorToEnd(firstField);
            }
          }
        }
      }, 0);

      if(questionText.toLowerCase().includes('invest monthly')){
        enableAutoSubmitText(form);
      }
      else if(questionText.toLowerCase().includes('risk')||questionText.toLowerCase().includes('interactive brokers')){
        enableAutoSubmitRadio(form);
      }
      else {
		  enableAutoSubmitRadio(form);
        enableAutoSubmitText(form);
        enableAutoSubmitDOB(form);
      }

      form.dataset.typed='true';
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.querySelector("textarea[name='monthlyInvestment']");
  const submitButton = document.querySelector(".submit-button");

  if (textarea && submitButton) {
    textarea.addEventListener("input", function () {
      if (/\d/.test(this.value)) {
        submitButton.classList.add("active");
      } else {
        submitButton.classList.remove("active");
      }
    });
  }
});
