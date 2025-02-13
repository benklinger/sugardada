document.addEventListener('DOMContentLoaded', () => {
  const heroTitle         = document.getElementById("heroTitle");
  const varaContainer     = document.getElementById("varaContainer");
  const heroCTA           = document.getElementById("heroCTA");
  const headerCTA         = document.getElementById("headerCTA");
  const sectionCTA        = document.getElementById("sectionCTA");
  const caretakerCanvas   = document.getElementById("caretCanvas");
  const caretakerContainer = document.getElementById("caretContainer");
  const untypeCount       = 14;
  let rc                  = null;

  const tableData = [
    { year: 2025, contr: 1000,  interest: 40 },
    { year: 2026, contr: 2000,  interest: 23 },
    { year: 2027, contr: 3000,  interest: 110 },
    { year: 2028, contr: 4000,  interest: 882 },
    { year: 2029, contr: 5000,  interest: 217 },
    { year: 2030, contr: 6000,  interest: 545 },
    { year: 2031, contr: 7000,  interest: 2682 },
    { year: 2032, contr: 8000,  interest: 6010 },
    { year: 2033, contr: 9000,  interest: 5600 },
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

  const section2El = document.querySelector(".section-2.compound-interest");
  if (section2El) {
    const yearEl      = document.getElementById("yearEl");
    const contrEl     = document.getElementById("contrEl");
    const interestEl  = document.getElementById("interestEl");
    const barContr    = document.getElementById("barContr");
    const barInterest = document.getElementById("barInterest");

    if (yearEl && contrEl && interestEl && barContr && barInterest) {
      initNumberFlowYear(yearEl, tableData[0].year);
      initNumberFlowMoney(contrEl, tableData[0].contr);
      initNumberFlowMoney(interestEl, tableData[0].interest);
      updateCompoundBar(tableData[0].year, tableData[0].contr, tableData[0].interest);

      let started = false;
      let timer   = null;
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!started && entry.isIntersecting) {
            timer = setTimeout(() => {
              started = true;
              animateTableRows();
            }, 100);
          }
          if (!entry.isIntersecting) {
            clearTimeout(timer);
          }
        });
      }, { threshold: 0.7 });
      observer.observe(section2El);

      function animateTableRows() {
        let idx = 0;
        const interval = setInterval(() => {
          idx++;
          if (idx >= tableData.length) {
            clearInterval(interval);
            return;
          }
          const row = tableData[idx];
          animateNumberFlowYear(yearEl, row.year);
          animateNumberFlowMoney(contrEl, row.contr);
          animateNumberFlowMoney(interestEl, row.interest);
          updateCompoundBar(row.year, row.contr, row.interest);
        }, 1000);
      }
    }
  }

  if (varaContainer) varaContainer.style.opacity = 0;
  if (caretakerContainer) caretakerContainer.style.opacity = 0;
  if (caretakerCanvas) {
    caretakerCanvas.width = caretakerCanvas.offsetWidth;
    caretakerCanvas.height = caretakerCanvas.offsetHeight;
    rc = rough.canvas(caretakerCanvas);
  }

  // Update: target the span with class "line-break" so that it persists.
  setTimeout(() => {
    // Look for the span inside heroTitle
    let lineBreakSpan = heroTitle.querySelector('.line-break');
    if (lineBreakSpan) {
      // Remove the span's text content via untyping
      untypeWords(lineBreakSpan, lineBreakSpan.textContent.length, () => {
        if (varaContainer) {
          varaContainer.style.opacity = 1;
          drawSecondWord();
        }
        setTimeout(() => {
          if (rc && caretakerContainer) {
            drawCaret(rc);
            caretakerContainer.style.opacity = 1;
          }
          // Type into the span so it stays wrapped for styling
          typeText(lineBreakSpan, " is today", 0, () => {
            if (heroCTA) heroCTA.classList.add("show");
          });
        }, 2000);
      });
    } else {
      // If the span doesn't exist, create it.
      lineBreakSpan = document.createElement('span');
      lineBreakSpan.classList.add('line-break');
      heroTitle.appendChild(lineBreakSpan);
      if (varaContainer) {
        varaContainer.style.opacity = 1;
        drawSecondWord();
      }
      setTimeout(() => {
        if (rc && caretakerContainer) {
          drawCaret(rc);
          caretakerContainer.style.opacity = 1;
        }
        typeText(lineBreakSpan, " is today", 0, () => {
          if (heroCTA) heroCTA.classList.add("show");
        });
      }, 2000);
    }
  }, 2000);

  if (heroCTA) {
    const navigateToOnboarding = (event) => {
      event.preventDefault();
      window.location.href = "/onboarding/1";
    };
    heroCTA.addEventListener("click", navigateToOnboarding);
    heroCTA.addEventListener("touchstart", navigateToOnboarding);
  }
  if (headerCTA) {
    const navigateToOnboarding = (event) => {
      event.preventDefault();
      window.location.href = "/onboarding/1";
    };
    headerCTA.addEventListener("click", navigateToOnboarding);
    headerCTA.addEventListener("touchstart", navigateToOnboarding);
  }
  if (sectionCTA) {
    const navigateToOnboarding = (event) => {
      event.preventDefault();
      window.location.href = "/onboarding/1";
    };
    sectionCTA.addEventListener("click", navigateToOnboarding);
    sectionCTA.addEventListener("touchstart", navigateToOnboarding);
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

function updateCompoundBar(year, contributions, interest) {
  const barContr    = document.getElementById("barContr");
  const barInterest = document.getElementById("barInterest");
  let c = Math.max(0, contributions);
  let i = Math.max(0, interest);
  let total = c + i;
  if (total <= 0) {
    barContr.style.width = "0%";
    barInterest.style.width = "0%";
    return;
  }
  let contrPerc = (c / total) * 100;
  let interestPerc = (i / total) * 100;
  barContr.style.width    = contrPerc + "%";
  barInterest.style.width = interestPerc + "%";
  barInterest.style.right = "0";
  barInterest.style.left  = "auto";
}

function initNumberFlowYear(el, yearVal) {
  if(!el) return;
  const nf = document.createElement("number-flow-lite");
  nf.data = formatToData(yearVal, new Intl.NumberFormat("en-US", {
    useGrouping: false, 
    maximumFractionDigits: 0
  }));
  el.replaceChildren(nf);
}

function initNumberFlowMoney(el, val) {
  if(!el) return;
  const nf = document.createElement("number-flow-lite");
  nf.data = formatToData(val, new Intl.NumberFormat("en-US", {
    useGrouping: true, 
    maximumFractionDigits: 0
  }));
  el.replaceChildren(nf);
}

function animateNumberFlowYear(el, yearVal) {
  if(!el) return;
  const nf = el.querySelector("number-flow-lite");
  if(!nf) {
    initNumberFlowYear(el, yearVal);
  } else {
    nf.data = formatToData(yearVal, new Intl.NumberFormat("en-US", {
      useGrouping: false,
      maximumFractionDigits: 0
    }));
  }
}

function animateNumberFlowMoney(el, val) {
  if(!el) return;
  const nf = el.querySelector("number-flow-lite");
  if(!nf) {
    initNumberFlowMoney(el, val);
  } else {
    nf.data = formatToData(val, new Intl.NumberFormat("en-US", {
      useGrouping: true,
      maximumFractionDigits: 0
    }));
  }
}

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
    .getPropertyValue("--text-color")
    .trim() || "#fff";
  new Vara("#varaContainer", "https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Satisfy/SatisfySL.json", [
    { text: "second", textAlign: "center" }
  ], {
    strokeWidth: 1.5,
    duration: 1500,
    fontSize: 24,
    autoAnimation: true,
    color: textColor,
    strokeColor: textColor
  });
}

function drawCaret(rc) {
  const caretakerPath = "M7.5,21.5c0,0,35-6,39,8c0,0,3-19,57-23";
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--text-color")
    .trim() || "#fff";
  rc.path(caretakerPath, {
    stroke: textColor,
    strokeWidth: 2,
    roughness: 1
  });
}