document.addEventListener("DOMContentLoaded", () => {
  initializeNumberFlowLite();
  pageLoadAnimateAll();

  const investCard = document.getElementById("monthly-investment-card");
  if (investCard) {
    let clickTimer = null;
    const delay = 300;
    investCard.addEventListener("pointerup", e => {
      e.preventDefault();
      if (clickTimer === null) {
        clickTimer = setTimeout(() => {
          singleClickInvest();
          clickTimer = null;
        }, delay);
      } else {
        clearTimeout(clickTimer);
        clickTimer = null;
        doubleClickInvest();
      }
    });
    async function singleClickInvest(){
      cardTapAnimate(investCard);
      try {
        investCard.style.pointerEvents = "none";
        investCard.classList.add("disabled");
        const r = await fetch(`/api/update-monthly-investment/${window.userId}`, {
          method:"POST",
          headers: { "Content-Type":"application/json" }
        });
        const j = await r.json();
        if (r.ok && !j.error){
          updateMonthlyUI(j);
        } else {
          alert("Failed to update monthly investment!");
        }
      } catch (err){
        alert("Something went wrong!");
        console.error(err);
      } finally {
        investCard.style.pointerEvents = "auto";
        investCard.classList.remove("disabled");
      }
    }
    async function doubleClickInvest(){
      cardTapAnimate(investCard);
      try {
        investCard.style.pointerEvents = "none";
        investCard.classList.add("disabled");
        const r = await fetch(`/api/update-monthly-investment/${window.userId}`, {
          method:"POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({ action: "decrement" })
        });
        const j = await r.json();
        if (r.ok && !j.error){
          updateMonthlyUI(j);
        } else {
          alert("Failed to update monthly investment!");
        }
      } catch (err){
        alert("Something went wrong!");
        console.error(err);
      } finally {
        investCard.style.pointerEvents = "auto";
        investCard.classList.remove("disabled");
      }
    }
    function updateMonthlyUI(j){
      const monthlyValEl = document.getElementById("monthly-investment-value");
      if (monthlyValEl && j.monthlyInvestment != null) {
        animateNumberFlowValue(monthlyValEl, j.monthlyInvestment);
      }
      const roiMultipleEl = document.getElementById("roi-multiple");
      if (roiMultipleEl && j.roiPct != null) {
        animateNumberFlowValue(roiMultipleEl, parseFloat(j.roiPct) || 0);
      }
      const estValueEl = document.getElementById("est-value");
      if (estValueEl && j.investmentRecords && j.investmentRecords.length > 0) {
        const last = j.investmentRecords[j.investmentRecords.length - 1];
        animateNumberFlowValue(estValueEl, last.totalValue);
      }
      if (window.updateLightweightChart){
        updateLightweightChart();
      }
    }
  }

  const riskCard = document.getElementById("risk-card");
  if(riskCard){
    riskCard.addEventListener("pointerup", e => {
      e.preventDefault();
      cardTapAnimate(riskCard);
      updateRisk();
    });
  }
  async function updateRisk(){
    try {
      riskCard.style.pointerEvents = "none";
      riskCard.classList.add("disabled");
      const r = await fetch(`/api/update-risk/${window.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await r.json();
      if(r.ok && !data.error){
        updateRiskUI(data);
      } else {
        alert("Failed to update risk!");
      }
    } catch(err){
      alert("Something went wrong updating risk!");
      console.error(err);
    } finally {
      riskCard.style.pointerEvents = "auto";
      riskCard.classList.remove("disabled");
    }
  }
  function updateRiskUI(data) {
    const riskLevelEl = document.getElementById("risk-level");
    if(riskLevelEl) {
      riskLevelEl.textContent = data.riskLevel;
    }
    const tickerEl = document.getElementById("ticker");
    if(tickerEl && data.investmentTicker != null) {
      animateText(tickerEl, data.investmentTicker.toUpperCase());
    }
    const monthlyValEl= document.getElementById("monthly-investment-value");
    if(monthlyValEl && data.monthlyInvestment != null){
      animateNumberFlowValue(monthlyValEl, data.monthlyInvestment);
    }
    const estValueEl  = document.getElementById("est-value");
    if(estValueEl && data.estValue != null){
      animateNumberFlowValue(estValueEl, data.estValue);
    }
    const roiMultipleEl = document.getElementById("roi-multiple");
    if (roiMultipleEl && data.roiPct != null) {
      animateNumberFlowValue(roiMultipleEl, parseFloat(data.roiPct) || 0);
    }
    if (window.updateLightweightChart){
      updateLightweightChart();
    }
  }

  function initializeNumberFlowLite() {
    const monthlyValEl = document.getElementById("monthly-investment-value");
    if (monthlyValEl) {
      const initialVal = parseFloat(monthlyValEl.textContent.replace(/[^\d.-]/g, '')) || 0;
      const isEstValue = (monthlyValEl.id === "est-value");
      initNumberFlowLiteOn(monthlyValEl, initialVal, false, isEstValue);
    }
    const roiMultipleEl = document.getElementById("roi-multiple");
    if (roiMultipleEl) {
      const roiVal = parseFloat(roiMultipleEl.textContent.replace(/[^\d.-]/g, '')) || 0;
      initNumberFlowLiteOn(roiMultipleEl, roiVal);
    }
    const estValueEl = document.getElementById("est-value");
    if (estValueEl) {
      const val = parseFloat(estValueEl.textContent.replace(/[^\d.-]/g, '')) || 0;
      initNumberFlowLiteOn(estValueEl, val, false, true);
    }
  }
});

function cardTapAnimate(cardEl){
  cardEl.classList.add("tap-animate");
  setTimeout(() => cardEl.classList.remove("tap-animate"), 200);
}
function initNumberFlowLiteOn(el, value, isText = false, noDecimals = false){
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
    'monthly-investment-value': { type: 'number', initial: 999,    final: 123456 },
    'est-value':               { type: 'number', initial: 999999, final: 800000 },
    'roi-multiple':            { type: 'number', initial: 999,    final: 525 },
    'ticker':                  { type: 'text',   initial: 'ACME',  final: 'SPY' }
  };
  Object.entries(placeholders).forEach(([id, config]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (config.type === 'number') {
      const finalStr = (el.dataset.final || "").replace(/,/g, "");
      const finalVal = parseFloat(finalStr) || config.final;
      const initialStr = el.textContent.replace(/[^\d.-]/g, "");
      const initialVal = parseFloat(initialStr) || config.initial;
      el.textContent = "";
      initNumberFlowLiteOn(el, initialVal);
      requestAnimationFrame(() => {
        animateNumberFlowValue(el, finalVal);
      });
    } else if (config.type === 'text') {
      const finalText = el.dataset.final?.trim() || config.final;
      const initialText = el.textContent.trim() || config.initial;
      el.textContent = "";
      initNumberFlowLiteOn(el, initialText, true);
      requestAnimationFrame(() => {
        animateText(el, finalText);
      });
    }
  });
}