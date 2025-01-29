document.addEventListener('DOMContentLoaded', () => {
  const heroTitle = document.getElementById("heroTitle");
  const varaContainer = document.getElementById('varaContainer');
  const heroCTA = document.getElementById("heroCTA");
  const headerCTA = document.getElementById("headerCTA");
  const caretakerCanvas = document.getElementById('caretCanvas');
  const caretakerContainer = document.getElementById('caretContainer');
  const untypeCount = 14;
  let rc = null;

  // Table data
  const tableData = [
    { year: 2025, contr: 1000, interest: 40 },
    { year: 2026, contr: 2000, interest: 23 },
    { year: 2027, contr: 3000, interest: 110 },
    { year: 2028, contr: 4000, interest: 882 },
    { year: 2029, contr: 5000, interest: 217 },
    { year: 2030, contr: 6000, interest: 545 },
    { year: 2031, contr: 7000, interest: 2682 },
    { year: 2032, contr: 8000, interest: 6010 },
    { year: 2033, contr: 9000, interest: 5600 },
    { year: 2034, contr: 10000, interest: 10978 },
    { year: 2035, contr: 11000, interest: 19418 },
    { year: 2036, contr: 12000, interest: 18494 },
    { year: 2037, contr: 13000, interest: 34276 },
    { year: 2038, contr: 14000, interest: 58844 },
    { year: 2039, contr: 15000, interest: 89073 },
    { year: 2040, contr: 16000, interest: 60659 },
    { year: 2041, contr: 17000, interest: 93548 },
    { year: 2042, contr: 18000, interest: 119153 }
  ];

  // Section 2
  const section2El = document.querySelector('.section-2');
  if (section2El) {
    const yearEl = document.getElementById('yearEl');
    const contrEl = document.getElementById('contrEl');
    const interestEl = document.getElementById('interestEl');

    if (yearEl && contrEl && interestEl) {
		initNumberFlowLiteNoGrouping(yearEl, tableData[0].year);
      initNumberFlowLiteWithGrouping(contrEl, tableData[0].contr);
      initNumberFlowLiteWithGrouping(interestEl, tableData[0].interest);

      let hasStarted = false;
      let timer = null;

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!hasStarted && entry.isIntersecting) {
            timer = setTimeout(() => {
              hasStarted = true;
              startSection2Animation(yearEl, contrEl, interestEl, tableData);
            }, 1000);
          }
          if (!entry.isIntersecting) {
            clearTimeout(timer);
          }
        });
      }, {
        threshold: 0.3,
        rootMargin: '0px 0px -10% 0px'
      });
      observer.observe(section2El);
    }
  }

  // caretaker, vara, etc.
  if (varaContainer) varaContainer.style.opacity = 0;
  if (caretakerContainer) caretakerContainer.style.opacity = 0;
  if (caretakerCanvas) {
    caretakerCanvas.width = caretakerCanvas.offsetWidth;
    caretakerCanvas.height = caretakerCanvas.offsetHeight;
    rc = rough.canvas(caretakerCanvas);
  }

  // hero untyping
  setTimeout(() => {
    untypeWords(heroTitle, untypeCount);
    if (varaContainer) {
      varaContainer.style.opacity = 1;
      drawSecondWord();
    }
    setTimeout(() => {
      if (rc && caretakerContainer) {
        drawCaret(rc);
        caretakerContainer.style.opacity = 1;
      }
      typeText(heroTitle, " is today", 0, () => {
        if (heroCTA) heroCTA.classList.add("show");
      });
    }, 1000);
  }, 1000);

  // CTA events
  if (heroCTA) {
    heroCTA.addEventListener('click', () => {
      window.location.href = "/onboarding/1";
    });
  }
  if (headerCTA) {
    headerCTA.addEventListener('click', () => {
      window.location.href = "/onboarding/1";
    });
  }
  if (heroCTA && headerCTA) {
    const observer2 = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          headerCTA.classList.remove("show");
        } else {
          headerCTA.classList.add("show");
        }
      });
    }, { threshold: 0.01 });
    observer2.observe(heroCTA);
  }

  // theming
  window.updateHomeTheme = function() {
    if (rc && caretakerContainer) {
      caretakerCanvas.width = caretakerCanvas.offsetWidth;
      caretakerCanvas.height = caretakerCanvas.offsetHeight;
      rc.clear();
      drawCaret(rc);
    }
    if (varaContainer) {
      varaContainer.innerHTML = "";
      varaContainer.style.opacity = 1;
      drawSecondWord();
    }
  };
});

