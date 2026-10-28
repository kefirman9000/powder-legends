// ======================= WIND TRAILS =======================
// Thin, faint white streaks off the ski tips, ski tails and hand while you're in the air. They start tiny and grow the
// longer you stay up (to a short cap), then shrink away after you land. Hidden while the rainbow adrenaline trail shows.
const WIND={hist:[],len:0,maxLen:9,grow:6,shrink:1.2,alpha:.30};   // len/maxLen in frames of history; grow: frames per second of air
function windTrails(Q,rainbowOn){
  if(!st)return;const live=!paused||replayMode;
  const parts=st.skisOff?[7,6]:[0,1,7];
  if(live){
    const want=st.onAir&&!st.crash&&!st.fireDeath&&!rainbowOn?Math.min(WIND.maxLen,1+st.air*WIND.grow):0;
    WIND.len=want>WIND.len?Math.min(want,WIND.len+.35):Math.max(want,WIND.len-WIND.shrink);
    if(WIND.len>0){WIND.hist.push(parts.map(k=>Q[k].x),parts.map(k=>Q[k].y));if(WIND.hist.length>(WIND.maxLen+1)*2)WIND.hist.splice(0,2)}
    else WIND.hist.length=0;
  }
  const n=Math.min(Math.floor(WIND.len),WIND.hist.length/2-1);if(n<1)return;
  cx.save();cx.lineCap='round';cx.strokeStyle='#fff';
  const H=WIND.hist,last=H.length/2-1;
  for(let pi=0;pi<parts.length;pi++){
    for(let i=0;i<n;i++){   // newest segment first; each older one fainter and thinner
      const a=(last-i)*2,b=(last-i-1)*2,u=1-i/n;
      cx.globalAlpha=WIND.alpha*u*u;cx.lineWidth=.6+1.1*u;
      cx.beginPath();cx.moveTo(H[a][pi],H[a+1][pi]);cx.lineTo(H[b][pi],H[b+1][pi]);cx.stroke()}}
  cx.restore();
}
function windReset(){WIND.hist.length=0;WIND.len=0}

// ======================= SPIN EFFECTS (replace the old in-air fireworks) =======================
// While you spin, a faint swoosh arc traces the last moment of rotation around your body; each completed flip sends out
// a quick ring pulse (white for the first flip, gold from the second). Cheap: a few short arcs, no particles.
const SPIN={hist:[],pulses:[]};
function flipPulse(n){SPIN.pulses.push({t:0,n})}
function spinFx(Q){
  if(!st)return;const live=!paused||replayMode,f=camFocus(Q),dt=Math.min(fdt,.05);
  const ang=Math.atan2(Q[5].y-Q[4].y,Q[5].x-Q[4].x);   // body orientation: hip -> shoulder
  if(live){if(st.onAir&&!st.crash){SPIN.hist.push(ang);if(SPIN.hist.length>12)SPIN.hist.shift()}else SPIN.hist.length=0}
  const H=SPIN.hist;cx.save();cx.lineCap='round';
  if(H.length>3){   // unwrap the recent angles and draw the swept arc if the body is really spinning
    const un=[H[0]];for(let i=1;i<H.length;i++){let d=H[i]-H[i-1];if(d>Math.PI)d-=2*Math.PI;else if(d<-Math.PI)d+=2*Math.PI;un.push(un[i-1]+d)}
    const sweep=un[un.length-1]-un[0];
    if(Math.abs(sweep)>1.1){const r=46,segs=un.length-1;
      for(let i=0;i<segs;i++){const u=(i+1)/segs;cx.globalAlpha=.28*u*u*Math.min(1,(Math.abs(sweep)-1.1)/.8);cx.strokeStyle='#fff';cx.lineWidth=1+2.4*u;
        const a0=un[i]+Math.PI,a1=un[i+1]+Math.PI;cx.beginPath();cx.arc(f.x,f.y,r,Math.min(a0,a1),Math.max(a0,a1));cx.stroke()}}}
  for(const p of SPIN.pulses){if(live)p.t+=dt;const u=Math.min(1,p.t/.45),e=1-Math.pow(1-u,2);
    cx.globalAlpha=.55*(1-u);cx.strokeStyle=p.n>=2?'#ffd36b':'#ffffff';cx.lineWidth=3*(1-u)+.6;cx.beginPath();cx.arc(f.x,f.y,20+62*e,0,7);cx.stroke()}
  SPIN.pulses=SPIN.pulses.filter(p=>p.t<.45);cx.restore();
}
function spinReset(){SPIN.hist.length=0;SPIN.pulses.length=0}
