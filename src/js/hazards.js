// ======================= HAZARD BONUSES + SHARK POOL =======================
// Clearing a hazard in the air earns a multiplier on that jump's air + flip points (plus a flat bonus),
// paid out when you land cleanly. A close shave (skimming the hazard) pays more.
const HZ={fireMult:2,fireClose:3,fireFlat:15000,fireCloseFlat:30000,sharkMult:2,sharkClose:3,sharkFlat:15000,sharkCloseFlat:30000,closePx:45};
const SHARK={reach:480,g:3600,len:118,rad:30,drag:6};   // reach: how high (px) above the water the nose gets; g: shark's own gravity
function hazardInit(){
  lavaInit();
  st.hPts=0;st.hzMult=1;st.hzFlat=0;st.hzName='';st.hNames='';
  for(const b of boxes)if(b.k==='fire-wall'){b.cleared=false;b.minM=undefined}
  st.sk=LVc&&LVc.water?{go:false,done:false,caught:false,carry:false,cleared:false,x:0,y:0,vx:0,vy:0,ang:-1.5,jaw:.3,minM:1e9,drops:[]}:null;
}
function hazardRearm(){   // after a ski reset: hazards come back, banked bonus points stay
  lavaInit();
  st.hzMult=1;st.hzFlat=0;
  for(const b of boxes)if(b.k==='fire-wall'){b.cleared=b.x-b.hw<P[4].x;b.minM=undefined}   // walls already behind you don't count as cleared
  if(LVc&&LVc.water)st.sk={go:false,done:false,caught:false,carry:false,cleared:false,x:0,y:0,vx:0,vy:0,ang:-1.5,jaw:.3,minM:1e9,drops:[]};
}
function hazardCleared(name,close,mult,flat){
  st.hzMult=mult;st.hzFlat=flat;st.hzName=name+(close?' (CLOSE SHAVE)':'');
  const label=close?'close shave':'cleared';
  st.hNames=(st.hNames?st.hNames+' · ':'')+name.toLowerCase()+' '+label+' ×'+mult;
  spray(name+' ×'+mult+(close?' · CLOSE SHAVE':''),'bonus pays out when you land',true);
}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l));return Math.hypot(px-(ax+dx*t),py-(ay+dy*t))}
function sharkSnap(){const s=st&&st.sk;return s&&s.go?{x:s.x,y:s.y,ang:s.ang,jaw:s.jaw}:null}
function sharkDrops(s,x,y,n,power){for(let i=0;i<n;i++)s.drops.push({x:x+(Math.random()-.5)*50,y,vx:(Math.random()-.5)*160,vy:-power*(.4+Math.random()*.9),l:1})}
function sharkLaunch(s,w,launchX,predX,apex){
  const v0=Math.sqrt(2*SHARK.g*(apex+90)),tA=v0/SHARK.g;
  s.go=true;s.splashed=false;s.x=launchX;s.y=w.y+90;s.vy=-v0;s.vx=Math.max(0,Math.min(650,(predX-launchX)/tA));s.minM=1e9;
  sharkDrops(s,launchX,w.y,16,380);
}
function hazardStep(){
  if(!st||!P)return;
  // ---- inferno wall: bonus for getting past the flames without touching them
  if(!st.done&&!st.crash&&!st.fireDeath){
    for(const b of boxes){
      if(b.k!=='fire-wall'||b.cleared)continue;
      const top=b.y-b.hh,x0=b.x-b.hw-14,x1=b.x+b.hw+14;let low=-1e9,past=true;
      for(const p of P){if(p.x>=x0&&p.x<=x1)low=Math.max(low,p.y);if(p.x<=x1)past=false}
      if(low>-1e9)b.minM=Math.min(b.minM===undefined?1e9:b.minM,top-low);
      if(past){b.cleared=true;const close=b.minM!==undefined&&b.minM<HZ.closePx;
        hazardCleared('FIRE JUMP',close,close?HZ.fireClose:HZ.fireMult,close?HZ.fireCloseFlat:HZ.fireFlat)}
    }
  }
  // ---- shark pool
  const w=LVc&&LVc.water,s=st.sk;if(!w||!s)return;
  const dt=1/120,q=P[4],vx=(q.x-q.px)*120;
  // drops (splash particles)
  for(const d of s.drops){d.vy+=900*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.l-=dt*1.3}
  s.drops=s.drops.filter(d=>d.l>0&&!(d.vy>0&&d.y>w.y+2));
  // splashdown: skis hit the water
  if(!st.crash&&!st.done){
    for(const i of [0,1]){const p=P[i];
      if(p.x>w.x0&&p.x<w.x1&&p.y>w.y+3&&ter(p.x).y>w.y){
        st.crash=true;st.msg='Splashdown! Fed to the sharks. Right-click, tap or press R to retry.';spray('SPLASH!');
        sharkDrops(s,p.x,w.y,18,300);
        if(!s.go&&!s.done)sharkLaunch(s,w,q.x,q.x,170);
        break}
    }
  }
  // launch: the shark times its leap so it reaches full height right where you'll be
  if(!s.go&&!s.done&&!st.crash&&!st.done){
    const tA=Math.sqrt(2*SHARK.reach/SHARK.g),predX=q.x+Math.max(vx,250)*tA;
    if(predX>=w.x0+60&&q.x<w.x1){
      const tx=Math.max(w.x0+50,Math.min(w.x1-50,predX));
      sharkLaunch(s,w,Math.max(w.x0+50,Math.min(w.x1-50,tx-22)),tx,SHARK.reach);
    }
  }
  if(s.go){
    const inWater=s.vy>0&&s.y>w.y;   // descending through the water: heavy drag + reduced gravity so it slows down
    if(inWater){if(!s.splashed){s.splashed=true;sharkDrops(s,s.x,w.y,12,320)}s.vy+=SHARK.g*.22*dt;const k=Math.max(0,1-SHARK.drag*dt);s.vy*=k;s.vx*=k}
    else s.vy+=SHARK.g*dt;
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.ang=Math.atan2(s.vy,s.vx||.001);
    s.jaw=s.carry?.15:s.vy<0?1:.45;
    const hx=s.x,hy=s.y,tx=hx-Math.cos(s.ang)*SHARK.len,ty=hy-Math.sin(s.ang)*SHARK.len;
    if(!s.caught&&!st.done){
      for(const p of P){const d=segDist(p.x,p.y,hx,hy,tx,ty);
        if(!st.crash||s.minM>1e8)s.minM=Math.min(s.minM,d-SHARK.rad);
        if(d<SHARK.rad+3){
          s.caught=true;s.carry=true;st.sharkDeath=true;st.sharkStarted=performance.now();st.done=true;st.finishedLevel=false;st.crash=false;st.msg='';st.pendingPts=0;st.failedPendingShown=false;st.fin=0;st.shown=false;trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';trickStackE.replaceChildren();queueTrickResult.nextAt=0;spray('CHOMP!');break}
      }
    }
    if(s.carry){   // the shark drags the skier along with it
      const sx=s.vx/120,sy=s.vy/120,hip=P[4],dx=(hx-hip.x)*.12,dy=(hy-hip.y)*.12;
      for(const p of P){const cvx_=p.x-p.px,cvy_=p.y-p.py,nvx=cvx_*.7+sx*.3,nvy=cvy_*.7+sy*.3;p.x+=dx;p.y+=dy;p.px=p.x-nvx;p.py=p.y-nvy}
    }
    if(s.vy>0&&s.y>w.y+230){s.go=false;s.done=true;if(s.carry)s.carry=false;sharkDrops(s,s.x,w.y,14,260)}
  }
  // cleared the shark: everything of you is past the pool, uneaten, and the shark did leap
  if(!s.cleared&&!s.caught&&!st.crash&&!st.done&&(s.go||s.done)&&P.every(p=>p.x>w.x1)){
    s.cleared=true;const close=s.minM<HZ.closePx;
    hazardCleared('SHARK JUMP',close,close?HZ.sharkClose:HZ.sharkMult,close?HZ.sharkCloseFlat:HZ.sharkFlat);
  }
}
function drawShark(){
  const w=LVc&&LVc.water;if(!w||!st)return;
  const s=(replayMode&&RP.n&&RP.sh[rpSlot(Math.min(RP.n-1,Math.floor(replayIndex)))])||(replayMode?null:(st.sk&&st.sk.go?st.sk:null));
  if(!s)return;
  cx.save();cx.translate(s.x,s.y);cx.rotate(s.ang);
  const g=cx.createLinearGradient(0,-26,0,26);g.addColorStop(0,'#3f6079');g.addColorStop(.5,'#6d8ea5');g.addColorStop(.58,'#e8f0f5');g.addColorStop(1,'#cfdde6');
  cx.lineJoin='round';
  // tail
  cx.fillStyle='#4a6a82';cx.strokeStyle='#243746';cx.lineWidth=2;
  cx.beginPath();cx.moveTo(-96,-4);cx.lineTo(-132,-38);cx.lineTo(-120,-2);cx.lineTo(-134,30);cx.lineTo(-96,6);cx.closePath();cx.fill();cx.stroke();
  // body
  cx.fillStyle=g;cx.beginPath();cx.moveTo(24,3);cx.bezierCurveTo(14,-22,-40,-27,-100,-6);cx.lineTo(-100,6);cx.bezierCurveTo(-40,28,8,24,24,8);cx.closePath();cx.fill();cx.stroke();
  // fins
  cx.fillStyle='#4a6a82';
  cx.beginPath();cx.moveTo(-26,-23);cx.lineTo(-50,-54);cx.lineTo(-62,-18);cx.closePath();cx.fill();cx.stroke();
  cx.beginPath();cx.moveTo(-18,18);cx.lineTo(-44,40);cx.lineTo(-48,14);cx.closePath();cx.fill();cx.stroke();
  // gills + eye
  cx.strokeStyle='#31485a';cx.lineWidth=1.6;for(let i=0;i<3;i++){cx.beginPath();cx.moveTo(-6-i*7,-5);cx.quadraticCurveTo(-10-i*7,3,-6-i*7,11);cx.stroke()}
  cx.fillStyle='#fff';cx.beginPath();cx.arc(10,-7,4.2,0,7);cx.fill();cx.fillStyle='#050505';cx.beginPath();cx.arc(11,-7,2.4,0,7);cx.fill();
  // open mouth with teeth
  const o=Math.max(.1,s.jaw),m=4+16*o;
  cx.fillStyle='#6a0f1a';cx.strokeStyle='#2b0508';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(24,5);cx.lineTo(-8,4);cx.lineTo(-2,4+m);cx.lineTo(22,10+m*.55);cx.closePath();cx.fill();cx.stroke();
  cx.fillStyle='#fff';for(let i=0;i<6;i++){const x=20-i*5;cx.beginPath();cx.moveTo(x,5);cx.lineTo(x-2.5,5+4+o*3);cx.lineTo(x-5,5);cx.closePath();cx.fill()}
  for(let i=0;i<5;i++){const x=19-i*5,y=8+m*.55-(i*.1*m);cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-2.5,y-3-o*2);cx.lineTo(x-5,y);cx.closePath();cx.fill()}
  cx.restore();
}
function drawWaterFront(){
  const w=LVc&&LVc.water;if(!w)return;
  const t=performance.now()/1000,n=Math.max(10,Math.round((w.x1-w.x0)/8)),wave=x=>w.y+Math.sin(x*.05+t*2.2)*2.3+Math.sin(x*.13-t*3.1)*1.3;
  cx.save();cx.beginPath();
  for(let i=0;i<=n;i++){const x=w.x0+(w.x1-w.x0)*i/n;i?cx.lineTo(x,wave(x)):cx.moveTo(x,wave(x))}
  for(let i=n;i>=0;i--){const x=w.x0+(w.x1-w.x0)*i/n;cx.lineTo(x,Math.max(ter(x).y,w.y+4)+2)}
  cx.closePath();
  const g=cx.createLinearGradient(0,w.y,0,w.y+w.depth);g.addColorStop(0,'rgba(46,170,222,.55)');g.addColorStop(1,'rgba(8,62,122,.82)');
  cx.fillStyle=g;cx.fill();
  cx.beginPath();for(let i=0;i<=n;i++){const x=w.x0+(w.x1-w.x0)*i/n;i?cx.lineTo(x,wave(x)):cx.moveTo(x,wave(x))}
  cx.strokeStyle='rgba(235,250,255,.85)';cx.lineWidth=2.4;cx.stroke();
  cx.restore();
  const s=st&&st.sk;if(s&&!replayMode){cx.fillStyle='rgba(235,250,255,.9)';for(const d of s.drops){cx.globalAlpha=Math.max(0,d.l);cx.beginPath();cx.arc(d.x,d.y,2.4,0,7);cx.fill()}cx.globalAlpha=1}
}
const adrenalineTrail=[];
function damageTint(color){const age=(performance.now()-damagePulseAt)/1000;if(!damagePulseAt||age<0||age>=1.25)return color;const fade=1-age/1.25,pulse=.5+.5*Math.sin(age*Math.PI*6);const amount=Math.round(78*pulse*fade);return amount>0?`color-mix(in srgb, #ff202e ${amount}%, ${color})`:color}

