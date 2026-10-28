// terrain control points (y is down)
let T=[[-500,0],[0,0],[1500,600],[1620,630],[1800,600],[1840,580],[1900,830],[2150,840],[2200,700],[3000,1280],[3200,1385],[3400,1460],[3600,1500],[3800,1515],[4000,1520],[4900,1520],[5600,1850],[5720,1880],[5880,1850],[5920,1830],[5990,2080],[6240,2090],[7200,2540],[7400,2560],[9000,2560]];
let FINISH=7800,LVc;
function ter(x){const n=T.length;if(x>=T[n-1][0])return{y:T[n-1][1],tx:1,ty:0};if(x<=T[0][0])return{y:T[0][1],tx:1,ty:0};   // flat forever past either end, at the height of the last point
  let lo=0,hi=T.length-2;while(lo<hi){const m=(lo+hi)>>1;if(x>T[m+1][0])lo=m+1;else hi=m}const i=lo;const a=T[i],b=T[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);return{y:a[1]+dy*(x-a[0])/dx,tx:dx/l,ty:dy/l}}
// skier: 0 tail,1 tip,2 ankle,3 knee,4 hip,5 shoulder,6 head,7 hand
const BOOT_BACK=6;  // how far behind the middle of the skis the boots sit (px). More = easier back flips
const C=[[0,1],[0,2],[1,2],[2,3],[3,4],[4,5],[5,6],[5,7],[0,3],[1,3]];   // last two braces make foot + shin one rigid link with the ski
const SEG={shin:27,thigh:25,torso:26,neck:12,arm:26};
let ANK=.85;                                // ankle stiffness of the two knee braces (1 = rigid like before, lower = the shin can rock over the boot; 0 = free hinge)
let ANKD=.45;                               // ankle damper: fraction of the shin-vs-ski rotation speed removed each physics step (0 = springy, 1 = dead). Equal and opposite torques, so spin is conserved
let SKIT=.15,SKIAD=.85,SKIRB=.25,SKIRK=.6;   // ski tip bounce control: for SKIT s after a ski end hits the snow with real impact, the ankle damper is stronger (SKIAD vs ANKD) and any ski end swinging away from the snow faster than SKIRB px/step (relative to the ski's middle) has SKIRK of the excess removed. Linear momentum is untouched
let LANDT=.15;                              // seconds after touchdown during which the absorber is active (it never acts while riding or taking off, so ramps and flips are unaffected)
let LAND=.2;                                // landing/bump absorber: while the skis touch the snow, this fraction of the body's up/down speed relative to the skis is removed each step, so legs cushion instead of springing back. Switched off while you actively stand up, so jumps keep their pop
let JD=0;                                   // joint damping per physics step: kills springy wobble between body parts (ankle, knees, hip) without touching the body's overall motion or spin. 0 = off, higher = deader/less bouncy
let SHIN=.28;                               // forward lean of the shin on the ski (rad)
const XMIN=-.55,XMAX=1.45;                       // range of the lean axis. The old game stopped at 0..1; going past it lets you lean back / tuck further
let CROUCH=1.4;                              // extra-deep crouch at the bottom of the mouse range (0 = old crouch, 1 = ~25deg more knee bend and ~15deg more hip fold, 2 = twice that). Fades in so mid-height poses are barely changed
let ARMTOP=1.1;                             // extra arm raise (rad) as you reach a full stand, on top of the pop throw. 0 = old arms
let CONSERVE=1;                             // spin conservation in the air. The solver that holds the body together (6 passes of joint/limb constraints) quietly bleeds off spin, and the faster you spin (tucked) the more it bleeds. 1 = the solver gives back exactly what it takes (true physics: tucking speeds you up and nothing slows you), 0 = old behaviour
const CAMX=.27,CAMY=.51;                       // where the skier sits on screen (fraction from the left / top). Original was .35 / .55; lower X = more of the slope ahead visible
let BODYOFF=1000,SKIHARD=2300;               // body / ski impact speed (px/s) that rips the skis off
const SKISOFF=true;                            // on any wipeout, skis can pop off the boots and tumble on their own; no level-specific exceptions
let HIPMAX=65;                              // hip limit in degrees (was 20). Higher = torso can lean back past the thigh line
let JUMP=1.6;                               // POP: extra launch speed (px per physics step) for a full crouch-to-stand. 0 = off. 1.6 gives a ~55px hop from a decent upward flick on flat ground
let RISE0=.003;                             // how fast you must be standing up (pose units per step) before the pop kicks in
let JUMPUP=.35;                             // pop direction: 0 = straight out of the snow (perpendicular to the slope), 1 = world-up
let COY=.1;                                 // seconds after leaving the snow during which a pop still counts (lets you pop right at a lip)
const XGB=1.7,XGF=1.5;                                // gain on left/right lean (1 = original mousemap). Higher = stronger lean, easier flips
const HIP0=.5;                               // rest-figure offset: the original skier.afig has the torso already folded ~35deg forward of the thigh at hip=0. Lower = more upright/backward lean, higher = more forward
const AUP=1.8,POPK=9,POPS=.06;                // arm throw: arms swing up in proportion to how fast you stand up. AUP = max extra swing (rad), POPK = sensitivity, POPS = smoothing (lower = longer swing)
const RESETPOSE=0,RESETIDLE=350;           // consistent stance: after RESETIDLE ms with no input on the ground, the pose eases back to the start crouch at RESETPOSE per step (0 = off)
const NY=.3;                                  // starting stance (the pose then stays wherever you leave it)
let DAMP=.85,GAIN=1;                          // pose inertia: mouse movement gives the pose a velocity that fades by DAMP each physics step (1/120s). Higher DAMP = longer glide; GAIN = total travel per mouse travel (1 = same as moving it directly)
let SMX=.12,SMY=.2;                        // how fast the "muscles" follow the mouse pose
let DMGMAX=100;                             // ski damage that makes the skis snap off
let DMGMIN=450;                             // ski-vs-ground impact speed (px/s) below which nothing is damaged
let DMGK=1/30;                              // damage per px/s above DMGMIN, per ski end (a hard landing hits both ends)
const DEADK=.2;                               // after a wipeout the joint motors keep this fraction of their strength, so the mouse can still move the body a little
let BRAKE0=.004,BRAKE1=.011,BRAMP=.5;      // click-and-hold brake: fraction of speed removed per physics step on the snow, ramping from BRAKE0 to BRAKE1 over BRAMP seconds of holding
const snow=[];let brakeT=0,snowC=0;
const SCORE_X=100;                            // points multiplier
const RESET_PENALTY=25000; let resetsUsed=0,resetPenaltyTotal=0;
let KK=.7,KH=.5,KA=.25;                    // joint motor strengths (original kp: knee > hip > shoulder)
let GRAV=900/14400,AIRDRAG=.9995;   // gravity (px per step^2) and per-step air drag on the skier
const dbg={on:false,frozen:false,ts:1,stepN:0,imp:[0,0,0,0,0,0,0,0],impT:[0,0,0,0,0,0,0,0],lock:false,auto:false,steps:0,trail:[],hist:[],crashAt:0,slope:.3,kick:true,show:{vec:true,norm:true,trail:true,rule:true,lab:true}};   // debug mode state (see the debug module at the end of the file)
let skiT=0,hit=false,dmg=0,braking=false,gT=0,lndT=0,cvx=0,cvy=0,pop=0,prevY=NY,snap=null,al=1,fdt=1/60,P,len,st,sm,ctl,cam={x:0,y:0},lastM=null,headHitFx=0,damagePulseAt=0,crashWasActive=false;
let checkpoints=[];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function clearTrickHUD(){
  // A new run/level starts with no pending trick or queued result notifications.
  trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';
  trickScoreE.classList.remove('failed','landed','power-1','power-2','power-3','power-4');
  trickScoreE.style.setProperty('--power','0');trickScoreE.style.setProperty('--scale','1');
  trickStackE.replaceChildren();queueTrickResult.nextAt=0;
}
function buildCheckpoints(){
  // Keep checkpoint flags on clear downhill-side crests, well away from designed obstacles.
  const pts=T||[], peaks=[]; let last=300;
  const clearOfObstacles=x=>{
    if(trees.some(t=>Math.abs(t.x-x)<360))return false;
    if(rocks.some(r=>Math.abs(r.x-x)<220))return false;
    if((LVc&&LVc.lava||[]).some(L=>x>L.x0-900&&x<L.x1+150))return false;   // never respawn someone on the brink of a lava pit
    if(boxes.some(b=>Math.abs(b.x-x)<(b.hw||0)+180))return false;
    return true;
  };
  for(let i=1;i<pts.length-1;i++){
    const [x,y]=pts[i], before=pts[i-1], after=pts[i+1];
    if(x<420||x>FINISH-380)continue;
    if(before[1]>y && after[1]>y && x-last>900){
      const cpX=Math.min(FINISH-180,x+55);
      if(cpX-last>900&&clearOfObstacles(cpX)){peaks.push(cpX);last=cpX;}
    }
  }
  checkpoints=(LVc&&LVc.water)?[300]:[300,...peaks];   // Shark Pool: start only
}
function checkpointFor(x){let cp=300;for(const c of checkpoints){if(c<=x+15)cp=c;else break}return cp}
function drawCheckpoints(){
  // The start at x=300 is an invisible checkpoint; no start-line graphics.
  for(const x of checkpoints){if(x<=300||x<cam.x-80||x>cam.x+W/Z+80)continue;const g=ter(x),y=g.y;
    cx.save();cx.lineWidth=3;cx.strokeStyle='#26394a';cx.beginPath();cx.moveTo(x,y);cx.lineTo(x,y-43);cx.stroke();
    cx.fillStyle='#45e3a2';cx.beginPath();cx.moveTo(x+1,y-42);cx.lineTo(x+24,y-35);cx.lineTo(x+1,y-27);cx.closePath();cx.fill();cx.restore();
  }
}
function reset(){
  camSnap();
  headHitFx=0; // clear concussion flash/dizziness whenever a level or full run is reset
  rpClear();replayMode=false;document.getElementById("replay-controls").style.removeProperty('display');document.getElementById("replay-controls").style.display="none";document.getElementById("replay-open").style.display="none";document.getElementById("replay-menu").style.display="none";
  clearTrickHUD();
  resetsUsed=0;resetPenaltyTotal=0;updateResetButton();
  dmg=0;braking=false;brakeT=0;fingers.length=0;snow.length=0;
  const x0=300,g=ter(x0),ux=g.tx,uy=g.ty,nx=g.ty,ny=-g.tx;
  sm={x:.5,y:NY};ctl={x:.5,y:NY};pop=0;prevY=NY;cvx=cvy=0;lndT=0;gT=0;const pz=pose();
  // forward kinematics in the ski frame (u forward, v up; angles CCW)
  const dir=a=>[Math.cos(a),Math.sin(a)],add=(p,d,l)=>[p[0]+d[0]*l,p[1]+d[1]*l];
  const ph=Math.PI/2-SHIN,pt=ph+pz.knee,pb=pt-pz.fold,pa=pb-(Math.PI-pz.arm);
  const ank=[-BOOT_BACK,8],kn=add(ank,dir(ph),SEG.shin),hip=add(kn,dir(pt),SEG.thigh),sh=add(hip,dir(pb),SEG.torso);
  const loc=[[-35,0],[35,0],ank,kn,hip,sh,add(sh,dir(pb-.15),SEG.neck),add(sh,dir(pa),SEG.arm)];
  P=loc.map(([a,b])=>{const x=x0+ux*a+nx*(b+3),y=g.y+uy*a+ny*(b+3);return{x,y,px:x-ux*.8,py:y-uy*.8}});
  len=C.map(([a,b])=>dist(P[a],P[b]));
  st={ff:0,bf:0,combo:0,tAir:0,bAir:0,land:0,aPts:0,fPts:0,maxV:0,time:0,adrenaline:0,la:0,fireDeath:false,specialFire:false,burnX:0,burnY:0,fireStarted:0,skisOff:false,skisStill:0,timeoutF:false,finishedLevel:false,noSkiFinish:false,warn:0,fl:0,fwFlips:0,fwDoves:0,pb:0,air:0,rot:0,ang:null,onAir:false,lt:0,lr:0,crash:false,done:false,msg:'',score:0,pendingPts:0,failedPendingShown:false,lastLandingPts:0,lastLandingAPts:0,lastLandingFPts:0,lastLandingAt:0,lastLandingRolledBack:false,lastLandingHPts:0,hPts:0,hzMult:1,hzFlat:0,hzName:'',hNames:'',sk:null,sharkDeath:false,sharkStarted:0};
  snap=null;cam.x=P[4].x-W/Z*CAMX;cam.y=P[4].y-H/Z*CAMY;
  boxes.length=0;trees.length=0;rocks.length=0;sd=11;if(LVc&&LVc.build)LVc.build();hazardInit();buildCheckpoints();fwReset();
}
function updateResetButton(){const b=document.getElementById('reset-skis');if(!b)return;b.textContent='↻ Reset Skis · −25,000'+(resetsUsed?' ('+resetsUsed+')':'');b.disabled=paused||!!(st&&st.finishedLevel);b.title='Reset skier at the latest checkpoint behind you. Deducts up to 25,000 points; '+resetsUsed+' reset'+(resetsUsed===1?'':'s')+' used. A/S grades are disabled for this run.'}
function resetSkisHere(){
  if(paused||!st||st.finishedLevel)return;
  const currentX=P&&P[4]?P[4].x:300;
  resetsUsed++;const penalty=Math.min(st.score,RESET_PENALTY);st.score-=penalty;resetPenaltyTotal+=penalty;
  respawnAt(checkpointFor(currentX));
  spray('SKIS RESET! −'+penalty.toLocaleString()+' PTS');updateResetButton();
}
// Put a fresh skier back on the snow at x0 (no penalty). Used by Reset Skis and the tutorial.
function respawnAt(x0){
  const g=ter(x0), ux=g.tx,uy=g.ty,nx=g.ty,ny=-g.tx;
  // Fully clear stale input/control state so the first movement after a checkpoint reset works normally.
  headHitFx=0;lastM=null;lastMove=performance.now();braking=false;brakeT=0;fingers.length=0;
  if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock();
  dmg=0;snow.length=0;
  sm={x:.5,y:NY};ctl={x:.5,y:NY};pop=0;prevY=NY;cvx=cvy=0;lndT=0;gT=0;const pz=pose();
  const dir=a=>[Math.cos(a),Math.sin(a)],add=(p,d,l)=>[p[0]+d[0]*l,p[1]+d[1]*l];
  const ph=Math.PI/2-SHIN,pt=ph+pz.knee,pb=pt-pz.fold,pa=pb-(Math.PI-pz.arm);
  const ank=[-BOOT_BACK,8],kn=add(ank,dir(ph),SEG.shin),hip=add(kn,dir(pt),SEG.thigh),sh=add(hip,dir(pb),SEG.torso);
  const loc=[[-35,0],[35,0],ank,kn,hip,sh,add(sh,dir(pb-.15),SEG.neck),add(sh,dir(pa),SEG.arm)];
  P=loc.map(([a,b])=>{const x=x0+ux*a+nx*(b+3),y=g.y+uy*a+ny*(b+3);return{x,y,px:x-ux*.8,py:y-uy*.8}});len=C.map(([a,b])=>dist(P[a],P[b]));
  st.crash=false;st.done=false;st.msg='';st.adrenaline=0;st.skisOff=false;st.skisStill=0;st.timeoutF=false;st.finishedLevel=false;st.noSkiFinish=false;st.warn=0;st.onAir=false;st.air=0;st.rot=0;st.ang=null;st.lt=0;st.lr=0;st.la=0;st.pendingPts=0;st.failedPendingShown=false;st.jumpScored=false;st.fin=0;st.shown=false;hazardRearm();
  snap=null;cam.x=P[4].x-W/Z*CAMX;cam.y=P[4].y-H/Z*CAMY;
  trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';trickScoreE.classList.remove('failed','landed','power-1','power-2','power-3','power-4');trickScoreE.style.setProperty('--power','0');trickScoreE.style.setProperty('--scale','1');
}
document.getElementById('reset-skis').addEventListener('click',resetSkisHere);
// Point masses (original: foot+ski 5, thigh 5, torso 10, arms 3). Every internal correction below is mass-weighted and
// translation/rotation invariant, so linear and angular momentum are conserved by the "muscles": spin comes only from the ground.
const M=[1.25,1.25,1.25,3.75,7.5,5.5,1,1.5];   // tail, tip, ankle, knee, hip, shoulder, head, hand
function pull(i,j,d,s){
  const a=P[i],b=P[j],wa=1/M[i],wb=1/M[j],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1e-6,f=(l-d)/l*s/(wa+wb);
  a.x+=dx*f*wa;a.y+=dy*f*wa;b.x-=dx*f*wb;b.y-=dy*f*wb;
}
let touchMode=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);   // true on phones/tablets; flips with the last input type used
const TOUCH_TOUGH=.6,TOUCH_HOLD=1.3;   // touch only: damage taken x0.6, and skis/body need a 30% harder hit before the skis pop off
function skiBindingBoost(){
  // Adrenaline earned through tricks temporarily tightens the bindings. Protection
  // is capped, so even a highly charged skier can still lose their skis on a brutal hit.
  const a=Math.min(1,Math.max(0,st.adrenaline||0)/100);return a*(2-a);   // 0..1, eased so even mid adrenaline gives strong protection
}
let adrDirty=true,adrShown=-1,adrHot=null;const adrFill=document.getElementById('adrenaline-fill'),adrEl=document.getElementById('adrenaline');
function updateAdrenalineUI(){adrDirty=true}   // physics just flags it; flushAdrenalineUI() touches the DOM once per frame
function flushAdrenalineUI(){if(!adrDirty)return;adrDirty=false;const a=Math.round(Math.max(0,Math.min(100,st&&st.adrenaline||0))*4)/4,hot=a>=70;if(a!==adrShown){adrShown=a;if(adrFill)adrFill.style.width=a+'%'}if(hot!==adrHot){adrHot=hot;if(adrEl)adrEl.classList.toggle('hot',hot)}}
const ALIGN_HOLD=.7,ALIGN_SOFT=.4;   // properly aligned landing (skis flat on the slope): skis need a 70% harder hit to pop off and take 40% less damage
function skisFly(){st.skisOff=true;spray('SKIS FLEW OFF!');P[0].py+=2.5;P[0].px-=1.2;P[1].py+=3;P[1].px+=1.2}
function hurt(a){if(!(a>0)||st.crash||st.done||st.skisOff)return;damagePulseAt=performance.now();const protection=skiBindingBoost();dmg=Math.min(DMGMAX,dmg+a*(1-protection*.93)*(touchMode?TOUCH_TOUGH:1));if(dmg>=DMGMAX){st.skisOff=true;st.msg='Your skis snapped off!';spray('SKIS GONE!')}else if(dmg>70&&!st.warn){st.warn=1;spray('SKIS CRACKING!')}}
function collide(){
  P.forEach((p,i)=>{
    const g=ter(p.x),off=i<2?3:i===2?4:0;if(p.y<=g.y-off)return;
    const nx=g.ty,ny=-g.tx,imp=(p.x-p.px)*nx+(p.y-p.py)*ny,dep=(p.y-g.y+off)*-ny;
    p.x+=nx*dep;p.y+=ny*dep;p.px+=nx*dep;p.py+=ny*dep;
    let vx=p.x-p.px,vy=p.y-p.py;const vn=Math.min(vx*nx+vy*ny,0);vx-=nx*vn;vy-=ny*vn;p.px=p.x-vx;p.py=p.y-vy;ct[i]=[nx,ny];hit=true;if(dbg.on&&imp<0){dbg.imp[i]=-imp*120;dbg.impT[i]=performance.now()}
    let al8=0;if(i<2){   // landing alignment: 1 when the skis lie flat along the slope (within ~8deg), fading to 0 by ~30deg of misalignment
      const ux=P[1].x-P[0].x,uy=P[1].y-P[0].y,ul=Math.hypot(ux,uy)||1,tl=Math.hypot(g.tx,g.ty)||1,dt=Math.abs((ux*g.tx+uy*g.ty)/(ul*tl)),th_=Math.acos(Math.min(1,dt));
      const q=Math.max(0,Math.min(1,(.52-th_)/(.52-.14)));al8=q*q*(3-2*q)}
    {const hv=-imp*120,protect=skiBindingBoost(),th=touchMode?TOUCH_HOLD:1,bodyLimit=BODYOFF*(1+protect*4)*th,skiLimit=SKIHARD*(1+protect*5)*th*(1+ALIGN_HOLD*al8);if(i===6&&hv>420)headHitFx=performance.now();if(i>=3&&i<=6)st.hv=Math.max(st.hv||0,hv);if(!st.skisOff&&((i>=4&&i<=6&&hv>bodyLimit)||(i<2&&hv>skiLimit)))skisFly()}
    if(i<2&&-imp*120>250)skiT=SKIT;   // a real ski impact arms the tip-bounce control (smooth riding and takeoffs never do)
    if(i<2&&-imp*120>DMGMIN)hurt((-imp*120-DMGMIN)*DMGK*(1-ALIGN_SOFT*al8));
    if(!st.crash&&((i>=4&&i<=6)||(i<2&&-imp*120>1800*(1+skiBindingBoost()*1.2)))){st.crash=true;st.msg=(st.skisOff?'No skis, no balance! ':'')+(st.air>.4||st.lr?'Wipeout on the landing! Right-click, tap or press R to retry.':'Wipeout! Right-click, tap or press R to retry.');}
  });
  {const mx=(P[0].x+P[1].x)/2,my=(P[0].y+P[1].y)/2,g=ter(mx),d=my-(g.y-3);if(d>0){const nx=g.ty,ny=-g.tx,dep=d*-ny;for(const j of [0,1]){P[j].x+=nx*dep;P[j].y+=ny*dep;P[j].px+=nx*dep;P[j].py+=ny*dep}}}
}

