// ======================= HAPTICS =======================
// Short phone vibrations for game events. Uses the Vibration API (Android browsers; iPhones don't support it
// on the web, so there it silently does nothing). Only buzzes while the player is using touch controls.
// hapTick() runs once per frame and fires on changes in game state, so the game code needs no extra hooks.
const HAPTIC_OK=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
let hapOn=true;try{hapOn=localStorage.getItem('skiHaptics')!=='0'}catch(e){}
function setHaptics(on){hapOn=!!on;try{localStorage.setItem('skiHaptics',on?'1':'0')}catch(e){}if(on)buzz(30,true)}
let hapLast=0,hapPrev=null;
function buzz(pattern,force){
  if(!HAPTIC_OK||!hapOn||(!touchMode&&!force))return;
  const now=performance.now();if(now-hapLast<70&&!force)return;hapLast=now;   // don't stack buzzes on top of each other
  try{navigator.vibrate(pattern)}catch(e){}
}
const HAP={
  flip:14,                                  // each full rotation in the air
  land:28,landBig:[30,40,45],               // clean landing / big trick landing
  hit:n=>Math.min(70,18+n*2),               // ski damage (scaled by how much)
  skisOff:[60,30,60],crash:[90,40,140],
  fire:[160,60,220],shark:[40,30,40,30,180],finish:[30,60,30,60,90]
};
function hapTick(){
  if(!st||!P||replayMode)return;
  const s={crash:st.crash,skisOff:st.skisOff,fire:st.fireDeath,shark:st.sharkDeath,fin:st.finishedLevel,land:st.land||0,fl:st.fl||0,dmg};
  const p=hapPrev;hapPrev=s;
  if(!p||paused)return;
  if(s.land<p.land)return;   // a new run started: just resync
  if(s.shark&&!p.shark)return buzz(HAP.shark);
  if(s.fire&&!p.fire)return buzz(HAP.fire);
  if(s.crash&&!p.crash)return buzz(HAP.crash);
  if(s.skisOff&&!p.skisOff)return buzz(HAP.skisOff);
  if(s.fin&&!p.fin)return buzz(HAP.finish);
  if(s.land>p.land)return buzz((st.lastLandingPts||0)>=200000?HAP.landBig:HAP.land);
  if(s.fl>p.fl)return buzz(HAP.flip);
  if(s.dmg>p.dmg+2)return buzz(HAP.hit(s.dmg-p.dmg));
}
addEventListener('DOMContentLoaded',()=>{   // "Vibration" switch in the sound menu; hidden where the browser can't vibrate
  const row=document.getElementById('hap-row'),box=document.getElementById('v-hap');if(!row||!box)return;
  if(!HAPTIC_OK){row.style.display='none';return}
  box.checked=hapOn;box.addEventListener('change',()=>setHaptics(box.checked));
});
