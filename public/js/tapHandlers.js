document.addEventListener("DOMContentLoaded", () => {
  const investCard = document.getElementById("monthly-investment-card");
  if (investCard) {
    let clickTimer = null;
    let delay = 300;
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

    async function singleClickInvest() {
      cardTapAnimate(investCard);
      try {
        investCard.style.pointerEvents = "none";
        investCard.classList.add("disabled");
        let r = await fetch("/api/update-monthly-investment", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        let j = await r.json();
        if (r.ok && !j.error) {
          const monthlyVal = document.getElementById("monthly-investment-value");
          const roiMultipleEl = document.getElementById("roi-multiple");
          const roiHintEl = document.getElementById("roi-hint");
          const estValueEl = document.getElementById("est-value");

          if (monthlyVal) monthlyVal.textContent = Math.round(j.monthlyInvestment).toLocaleString();
          if (j.roiMultiple && roiMultipleEl) roiMultipleEl.textContent = formatRoi(j.roiMultiple);
          if (typeof j.totalProfit === "number" && roiHintEl) roiHintEl.textContent = Math.round(j.totalProfit).toLocaleString();

          if (j.investmentRecords && j.investmentRecords.length > 0 && estValueEl) {
            let l = j.investmentRecords[j.investmentRecords.length - 1];
            estValueEl.textContent = Math.round(l.totalValue).toLocaleString();
          }

          // After successful update, refresh chart:
          if (window.updateLightweightChart) {
            updateLightweightChart();
          }
        } else {
          alert("Failed to update monthly investment!");
        }
      } catch (_) {
        alert("Something went wrong!");
      } finally {
        investCard.style.pointerEvents = "auto";
        investCard.classList.remove("disabled");
      }
    }

    async function doubleClickInvest() {
      cardTapAnimate(investCard);
      try {
        investCard.style.pointerEvents = "none";
        investCard.classList.add("disabled");
        let r = await fetch("/api/update-monthly-investment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "decrement" })
        });
        let j = await r.json();
        if (r.ok && !j.error) {
          const monthlyVal = document.getElementById("monthly-investment-value");
          const roiMultipleEl = document.getElementById("roi-multiple");
          const roiHintEl = document.getElementById("roi-hint");
          const estValueEl = document.getElementById("est-value");

          if (monthlyVal) monthlyVal.textContent = Math.round(j.monthlyInvestment).toLocaleString();
          if (j.roiMultiple && roiMultipleEl) roiMultipleEl.textContent = formatRoi(j.roiMultiple);
          if (typeof j.totalProfit === "number" && roiHintEl) roiHintEl.textContent = Math.round(j.totalProfit).toLocaleString();

          if (j.investmentRecords && j.investmentRecords.length > 0 && estValueEl) {
            let l = j.investmentRecords[j.investmentRecords.length - 1];
            estValueEl.textContent = Math.round(l.totalValue).toLocaleString();
          }

          // After successful update, refresh chart:
          if (window.updateLightweightChart) {
            updateLightweightChart();
          }
        } else {
          alert("Failed to update monthly investment!");
        }
      } catch (_) {
        alert("Something went wrong!");
      } finally {
        investCard.style.pointerEvents = "auto";
        investCard.classList.remove("disabled");
      }
    }
  }

  const riskCard = document.getElementById("risk-card");
  if (riskCard) {
    const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) {
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

  async function updateRisk() {
    try {
      riskCard.style.pointerEvents = "none";
      riskCard.classList.add("disabled");
      let r = await fetch("/api/update-risk", { method:"POST" });
      let data = await r.json();
      if (r.ok && !data.error) {
        const riskLevelEl = document.getElementById("risk-level");
        const tickerEl = document.getElementById("ticker");
        const monthlyVal = document.getElementById("monthly-investment-value");
        const estValueEl = document.getElementById("est-value");
        const roiMultipleEl = document.getElementById("roi-multiple");
        const roiHintEl = document.getElementById("roi-hint");

        if (riskLevelEl) riskLevelEl.textContent = data.riskLevel;
        if (tickerEl) animateElement("ticker", data.investmentTicker.toUpperCase());
        if (monthlyVal && data.monthlyInvestment != null){
          monthlyVal.textContent = Math.round(data.monthlyInvestment).toLocaleString();
        }
        if (estValueEl && data.estValue != null){
          estValueEl.textContent = data.estValue.toLocaleString();
        }
        if (roiMultipleEl && data.roiMultiple){
          roiMultipleEl.textContent = data.roiMultiple;
        }
        if (roiHintEl && data.totalProfit != null){
          roiHintEl.textContent = Math.round(data.totalProfit).toLocaleString();
        }

        // Refresh chart after updating risk
        if (window.updateLightweightChart) {
          updateLightweightChart();
        }
      } else {
        alert("Failed to update risk!");
      }
    } catch(e) {
      alert("Something went wrong updating risk!");
    } finally {
      riskCard.style.pointerEvents = "auto";
      riskCard.classList.remove("disabled");
    }
  }
});

/* Helper functions */
function cardTapAnimate(cardEl) {
  cardEl.classList.add("tap-animate");
  setTimeout(() => cardEl.classList.remove("tap-animate"), 200);
}

function animateElement(id, newVal){
  const el = document.getElementById(id);
  if(!el) return;
  let oldVal = el.textContent.trim();
  new universalRush(id, newVal, oldVal, { stepDelayStart:50, stepDelayInc:5, easing:"easeOut" });
}

function formatRoi(val){
  const num = parseFloat(val);
  if(isNaN(num)) return "N/A";
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}