/* Once the observer triggers, we loop through tableData row by row. 
   year => no grouping, contr & interest => grouping. */
function startSection2Animation(yearEl, contrEl, interestEl, data) {
  let idx = 0;
  const interval = setInterval(() => {
    idx++;
    if (idx >= data.length) {
      clearInterval(interval);
      return;
    }
    const row = data[idx];
    animateNumberFlowValueNoGrouping(yearEl, row.year);
    animateNumberFlowValueWithGrouping(contrEl, row.contr);
    animateNumberFlowValueWithGrouping(interestEl, row.interest);
  }, 1000);
}

function initNumberFlowLiteNoGrouping(el, value) {
  if(!el) return;
  const nf = document.createElement('number-flow-lite');
  nf.data = formatToData(value, new Intl.NumberFormat('en-US', { useGrouping: false }));
  el.replaceChildren(nf);
}

function initNumberFlowLiteWithGrouping(el, value) {
  if(!el) return;
  const nf = document.createElement('number-flow-lite');
  nf.data = formatToData(value, new Intl.NumberFormat('en-US'));
  el.replaceChildren(nf);
}

function animateNumberFlowValueNoGrouping(el, newVal) {
  if(!el) return;
  const nf = el.querySelector('number-flow-lite');
  if(!nf){
    initNumberFlowLiteNoGrouping(el, newVal);
  } else {
    nf.data = formatToData(newVal, new Intl.NumberFormat('en-US', { useGrouping: false }));
  }
}

function animateNumberFlowValueWithGrouping(el, newVal) {
  if(!el) return;
  const nf = el.querySelector('number-flow-lite');
  if(!nf){
    initNumberFlowLiteWithGrouping(el, newVal);
  } else {
    nf.data = formatToData(newVal, new Intl.NumberFormat('en-US'));
  }
}

/* caretaker & second word stuff */
function untypeWords(el, count, callback) {
  if (!el) return;
  if (count <= 0) {
    if (callback) callback();
    return;
  }
  el.textContent = el.textContent.slice(0, -1);
  setTimeout(() => untypeWords(el, count - 1, callback), 40);
}

function typeText(el, text, i = 0, callback) {
  if (!el) return;
  if (i < text.length) {
    el.textContent += text.charAt(i);
    setTimeout(() => typeText(el, text, i + 1, callback), 40);
  } else {
    if (callback) callback();
  }
}

function drawSecondWord() {
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-color')
    .trim() || '#fff';
  new Vara("#varaContainer", "https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Satisfy/SatisfySL.json", [
    { text: "second", textAlign: "center" }
  ], {
    strokeWidth: 1.5,
    duration: 750,
    fontSize: 24,
    autoAnimation: true,
    color: textColor,
    strokeColor: textColor
  });
}

function drawCaret(rc) {
  const caretakerPath = "M7.5,21.5c0,0,35-6,39,8c0,0,3-19,57-23";
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-color')
    .trim() || '#fff';
  rc.path(caretakerPath, {
    stroke: textColor,
    strokeWidth: 2,
    roughness: 1
  });
}

function startSection2Animation(yearEl, contrEl, interestEl, data) {
  const barContr = document.getElementById('barContr');
  const barInterest = document.getElementById('barInterest');
  let idx = 0;
  const interval = setInterval(() => {
    idx++;
    if (idx >= data.length) {
      clearInterval(interval);
      return;
    }
    const row = data[idx];

    animateNumberFlowValueNoGrouping(yearEl, row.year);
    animateNumberFlowValueWithGrouping(contrEl, row.contr);
    animateNumberFlowValueWithGrouping(interestEl, row.interest);

    if (barContr && barInterest) {
      updateBars(barContr, barInterest, row.contr, row.interest);
    }
  }, 1000);
}

function updateBars(barContr, barInterest, contrVal, interestVal) {
  const c = contrVal < 0 ? 0 : contrVal;
  const i = interestVal < 0 ? 0 : interestVal;
  const total = c + i;
  // If total=0, both bars are 0
  if (total === 0) {
    barContr.style.width = '0';
    barInterest.style.width = '0';
    return;
  }
  const contrPerc = (c / total) * 100;
  const interestPerc = (i / total) * 100;

  barContr.style.width = contrPerc + '%';
  barInterest.style.width = interestPerc + '%';
}