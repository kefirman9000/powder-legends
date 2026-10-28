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
function camVel(){   // hip velocity in px/s, also during replays (read from the recorder, which runs at 60/s)
  if(replayMode&&RP.n>1){const i=Math.max(0,Math.min(RP.n-2,Math.floor(replayIndex))),a=rpSlot(i)*RP_W+16,b=rpSlot(i+1)*RP_W+16;return[(RP.buf[b]-RP.buf[a])*60,(RP.buf[b+1]-RP.buf[a+1])*60]}
  const h=P[4];return[(h.x-h.px)*120,(h.y-h.py)*120];
}
function camTick(Q){
  if(!P||!P.length||!st)return;
  if(paused&&!replayMode){camK.z=1;camK.lx=0;camK.ly=0;return}   // behind a menu: plain framing, no pull-back or look-ahead easing in
  const dt=Math.min(fdt,.05),[vx,vy]=camVel(),sp=Math.hypot(vx,vy);
  const mx=(Q[0].x+Q[1].x)/2,ht=Math.max(0,ter(mx).y-Math.max(Q[0].y,Q[1].y));
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
