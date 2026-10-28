// ======================= SETTINGS =======================
// Opened from the ⚙ Settings button on the main menu. Holds the version and update check, vibration,
// and a reset for saved scores. (Sound levels stay in the speaker menu at the top of the screen.)
(function(){
const $=id=>document.getElementById(id);
const css=document.createElement('style');css.textContent=`
#set-modal{position:fixed;inset:0;z-index:25;display:none;align-items:center;justify-content:center;background:rgba(5,10,18,.82);padding:16px}
#set-card{width:min(420px,94vw);max-height:90vh;overflow:auto;background:#18222f;border:1px solid #ffffff30;border-radius:14px;padding:16px 18px;color:#fff;box-shadow:0 10px 40px #000a}
#set-card h3{margin:0 0 10px;font:400 26px/1 var(--gf);color:#ffd36b;display:flex;justify-content:space-between;align-items:center}
#set-card h3 button{font:600 13px system-ui;padding:5px 12px;border-radius:8px;border:1px solid #ffffff40;background:#ffffff14;color:#fff;cursor:pointer}
.set-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #ffffff18;font:600 14px system-ui}
.set-row small{display:block;font:500 12px system-ui;opacity:.65;margin-top:2px}
.set-row button{flex:none;font:700 13px system-ui;padding:8px 14px;border-radius:9px;border:0;background:#2f7ddd;color:#fff;cursor:pointer}
.set-row button.danger{background:#7a2a33}
.set-row input[type=checkbox]{width:22px;height:22px;accent-color:#7cffa0}`;
document.head.appendChild(css);
const m=document.createElement('div');m.id='set-modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
m.innerHTML=`<div id="set-card"><h3>⚙ Settings <button type="button" id="set-close">Done</button></h3>
 <div class="set-row"><div>Game version<small id="set-ver"></small></div><button type="button" id="set-upd">Check for updates</button></div>
 <div class="set-row" id="set-hap-row"><div>Vibration<small>Short buzzes on landings, flips and crashes (Android phones)</small></div><input type="checkbox" id="set-hap"></div>
 <div class="set-row"><div>Reset all scores<small>Clears best scores, grades and records. Unlocked gear is kept.</small></div><button type="button" class="danger" id="set-reset">Reset</button></div></div>`;
document.body.appendChild(m);
function open(){
  $('set-ver').textContent='v'+GAME_VERSION+(window.__SKI_FROM_UPDATE?' (installed update)':'');
  const ok=typeof HAPTIC_OK!=='undefined'&&HAPTIC_OK;$('set-hap-row').style.display=ok?'':'none';if(ok)$('set-hap').checked=hapOn;
  $('set-reset').textContent='Reset';m.style.display='flex'}
const close=()=>{m.style.display='none'};
$('set-btn').addEventListener('click',open);$('set-close').addEventListener('click',close);
m.addEventListener('pointerdown',e=>{if(e.target===m)close()});m.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close()});
$('set-upd').addEventListener('click',()=>{close();if(window.updCheck)updCheck()});
$('set-hap').addEventListener('change',e=>{setHaptics(e.target.checked);const b=$('v-hap');if(b)b.checked=e.target.checked});
$('set-reset').addEventListener('click',e=>{const b=e.target;if(b.textContent==='Reset'){b.textContent='Tap again to confirm';return}   // two taps, so it can't happen by accident
  best.fill(0);bestG.fill(-1);save();['skiJumpRecord','skiEndlessM'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
  LV.forEach(l=>{delete l._preview});showSel(0);b.textContent='Scores cleared ✓'});
})();