// ---- Crates: simple 2D rigid bodies (impulse based) that the skier can crash into, knock over and stack ------------------
const boxes=[],GR={x:0,y:0,vx:0,vy:0,w:0,m:Infinity,I:Infinity},GP=900/14400,CRATE=34;
function addCrate(x,y,a=0,sz=CRATE,m=6){boxes.push({x,y,a,vx:0,vy:0,w:0,hw:sz/2,hh:sz/2,m,I:m*sz*sz/6})}
function pyramid(x,rows){const g=ter(x),a=Math.atan2(g.ty,g.tx);for(let r=0;r<rows;r++)for(let c=0;c<rows-r;c++){addCrate(x+(c-(rows-r-1)/2)*(CRATE+1),g.y-CRATE/2-1-r*(CRATE+.5),0)}}
function corners(b){const c=Math.cos(b.a),s=Math.sin(b.a);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>{const lx=i*b.hw,ly=j*b.hh;return[b.x+lx*c-ly*s,b.y+lx*s+ly*c]})}
// impulse between bodies A and B at point (px,py); n points from A toward B. Returns approach speed (px/step)
function contactBB(A,B,px,py,nx,ny,mu){
  const rax=px-A.x,ray=py-A.y,rbx=px-B.x,rby=py-B.y;
  const rvx=(B.vx-B.w*rby)-(A.vx-A.w*ray),rvy=(B.vy+B.w*rbx)-(A.vy+A.w*rax),vn=rvx*nx+rvy*ny;if(vn>=0)return 0;
  const rna=rax*ny-ray*nx,rnb=rbx*ny-rby*nx,iA=1/A.m,iB=1/B.m,jA=1/A.I,jB=1/B.I;
  const j=-vn/(iA+iB+rna*rna*jA+rnb*rnb*jB);
  A.vx-=j*nx*iA;A.vy-=j*ny*iA;A.w-=j*rna*jA;B.vx+=j*nx*iB;B.vy+=j*ny*iB;B.w+=j*rnb*jB;
  const tx=-ny,ty=nx,vt=rvx*tx+rvy*ty,rta=rax*ty-ray*tx,rtb=rbx*ty-rby*tx;
  const jt=Math.max(-mu*j,Math.min(mu*j,-vt/(iA+iB+rta*rta*jA+rtb*rtb*jB)));
  A.vx-=jt*tx*iA;A.vy-=jt*ty*iA;A.w-=jt*rta*jA;B.vx+=jt*tx*iB;B.vy+=jt*ty*iB;B.w+=jt*rtb*jB;
  return -vn;
}
// if (px,py) is inside box b, return outward normal (from box toward the point) and depth
function inside(b,px,py,r){
  const c=Math.cos(b.a),s=Math.sin(b.a),dx=px-b.x,dy=py-b.y,lx=dx*c+dy*s,ly=-dx*s+dy*c,ex=b.hw+r-Math.abs(lx),ey=b.hh+r-Math.abs(ly);
  if(ex<=0||ey<=0)return null;
  const nlx=ex<ey?Math.sign(lx)||1:0,nly=ex<ey?0:Math.sign(ly)||1;
  return{nx:nlx*c-nly*s,ny:nlx*s+nly*c,d:Math.min(ex,ey)};
}
function stepBoxes(){for(const b of boxes){
  if(b.tm>0&&--b.tm===0){b.fixed=false;b.m=b.m0;b.I=b.I0;b.vy=.3;b.w=(Math.random()-.5)*.02;for(const n of [b.prev,b.next])if(n&&n.fixed&&!n.tm)n.tm=b.chain||5}   // bridge plank lets go and drags its neighbours down
  if(b.fixed)continue;b.vx*=.9995;b.vy=b.vy*.9995+GP;b.w*=.995;b.x+=b.vx;b.y+=b.vy;b.a+=b.w}
  stepTrees();stepRocks()}
