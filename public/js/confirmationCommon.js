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