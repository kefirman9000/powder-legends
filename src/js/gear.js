// ======================= UNLOCKABLE GEAR =======================
// Special-effect gear, earned by finishing certain levels (with your skis still on). One item per slot can be
// worn at a time; equip it in the customizer. Effects are drawn on top of the normal skier, using additive
// "lighter" blending for glow so they stay cheap on phones (no canvas shadow blur).
const GEAR=[
 {id:'ice',   slot:'skis',  ic:'❄️',name:'Ice Crystal Skis',how:'Finish Icefall Slalom',  level:'Icefall Slalom'},
 {id:'lava',  slot:'skis',  ic:'🌋',name:'Lava Skis',       how:'Finish Volcano Run',     level:'Volcano Run'},
 {id:'neon',  slot:'suit',  ic:'💡',name:'Neon Suit',       how:'Finish Lantern Forest',  level:'Lantern Forest'},
 {id:'ghost', slot:'suit',  ic:'👻',name:'Ghost Suit',      how:'Finish Death Valley',    level:'Death Valley'},
 {id:'gold',  slot:'helmet',ic:'👑',name:'Gold Helmet',     how:'Finish Mega Ramp',       level:'Mega Ramp'},
 {id:'fin',   slot:'helmet',ic:'🦈',name:'Shark Fin Helmet',how:'Finish Shark Pool',      level:'Shark Pool'},
 {id:'sparks',slot:'trail', ic:'🎆',name:'Firework Trail',  how:'Finish Fireworks Hill',  level:'Fireworks Hill'},
 {id:'aurora',slot:'trail', ic:'🌌',name:'Aurora Trail',    how:'Finish The Long Haul',   level:'The Long Haul'},
 {id:'wings', slot:'trail', ic:'🪽',name:'Jump Wings',      how:'Land 100 m on Ski Jump Hill'}
];
const GSLOTS={skis:'Skis',suit:'Suit',helmet:'Helmet',trail:'Trail'};
let gear={unlocked:[],on:{}};
try{const g=JSON.parse(localStorage.getItem('skiGear')||'null');if(g&&Array.isArray(g.unlocked))gear={unlocked:g.unlocked,on:g.on||{}}}catch(e){}
const gearSave=()=>{try{localStorage.setItem('skiGear',JSON.stringify(gear))}catch(e){}};
const gearHas=id=>gear.unlocked.includes(id),gearOn=slot=>gear.on[slot]||null;
function gearUnlock(id){if(gearHas(id))return false;gear.unlocked.push(id);const g=GEAR.find(x=>x.id===id);if(g&&!gear.on[g.slot])gear.on[g.slot]=id;gearSave();return true}   // a new item is worn right away if that slot is empty
function gearSync(){GEAR.forEach(g=>{if(g.level){const i=LV.findIndex(l=>l.n===g.level);if(i>=0&&best[i]>0)gearUnlock(g.id)}})}   // players who already beat a level get its gear
function gearNewUnlocks(){   // called by the results screen
  if(!st||!st.finishedLevel||st.noSkiFinish||!LVc)return[];
  return GEAR.filter(g=>g.level===LVc.n&&gearUnlock(g.id));
}
function gearJump(m){if(m>=100&&gearUnlock('wings'))spray('UNLOCKED: JUMP WINGS','equip them in Customize',true)}
// ---- customizer panel
function gearPanel(){
  gearSync();let box=document.getElementById('gear-panel');
  if(!box){box=document.createElement('div');box.id='gear-panel';const a=document.getElementById('custom-actions');a.parentNode.insertBefore(box,a)}
  box.innerHTML='<h4>✨ Special gear <span>'+gear.unlocked.length+' / '+GEAR.length+' unlocked</span></h4>'+Object.keys(GSLOTS).map(slot=>'<div class="gslot"><b>'+GSLOTS[slot]+'</b><div class="gitems">'+
    GEAR.filter(g=>g.slot===slot).map(g=>{const has=gearHas(g.id),on=gear.on[slot]===g.id;return '<button type="button" class="gi'+(has?'':' locked')+(on?' on':'')+'" data-id="'+g.id+'"'+(has?'':' disabled')+' title="'+(has?g.name+(on?' (click to take off)':' (click to wear)'):'Locked: '+g.how)+'"><span class="gic">'+(has?g.ic:'🔒')+'</span><span class="gn">'+g.name+'</span><span class="gh">'+(has?(on?'WEARING':'tap to wear'):g.how)+'</span></button>'}).join('')+'</div></div>').join('');
  box.querySelectorAll('.gi:not(.locked)').forEach(b=>b.onclick=()=>{const g=GEAR.find(x=>x.id===b.dataset.id);gear.on[g.slot]=gear.on[g.slot]===g.id?null:g.id;gearSave();gearPanel()});
}
{const css=document.createElement('style');css.textContent=`
#gear-panel{max-width:620px;margin:12px auto 0;padding:10px;border-radius:12px;background:#ffffff0b;border:1px solid #ffffff18}
#gear-panel h4{margin:0 0 8px;font:800 13px system-ui;letter-spacing:.06em;color:#ffd36b;display:flex;justify-content:space-between}#gear-panel h4 span{color:#9fb6cc;font-weight:600;letter-spacing:0}
.gslot{display:grid;grid-template-columns:56px 1fr;align-items:center;gap:8px;margin-top:6px}.gslot>b{font:700 11px system-ui;color:#bfe9ff;letter-spacing:.08em;text-transform:uppercase}
.gitems{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.gi{display:grid;grid-template-columns:auto 1fr;column-gap:7px;align-items:center;text-align:left;padding:6px 8px;border-radius:9px;border:1px solid #ffffff28;background:#ffffff10;color:#fff;cursor:pointer;font:600 12px system-ui}
.gi .gic{grid-row:1/3;font-size:20px}.gi .gh{font:600 9.5px system-ui;color:#9fb6cc;letter-spacing:.04em}
.gi.on{border-color:#7cffa0;background:#7cffa022;box-shadow:0 0 12px #7cffa055}.gi.on .gh{color:#7cffa0}
.gi.locked{opacity:.55;cursor:default}.gi:not(.locked):hover{background:#ffffff22}`;document.head.appendChild(css)}
// ---- drawing
const gfx={hist:[],sp:[],last:0};
function gearReset(){gfx.hist.length=0;gfx.sp.length=0}
const glowLine=(a,b,w,col,alpha)=>{cx.globalAlpha=alpha;cx.strokeStyle=col;cx.lineWidth=w;cx.lineCap='round';cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()};
function drawGearBack(Q){   // behind the skier: trails and wings
  const t=performance.now()/1000,tr=gearOn('trail'),air=st&&st.onAir;
  gfx.hist.push({a:{x:Q[0].x,y:Q[0].y},b:{x:Q[1].x,y:Q[1].y},h:{x:Q[4].x,y:Q[4].y}});if(gfx.hist.length>26)gfx.hist.shift();
  if(!tr||st.fireDeath)return;cx.save();cx.globalCompositeOperation='lighter';
  if(tr==='aurora'){const H=gfx.hist;for(let i=1;i<H.length;i++){const u=i/H.length,c='hsl('+(130+u*170+Math.sin(t+i*.3)*20)+' 95% 62%)';
      cx.globalAlpha=u*.55;cx.fillStyle=c;cx.beginPath();cx.moveTo(H[i-1].a.x,H[i-1].a.y);cx.lineTo(H[i].a.x,H[i].a.y);cx.lineTo(H[i].h.x,H[i].h.y);cx.lineTo(H[i-1].h.x,H[i-1].h.y);cx.closePath();cx.fill()}}
  if(tr==='sparks'&&!paused){const v=Math.hypot(P[4].x-P[4].px,P[4].y-P[4].py);if(v>2&&gfx.sp.length<(COARSE?60:140))for(let k=0;k<2;k++){const s=Math.random()<.5?Q[0]:Q[1];gfx.sp.push({x:s.x,y:s.y,vx:(Math.random()-.5)*1.6,vy:-Math.random()*1.6,l:1,h:Math.random()*360})}}
  if(tr==='wings'&&air){const s=Q[5],h=Q[4],ang=Math.atan2(s.y-h.y,s.x-h.x),flap=Math.sin(t*9)*.25,len=34;
    cx.globalCompositeOperation='source-over';   // solid, outlined wings: glow blending vanishes against bright skies
    for(const side of [-1,1]){cx.globalAlpha=.85;const g=cx.createLinearGradient(s.x,s.y,s.x-Math.cos(ang)*len,s.y-Math.sin(ang)*len);g.addColorStop(0,'rgba(255,255,255,.98)');g.addColorStop(1,'rgba(140,200,255,.35)');cx.fillStyle=g;cx.strokeStyle='#5d9be0';cx.lineWidth=1.2;cx.lineJoin='round';
      cx.beginPath();cx.moveTo(s.x,s.y);for(let k=0;k<=4;k++){const a=ang+Math.PI+side*(.5+k*.22+flap),r=len*(1-k*.12);cx.lineTo(s.x+Math.cos(a)*r,s.y+Math.sin(a)*r)}cx.closePath();cx.fill();cx.stroke()}cx.globalCompositeOperation='lighter'}
  for(const p of gfx.sp){if(!paused){p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.l-=.025}cx.globalAlpha=Math.max(0,p.l);cx.fillStyle='hsl('+p.h+' 100% 65%)';cx.fillRect(p.x-1.2,p.y-1.2,2.4,2.4)}
  gfx.sp=gfx.sp.filter(p=>p.l>0);cx.restore();
}
function drawGearFront(Q){   // on top of the skier: skis, suit and helmet effects
  if(!st||st.fireDeath)return;const t=performance.now()/1000,sk=gearOn('skis'),su=gearOn('suit'),he=gearOn('helmet');cx.save();
  if(sk&&!st.skisOff){cx.globalCompositeOperation='lighter';
    if(sk==='lava'){glowLine(Q[0],Q[1],10,'#ff5a14',.28+.08*Math.sin(t*8));glowLine(Q[0],Q[1],3.5,'#ffc04a',.95);
      if(!paused&&Math.random()<.5)gfx.sp.push({x:Q[0].x+(Q[1].x-Q[0].x)*Math.random(),y:Q[0].y+(Q[1].y-Q[0].y)*Math.random(),vx:(Math.random()-.5)*.6,vy:-.4-Math.random()*.8,l:.8,h:20+Math.random()*25})}
    if(sk==='ice'){glowLine(Q[0],Q[1],9,'#5fd8ff',.3);glowLine(Q[0],Q[1],3,'#e6fbff',.95);
      for(let k=0;k<3;k++){const u=(t*.6+k/3)%1,x=Q[0].x+(Q[1].x-Q[0].x)*u,y=Q[0].y+(Q[1].y-Q[0].y)*u-3,s=2.5*Math.sin(u*Math.PI);cx.globalAlpha=.9;cx.strokeStyle='#ffffff';cx.lineWidth=1;cx.beginPath();cx.moveTo(x-s,y);cx.lineTo(x+s,y);cx.moveTo(x,y-s);cx.lineTo(x,y+s);cx.stroke()}}}
  if(su){const limbs=[[2,3],[3,4],[4,5],[5,7]];cx.globalCompositeOperation='lighter';
    if(su==='neon'){const hue=(t*60)%360;limbs.forEach(([a,b],i)=>{glowLine(Q[a],Q[b],9,'hsl('+((hue+i*40)%360)+' 100% 60%)',.3);glowLine(Q[a],Q[b],2,'hsl('+((hue+i*40)%360)+' 100% 82%)',.9)})}
    if(su==='ghost'){const H=gfx.hist;for(let k=1;k<=3;k++){const o=H[Math.max(0,H.length-1-k*5)];if(!o)continue;const dx=o.h.x-Q[4].x,dy=o.h.y-Q[4].y;limbs.forEach(([a,b])=>glowLine({x:Q[a].x+dx,y:Q[a].y+dy},{x:Q[b].x+dx,y:Q[b].y+dy},6,'#bfe6ff',.16/k))}
      limbs.forEach(([a,b])=>glowLine(Q[a],Q[b],8,'#d8f2ff',.18+.1*Math.sin(t*3)))}}
  if(he){cx.globalCompositeOperation='source-over';cx.globalAlpha=1;const ta=Math.atan2(Q[5].y-Q[4].y,Q[5].x-Q[4].x);cx.translate(Q[6].x,Q[6].y);cx.rotate(ta+Math.PI/4);
    if(he==='gold'){const g=cx.createLinearGradient(-6,-8,6,0);g.addColorStop(0,'#fff6c2');g.addColorStop(.4,'#ffcc33');g.addColorStop(1,'#a8740c');cx.fillStyle=g;cx.beginPath();cx.arc(0,-2,6.4,Math.PI,Math.PI*2);cx.lineTo(6.4,0);cx.lineTo(-6.4,0);cx.closePath();cx.fill();
      const sh=((t*.7)%1)*16-8;cx.globalCompositeOperation='lighter';cx.globalAlpha=.8;cx.fillStyle='#fffbe0';cx.beginPath();cx.arc(sh,-4,1.6,0,7);cx.fill()}
    if(he==='fin'){cx.fillStyle='#5f7f97';cx.strokeStyle='#2c4252';cx.lineWidth=1;cx.beginPath();cx.moveTo(-4,-7);cx.quadraticCurveTo(1,-19,7,-21);cx.quadraticCurveTo(4,-13,4,-7);cx.closePath();cx.fill();cx.stroke()}}
  cx.restore();
}
