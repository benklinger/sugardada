document.addEventListener('DOMContentLoaded', () => {
  const heroTitle = document.getElementById("heroTitle");
  const varaContainer = document.getElementById('varaContainer');
  const heroCTA = document.getElementById("heroCTA");
  const headerCTA = document.getElementById("headerCTA");
  const caretakerCanvas = document.getElementById('caretCanvas');
  const caretakerContainer = document.getElementById('caretContainer');
  const untypeCount = 14;
  let rc = null;

  if (varaContainer) varaContainer.style.opacity = 0;
  if (caretakerContainer) caretakerContainer.style.opacity = 0;

  if (caretakerCanvas) {
    caretakerCanvas.width = caretakerCanvas.offsetWidth;
    caretakerCanvas.height = caretakerCanvas.offsetHeight;
    rc = rough.canvas(caretakerCanvas);
  }

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
  }, 2000);

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
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          headerCTA.classList.remove("show");
        } else {
          headerCTA.classList.add("show");
        }
      });
    }, { threshold: 0.01 });
    observer.observe(heroCTA);
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
    roughness: 2
  });
}