function collideBoxes(){
  for(const b of boxes){
    if(b.fixed)continue;for(const [cx_,cy_] of corners(b)){const g=ter(cx_),dep=(cy_-g.y)*g.tx;if(dep<=0)continue;
      const ux=g.ty,uy=-g.tx;b.x+=ux*dep*.6;b.y+=uy*dep*.6;GR.x=cx_;GR.y=g.y;contactBB(b,GR,cx_,cy_,-ux,-uy,.7)}
  }
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const A=boxes[i],B=boxes[j];if((A.fixed&&B.fixed)||Math.hypot(A.x-B.x,A.y-B.y)>(A.fixed||B.fixed?220:CRATE*1.6))continue;
    for(const [P1,P2,s] of [[A,B,1],[B,A,-1]]){
      for(const [x,y] of corners(P1)){const h=inside(P2,x,y,0);if(!h)continue;
        // h.n points from P2 toward the corner (which belongs to P1)
        {const f1=P1.fixed?0:P2.fixed?.5:.25,f2=P2.fixed?0:P1.fixed?.5:.25;P1.x+=h.nx*h.d*f1;P1.y+=h.ny*h.d*f1;P2.x-=h.nx*h.d*f2;P2.y-=h.ny*h.d*f2}
        contactBB(P2,P1,x,y,h.nx,h.ny,.6)}}
  }
  // skier points vs crates
  P.forEach((p,i)=>{
    for(const b of boxes){
      if(b.k==='fire-wall'&&!st.fireDeath&&inside(b,p.x,p.y,14)){
        burnUp(p,'fire');
        // Fire is a hazard, not a solid barrier: trigger the burn, but let the skier pass through it.
      }
      if(b.k==='fire-wall')continue;
      const h=inside(b,p.x,p.y,2);if(!h)continue;
      if(b.deck){const c=Math.cos(b.a),s=Math.sin(b.a),ly=-(p.x-b.x)*s+(p.y-b.y)*c;if(ly<0){h.nx=s;h.ny=-c;h.d=b.hh+2+ly}}   // bridge decks: always push up off the top, so plank seams never snag the skis
      const pt={x:p.x,y:p.y,vx:p.x-p.px,vy:p.y-p.py,w:0,m:M[i]*3,I:Infinity};          // x3: a rider is heavier than a point
      const k=(1/b.m)/(1/b.m+1/pt.m);p.x+=h.nx*h.d*(1-k);p.y+=h.ny*h.d*(1-k);b.x-=h.nx*h.d*k;b.y-=h.ny*h.d*k;hit=true;if(b.deck&&b.fixed&&!b.tm)b.tm=b.hold||18;
      const sp=contactBB(b,pt,p.x,p.y,h.nx,h.ny,b.mu||.5)*120;if(i<2)hurt((sp-250)*.03);
      p.px=p.x-pt.vx;p.py=p.y-pt.vy;
      const L=b.lim||[650,380];if(!st.crash&&!st.done&&sp>(i<2?L[0]:L[1])){st.crash=true;st.msg=(b.say||'Crashed into a crate!')+' Right-click, tap or press R to retry.'}
    }
  });
}
const ct=[];
function spinL(){let mt=0,gx=0,gy=0,vx=0,vy=0;P.forEach((p,i)=>{const m=M[i];mt+=m;gx+=m*p.x;gy+=m*p.y;vx+=m*(p.x-p.px);vy+=m*(p.y-p.py)});gx/=mt;gy/=mt;vx/=mt;vy/=mt;
  let L=0,I=0;P.forEach((p,i)=>{const m=M[i],rx=p.x-gx,ry=p.y-gy;L+=m*(rx*(p.y-p.py-vy)-ry*(p.x-p.px-vx));I+=m*(rx*rx+ry*ry)});return{L,I,gx,gy}}
