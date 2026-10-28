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
