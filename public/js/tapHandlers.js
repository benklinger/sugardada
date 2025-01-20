document.addEventListener("DOMContentLoaded",()=>{
  /***********************
   * Monthly Investment
   ***********************/
  const investCard=document.getElementById("monthly-investment-card");
  if(investCard){
    let clickTimer=null,delay=300;
    const isTouch=('ontouchstart' in window||navigator.maxTouchPoints>0);

    if(isTouch){
      investCard.addEventListener("touchend",handleTap);
    } else {
      investCard.addEventListener("click",handleTap);
    }
    function handleTap(e){
      e.preventDefault();
      if(clickTimer===null){
        clickTimer=setTimeout(()=>{
          singleClickInvest();
          clickTimer=null;
        },delay);
      } else {
        clearTimeout(clickTimer);
        clickTimer=null;
        doubleClickInvest();
      }
    }
    async function singleClickInvest(){
      cardTapAnimate(investCard);
      try{
        investCard.style.pointerEvents="none";
        investCard.classList.add("disabled");
        let r=await fetch("/api/update-monthly-investment",{method:"POST",headers:{"Content-Type":"application/json"}});
        let j=await r.json();
        if(r.ok&&!j.error){
          animateElement("monthly-investment-value",Math.round(j.monthlyInvestment).toLocaleString());
          if(j.roiMultiple) animateElement("roi-multiple",formatRoi(j.roiMultiple));
          if(typeof j.totalProfit==="number") animateElement("roi-hint",Math.round(j.totalProfit).toLocaleString());
          if(j.investmentRecords&&j.investmentRecords.length>0){
            let l=j.investmentRecords[j.investmentRecords.length-1];
            animateElement("est-value",Math.round(l.totalValue).toLocaleString());
          }
          // re-fetch chart
          if(window.fetchAndBuildChart) fetchAndBuildChart();
        } else {
          alert("Failed to update monthly investment!");
        }
      }catch(_){
        alert("Something went wrong!");
      }finally{
        investCard.style.pointerEvents="auto";
        investCard.classList.remove("disabled");
      }
    }
    async function doubleClickInvest(){
      cardTapAnimate(investCard);
      try{
        investCard.style.pointerEvents="none";
        investCard.classList.add("disabled");
        let r=await fetch("/api/update-monthly-investment",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({action:"decrement"})
        });
        let j=await r.json();
        if(r.ok&&!j.error){
          animateElement("monthly-investment-value",Math.round(j.monthlyInvestment).toLocaleString());
          if(j.roiMultiple) animateElement("roi-multiple",formatRoi(j.roiMultiple));
          if(typeof j.totalProfit==="number") animateElement("roi-hint",Math.round(j.totalProfit).toLocaleString());
          if(j.investmentRecords&&j.investmentRecords.length>0){
            let l=j.investmentRecords[j.investmentRecords.length-1];
            animateElement("est-value",Math.round(l.totalValue).toLocaleString());
          }
          // re-fetch chart
          if(window.fetchAndBuildChart) fetchAndBuildChart();
        } else {
          alert("Failed to update monthly investment!");
        }
      }catch(_){
        alert("Something went wrong!");
      }finally{
        investCard.style.pointerEvents="auto";
        investCard.classList.remove("disabled");
      }
    }
  }

  /***********************
   * Risk Card
   ***********************/
  const riskCard=document.getElementById("risk-card");
  if(riskCard){
    const isTouch=('ontouchstart' in window||navigator.maxTouchPoints>0);
    if(isTouch){
      riskCard.addEventListener("touchend", e=>{
        e.preventDefault();
        cardTapAnimate(riskCard);
        updateRisk();
      });
    } else {
      riskCard.addEventListener("click",()=>{
        cardTapAnimate(riskCard);
        updateRisk();
      });
    }
  }
  async function updateRisk(){
    try{
      riskCard.style.pointerEvents="none";
      riskCard.classList.add("disabled");
      let r=await fetch("/api/update-risk",{method:"POST"});
      let data=await r.json();
      if(r.ok&&!data.error){
        document.getElementById("risk-level").textContent=data.riskLevel;
        animateElement("ticker",data.investmentTicker.toUpperCase());
        if(data.monthlyInvestment!=null){
          animateElement("monthly-investment-value",Math.round(data.monthlyInvestment).toLocaleString());
        }
        if(data.estValue!=null){
          animateElement("est-value",data.estValue.toLocaleString());
        }
        if(data.roiMultiple){
          animateElement("roi-multiple",data.roiMultiple);
        }
        if(data.totalProfit!=null){
          animateElement("roi-hint",Math.round(data.totalProfit).toLocaleString());
        }
        // re-fetch chart
        if(window.fetchAndBuildChart) fetchAndBuildChart();
      } else {
        alert("Failed to update risk!");
      }
    } catch(e){
      alert("Something went wrong updating risk!");
    } finally{
      riskCard.style.pointerEvents="auto";
      riskCard.classList.remove("disabled");
    }
  }
});