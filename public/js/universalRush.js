class universalRush {
  constructor(id,newVal,oldVal,opts={}) {
    this.el=document.getElementById(id);if(!this.el)return;
    this.newVal=newVal??"";
    this.oldVal=oldVal??"RND";
    this.stepDelayStart=opts.stepDelayStart??50;
    this.stepDelayInc=opts.stepDelayInc??5;
    this.easing=opts.easing||"easeOut";
    this.onEnd=opts.onEnd||function(){};
    this.digits="0123456789";
    this.letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(this.oldVal==="RND")this.oldVal=this._randomPlaceholder(this.newVal);
    this._spinAll();
  }
  _spinAll(){
    const o=this.oldVal,n=this.newVal;
    const minLen=Math.min(o.length,n.length);let done=0;
    for(let i=0;i<minLen;i++){
      this._spinChar(i,o[i],n[i],()=>{
        if(++done===minLen){
          this.el.textContent=n;
          this.onEnd();
        }
      });
    }
    if(n.length>o.length){
      this.el.textContent=n;
      this.onEnd();
    }
  }
  _spinChar(pos,oc,nc,onDone){
    if(oc===nc){this._setChar(pos,nc);onDone();return}
    const dig=this._isDigit(oc)&&this._isDigit(nc);
    const lettr=this._isLetter(oc)&&this._isLetter(nc);
    if(!dig&&!lettr){this._setChar(pos,nc);onDone();return}
    let path=dig?this._spinPathDigits(oc,nc):this._spinPathLetters(oc,nc);
    let i=0,len=path.length,sd=this.stepDelayStart;
    const run=()=>{
      if(i<len){
        this._setChar(pos,path[i++]);
        sd=this._calcDelay(i,len);
        setTimeout(run,sd);
      } else {onDone();}
    };
    run();
  }
  _calcDelay(i,len){
    let t=i/len;
    let easingVal=1-Math.pow(1-t,3); // easeOutCubic
    return this.stepDelayStart+this.stepDelayInc*easingVal*len;
  }
  _spinPathDigits(a,b){
    let oa=this.digits.indexOf(a),ob=this.digits.indexOf(b),f=[],r=[];
    {let x=oa;while(x!==ob){x=(x+1)%10;f.push(this.digits[x]);}}
    {let x=oa;while(x!==ob){x=(x-1+10)%10;r.push(this.digits[x]);}}
    return f.length<=r.length?f:r;
  }
  _spinPathLetters(a,b){
    let A=a.toUpperCase(),B=b.toUpperCase();
    let oa=this.letters.indexOf(A),ob=this.letters.indexOf(B),f=[],r=[];
    {let x=oa;while(x!==ob){x=(x+1)%26;f.push(this._preserveCase(a,this.letters[x]));}}
    {let x=oa;while(x!==ob){x=(x-1+26)%26;r.push(this._preserveCase(a,this.letters[x]));}}
    return f.length<=r.length?f:r;
  }
  _preserveCase(o,n){return o===o.toLowerCase()?n.toLowerCase():n}
  _setChar(pos,c){
    let cur=this.el.textContent;while(cur.length<=pos)cur+=" ";
    let arr=cur.split("");arr[pos]=c;this.el.textContent=arr.join("");
  }
  _isDigit(c){return this.digits.includes(c)}
  _isLetter(c){return this.letters.includes(c.toUpperCase())}
  _randomPlaceholder(str){
    // same logic you had
    if(/^[0-9,]+$/.test(str.replace(/[^0-9]/g,""))){
      let out="";for(let i=0;i<str.length;i++){
        out+=(str[i]===","?"," : this.digits[Math.floor(Math.random()*10)]);
      }
      return out;
    }
    if(/^[A-Za-z]+$/.test(str.replace(/[^A-Za-z]/g,""))){
      let out="";for(let i=0;i<str.length;i++){
        let c=this.letters[Math.floor(Math.random()*26)];
        if(str[i]===str[i].toLowerCase())c=c.toLowerCase();
        out+=c;
      }
      return out;
    }
    let out="";
    for(let i=0;i<str.length;i++){
      if(/[^A-Za-z0-9]/.test(str[i])){
        out+=str[i];
      } else {
        if(Math.random()>0.5)out+=this.digits[Math.floor(Math.random()*10)];
        else{
          let c=this.letters[Math.floor(Math.random()*26)];
          out+=(str[i]===str[i].toLowerCase()?c.toLowerCase():c);
        }
      }
    }
    return out;
  }
}