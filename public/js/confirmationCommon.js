function animateElement(id,newVal){
  const el=document.getElementById(id);
  if(!el)return;
  let oldVal=el.textContent.trim();
  new universalRush(id,newVal,oldVal,{stepDelayStart:50,stepDelayInc:5,easing:"easeOut"});
}

function formatRoi(val){
  const num=parseFloat(val);
  if(isNaN(num))return "N/A";
  const rounded=Math.round(num*10)/10;
  return Number.isInteger(rounded)?String(rounded):rounded.toFixed(2);
}

function cardTapAnimate(cardEl){
  cardEl.classList.add("tap-animate");
  setTimeout(()=>cardEl.classList.remove("tap-animate"),200);
}

document.addEventListener("DOMContentLoaded",()=>{
	const cards = document.querySelectorAll(".card");
	setTimeout(()=>{
	  ["ticker","monthly-investment-value","est-value","roi-multiple","roi-hint"].forEach(id=>{
	    const el=document.getElementById(id);
	    if(el){
	      new universalRush(id, el.textContent.trim(), "RND", {stepDelayStart:50,stepDelayInc:5,easing:"easeOut"});
	    }
	  });
	}, cards.length*100 + 200);

  fetch("/api/investment-records")
    .then(r=>r.json())
    .then(d=>{
      if(d.error){
        animateElement("ticker","Err");
        animateElement("est-value","Err");
        animateElement("roi-multiple","N/A");
        animateElement("roi-hint","Err");
        return;
      }
      const recs=d.investmentRecords;
      if(!recs||!recs.length){
        animateElement("est-value","No data");
        animateElement("roi-multiple","N/A");
        animateElement("roi-hint","N/A");
        return;
      }
      const last=recs[recs.length-1];
      const interest=last.interest;
      const total=last.totalValue;
      const principal=total - interest;
      animateElement("est-value",Math.round(total).toLocaleString());
      animateElement("roi-multiple",formatRoi(principal>0?(interest/principal):"N/A"));
      animateElement("roi-hint",Math.round(interest).toLocaleString());
      if(last.ticker) animateElement("ticker",last.ticker);
    })
    .catch(e=>{
      animateElement("est-value","Err");
      animateElement("roi-multiple","N/A");
      animateElement("roi-hint","Err");
    });
  
	if(window.fetchAndBuildChart){
    fetchAndBuildChart();
  }
});