// ======================= LAVA POOLS (Volcano Run) =======================
// A level can list lava pools: LVc.lava=[{x0,x1,y}]. Touching the lava burns you up (same sequence as the fire
// walls). Clearing a pool in the air pays a hazard bonus on that jump, more for a close shave.
const LAVA={mult:2,close:3,flat:15000,closeFlat:30000};
function lavaInit(){if(!st)return;st.lv=(LVc&&LVc.lava||[]).map(p=>({cleared:!!(P&&P[4]&&P[4].x>p.x0),minM:1e9}))}   // pools already behind you don't count
function burnUp(p,why){   // shared by fire walls and lava: the skier catches fire and the run ends with F FOR FIRE
  if(st.fireDeath)return;
  st.fireDeath=true;st.specialFire=true;st.lavaDeath=why==='lava';st.finishedLevel=false;st.done=true;st.crash=false;st.skisOff=true;st.skisStill=0;st.msg='';st.pendingPts=0;st.failedPendingShown=false;P[0].py+=2.5;P[0].px-=1.2;P[1].py+=3;P[1].px+=1.2;
  st.burnX=p.x;st.burnY=p.y;st.fireStarted=performance.now();st.fin=-1.65;st.shown=false;cvx*=.65;cvy*=.65;
  trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';trickStackE.replaceChildren();queueTrickResult.nextAt=0;
}
function lavaStep(){
  const L=LVc&&LVc.lava;if(!L||!st||!st.lv||st.done)return;
  L.forEach((pool,k)=>{const s=st.lv[k];
    for(const p of P){if(p.x>pool.x0&&p.x<pool.x1){if(p.y>pool.y-2){if(window.tut&&tut.on){st.crash=true;return}burnUp(p,'lava');for(let i=0;i<14;i++)snow.push({x:p.x,y:pool.y,vx:(Math.random()-.5)*3,vy:-1-Math.random()*2.5,l:1,d:.02,g:.05,s:1.4});return}s.minM=Math.min(s.minM,pool.y-p.y)}}
    if(!s.cleared&&!st.crash&&P.every(p=>p.x>pool.x1)){s.cleared=true;const close=s.minM<HZ.closePx;hazardCleared('LAVA JUMP',close,close?LAVA.close:LAVA.mult,close?LAVA.closeFlat:LAVA.flat)}
  });
}
function drawLava(){
  const L=LVc&&LVc.lava;if(!L)return;const t=performance.now()/1000;
  for(const pool of L){if(pool.x1<cam.x-50||pool.x0>cam.x+W/Z+50)continue;
    const n=Math.max(10,Math.round((pool.x1-pool.x0)/10)),wave=x=>pool.y+Math.sin(x*.035+t*1.6)*2.6+Math.sin(x*.11-t*2.3)*1.2;
    cx.save();cx.beginPath();for(let i=0;i<=n;i++){const x=pool.x0+(pool.x1-pool.x0)*i/n;i?cx.lineTo(x,wave(x)):cx.moveTo(x,wave(x))}
    for(let i=n;i>=0;i--){const x=pool.x0+(pool.x1-pool.x0)*i/n;cx.lineTo(x,Math.max(ter(x).y,pool.y+4)+2)}cx.closePath();
    const g=cx.createLinearGradient(0,pool.y-4,0,pool.y+260);g.addColorStop(0,'#ffe36a');g.addColorStop(.08,'#ff8a1c');g.addColorStop(.4,'#d4300c');g.addColorStop(1,'#5c0c04');cx.fillStyle=g;cx.fill();
    cx.globalCompositeOperation='lighter';{const mx=(pool.x0+pool.x1)/2,hw=(pool.x1-pool.x0)/2+40;cx.save();cx.translate(mx,pool.y);cx.scale(hw/100,1);const hg=cx.createRadialGradient(0,0,0,0,0,100);hg.addColorStop(0,'rgba(255,110,30,.38)');hg.addColorStop(1,'rgba(255,90,20,0)');cx.fillStyle=hg;cx.beginPath();cx.arc(0,0,100,Math.PI,0);cx.fill();cx.restore()}   // soft heat glow
    for(let i=0;i<7;i++){const ph=(t*.7+i*.37)%1,x=pool.x0+(pool.x1-pool.x0)*((i*.618+Math.floor(t*.7+i*.37)*.31)%1),r=2+ph*6;cx.globalAlpha=1-ph;cx.strokeStyle='#ffd27a';cx.lineWidth=1.5;cx.beginPath();cx.arc(x,pool.y-ph*4,r,Math.PI,0);cx.stroke()}   // bubbles
    cx.restore()}
}
