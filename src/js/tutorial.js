// ======================= FIRST-RUN TUTORIAL ("Ski School") =======================
// A short guided slope. Each step shows a prompt and moves on only when the player actually does the move.
// Wipe out (or miss a jump) and you're put back just before that part, with no penalty.
// Starts automatically the very first time the game is opened; replay any time from the menu.
(function(){
const $=id=>document.getElementById(id);
// ---- the slope: a flat start to practise the controls, a long run to learn the brake, a small kicker, a big kicker
const TUT_LV=LV.find(l=>l.tutorial),K={t:TUT_LV.T,L1:TUT_LV.L1,L2:TUT_LV.L2};   // the Ski School level (levels.js)
const touch=()=>touchMode;
const done=s=>{try{localStorage.setItem('skiTutDone','1')}catch(e){}};
// ---- steps
//   hold: keep the skier parked while practising.  cond: true when the move is done.  fail: true when the chance was missed.
const STEPS=[
 {t:()=>touch()?'Drag your finger <b>DOWN</b> to crouch':'Move the mouse <b>DOWN</b> to crouch',sub:'Only movement counts: your pose stays where you leave it.',hold:1,
  cond:()=>ctl.y<.12},
 {t:()=>touch()?'Now drag <b>UP</b> to stand tall':'Now move the mouse <b>UP</b> to stand tall',sub:'Flick up fast from a crouch and you\'ll pop off the snow.',hold:1,
  cond:()=>ctl.y>.88},
 {t:()=>touch()?'Drag <b>LEFT</b> to lean back, then <b>RIGHT</b> to tuck forward':'Move <b>LEFT</b> to lean back, then <b>RIGHT</b> to tuck forward',sub:'Leaning is how you spin in the air.',hold:1,
  cond:s=>{if(ctl.x<.1)s.back=1;if(ctl.x>.9)s.fwd=1;return s.back&&s.fwd}},
 {t:()=>touch()?'Off you go! Hold a <b>SECOND FINGER</b> down to brake':'Off you go! <b>Hold the left mouse button</b> to brake',sub:'The brake grips harder the longer you hold it.',back:1100,
  enter:()=>{if(P[4].x<800)P.forEach(p=>{p.px-=280/120})},
  cond:()=>brakeT>=.55&&!st.onAir,fail:()=>P[4].x>K.L1-600},
 {t:()=>'Ramp ahead! <b>Crouch</b> on the way up, then flick <b>UP</b> at the lip',sub:'Let go of the brake to keep your speed. Land with your skis flat.',back:K.L1-900,
  enter:s=>{s.base=st.land||0},cond:s=>(st.land||0)>s.base,fail:()=>P[4].x>K.L1+1100&&!st.onAir},
 {t:()=>touch()?'Big ramp: in the air, drag <b>LEFT + DOWN</b> to spin a backflip':'Big ramp: in the air, move <b>LEFT + DOWN</b> to spin a backflip',sub:'Tuck tight to spin faster. Stand up straight (UP, back to the middle) before you land.',back:K.L2-1000,
  enter:s=>{s.base=(st.ff||0)+(st.bf||0)},cond:s=>(st.ff||0)+(st.bf||0)>s.base,fail:()=>P[4].x>K.L2+1500&&!st.onAir}
];
const tut={on:false,i:0,s:{},crashAt:0,okAt:0,endAt:0};
window.tut=tut;
// ---- UI
const css=document.createElement('style');css.textContent=`
#tut-box{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 104px);transform:translateX(-50%);z-index:3;width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:10px 14px 11px;border-radius:14px;background:#0b1a2be6;border:1px solid #8bdfff77;box-shadow:0 8px 24px #0006;color:#fff;text-align:center;display:none;pointer-events:none}
#tut-step{font:800 10px system-ui;letter-spacing:.2em;color:#8fd4ff}
#tut-txt{font:400 clamp(17px,3.4vw,24px)/1.2 var(--gf);margin-top:4px}#tut-txt b{color:#ffd36b;font-weight:400}
#tut-sub{font:13px/1.35 system-ui;opacity:.8;margin-top:4px}
#tut-dots{display:flex;gap:5px;justify-content:center;margin-top:7px}#tut-dots i{width:22px;height:4px;border-radius:3px;background:#ffffff30}#tut-dots i.on{background:#7cffa0}
#tut-box.ok{border-color:#7cffa0;animation:tutOk .45s ease-out}@keyframes tutOk{30%{transform:translateX(-50%) scale(1.05)}}
#tut-skip{pointer-events:auto;margin-top:8px;font:600 11px system-ui;padding:4px 10px;border-radius:7px;border:1px solid #ffffff40;background:#ffffff14;color:#fff;cursor:pointer}`;
document.head.appendChild(css);
const box=document.createElement('div');box.id='tut-box';
box.innerHTML='<div id="tut-step"></div><div id="tut-txt"></div><div id="tut-sub"></div><div id="tut-dots">'+STEPS.map(()=>'<i></i>').join('')+'</div><button id="tut-skip" type="button">Skip tutorial</button>';
document.body.appendChild(box);
function render(){const s=STEPS[tut.i];if(!s)return;$('tut-step').textContent='SKI SCHOOL · STEP '+(tut.i+1)+' OF '+STEPS.length;$('tut-txt').innerHTML=s.t();$('tut-sub').textContent=s.sub||'';
  [...$('tut-dots').children].forEach((d,k)=>d.classList.toggle('on',k<tut.i))}
function enter(i){tut.i=i;tut.s={};tut.okAt=0;const s=STEPS[i];if(s&&s.enter)s.enter(tut.s);render()}
function back(msg){const s=STEPS[tut.i];respawnAt(s.back||300);if(s.enter)s.enter(tut.s);spray(msg||'TRY AGAIN!')}
// ---- start / stop
window.startTutorial=function(){
  if(dbg.on)exitDebug();
  tId++;fxStop();popsE.replaceChildren();cur=LV.indexOf(TUT_LV);LVc=TUT_LV;T=LVc.T;FINISH=LVc.fin;closeMenu();reset();
  tut.on=true;tut.crashAt=0;tut.endAt=0;enter(0);$('reset-skis').style.display='none';
};
function stop(){if(!tut.on)return;tut.on=false;box.style.display='none';$('reset-skis').style.display=''}
window.tutStop=stop;
const _go=go;go=function(){stop();return _go.apply(this,arguments)};
function finish(){done();stop();openMenu();mh.textContent='🎓 Ski School complete!';ms.textContent='You\'re ready. Pick a level and go send it.';sel=(cur+1)%LV.length;showSel(1)}   // land on the first real level
$('tut-skip').onclick=()=>{done();stop();openMenu();sel=(cur+1)%LV.length;showSel(1)};
// first launch: run the tutorial instead of showing the menu (only for brand-new players)
window.tutAutoStart=function(){let seen=false;try{seen=localStorage.getItem('skiTutDone')==='1'}catch(e){}
  if(seen||best.some(b=>b>0)){done();return false}startTutorial();return true};
// ---- per physics step
window.tutPost=function(){
  if(!tut.on)return;const s=STEPS[tut.i],now=performance.now();
  if(tut.endAt){if(now>tut.endAt)finish();return}
  if(s.hold){let mt=0,vx=0;P.forEach((p,k)=>{mt+=M[k];vx+=M[k]*(p.x-p.px)});vx/=mt;P.forEach(p=>{p.px+=vx})}   // parked: cancel sliding, keep the body free to move
  if(st.crash||st.skisOff||st.fireDeath){if(!tut.crashAt)tut.crashAt=now;else if(now-tut.crashAt>1300){tut.crashAt=0;back()}return}
  tut.crashAt=0;
  if(!s.hold&&!st.onAir){const sp=Math.hypot(P[4].x-P[4].px,P[4].y-P[4].py)*120;
    if(P[4].x<720&&sp<150)P.forEach(p=>{p.px-=.4});                 // back on the flat start (R / restart): roll them onto the slope
    else if(sp<25){if(!tut.stallAt)tut.stallAt=now;else if(now-tut.stallAt>3500){tut.stallAt=0;back('KEEP MOVING!')}}else tut.stallAt=0}
  if(tut.okAt){if(now-tut.okAt>350){   // landed and still standing a moment later: step passed
      box.classList.remove('ok');void box.offsetWidth;box.classList.add('ok');
      if(tut.i+1<STEPS.length){spray('NICE!');enter(tut.i+1)}
      else{spray('YOU\'RE A NATURAL!','',true);for(let k=0;k<6;k++)fwRocket(P[4].x+120+k*110,P[4].y-220-Math.random()*120,k*10);[...$('tut-dots').children].forEach(d=>d.classList.add('on'));$('tut-txt').innerHTML='Tutorial complete!';$('tut-sub').textContent='';tut.endAt=now+2600}}
    return}
  if(s.cond(tut.s)){tut.okAt=now;return}
  if(s.fail&&s.fail())back('MISSED IT! AGAIN');
};
// ---- every frame: show the prompt only while actually playing
let lastTouch=null;
window.tutFrame=function(){const show=tut.on&&!paused&&!replayMode;if((box.style.display!=='none')!==show)box.style.display=show?'block':'none';
  if(show&&!tut.endAt&&touchMode!==lastTouch){lastTouch=touchMode;render()}};   // switch mouse/finger wording if the input type changes
})();

// players who've finished (or skipped) Ski School start the menu on the first real level
try{if(localStorage.getItem('skiTutDone')==='1'&&LV[cur]&&LV[cur].tutorial)cur=LV.findIndex(l=>!l.tutorial)}catch(e){}
