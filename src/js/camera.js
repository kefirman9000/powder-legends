// ======================= SPEED-AWARE CAMERA =======================
// Pulls the view back as you go faster and as you get higher off the snow, and slides the framing ahead of
// where you're heading so the landing comes into view early. Eases out quickly, eases back in slowly.
// Works on top of the player's own zoom (scroll wheel / + -): this only ever zooms OUT from it.
const CAMS={
  v0:450,v1:1600,vOut:.22,     // speed (px/s) where pull-back starts / is at full, and how much it zooms out at full speed
  h0:40,h1:380,hOut:.24,      // height above the snow (px) where pull-back starts / is at full, and how much
  zMin:.58,                   // never zoom out further than this fraction of the player's zoom
  outRate:2.6,inRate:.9,      // how fast it pulls back / settles in (per second)
  lookT:.22,lookX:.1,lookY:.14,lookRate:2.2   // look-ahead: seconds of travel to lead by, capped to this fraction of the screen
};
const camK={z:1,lx:0,ly:0};
const clamp01=v=>v<0?0:v>1?1:v;
// The camera follows the skier's centre of mass, not the hips. During a flip the hips swing in a circle around
// the centre of mass, which made the camera bob; the centre of mass flies one smooth arc however the body spins.
// Once the skis come off they're left out, so the camera stays with the skier rather than a tumbling ski.
const CAM_FIRST=()=>st&&st.skisOff?2:0;
function camFocus(Q){let x=0,y=0,m=0;for(let k=CAM_FIRST();k<8;k++){x+=M[k]*Q[k].x;y+=M[k]*Q[k].y;m+=M[k]}return{x:x/m,y:y/m}}
function camVel(){   // centre-of-mass velocity in px/s, also during replays (read from the recorder, which runs at 60/s)
  const f=CAM_FIRST();let vx=0,vy=0,m=0;
  if(replayMode&&RP.n>1){const i=Math.max(0,Math.min(RP.n-2,Math.floor(replayIndex))),a=rpSlot(i)*RP_W,b=rpSlot(i+1)*RP_W;
    for(let k=f;k<8;k++){vx+=M[k]*(RP.buf[b+k*4]-RP.buf[a+k*4]);vy+=M[k]*(RP.buf[b+k*4+1]-RP.buf[a+k*4+1]);m+=M[k]}return[vx/m*60,vy/m*60]}
  for(let k=f;k<8;k++){vx+=M[k]*(P[k].x-P[k].px);vy+=M[k]*(P[k].y-P[k].py);m+=M[k]}return[vx/m*120,vy/m*120];
}
function camTick(Q){
  if(!P||!P.length||!st)return;
  if(paused&&!replayMode){camK.z=1;camK.lx=0;camK.ly=0;return}   // behind a menu: plain framing, no pull-back or look-ahead easing in
  const dt=Math.min(fdt,.05),[vx,vy]=camVel(),sp=Math.hypot(vx,vy);
  const fc=camFocus(Q),ht=Math.max(0,ter(fc.x).y-fc.y-41);   // height of the centre of mass above its normal standing height (spinning skis no longer wobble the zoom)
  const s=t=>t*t*(3-2*t);   // smoothstep
  let tz=1-CAMS.vOut*s(clamp01((sp-CAMS.v0)/(CAMS.v1-CAMS.v0)))-CAMS.hOut*s(clamp01((ht-CAMS.h0)/(CAMS.h1-CAMS.h0)));
  if(st.sharkDeath||st.fireDeath||paused&&!replayMode)tz=camK.z;   // hold still during death scenes and behind menus
  tz=Math.max(CAMS.zMin,tz);
  const rate=tz<camK.z?CAMS.outRate:CAMS.inRate;camK.z+=(tz-camK.z)*(1-Math.exp(-rate*dt));
  // look-ahead in world units, capped to part of the visible screen
  const vw=W/(ZB*zoom*camK.z),vh=H/(ZB*zoom*camK.z);
  let tx=Math.max(-vw*CAMS.lookX,Math.min(vw*CAMS.lookX,vx*CAMS.lookT)),ty=st.onAir?Math.max(-vh*CAMS.lookY*.5,Math.min(vh*CAMS.lookY,vy*CAMS.lookT)):0;
  if(st.crash||st.done)tx=ty=0;
  const lr=1-Math.exp(-CAMS.lookRate*dt);camK.lx+=(tx-camK.lx)*lr;camK.ly+=(ty-camK.ly)*lr;
}
function camSnap(){camK.z=1;camK.lx=0;camK.ly=0}   // new run: start framed normally
