class universalRush {
  constructor(id,newVal,oldVal,opts={}) {
    this.el=document.getElementById(id);if(!this.el)return;
    this.newVal=newVal??"";this.oldVal=oldVal??"RND";
    this.stepDelayStart=opts.stepDelayStart??20;this.stepDelayInc=opts.stepDelayInc??3;
    this.onEnd=opts.onEnd??function(){};
    this.digits="0123456789";this.letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(this.oldVal==="RND")this.oldVal=this._randomPlaceholder(this.newVal);
    this._spinAll();
  }
  _spinAll(){
    const o=this.oldVal,n=this.newVal,m=Math.min(o.length,n.length);let c=0;
    for(let i=0;i<m;i++){
      this._spinChar(i,o[i],n[i],()=>{if(++c===m){this.el.textContent=n;this.onEnd();}});
    }
    if(n.length>o.length){this.el.textContent=n;this.onEnd();}
  }
  _spinChar(p,oc,nc,onDone){
    if(oc===nc){this._setChar(p,nc);onDone();return}
    const d=this._isDigit(oc)&&this._isDigit(nc),l=this._isLetter(oc)&&this._isLetter(nc);
    if(!d&&!l){this._setChar(p,nc);onDone();return}
    let path=d?this._spinPathDigits(oc,nc):this._spinPathLetters(oc,nc),sd=this.stepDelayStart,i=0;
    const fn=()=>{if(i<path.length){this._setChar(p,path[i++]);sd+=this.stepDelayInc;setTimeout(fn,sd);}else onDone();};fn();
  }
  _spinPathDigits(a,b){
    let oi=this.digits.indexOf(a),ni=this.digits.indexOf(b),f=[],r=[];
    {let i=oi;while(i!==ni){i=(i+1)%10;f.push(this.digits[i]);}}
    {let j=oi;while(j!==ni){j=(j-1+10)%10;r.push(this.digits[j]);}}
    return f.length<=r.length?f:r;
  }
  _spinPathLetters(a,b){
    let A=a.toUpperCase(),B=b.toUpperCase(),oi=this.letters.indexOf(A),ni=this.letters.indexOf(B),f=[],r=[];
    {let i=oi;while(i!==ni){i=(i+1)%26;f.push(this._preserveCase(a,this.letters[i]));}}
    {let j=oi;while(j!==ni){j=(j-1+26)%26;r.push(this._preserveCase(a,this.letters[j]));}}
    return f.length<=r.length?f:r;
  }
  _preserveCase(oldC,newU){return oldC===oldC.toLowerCase()?newU.toLowerCase():newU}
  _setChar(pos,c){
    let cur=this.el.textContent;while(cur.length<=pos)cur+=" ";
    let arr=cur.split("");arr[pos]=c;this.el.textContent=arr.join("");
  }
  _isDigit(c){return this.digits.includes(c)}
  _isLetter(c){return this.letters.includes(c.toUpperCase())}
  _randomPlaceholder(str){
    if(/^[0-9,]+$/.test(str.replace(/[^0-9]/g,""))){
      let out="";for(let i=0;i<str.length;i++){out+=(str[i]===","?",":this.digits[Math.floor(Math.random()*10)])}return out;
    }
    if(/^[A-Za-z]+$/.test(str.replace(/[^A-Za-z]/g,""))){
      let out="";for(let i=0;i<str.length;i++){let c=this.letters[Math.floor(Math.random()*26)];if(str[i]===str[i].toLowerCase())c=c.toLowerCase();out+=c;}return out;
    }
    let out="";for(let i=0;i<str.length;i++){
      if(/[^A-Za-z0-9]/.test(str[i])){out+=str[i]}else{
        if(Math.random()>0.5){out+=this.digits[Math.floor(Math.random()*10)]}
        else{
          let c=this.letters[Math.floor(Math.random()*26)];
          out+=str[i]===str[i].toLowerCase()?c.toLowerCase():c;
        }
      }
    }
    return out;
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  function animateElement(id,newVal){
    const el=document.getElementById(id);if(!el)return;
    let oldVal=el.textContent.trim();
    new universalRush(id,newVal,oldVal,{stepDelayStart:20,stepDelayInc:3});
  }

  function formatRoi(val){
    const num=parseFloat(val);
    if(isNaN(num))return "N/A";
    const rounded=Math.round(num*10)/10;
    return Number.isInteger(rounded)?String(rounded):rounded.toFixed(1);
  }

  // Stagger the card transitions
  document.querySelectorAll(".card").forEach((card,i)=>{
    setTimeout(()=>card.classList.add("card-enter"),i*100);
  });

  ["ticker","monthly-investment-value","est-value","roi-multiple","roi-hint"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) new universalRush(id,el.textContent.trim(),"RND",{stepDelayStart:20,stepDelayInc:3});
  });

  // Load fresh data from your server
  fetch("/api/investment-records")
  .then(r=>r.json())
  .then(d=>{
    console.log("investment-records data:", d); // BROWSER-SIDE LOG
    if(d.error){
      animateElement("ticker","Err");
      animateElement("est-value","Err");
      animateElement("roi-multiple","N/A");
      animateElement("roi-hint","Err");
      return;
    }
    let recs=d.investmentRecords;
    if(!recs||!recs.length){
      animateElement("est-value","No data");
      animateElement("roi-multiple","N/A");
      animateElement("roi-hint","N/A");
      return;
    }
    let last=recs[recs.length-1];
    let interest=last.interest,total=last.totalValue,principal=total-interest;
    animateElement("est-value",Math.round(total).toLocaleString());
    animateElement("roi-multiple",formatRoi(principal>0?(interest/principal):"N/A"));
    animateElement("roi-hint",Math.round(interest).toLocaleString());
    if(last.ticker) animateElement("ticker",last.ticker);
  })
  .catch(_=>{
    animateElement("est-value","Err");
    animateElement("roi-multiple","N/A");
    animateElement("roi-hint","Err");
  });

  const card=document.getElementById("monthly-investment-card");
  let clickTimer=null,delay=300;
  if(card){
    card.addEventListener("click",()=>{
      if(clickTimer==null){
        clickTimer=setTimeout(()=>{singleClick();clickTimer=null},delay);
      }else{
        clearTimeout(clickTimer);clickTimer=null;doubleClick();
      }
    });
    let lastTap=0;
    card.addEventListener("touchend",e=>{
      let now=Date.now(),elapsed=now-lastTap;
      if(elapsed<delay && elapsed>0){
        clearTimeout(clickTimer);clickTimer=null;
        doubleClick();e.preventDefault();
      } else {
        clickTimer=setTimeout(()=>{singleClick();clickTimer=null},delay);
      }
      lastTap=now;
    });
  }

  async function singleClick(){
    try{
      card.style.pointerEvents="none";card.classList.add("disabled");
      let r=await fetch("/api/update-monthly-investment",{method:"POST",headers:{"Content-Type":"application/json"}});
      let j=await r.json();
      if(r.ok){
        animateElement("monthly-investment-value",Math.round(j.monthlyInvestment).toLocaleString());
        if(j.roiMultiple) animateElement("roi-multiple",formatRoi(j.roiMultiple));
        if(typeof j.totalProfit==="number") animateElement("roi-hint",Math.round(j.totalProfit).toLocaleString());
        if(j.investmentRecords&&j.investmentRecords.length>0){
          let l=j.investmentRecords[j.investmentRecords.length-1];
          animateElement("est-value",Math.round(l.totalValue).toLocaleString());
        }
      }else{alert("Failed to update monthly investment!")}
    }catch(_){alert("Something went wrong!")}
    finally{
      card.style.pointerEvents="auto";
      card.classList.remove("disabled");
    }
  }

  async function doubleClick(){
    try{
      card.style.pointerEvents="none";card.classList.add("disabled");
      let r=await fetch("/api/update-monthly-investment",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"decrement"})
      });
      let j=await r.json();
      if(r.ok){
        animateElement("monthly-investment-value",Math.round(j.monthlyInvestment).toLocaleString());
        if(j.roiMultiple) animateElement("roi-multiple",formatRoi(j.roiMultiple));
        if(typeof j.totalProfit==="number") animateElement("roi-hint",Math.round(j.totalProfit).toLocaleString());
        if(j.investmentRecords&&j.investmentRecords.length>0){
          let l=j.investmentRecords[j.investmentRecords.length-1];
          animateElement("est-value",Math.round(l.totalValue).toLocaleString());
        }
      }else{alert("Failed to update monthly investment!")}
    }catch(_){alert("Something went wrong!")}
    finally{
      card.style.pointerEvents="auto";
      card.classList.remove("disabled");
    }
  }
});