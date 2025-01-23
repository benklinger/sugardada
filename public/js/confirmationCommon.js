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