// ---- Joint motors (the original's jt_pd + mousemap) -------------------------------------------------------------------
// A motor drives the angle at joint j (between segments a-j and j-c) toward a target. It is a position-based angle
// constraint: the correction on each point is mass-weighted along the angle's gradient, which sums to zero force and zero
// torque, so it can only move the body parts relative to each other (exactly like internal muscles).
// Angle = atan2(cross, dot) of (j-a) -> (c-j) in screen coords (y down, so positive = clockwise on screen).
const wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a};
function motor(ia,ij,ic,target,s){
  const a=P[ia],j=P[ij],c=P[ic],v1x=j.x-a.x,v1y=j.y-a.y,v2x=c.x-j.x,v2y=c.y-j.y;
  const q1=v1x*v1x+v1y*v1y||1e-6,q2=v2x*v2x+v2y*v2y||1e-6;
  const e=Math.max(-.3,Math.min(.3,wrap(Math.atan2(v1x*v2y-v1y*v2x,v1x*v2x+v1y*v2y)-target)));   // angle error
  const ax=-v1y/q1,ay=v1x/q1,cx=-v2y/q2,cy=v2x/q2,jx=-ax-cx,jy=-ay-cy;            // gradient of the angle
  const wa=1/M[ia],wj=1/M[ij],wc=1/M[ic],den=wa*(ax*ax+ay*ay)+wj*(jx*jx+jy*jy)+wc*(cx*cx+cy*cy)||1e-9,k=-e/den*s;
  a.x+=k*wa*ax;a.y+=k*wa*ay;j.x+=k*wj*jx;j.y+=k*wj*jy;c.x+=k*wc*cx;c.y+=k*wc*cy;
}
// mousemap, straight from skier.keys (degrees). Mouse y: 0 = crouched, 1 = standing. Mouse x: 0 = lean back, 1 = tuck forward.
//   knee (joint 2): y 100->0   x 60->0   limits 0..100
//   hip  (joint 3): y -130->20 x 20->-20 limits -110..20
//   arm  (joint 4): y 20->70 (here the arm swings forward when you crouch, as in v2)
function pose(){
  const x=Math.min(Math.max(sm.x,XMIN),XMAX),y=Math.min(Math.max(sm.y,0),1),D=Math.PI/180;
  const g=x<.5?XGB:XGF,ce=CROUCH*(1-y)*(1-y),knee=Math.min(100+25*CROUCH,Math.max(0,100*(1-y)+25*ce+30+g*(30-66*x)))*D;
  const hip=Math.min(HIPMAX,Math.max(-110-15*CROUCH,-130-15*ce+150*y+g*(20-44*x)))*D;
  return{knee,fold:-hip+HIP0,arm:.35+.7*(1-y)+(x-.5)*.6+AUP*pop+ARMTOP*y*y*y};
}
const LASS=.0007;                             // landing helper: within ~110px of the snow and within ~80deg of upright, gently turns you to stand square to the slope and calms the spin, so near-complete flips don't land on the head. 0 = off
let UPRC=.05,UPRD=.12,UPR0=.55;               // upright spin limit: when standing (pose height above UPR0), spin faster than UPRC rad/step (~6 rad/s) is damped by UPRD per step, scaled by how upright you are. Tucked spins are unaffected. UPRD=0 turns it off
const LEANH=.0002;                          // held-lean bias: while airborne, leaning the pose forward/back adds a gentle steady spin in that direction (about 2.3 rad/s after a second at full lean; tucking afterwards shrinks the body and speeds that spin up naturally). 0 = off
const LEANB=.009;                            // lean bias in the air: horizontal mouse motion adds a small spin (right = forward, left = backward) in proportion to how far/fast you move. 0 = off
const AIRD=.22,AIRT=.09;                      // air assist: a slow forward rotation (under AIRT rad/step, about 3.6 rad/s) is damped by AIRD per step so you glide off ramps instead of drifting into a front flip. Real flips spin faster than AIRT and are untouched. AIRD=0 turns it off
function step(){
  // Fire does not change the skier's physics: after contact, normal gravity,
  // collisions, momentum and rotation continue exactly as they normally would.
  const gp=GRAV;
  const q0=st.onAir&&!st.crash?spinL():null;   // air drag may slow your travel, but it must not eat your spin
  for(const p of P){const vx=(p.x-p.px)*AIRDRAG,vy=(p.y-p.py)*AIRDRAG;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+gp}
  if(q0){const q1=spinL(),dw=(q0.L-q1.L)/(q1.I||1);P.forEach(p=>{p.px+=dw*(p.y-q1.gy);p.py-=dw*(p.x-q1.gx)})}
  stepBoxes();
  hazardStep();lavaStep();
  if(st.fireDeath&&(performance.now()-st.fireStarted)/1000<3.15){st.burnX=P[4].x;st.burnY=P[4].y-12}
  ctl.x+=cvx;ctl.y+=cvy;                                         // the pose coasts on the velocity the mouse gave it...
  if(ctl.x<XMIN||ctl.x>XMAX){ctl.x=Math.min(XMAX,Math.max(XMIN,ctl.x));cvx=0}   // ...and stops dead at its limits (no bounce)
  if(ctl.y<0||ctl.y>1){ctl.y=Math.min(1,Math.max(0,ctl.y));cvy=0}
  if(RESETPOSE>0&&!st.onAir&&!st.crash&&!st.done&&!fingers.length&&performance.now()-lastMove>RESETIDLE){   // on the snow with no input: settle back to the standard crouch so every jump starts from the same stance
    ctl.y+=(NY-ctl.y)*RESETPOSE;ctl.x+=(.5-ctl.x)*RESETPOSE;cvx*=.8;cvy*=.8}
  cvx*=DAMP;cvy*=DAMP;                                           // friction: acceleration tapers off, pose holds where it ends
  sm.x+=(ctl.x-sm.x)*SMX;sm.y+=(ctl.y-sm.y)*SMY;
  pop+=(Math.min(1,Math.max(0,((sm.y-prevY)*POPK*10-.3)/.7))-pop)*POPS;const rise=sm.y-prevY;prevY=sm.y;   // standing-up speed -> arm throw
  {  // POP: legs pushing off the snow. A pure linear launch impulse on every body part (a push through the centre of mass: no torque, no spin correction). All rotation is natural physics.
    const pe=Math.max(0,rise-RISE0);
    if(pe>0&&gT<COY&&!st.crash&&!st.done){
      const g=ter((P[0].x+P[1].x)/2);let ux=g.ty*(1-JUMPUP),uy=-g.tx*(1-JUMPUP)-JUMPUP;const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
      const dv=JUMP*pe;P.forEach(p=>{p.px-=ux*dv;p.py-=uy*dv});
    }
  }
  const pz=pose(),sf=Math.min(1,Math.max(0,(sm.y-.12)/.38));   // sf: 0 crouched .. 1 standing. The glide and landing assists fade out as you tuck, so nothing fights a tucked spin
  hit=false;const s0=CONSERVE&&st.onAir&&!st.crash?spinL():null;
  for(let k=0;k<6;k++){
    if(st.crash&&SKISOFF)st.skisOff=true;
    C.forEach(([a,b],i)=>{if(st.skisOff&&(i===1||i===2||i>=8))return;pull(a,b,len[i],i>=8?ANK:1)});   // once the skis are off, only the ski's own tail-tip link remains   // last two links are the ankle braces
    {const f=st.crash?DEADK:1;motor(2,3,4,-pz.knee,KK*f);motor(3,4,5,pz.fold,KH*f);motor(4,5,7,Math.PI-pz.arm,KA*f);motor(4,5,6,.15,.3*f)}  // knee, hip, shoulder, neck
    collide();collideBoxes();collideProps();
  }
  if(s0&&!hit){const s1=spinL(),dw=(s0.L-s1.L)/(s1.I||1);P.forEach(p=>{p.px+=dw*(p.y-s1.gy);p.py-=dw*(p.x-s1.gx)})}   // give back the spin the solver bled off (only while nothing is touching the body)
  if(AIRD>0&&st.onAir&&!st.crash&&!hit&&Math.abs(st.rot)<1.2&&Math.abs(sm.x-.5)<.12&&lastMove<st.t0-250){const q=spinL(),w=q.L/(q.I||1);if(w>0&&w<AIRT){const dw=-w*AIRD*sf;P.forEach(p=>{p.px+=dw*(p.y-q.gy);p.py-=dw*(p.x-q.gx)})}}
  if(UPRD>0&&st.onAir&&!st.crash&&!hit){const u=Math.max(0,(sm.y-UPR0)/(1-UPR0)),q=spinL(),w=q.L/(q.I||1),ex=Math.abs(w)-UPRC;if(u>0&&ex>0){const dw=-Math.sign(w)*ex*UPRD*u*u;P.forEach(p=>{p.px+=dw*(p.y-q.gy);p.py-=dw*(p.x-q.gx)})}}   // upright speed limit: standing tall in the air bleeds off only the spin above UPRC, so a stretched skier can't whirl; tucked spins (u=0) are untouched
  if(LEANH>0&&st.onAir&&!st.crash&&!hit){const ln=sm.x-.5,mag=Math.abs(ln);if(mag>.06){const dw=Math.sign(ln)*(mag-.06)*LEANH;const q=spinL();P.forEach(p=>{p.px+=dw*(p.y-q.gy);p.py-=dw*(p.x-q.gx)})}}   // held lean: slight steady rotation bias in the air (lean forward = forward spin, back = backward)
  if(LEANB>0&&st.onAir&&!st.crash&&!hit&&Math.abs(cvx)>1e-5){const q=spinL(),dw=cvx*LEANB;P.forEach(p=>{p.px+=dw*(p.y-q.gy);p.py-=dw*(p.x-q.gx)})}
  if(LASS>0&&st.onAir&&!st.crash&&!hit&&P[2].y>P[2].py){const g=ter((P[0].x+P[1].x)/2);const gap=g.y-Math.max(P[0].y,P[1].y);if(gap<220){const fade=Math.max(0,1-gap/220),fa=fade*fade*(3-2*fade);const a=Math.atan2(P[5].y-P[2].y,P[5].x-P[2].x),e=wrap(Math.atan2(-g.tx,g.ty)-a);
    if(Math.abs(e)<1.4){const q=spinL(),dw=(e*LASS-q.L/(q.I||1)*.04)*sf*fa;P.forEach(p=>{p.px+=dw*(p.y-q.gy);p.py-=dw*(p.x-q.gx)})}}}
  if(!st.skisOff){   // ankle damper: equal & opposite angular impulses on the shin {ankle,knee} and the ski {tail,tip}
    const sub=(a,b)=>{const A=P[a],B=P[b],ma=M[a],mb=M[b],g={x:(ma*A.x+mb*B.x)/(ma+mb),y:(ma*A.y+mb*B.y)/(ma+mb)},
      rax=A.x-g.x,ray=A.y-g.y,rbx=B.x-g.x,rby=B.y-g.y,I=ma*(rax*rax+ray*ray)+mb*(rbx*rbx+rby*rby)||1e-6,
      va={x:A.x-A.px,y:A.y-A.py},vb={x:B.x-B.px,y:B.y-B.py},vg={x:(ma*va.x+mb*vb.x)/(ma+mb),y:(ma*va.y+mb*vb.y)/(ma+mb)},
      L=ma*(rax*(va.y-vg.y)-ray*(va.x-vg.x))+mb*(rbx*(vb.y-vg.y)-rby*(vb.x-vg.x));
      return{pts:[[A,rax,ray],[B,rbx,rby]],I,w:L/I}};
    const sh=sub(2,3),sk=sub(0,1),Ie=sh.I*sk.I/(sh.I+sk.I),dW=(skiT>0?SKIAD:ANKD)*(sh.w-sk.w)*Ie;   // angular impulse that removes ANKD of the relative spin
    const spin=(o,dw)=>o.pts.forEach(([p,rx,ry])=>{p.px+=dw*ry;p.py-=dw*rx});       // v += dw x r  (px is x - v, so the sign flips)
    spin(sh,-dW/sh.I);spin(sk,dW/sk.I);
  }
  if(JD>0){   // internal damping: remove only the deformation part of the velocity (velocity minus rigid-body motion), so linear and angular momentum are untouched
    let mt=0,gx=0,gy=0,vx=0,vy=0;
    P.forEach((p,i)=>{const m=M[i];mt+=m;gx+=m*p.x;gy+=m*p.y;vx+=m*(p.x-p.px);vy+=m*(p.y-p.py)});
    gx/=mt;gy/=mt;vx/=mt;vy/=mt;
    let L=0,I=0;
    P.forEach((p,i)=>{const m=M[i],rx=p.x-gx,ry=p.y-gy;L+=m*(rx*(p.y-p.py-vy)-ry*(p.x-p.px-vx));I+=m*(rx*rx+ry*ry)});
    const om=L/(I||1);
    P.forEach(p=>{const rx=p.x-gx,ry=p.y-gy,dx=(p.x-p.px)-(vx-om*ry),dy=(p.y-p.py)-(vy+om*rx);p.px+=dx*JD;p.py+=dy*JD});
  }
  if(skiT>0)skiT-=1/120;
  if(skiT>0&&!st.skisOff&&!st.crash){const g=ter((P[0].x+P[1].x)/2),nx=g.ty,ny=-g.tx,n0=(P[0].x-P[0].px)*nx+(P[0].y-P[0].py)*ny,n1=(P[1].x-P[1].px)*nx+(P[1].y-P[1].py)*ny,rv=(n1-n0)/2;   // rv>0: tip rising relative to tail; rv<0: tail rising relative to tip
    if(Math.abs(rv)>SKIRB){const d=(Math.abs(rv)-SKIRB)*SKIRK*Math.sign(rv);P[1].px+=nx*d;P[1].py+=ny*d;P[0].px-=nx*d;P[0].py-=ny*d}}   // only rebound is checked against the slope normal; pushing the end back down uses equal and opposite changes so the ski's overall motion is unchanged
  if(LAND>0&&lndT>0&&!st.crash&&(ct[0]||ct[1])){
    const c=ct[0]||ct[1],vs=((P[0].x-P[0].px+P[1].x-P[1].px)*c[0]+(P[0].y-P[0].py+P[1].y-P[1].py)*c[1])/2,k0=ctl.y-sm.y>.03?0:LAND*(1-pop);   // no absorbing while the legs are still being driven upward
    for(let i=2;i<8;i++){const p=P[i],rel=(p.x-p.px)*c[0]+(p.y-p.py)*c[1]-vs,RB=.45;let r2=rel,k=k0;if(rel>RB&&k0>0){r2=rel-RB;k=Math.max(k0,.35*(1-pop)*Math.min(1,lndT/.15))}else if(rel>0)k=k0*.5;p.px+=c[0]*r2*k;p.py+=c[1]*r2*k}   // only a big rebound (faster than RB px/step away from the snow) is damped, and only for the first part of the window; gentle settling is left alone so it never feels glued to the snow
  }
  {const on=braking&&!st.crash&&!st.done&&(ct[0]||ct[1]||(st.skisOff&&ct[2]));   // click-and-hold brake: grips harder the longer you hold, and throws up snow
    if(on){const headAge=(performance.now()-headHitFx)/1000,brakeDull=headHitFx>0&&headAge>=0&&headAge<2?.55:1;brakeT=Math.min(1,brakeT+1/120/BRAMP);const b=(BRAKE0+(BRAKE1-BRAKE0)*brakeT)*brakeDull;P.forEach(p=>{p.px+=(p.x-p.px)*b});
      const q=P[0],vx=q.x-q.px,vy=q.y-q.py;if(Math.hypot(vx,vy)>.8&&(snowC++%2===0))for(let k=0;k<2;k++)snow.push({x:q.x,y:q.y-2,vx:-vx*.25+(Math.random()-.5)*.9,vy:-Math.random()*1.3-.2,l:1})}
    else brakeT=Math.max(0,brakeT-.03)}
  for(let i=snow.length-1;i>=0;i--){const q=snow[i];q.x+=q.vx;q.y+=q.vy;q.vy+=q.g||.025;q.l-=q.d||.022;if(q.g){const gy=ter(q.x).y-1;if(q.y>gy){q.y=gy;q.vx*=.6;q.vy=0}}if(q.l<=0)snow.splice(i,1)}
  P.forEach((p,i)=>{const c=ct[i];if(!c)return;ct[i]=0;const vx=p.x-p.px,vy=p.y-p.py,vn=vx*c[0]+vy*c[1],m=i<2?.0025:.08;p.px=p.x-(vx-c[0]*vn)*(1-m)-c[0]*vn;p.py=p.y-(vy-c[1]*vn)*(1-m)-c[1]*vn});
  // stunt tracking
  if(!st.crash&&!st.done){st.time+=1/120;const v=Math.hypot(P[4].x-P[4].px,P[4].y-P[4].py)*120;if(v>st.maxV)st.maxV=v}
  const air=st.skisOff?ter(P[2].x).y-P[2].y>9:[P[0],P[1]].every(p=>ter(p.x).y-p.y>5);
  if(st.crash){st.adrenaline=0}else if(!st.done){if(air&&!st.crash){const flips=Math.abs(st.rot)/6.2832;st.adrenaline=Math.min(100,(st.adrenaline||0)+(2.6+Math.min(3.8,flips*1.5))/120)}else st.adrenaline=Math.max(0,(st.adrenaline||0)-.22/120);updateAdrenalineUI()}
  const ang=Math.atan2(P[5].y-P[2].y,P[5].x-P[2].x);
  if(st.ang!==null&&st.onAir){let d=ang-st.ang;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;st.rot+=d}
  st.ang=ang;
  if(st.onAir&&!st.crash){const n=Math.floor(Math.abs(st.rot)/6.2832+.08);if(n>st.fl){st.fl=n;spray((st.rot>0?'FRONT':'BACK')+'FLIP'+(n>1?' \u00d7'+n:'')+'!', '', n>=3, 0, n>=4?'mega-flip':n>=3?'big-flip':'');if(n>=2&&n>st.fwFlips){fwTrick(P[4].x,P[4].y-35,n);st.fwFlips=n}else if(n===1&&!st.fwFlips){fwBurst(P[4].x,P[4].y-35,RM()*360,90,3.6,true);st.fwFlips=1}}
  // Trigger the heavenly big-air effect during the jump, not after touchdown.
  }
  if(!air)gT=0;else gT+=1/120;
  if(lndT>0)lndT-=1/120;
  if(!air&&st.onAir&&st.air>.15)lndT=LANDT;                      // only a real landing (not a little skip over a bump) arms the absorber
  if(air&&!st.onAir){st.air=0;st.rot=0;st.fl=0;st.fwFlips=0;st.fwDoves=0;st.lr=0;st.jumpScored=false;st.jumpFw=false;st.failedPendingShown=false;st.pendingPts=0;trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';trickScoreE.classList.remove('failed','landed','power-1','power-2','power-3','power-4');trickScoreE.style.setProperty('--power','0');trickScoreE.style.setProperty('--scale','1');st.t0=performance.now()}
  if(air)st.air+=1/120;
  if(air&&!st.crash&&!st.done&&!st.jumpFw&&st.air>.3){st.jumpFw=true;fwJump()}
  // Trick points are provisional while airborne. They only enter the real score
  // once BOTH skis touch down and the landing has not caused a crash.
  if(air&&!st.crash&&!st.fireDeath){
    const pf=Math.max(st.fl,Math.floor(Math.abs(st.rot)/6.2832));
    {const base=(Math.round(st.air*100)+pf*1000)*SCORE_X;st.pendingPts=st.hzMult>1?Math.round(base*st.hzMult+st.hzFlat):base}
  }
  if(!st.fireDeath&&!air&&st.onAir&&st.air>.4&&!st.jumpScored){
    st.lr=st.rot;st.la=st.air;
    const f=Math.max(st.fl,Math.floor(Math.abs(st.rot)/6.2832));
    const aP=Math.round(st.la*100)*SCORE_X,fP=f*1000*SCORE_X,hB=st.hzMult>1?Math.round((aP+fP)*(st.hzMult-1)+st.hzFlat):0,pts=aP+fP+hB;
    if(!st.crash){
      st.failedPendingShown=false;
      st.score+=pts;st.aPts+=aP;st.fPts+=fP;st.hPts+=hB;st.lastLandingHPts=hB;st.land++;st.tAir+=st.la;st.lastLandingPts=pts;st.lastLandingAPts=aP;st.lastLandingFPts=fP;st.lastLandingAt=performance.now();st.lastLandingRolledBack=false;st.adrenaline=Math.min(100,(st.adrenaline||0)+Math.min(44,10+Math.sqrt(Math.max(0,pts))*.28));updateAdrenalineUI();
      st.bAir=Math.max(st.bAir,st.la);st.combo=Math.max(st.combo,f);
      if(f){if(st.lr>0)st.ff+=f;else st.bf+=f}
      spray((hB?st.hzName+' ×'+st.hzMult+' · ':'')+(f?f+'× '+(st.lr>0?'FRONT':'BACK')+'FLIP':'BIG AIR'),'+'+pts.toLocaleString(),f>1||!!hB,pts,'landed');
      queueTrickResult(pts,'landed');
      trickScoreE.classList.remove('failed','power-1','power-2','power-3','power-4','landed');
      trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';
      trickScoreE.style.setProperty('--power','0');trickScoreE.style.setProperty('--scale','1');celebrateLanding(pts);fwLand(pts,f);
    }
    st.pendingPts=0;if(!st.crash)st.failedPendingShown=false;st.jumpScored=true;st.hzMult=1;st.hzFlat=0;
  }
  // Keep the same provisional score visible after a crash, and let the HUD turn it red.
  // Do not create a separate POINTS LOST notification.
  if(st.crash&&st.air>.4&&st.pendingPts>0)st.failedPendingShown=true;
  st.onAir=air;
  // Idle timer: after the skis are gone, three seconds without player input ends the run with an F.
  if(st.skisOff&&!st.done){
    if(!st.idleTimerStarted){st.idleTimerStarted=true;lastMove=performance.now()}
    if(!dbg.on&&performance.now()-lastMove>=3000){st.done=true;st.timeoutF=true;st.msg='';st.pb=best[cur]}
  }
  if(!st.done&&P[4].x>FINISH&&(!st.crash||st.skisOff)){st.done=true;st.finishedLevel=true;st.noSkiFinish=!!st.skisOff;st.pb=best[cur];st.msg='';st.pendingPts=0;st.failedPendingShown=false;trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';trickScoreE.classList.remove('failed','landed','power-1','power-2','power-3','power-4');trickScoreE.style.setProperty('--power','0');trickScoreE.style.setProperty('--scale','1');trickStackE.replaceChildren();queueTrickResult.nextAt=0;fwFinale()}
  if(st.done&&!st.shown&&!st.fireDeath&&!st.sharkDeath){st.fin=(st.fin||0)+1/120;if(st.fin>1){st.shown=true;if(!st.noSkiFinish){best[cur]=Math.max(best[cur],st.score);{const gi=RATES.indexOf(rate().r);if(bestG[cur]<0||gi<bestG[cur])bestG[cur]=gi}save()}openMenu(true)}}
  if(st.fireDeath&&!st.shown&&(performance.now()-st.fireStarted)/1000>3.15){st.shown=true;openMenu(true)}
  if(st.sharkDeath&&!st.shown&&(performance.now()-st.sharkStarted)/1000>2.2){st.shown=true;openMenu(true)}
  if(st.crash){st.adrenaline=0;updateAdrenalineUI()}
}

