document.addEventListener("DOMContentLoaded", () => {
  initializeNumberFlowLite();

  const investCard = document.getElementById("monthly-investment-card");
  if (investCard) {
    let clickTimer = null;
    const delay = 300;
    const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    if (isTouch) {
      investCard.addEventListener("touchend", handleTap);
    } else {
      investCard.addEventListener("click", handleTap);
    }

    function handleTap(e) {
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
    }

    async function singleClickInvest(){
      cardTapAnimate(investCard);
      try {
        investCard.style.pointerEvents = "none";
        investCard.classList.add("disabled");
        const r = await fetch("/api/update-monthly-investment", {
          method:"POST",
          headers: { "Content-Type":"application/json" }
        });
        const j = await r.json();
        if (r.ok && !j.error){
          const monthlyValEl = document.getElementById("monthly-investment-value");
          const roiMultipleEl = document.getElementById("roi-multiple");
          const roiHintEl = document.getElementById("roi-hint");
          const estValueEl = document.getElementById("est-value");

          if (monthlyValEl) animateNumberFlowValue(monthlyValEl, j.monthlyInvestment);
          if (j.roiMultiple && roiMultipleEl) animateNumberFlowValue(roiMultipleEl, j.roiMultiple);
          if (typeof j.totalProfit === "number" && roiHintEl){
            animateNumberFlowValue(roiHintEl, j.totalProfit);
          }
          if (j.investmentRecords && j.investmentRecords.length > 0 && estValueEl){
            const last = j.investmentRecords[j.investmentRecords.length - 1];
            animateNumberFlowValue(estValueEl, last.totalValue);
          }

          if (window.updateLightweightChart){
            updateLightweightChart();
          }
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
        const r = await fetch("/api/update-monthly-investment", {
          method:"POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({ action: "decrement" })
        });
        const j = await r.json();
        if (r.ok && !j.error){
          const monthlyValEl = document.getElementById("monthly-investment-value");
          const roiMultipleEl = document.getElementById("roi-multiple");
          const roiHintEl = document.getElementById("roi-hint");
          const estValueEl = document.getElementById("est-value");

          if (monthlyValEl) animateNumberFlowValue(monthlyValEl, j.monthlyInvestment);
          if (j.roiMultiple && roiMultipleEl) animateNumberFlowValue(roiMultipleEl, j.roiMultiple);
          if (typeof j.totalProfit === "number" && roiHintEl){
            animateNumberFlowValue(roiHintEl, j.totalProfit);
          }
          if (j.investmentRecords && j.investmentRecords.length > 0 && estValueEl){
            const last = j.investmentRecords[j.investmentRecords.length - 1];
            animateNumberFlowValue(estValueEl, last.totalValue);
          }

          if (window.updateLightweightChart){
            updateLightweightChart();
          }
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
  }

  const riskCard = document.getElementById("risk-card");
  if(riskCard){
    const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if(isTouch){
      riskCard.addEventListener("touchend", e => {
        e.preventDefault();
        cardTapAnimate(riskCard);
        updateRisk();
      });
    } else {
      riskCard.addEventListener("click", () => {
        cardTapAnimate(riskCard);
        updateRisk();
      });
    }
  }

  async function updateRisk(){
    try {
      riskCard.style.pointerEvents = "none";
      riskCard.classList.add("disabled");
      const r = await fetch("/api/update-risk",{ method:"POST" });
      const data = await r.json();
      if(r.ok && !data.error){
        // risk-level is updated with NO animation
        const riskLevelEl = document.getElementById("risk-level");
        if(riskLevelEl) {
          riskLevelEl.textContent = data.riskLevel;
        }

        // Ticker is still animated text
        const tickerEl    = document.getElementById("ticker");
        if(tickerEl) animateText(tickerEl, data.investmentTicker.toUpperCase());

        // The rest are animated numbers, if present
        const monthlyValEl= document.getElementById("monthly-investment-value");
        const estValueEl  = document.getElementById("est-value");
        const roiMultipleEl = document.getElementById("roi-multiple");
        const roiHintEl   = document.getElementById("roi-hint");

        if(monthlyValEl && data.monthlyInvestment != null){
          animateNumberFlowValue(monthlyValEl, data.monthlyInvestment);
        }
        if(estValueEl && data.estValue != null){
          animateNumberFlowValue(estValueEl, data.estValue);
        }
        if(roiMultipleEl && data.roiMultiple){
          animateNumberFlowValue(roiMultipleEl, data.roiMultiple);
        }
        if(roiHintEl && data.totalProfit != null){
          animateNumberFlowValue(roiHintEl, data.totalProfit);
        }

        if (window.updateLightweightChart){
          updateLightweightChart();
        }
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

  function initializeNumberFlowLite(){
    const monthlyValEl = document.getElementById("monthly-investment-value");
    if (monthlyValEl){
      const currentVal = parseFloat(monthlyValEl.textContent.replace(/[^\d.-]/g, '')) || 0;
      initNumberFlowLiteOn(monthlyValEl, currentVal);
    }
  }
});

/****************************
 * Helper functions
 ****************************/
function cardTapAnimate(cardEl){
  cardEl.classList.add("tap-animate");
  setTimeout(() => cardEl.classList.remove("tap-animate"), 200);
}

function formatRoi(val){
  const num = parseFloat(val);
  if(isNaN(num)) return "N/A";
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

/** Creates or updates <number-flow-lite> with numeric or text data. */
function initNumberFlowLiteOn(el, value, isText = false){
  if(!el) return;
  const nf = document.createElement('number-flow-lite');
  if(isText){
    nf.data = formatTextToData(value);
  } else {
    nf.data = formatToData(value, new Intl.NumberFormat('en-US'));
  }
  el.replaceChildren(nf);
}

function animateNumberFlowValue(el, newVal){
  if(!el) return;
  const nf = el.querySelector('number-flow-lite');
  if(!nf){
    initNumberFlowLiteOn(el, newVal);
  } else {
    nf.data = formatToData(newVal, new Intl.NumberFormat('en-US'));
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