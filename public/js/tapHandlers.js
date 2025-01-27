document.addEventListener("DOMContentLoaded", () => {
  initializeNumberFlowLite();
  pageLoadAnimateAll();

  setupCard({
    cardId: "monthly-investment-card",
    isDoubleTap: true,
    fetchUrl: () => `/api/update-monthly-investment/${window.userId}`,
    fetchBody: dbl => dbl ? { action: "decrement" } : null,
    onSuccess: updatePlanUI
  });

  setupCard({
    cardId: "risk-card",
    isDoubleTap: false,
    fetchUrl: () => `/api/update-risk/${window.userId}`,
    fetchBody: () => null,
    onSuccess: updatePlanUI
  });

  setupCard({
    cardId: "est-value-card",
    isDoubleTap: false,
    fetchUrl: () => `/api/update-target-age/${window.userId}`,
    fetchBody: () => null,
    onSuccess: updatePlanUI
  });
});

function setupCard({ cardId, isDoubleTap, fetchUrl, fetchBody, onSuccess }) {
  const card = document.getElementById(cardId);
  if (!card) return;
  if (isDoubleTap) {
    let clickTimer = null;
    const delay = 300;
    card.addEventListener("pointerup", e => {
      e.preventDefault();
      if (clickTimer === null) {
        clickTimer = setTimeout(() => {
          singleTap(card);
          clickTimer = null;
        }, delay);
      } else {
        clearTimeout(clickTimer);
        clickTimer = null;
        doubleTap(card);
      }
    });
  } else {
    card.addEventListener("pointerup", e => {
      e.preventDefault();
      singleTap(card);
    });
  }
  async function singleTap(el) {
    cardTapAnimate(el);
    await doCardAction(el, false);
  }
  async function doubleTap(el) {
    cardTapAnimate(el);
    await doCardAction(el, true);
  }
  async function doCardAction(el, dbl) {
    try {
      el.style.pointerEvents = "none";
      el.classList.add("disabled");
      const url = fetchUrl(dbl);
      const bodyObj = fetchBody(dbl);
      const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
      if (bodyObj) opts.body = JSON.stringify(bodyObj);
      const res = await fetch(url, opts);
      const data = await res.json();
      if (res.ok && !data.error) {
        onSuccess(data);
      } else {
        alert(`Failed to update "${cardId}"`);
      }
    } catch (err) {
      alert(`Error updating "${cardId}"`);
      console.error(err);
    } finally {
      el.style.pointerEvents = "auto";
      el.classList.remove("disabled");
    }
  }
}

function updatePlanUI(data) {
  if (data.targetAge != null) {
    const yearsEl = document.getElementById("est-years");
    if (yearsEl) animateNumberFlowValue(yearsEl, data.targetAge);
  }
  if (data.riskLevel != null) {
    const riskLevelEl = document.getElementById("risk-level");
    if (riskLevelEl) riskLevelEl.textContent = data.riskLevel;
  }
  if (data.investmentTicker != null) {
    const tickerEl = document.getElementById("ticker");
    if (tickerEl) animateText(tickerEl, data.investmentTicker.toUpperCase());
  }
  if (data.monthlyInvestment != null) {
    const monthlyValEl = document.getElementById("monthly-investment-value");
    if (monthlyValEl) animateNumberFlowValue(monthlyValEl, data.monthlyInvestment);
  }
  if (data.roiPct != null) {
    const roiMultipleEl = document.getElementById("roi-multiple");
    if (roiMultipleEl) animateNumberFlowValue(roiMultipleEl, parseFloat(data.roiPct) || 0);
  }
  if (data.estValue != null) {
    const estValueEl = document.getElementById("est-value");
    if (estValueEl) animateNumberFlowValue(estValueEl, data.estValue);
  }
  if (window.updateLightweightChart) {
    updateLightweightChart();
  }
}

function cardTapAnimate(cardEl){
  cardEl.classList.add("tap-animate");
  setTimeout(() => cardEl.classList.remove("tap-animate"), 200);
}

function initializeNumberFlowLite() {
  const monthlyValEl = document.getElementById("monthly-investment-value");
  if (monthlyValEl) {
    const val = parseFloat(monthlyValEl.textContent.replace(/[^\d.-]/g, '')) || 0;
    initNumberFlowLiteOn(monthlyValEl, val, false, monthlyValEl.id === "est-value");
  }
  const roiMultipleEl = document.getElementById("roi-multiple");
  if (roiMultipleEl) {
    const val = parseFloat(roiMultipleEl.textContent.replace(/[^\d.-]/g, '')) || 0;
    initNumberFlowLiteOn(roiMultipleEl, val);
  }
  const estValueEl = document.getElementById("est-value");
  if (estValueEl) {
    const val = parseFloat(estValueEl.textContent.replace(/[^\d.-]/g, '')) || 0;
    initNumberFlowLiteOn(estValueEl, val, false, true);
  }
  const estYearsEl = document.getElementById("est-years");
  if (estYearsEl) {
    const val = parseFloat(estYearsEl.textContent.replace(/[^\d.-]/g, '')) || 0;
    initNumberFlowLiteOn(estYearsEl, val);
  }
}

function initNumberFlowLiteOn(el, value, isText = false, noDecimals = false) {
  if(!el) return;
  const nf = document.createElement('number-flow-lite');
  if(isText){
    nf.data = formatTextToData(value);
  } else if(noDecimals){
    nf.data = formatToData(value, new Intl.NumberFormat('en-US',{ maximumFractionDigits: 0 }));
  } else {
    nf.data = formatToData(value, new Intl.NumberFormat('en-US'));
  }
  el.replaceChildren(nf);
}

function animateNumberFlowValue(el, newVal){
  if(!el) return;
  const nf = el.querySelector('number-flow-lite');
  const isEstValue = (el.id === "est-value");
  if(!nf){
    initNumberFlowLiteOn(el, newVal, false, isEstValue);
  } else {
    nf.data = isEstValue
      ? formatToData(newVal, new Intl.NumberFormat('en-US',{ maximumFractionDigits: 0 }))
      : formatToData(newVal, new Intl.NumberFormat('en-US'));
  }
}

function animateText(el, newVal){
  if(!el) return;
  const nf = el.querySelector('number-flow-lite');
  if(!nf){
    initNumberFlowLiteOn(el, newVal, true);
  } else {
    nf.data = formatTextToData(newVal);
  }
}

function pageLoadAnimateAll() {
  const placeholders = {
    'monthly-investment-value': { type: 'number', initial: 999, final: 123456 },
    'est-value':               { type: 'number', initial: 999999, final: 800000 },
    'roi-multiple':            { type: 'number', initial: 999,    final: 525 },
    'ticker':                  { type: 'text',   initial: 'ACME', final: 'SPY' },
    'est-years':               { type: 'number', initial: 17,     final: 18 }
  };
  Object.entries(placeholders).forEach(([id, cfg]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (cfg.type === 'number') {
      const finalVal = parseFloat((el.dataset.final||"").replace(/,/g,'')) || cfg.final;
      const initVal = parseFloat(el.textContent.replace(/[^\d.-]/g,'')) || cfg.initial;
      el.textContent = "";
      initNumberFlowLiteOn(el, initVal);
      requestAnimationFrame(() => {
        animateNumberFlowValue(el, finalVal);
      });
    } else {
      const finalTxt = (el.dataset.final||"").trim() || cfg.final;
      const initTxt = el.textContent.trim() || cfg.initial;
      el.textContent = "";
      initNumberFlowLiteOn(el, initTxt, true);
      requestAnimationFrame(() => {
        animateText(el, finalTxt);
      });
    }
  });
}