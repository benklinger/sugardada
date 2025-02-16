document.addEventListener('DOMContentLoaded', () => {
  const bodyEl = document.body;
  window.userId = bodyEl.dataset.userid || "";

  const lifeEventsScript = document.getElementById('lifeEventsJson');
  let parsed = [];
  if (lifeEventsScript) {
    const rawJson = lifeEventsScript.textContent.trim();
    try {
      parsed = JSON.parse(rawJson);
    } catch (err) {
      console.error("Failed to parse lifeEvents JSON:", err, rawJson);
    }
  }
  window.lifeEvents = parsed;

  const chartContainer = document.getElementById('chartContainer');
  if (chartContainer) {
    if (getComputedStyle(chartContainer).position === 'static') {
      chartContainer.style.position = 'relative';
    }
    
    const toast = document.createElement('div');
    const isMobile = window.innerWidth < 768;
    toast.textContent = isMobile ? "Hold & drag to see more details" : "Hover to see more details";
    toast.style.position = 'absolute';
    toast.style.top = '10px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = '#fff';
    toast.style.padding = '8px 12px';
    toast.style.borderRadius = '16px';
    toast.style.zIndex = '1000';
    toast.style.whiteSpace = 'nowrap';
    
    if (isMobile) {
      toast.style.minWidth = '250px';
    }
    
    chartContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
});

function animateElement(id, newVal) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = newVal;
}

function formatRoi(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return "N/A";
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function cardTapAnimate(cardEl) {
  cardEl.classList.add("tap-animate");
  setTimeout(() => cardEl.classList.remove("tap-animate"), 200);
}
