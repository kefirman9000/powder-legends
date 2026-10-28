(()=>{
const KEY='skiVol';let V={master:.8,fx:.8,haz:.8,mute:false};
try{Object.assign(V,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(V))}catch(e){}};
let ac,mg,nb,bus={},L={};
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
function out(n,pan,b){let x=n;if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=cl(pan||0,-1,1);n.connect(p);x=p}x.connect(bus[b||'fx'])}
function loop(type,f,b){const s=ac.createBufferSource();s.buffer=nb;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);let p=null;if(ac.createStereoPanner){p=ac.createStereoPanner();g.connect(p);p.connect(bus[b])}else g.connect(bus[b]);s.start(0,Math.random()*1.5);return{fl,g,p}}
function init(){
 if(ac){if(ac.state!=='running')ac.resume();return}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 ac=new AC();mg=ac.createGain();mg.connect(ac.destination);
 nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 bus.fx=ac.createGain();bus.haz=ac.createGain();bus.fx.connect(mg);bus.haz.connect(mg);
 L.wind=loop('lowpass',400,'fx');L.carve=loop('bandpass',2200,'fx');L.fire=loop('bandpass',1100,'haz');L.water=loop('lowpass',600,'haz');L.shark=loop('bandpass',450,'haz');
}
function noise(dur,vol,type,f,to,pan,b){if(!ac||!vol)return;const t=ac.currentTime,s=ac.createBufferSource();s.buffer=nb;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);if(to)fl.frequency.exponentialRampToValueAtTime(to,t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);out(g,pan,b);s.start(t,Math.random());s.stop(t+dur+.05)}
function tone(f,to,dur,vol,type,pan,b,delay){if(!ac||!vol)return;const t=ac.currentTime+(delay||0),o=ac.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(to!==f)o.frequency.exponentialRampToValueAtTime(to,t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);out(g,pan,b);o.start(t);o.stop(t+dur+.05)}
// distance -> loudness, x offset -> left/right ear
function at(x,y,R){const q=P[4],dx=x-q.x,dy=y-q.y,d=Math.hypot(dx,dy),k=Math.max(0,1-d/R);return{g:k*k,p:cl(dx/700,-1,1)}}
function thump(v){noise(.3,.5*v,'lowpass',900,150,0,'fx');tone(130,35,.35,.6*v,'sine',0,'fx')}
const H0=window.hurt;window.hurt=function(a){const hp=dmg;H0.apply(this,arguments);if(ac&&dmg>hp)thump(cl(.3+a/60,.3,1))};
const S0=window.skisFly;window.skisFly=function(){S0.apply(this,arguments);if(ac){noise(.15,.5,'highpass',2500,800,0,'fx');tone(900,300,.2,.2,'square',0,'fx')}};
// landing sounds: the chime plays only once a landing has actually counted (physics.js bankLanding), never on a crash
window.sndLand=function(pts,perfect){if(!ac)return;const n=pts>9000?4:pts>2500?3:2,v=.15+.05*n;for(let i=0;i<n;i++)tone(520*Math.pow(1.26,i),520*Math.pow(1.26,i),.22,v,'triangle',0,'fx',i*.08);
  if(perfect)tone(1568,1568,.35,.12,'sine',0,'fx',n*.08+.02)};   // a bright sparkle on top for PERFECT
// failure: a short descending "bwomp" when a trick's points are lost (crash on or after touchdown, mid-air crash, not flat)
let failAt=0;window.sndFail=function(){if(!ac)return;const n=performance.now();if(n-failAt<600)return;failAt=n;
  tone(330,220,.18,.2,'triangle',0,'fx');tone(247,140,.32,.2,'triangle',0,'fx',.15);noise(.12,.08,'lowpass',600,200,0,'fx',.15)};
// end-of-level tally sounds: a fast ticking blip while points count up (rising in pitch as the row fills), a 'ka-ching' when a row finishes, and a chime for every award (bigger tiers get longer, brighter fanfares)
let tickAt=0;
window.sndTick=function(u){if(!ac)return;const n=performance.now();if(n-tickAt<42)return;tickAt=n;const f=520+900*u+(Math.random()-.5)*40;tone(f,f*1.04,.05,.13,'square',0,'fx');noise(.025,.08,'highpass',4000,0,0,'fx')};
window.sndRow=function(){if(!ac)return;tone(1175,1175,.14,.18,'triangle',0,'fx');tone(1760,1760,.3,.16,'triangle',0,'fx',.07);noise(.08,.1,'highpass',6000,3000,0,'fx')};
window.sndAward=function(ti){if(!ac)return;const sc=[[0],[0,4],[0,4,7],[0,4,7,12]][ti]||[0],base=[523,587,659,784][ti]||523;tone(150,60,.18,.35,'sine',0,'fx');sc.forEach((s2,i)=>{const f=base*Math.pow(2,s2/12);tone(f,f,.38,.2,'triangle',0,'fx',.04+i*.09);tone(f*2,f*2,.3,.06,'sine',0,'fx',.04+i*.09)});if(ti>=2)noise(.5,.12,'highpass',5000,9000,0,'fx')};
let pv={};
window.audioTick=function(){try{
 if(!ac)return;const t=ac.currentTime,T=(p,v)=>p.setTargetAtTime(v,t,.06);
 T(mg.gain,V.mute?0:V.master*V.master);T(bus.fx.gain,V.fx);T(bus.haz.gain,V.haz);
 const on=!V.mute&&!paused&&!replayMode&&st&&P&&P.length;
 if(!on){for(const k in L)T(L[k].g.gain,0);return}
 const q=P[4],sp=cl(Math.hypot(q.x-q.px,q.y-q.py)/9,0,1),ground=!st.onAir&&!st.skisOff&&!st.done;
 T(L.wind.g.gain,.4*Math.pow(sp,1.3));T(L.wind.fl.frequency,300+1300*sp);
 T(L.carve.g.gain,ground?(braking?.45:.25)*sp:0);T(L.carve.fl.frequency,braking?1200:1800+1500*sp);
 // fire: loudest at the nearest flame wall, silent when far away
 let best=null;for(const b of boxes){if(b.k!=='fire-wall')continue;const nx=cl(q.x,b.x-b.hw,b.x+b.hw),ny=cl(q.y,b.y-b.hh,b.y+b.hh),a=at(nx,ny,1300);if(!best||a.g>best.g)best=a}
 if(best&&best.g>.002){T(L.fire.g.gain,.7*best.g*(.6+.4*Math.random()));if(L.fire.p)T(L.fire.p.pan,best.p);if(Math.random()<.25)noise(.05,.5*best.g,'bandpass',1500+Math.random()*2500,0,best.p,'haz')}else T(L.fire.g.gain,0);
 // water
 const w=LVc&&LVc.water;let wg=0,wp=0;if(w&&w.x1>w.x0){const a=at(cl(q.x,w.x0,w.x1),w.y,1400);wg=.35*a.g;wp=a.p}
 T(L.water.g.gain,wg*(.7+.3*Math.sin(t*1.7)));if(L.water.p)T(L.water.p.pan,wp);
 // shark
 const s=st.sk;let sg=0,sp2=0;if(s&&s.go&&!s.done){const a=at(s.x,s.y,1500);sg=.6*a.g;sp2=a.p}
 T(L.shark.g.gain,sg);if(L.shark.p)T(L.shark.p.pan,sp2);
 // one-shots on state changes
 if(st.crash&&!pv.crash){thump(1);if(st.onAir||st.pendingPts>0||st.failedPendingShown)window.sndFail()}   // crashed mid-trick: the points are gone
 if(st.fireDeath&&!pv.fd){noise(.9,.8,'lowpass',3000,200,0,'fx');tone(400,90,.7,.3,'sawtooth',0,'fx')}
 if(st.sharkDeath&&!pv.sd&&s){const a=at(s.x,s.y,1800);noise(.3,.9,'bandpass',900,300,a.p,'haz');tone(90,40,.4,.8*Math.max(.3,a.g),'sine',a.p,'haz')}
 if(st.finishedLevel&&!pv.fin)[0,4,7,12].forEach((n,i)=>tone(440*Math.pow(2,n/12),440*Math.pow(2,n/12),.35,.2,'triangle',0,'fx',i*.1));
 pv={crash:st.crash,fd:st.fireDeath,sd:st.sharkDeath,fin:st.finishedLevel};
}catch(e){}};
// unlock audio on first touch/click/key (browsers require a gesture)
for(const ev of['pointerdown','keydown','touchend'])addEventListener(ev,init,true);
// volume UI
const $=id=>document.getElementById(id),m=$('vol-menu'),btn=$('vol-btn');
function ui(){btn.innerHTML=V.mute||V.master===0?'&#128263;':'&#128266;';$('v-mute').textContent=V.mute?'Unmute':'Mute all';for(const k of['master','fx','haz'])$('v-'+k).value=V[k]}
for(const k of['master','fx','haz'])$('v-'+k).addEventListener('input',e=>{V[k]=+e.target.value;if(V.mute&&k==='master')V.mute=false;save();ui()});
$('v-mute').addEventListener('click',()=>{V.mute=!V.mute;save();ui()});
btn.addEventListener('click',()=>{init();m.style.display=m.style.display==='block'?'none':'block';btn.blur()});
m.addEventListener('keydown',e=>e.stopPropagation());m.addEventListener('pointerup',e=>{if(e.target.type==='range')e.target.blur()});
ui();
// place the icon just left of the Levels button; the slider panel opens under it and closes when you click elsewhere
const lbE=document.getElementById('lb');
function placeVol(){const r=lbE.getBoundingClientRect();if(!r.width)return;btn.style.right=(innerWidth-r.left+6)+'px';btn.style.top=r.top+'px';btn.style.height=r.height+'px';m.style.top=(r.bottom+6)+'px';m.style.right=Math.max(10,innerWidth-r.right)+'px'}
placeVol();addEventListener('resize',placeVol);addEventListener('orientationchange',placeVol);setTimeout(placeVol,300);
if(window.ResizeObserver)new ResizeObserver(placeVol).observe(lbE);else setInterval(placeVol,500);
document.addEventListener('pointerdown',e=>{if(m.style.display==='block'&&!m.contains(e.target)&&e.target!==btn)m.style.display='none'},true);
// pause when the tab/app is hidden
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(!paused)openMenu();if(ac)ac.suspend()}else if(ac)ac.resume()});
})();
