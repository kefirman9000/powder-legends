// ===== DEBUG MODE =====================================================================
// Menu (bottom-left) -> "Debug": a plain downhill with a live physics readout, an overlay on the skier, a graph, and tools.
// Tunable constants can be edited live; leaving debug mode puts every value back to its default.
(function(){
const $=id=>document.getElementById(id);
const ACC={GRAV:[()=>GRAV,v=>{GRAV=v}],AIRDRAG:[()=>AIRDRAG,v=>{AIRDRAG=v}],LAND:[()=>LAND,v=>{LAND=v}],LANDT:[()=>LANDT,v=>{LANDT=v}],SKIT:[()=>SKIT,v=>{SKIT=v}],SKIAD:[()=>SKIAD,v=>{SKIAD=v}],SKIRB:[()=>SKIRB,v=>{SKIRB=v}],SKIRK:[()=>SKIRK,v=>{SKIRK=v}],ANK:[()=>ANK,v=>{ANK=v}],ANKD:[()=>ANKD,v=>{ANKD=v}],JD:[()=>JD,v=>{JD=v}],KK:[()=>KK,v=>{KK=v}],KH:[()=>KH,v=>{KH=v}],KA:[()=>KA,v=>{KA=v}],SHIN:[()=>SHIN,v=>{SHIN=v}],HIPMAX:[()=>HIPMAX,v=>{HIPMAX=v}],CONSERVE:[()=>CONSERVE,v=>{CONSERVE=v}],UPRC:[()=>UPRC,v=>{UPRC=v}],UPRD:[()=>UPRD,v=>{UPRD=v}],UPR0:[()=>UPR0,v=>{UPR0=v}],JUMP:[()=>JUMP,v=>{JUMP=v}],RISE0:[()=>RISE0,v=>{RISE0=v}],JUMPUP:[()=>JUMPUP,v=>{JUMPUP=v}],COY:[()=>COY,v=>{COY=v}],BODYOFF:[()=>BODYOFF,v=>{BODYOFF=v}],SKIHARD:[()=>SKIHARD,v=>{SKIHARD=v}],DMGMIN:[()=>DMGMIN,v=>{DMGMIN=v}],DMGK:[()=>DMGK,v=>{DMGK=v}],DMGMAX:[()=>DMGMAX,v=>{DMGMAX=v}],BRAKE0:[()=>BRAKE0,v=>{BRAKE0=v}],BRAKE1:[()=>BRAKE1,v=>{BRAKE1=v}],SMX:[()=>SMX,v=>{SMX=v}],SMY:[()=>SMY,v=>{SMY=v}],DAMP:[()=>DAMP,v=>{DAMP=v}],GAIN:[()=>GAIN,v=>{GAIN=v}],CROUCH:[()=>CROUCH,v=>{CROUCH=v}]};   // direct getters/setters for the tunables (no eval, so it works under any CSP / in-app browser)
const GE=n=>ACC[n][0](),SE=(n,v)=>{ACC[n][1](+v)};
const NAMES=['tail','tip','ankle','knee','hip','shoulder','head','hand'];
const TUN=[['World','GRAV',0,.2,.0005],['World','AIRDRAG',.99,1,.0001],
 ['Landing','LAND',0,1,.01],['Landing','LANDT',0,1,.01],
 ['Ski tips','SKIT',0,1,.01],['Ski tips','SKIAD',0,1,.01],['Ski tips','SKIRB',0,2,.01],['Ski tips','SKIRK',0,1,.01],
 ['Joints','ANK',0,1,.01],['Joints','ANKD',0,1,.01],['Joints','JD',0,1,.01],['Joints','KK',0,1.5,.01],['Joints','KH',0,1.5,.01],['Joints','KA',0,1.5,.01],['Joints','SHIN',0,1,.01],['Joints','HIPMAX',0,180,1],
 ['Spin','CONSERVE',0,1,.05],['Spin','UPRC',0,.3,.005],['Spin','UPRD',0,1,.01],['Spin','UPR0',0,1,.01],
 ['Pop','JUMP',0,5,.05],['Pop','RISE0',0,.02,.0005],['Pop','JUMPUP',0,1,.05],['Pop','COY',0,.5,.01],
 ['Damage','BODYOFF',0,6000,50],['Damage','SKIHARD',0,10000,50],['Damage','DMGMIN',0,3000,25],['Damage','DMGK',0,.2,.001],['Damage','DMGMAX',1,400,1],
 ['Brake','BRAKE0',0,.05,.0005],['Brake','BRAKE1',0,.1,.0005],
 ['Pose','SMX',0,1,.01],['Pose','SMY',0,1,.01],['Pose','DAMP',.5,1,.005],['Pose','GAIN',0,3,.05],['Pose','CROUCH',0,3,.05]];
const DEF={};TUN.forEach(t=>{try{DEF[t[1]]=GE(t[1])}catch(e){console.warn('debug tunable missing:',t[1])}});
const TL=TUN.filter(t=>t[1] in DEF);

// ---- the debug level: plain constant downhill, optional kickers every ~2500px
dbg.kAng=.45;dbg.kLen=290;dbg.kGap=1800;   // jump settings: lip slope (uphill), ramp size (total length in px: ease in + straight lip + ease out), distance between jumps
function mkLevel(){const k=track(),sl=dbg.slope,a=-dbg.kAng,L=dbg.kLen;k.line(900,sl);
  if(dbg.kick)for(let i=0;i<8;i++){k.ease(L*.38,a);k.line(L*.24,a);k.ease(L*.38,sl);k.line(dbg.kGap,sl)}
  k.line(40000,sl);
  return Object.assign({},LV.find(l=>l.n==='Pine Hop')||LV[0],{n:'Debug Slope',d:'',T:k.t,fin:1e9,build:null,cliff:false})}
function applyLevel(){LVc=mkLevel();T=LVc.T;FINISH=LVc.fin}
function start(){tId++;fxStop();popsE.replaceChildren();dbg.on=true;dbg.frozen=false;dbg.ts=1;dbg.stepN=0;dbg.trail.length=0;dbg.hist.length=0;applyLevel();closeMenu();reset();sync()}
function exit(){if(!dbg.on)return;dbg.on=false;dbg.frozen=false;dbg.ts=1;TL.forEach(t=>SE(t[1],DEF[t[1]]));panel.style.display='none'}
const _go=go;go=function(){exit();return _go.apply(this,arguments)};
const _om=openMenu;openMenu=function(f){if(dbg.on&&f===true){reset();return}return _om.apply(this,arguments)};   // a run can never "finish" or save a score in debug mode

// ---- panel
const css=document.createElement('style');css.textContent=`
#dbg{position:fixed;right:0;top:112px;bottom:0;max-height:calc(100vh - 112px);max-height:calc(100dvh - 112px);width:min(330px,max(46vw,260px),100vw);z-index:4;display:none;flex-direction:column;background:#0b121cdd;color:#dfe9f5;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;border-left:1px solid #ffffff22;backdrop-filter:blur(3px)}
#dbg *{box-sizing:border-box}#dbg-h{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#173a2e;color:#aef5cf;font:700 12px system-ui;cursor:pointer;user-select:none}#dbg-h span{flex:1}
#dbg-b{overflow-y:auto;padding:6px 8px 20px;flex:1}#dbg.min{bottom:auto}#dbg.min #dbg-b{display:none}
#dbg pre{margin:0 0 6px;white-space:pre-wrap;font:inherit;color:#cfe3f7}#dbg h4{margin:8px 0 3px;font:700 11px system-ui;color:#8fd4ff;border-bottom:1px solid #ffffff20;padding-bottom:2px}
#dbg button{font:600 11px system-ui;padding:4px 7px;margin:2px 2px 2px 0;border:1px solid #ffffff33;border-radius:6px;background:#ffffff14;color:#fff;cursor:pointer}#dbg button:hover{background:#ffffff30}
#dbg label{display:inline-flex;align-items:center;gap:3px;margin-right:8px;white-space:nowrap}#dbg input[type=number],#dbg input[type=text]{width:64px;background:#000a;color:#fff;border:1px solid #ffffff33;border-radius:4px;padding:2px 4px;font:inherit}
#dbg .tr{display:grid;grid-template-columns:72px minmax(60px,1fr) 52px;gap:4px;align-items:center}#dbg .tr input[type=range]{width:100%;margin:0}#dbg .tr b{text-align:right;font-weight:600}#dbg .tr.ch{color:#ffd77a}
#dbg-b{min-height:0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}
#dbg [hidden]{display:none!important}
#dbg h4.sh{display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;-webkit-user-select:none}
#dbg .gh{display:flex;align-items:center;justify-content:space-between;margin:4px 0 1px;color:#8fd4ff;font:600 10px system-ui;cursor:pointer;user-select:none;-webkit-user-select:none}
#dbg .hb{margin:0;padding:1px 7px;min-height:20px;font:600 10px system-ui;color:#aef5cf;background:#ffffff10}
#dbg #d-allrow{display:flex;gap:4px;margin-bottom:2px}
#dbg textarea{width:100%;height:54px;background:#000a;color:#cfe;border:1px solid #ffffff33;border-radius:4px;font:inherit}#dbg canvas{width:100%;height:84px;background:#000a;border-radius:4px;display:block}`;
document.head.appendChild(css);
const panel=document.createElement('div');panel.id='dbg';
panel.innerHTML=`<div id="dbg-h"><span>🐞 DEBUG MODE</span><b id="dbg-min">▾</b></div><div id="dbg-b">
<div id="d-allrow"><button type="button" id="d-hideall">Hide all sections</button><button type="button" id="d-showall">Show all</button></div>
<h4>TIME</h4><button id="d-pause">⏸ Pause (P)</button><button id="d-step">Step 1 (.)</button><button id="d-step10">Step 10</button> <label>Speed <input type="range" id="d-ts" min=".05" max="2" step=".05" value="1" style="width:90px"><b id="d-tsv">1.00x</b></label>
<h4>SKIER</h4><button id="d-reset">↻ Respawn (R)</button><button id="d-stop">Stop</button><button id="d-boost">+300 px/s</button><button id="d-spp">Spin +</button><button id="d-spm">Spin −</button><button id="d-zadr">Adrenaline 0</button><br>
<label>Teleport to x <input type="number" id="d-tpx" value="3000" step="500"></label><button id="d-tp">Go</button>
<label>Set speed <input type="number" id="d-spd" value="800" step="100"></label><button id="d-setspd">Set</button><br>
<label><input type="checkbox" id="d-lock">Lock adrenaline 100</label><label><input type="checkbox" id="d-auto">Auto-respawn after crash</label>
<h4>LEVEL</h4><label>Slope <input type="range" id="d-slope" min="0" max="1.2" step=".05" value=".3" style="width:110px"><b id="d-slopev"></b></label><label><input type="checkbox" id="d-kick" checked>Jumps</label><br>
<label title="Slope of the lip (uphill)">Jump angle <input type="range" id="d-kang" min=".05" max="1.5" step=".05" value=".45" style="width:100px"><b id="d-kangv"></b></label><br>
<label title="Total length of the ramp in px: longer = a gentler, bigger ramp">Jump size <input type="range" id="d-klen" min="100" max="900" step="10" value="290" style="width:100px"><b id="d-klenv"></b></label><br>
<label>Jump spacing <input type="range" id="d-kgap" min="300" max="5000" step="100" value="1800" style="width:100px"><b id="d-kgapv"></b></label>
<h4>OVERLAY</h4><label><input type="checkbox" data-sh="vec" checked>Velocity</label><label><input type="checkbox" data-sh="norm" checked>Normals</label><label><input type="checkbox" data-sh="trail" checked>Trail</label><label><input type="checkbox" data-sh="rule" checked>Rulers</label><label><input type="checkbox" data-sh="lab" checked>Labels</label>
<h4>TUNABLES (live, reset on exit)</h4><div id="d-tun"></div><button id="d-defs">Reset all to defaults</button>
<h4>CHANGED VALUES (copy into the code)</h4><textarea id="d-chg" readonly></textarea><button id="d-copy">Copy</button>
<h4 id="d-rh">READOUT &amp; GRAPH</h4><div id="d-ro">
<pre id="dbg-out"></pre>
<canvas id="dbg-g" width="300" height="84"></canvas>
<div style="font-size:10px;margin:2px 0 4px"><span style="color:#7cf">■ speed</span> <span style="color:#fc6">■ vert vel</span> <span style="color:#f7a">■ spin</span> <span style="color:#8f8">■ adrenaline</span> (last 6s)</div>
</div>
<div class="dk" style="opacity:.6;margin-top:6px">Keys: P pause, . step, R respawn, +/- zoom, M menu. Mouse over this panel does not steer the skier.</div></div>`;
document.body.appendChild(panel);
panel.addEventListener('keydown',e=>e.stopPropagation());
$('dbg-h').onclick=()=>{panel.classList.toggle('min');$('dbg-min').textContent=panel.classList.contains('min')?'▸':'▾'};
$('dbg-open').onclick=start;
// ---- hide/show buttons for every section
const secs=[];
[...$('dbg-b').querySelectorAll(':scope > h4')].forEach(h=>{
  const wrap=document.createElement('div');wrap.className='sb';
  let n=h.nextSibling;while(n&&!(n.nodeType===1&&(n.tagName==='H4'||n.classList.contains('dk')))){const nx=n.nextSibling;wrap.appendChild(n);n=nx}
  h.after(wrap);h.classList.add('sh');
  const b=document.createElement('button');b.type='button';b.className='hb';h.appendChild(b);
  const set=x=>{wrap.hidden=x;b.textContent=x?'▸ show':'▾ hide';h.setAttribute('aria-expanded',String(!x))};
  h.onclick=()=>set(!wrap.hidden);set(false);secs.push(set)});
$('d-hideall').onclick=()=>secs.forEach(f=>f(true));$('d-showall').onclick=()=>secs.forEach(f=>f(false));

// ---- tunable sliders
const tun=$('d-tun');let grp='',gbox=tun;
TL.forEach(([g,n,lo,hi,stp])=>{if(g!==grp){grp=g;const h=document.createElement('div');h.className='gh';h.innerHTML='<span></span><button type="button" class="hb"></button>';h.firstChild.textContent=g;const box=gbox=document.createElement('div'),b=h.lastChild,set=x=>{box.hidden=x;b.textContent=x?'▸ show':'▾ hide'};box.className='gb';h.onclick=()=>set(!box.hidden);set(false);tun.append(h,box)}
  const r=document.createElement('div');r.className='tr';r.id='tr-'+n;const v=GE(n);
  r.innerHTML=`<span title="${n}">${n}</span><input type="range" min="${lo}" max="${hi}" step="${stp}" value="${v}"><b>${+(+v).toPrecision(4)}</b>`;
  const rg=r.children[1],b=r.children[2];rg.oninput=()=>{SE(n,rg.value);b.textContent=+(+rg.value).toPrecision(4);r.classList.toggle('ch',Math.abs(GE(n)-DEF[n])>1e-9);chg()};gbox.appendChild(r)});
function chg(){const l=TL.filter(t=>Math.abs(GE(t[1])-DEF[t[1]])>1e-9).map(t=>t[1]+'='+(+(+GE(t[1])).toPrecision(5))+'   // default '+(+(+DEF[t[1]]).toPrecision(5)));$('d-chg').value=l.join('\n')}
$('d-defs').onclick=()=>{TL.forEach(t=>{SE(t[1],DEF[t[1]]);const r=$('tr-'+t[1]);r.children[1].value=DEF[t[1]];r.children[2].textContent=+(+DEF[t[1]]).toPrecision(4);r.classList.remove('ch')});chg()};
$('d-copy').onclick=()=>{const t=$('d-chg');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}};

// ---- tools
const pause=()=>{dbg.frozen=!dbg.frozen;$('d-pause').textContent=dbg.frozen?'▶ Resume (P)':'⏸ Pause (P)'};
const stepN=n=>{if(!dbg.frozen)pause();dbg.stepN+=n};
$('d-pause').onclick=pause;$('d-step').onclick=()=>stepN(1);$('d-step10').onclick=()=>stepN(10);
$('d-ts').oninput=e=>{dbg.ts=+e.target.value;$('d-tsv').textContent=dbg.ts.toFixed(2)+'x'};
$('d-reset').onclick=()=>reset();
const tan=()=>{const g=ter(P[4].x),l=Math.hypot(g.tx,g.ty)||1;return[g.tx/l,g.ty/l]};
const setVel=(vx,vy)=>P.forEach(p=>{p.px=p.x-vx/120;p.py=p.y-vy/120});   // px/s
$('d-stop').onclick=()=>setVel(0,0);
$('d-setspd').onclick=()=>{const[tx,ty]=tan(),s=+$('d-spd').value||0;setVel(tx*s,ty*s)};
$('d-boost').onclick=()=>{const[tx,ty]=tan();P.forEach(p=>{p.px-=tx*300/120;p.py-=ty*300/120})};
const spin=dw=>{const q=spinL();P.forEach(p=>{p.px+=dw*(p.y-q.gy);p.py-=dw*(p.x-q.gx)})};
$('d-spp').onclick=()=>spin(.05);$('d-spm').onclick=()=>spin(-.05);
$('d-zadr').onclick=()=>{st.adrenaline=0};
$('d-tp').onclick=()=>{const nx=+$('d-tpx').value||0,ox=P[4].x,dy=ter(nx).y-ter(ox).y,dx=nx-ox;P.forEach(p=>{p.x+=dx;p.px+=dx;p.y+=dy;p.py+=dy});dbg.trail.length=0;cam.x+=dx;cam.y+=dy};
$('d-lock').onchange=e=>dbg.lock=e.target.checked;$('d-auto').onchange=e=>dbg.auto=e.target.checked;
const sv=()=>$('d-slopev').textContent=(Math.atan(dbg.slope)*57.2958).toFixed(1)+'°';
$('d-slope').oninput=e=>{dbg.slope=+e.target.value;sv();applyLevel();reset()};$('d-kick').onchange=e=>{dbg.kick=e.target.checked;applyLevel();reset()};
const jv=()=>{$('d-kangv').textContent=(Math.atan(dbg.kAng)*57.2958).toFixed(1)+'°';$('d-klenv').textContent=dbg.kLen+'px';$('d-kgapv').textContent=dbg.kGap+'px'};jv();
[['d-kang','kAng'],['d-klen','kLen'],['d-kgap','kGap']].forEach(([id,k])=>$(id).oninput=e=>{dbg[k]=+e.target.value;jv();applyLevel();reset()});
panel.querySelectorAll('[data-sh]').forEach(c=>c.onchange=()=>dbg.show[c.dataset.sh]=c.checked);
addEventListener('keydown',e=>{if(!dbg.on||paused||/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))return;if(e.key==='p'||e.key==='P')pause();if(e.key==='.')stepN(1)});
function sync(){sv();jv();['d-pause'].forEach(()=>$('d-pause').textContent='⏸ Pause (P)');$('d-ts').value=1;$('d-tsv').textContent='1.00x'}

// ---- per-physics-step bookkeeping (called from the main loop)
window.dbgPost=function(){dbg.steps++;const h=P[4];dbg.trail.push(h.x,h.y);if(dbg.trail.length>1800)dbg.trail.splice(0,2);
  const q=spinL(),vx=(h.x-h.px)*120,vy=(h.y-h.py)*120;dbg.hist.push([Math.hypot(vx,vy),vy,q.L/(q.I||1)*120,st.adrenaline||0]);if(dbg.hist.length>720)dbg.hist.shift();
  if(dbg.lock)st.adrenaline=100;
  if(dbg.auto&&(st.crash||st.skisOff||st.done)){if(!dbg.crashAt)dbg.crashAt=performance.now();else if(performance.now()-dbg.crashAt>1500){dbg.crashAt=0;reset()}}else dbg.crashAt=0};

// ---- overlay drawn on the game canvas
let frames=0;
window.dbgDraw=function(){frames++;const d=window.DPR||1,Q=P.map((p,i)=>snap?{x:snap[i][0]+(p.x-snap[i][0])*al,y:snap[i][1]+(p.y-snap[i][1])*al}:p),X=x=>(x-cam.x)*Z,Y=y=>(y-cam.y)*Z,now=performance.now(),sh=dbg.show;
  cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=1;cx.shadowBlur=0;cx.lineWidth=1.5*d;cx.font=(11*d)+'px ui-monospace,monospace';
  if(sh.rule){const x0=Math.floor(cam.x/250)*250;for(let x=x0;x<cam.x+W/Z;x+=250){const gy=ter(x).y,big=x%1000===0;cx.strokeStyle=big?'#ff0':'#fff8';cx.beginPath();cx.moveTo(X(x),Y(gy));cx.lineTo(X(x),Y(gy)+(big?26:12)*d);cx.stroke();if(big){cx.fillStyle='#ff0';cx.fillText('x '+x,X(x)+3*d,Y(gy)+24*d)}}}
  if(sh.trail&&dbg.trail.length>3){cx.strokeStyle='#ff8cf0aa';cx.beginPath();for(let i=0;i<dbg.trail.length;i+=2){const px=X(dbg.trail[i]),py=Y(dbg.trail[i+1]);i?cx.lineTo(px,py):cx.moveTo(px,py)}cx.stroke()}
  const arrow=(a,b,c)=>{const x1=X(a.x),y1=Y(a.y),x2=X(b.x),y2=Y(b.y),an=Math.atan2(y2-y1,x2-x1);cx.strokeStyle=c;cx.fillStyle=c;cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke();cx.beginPath();cx.moveTo(x2,y2);cx.lineTo(x2-7*d*Math.cos(an-.4),y2-7*d*Math.sin(an-.4));cx.lineTo(x2-7*d*Math.cos(an+.4),y2-7*d*Math.sin(an+.4));cx.fill()};
  P.forEach((p,i)=>{const g=ter(p.x),off=i<2?3:i===2?4:0,on=p.y>=g.y-off-.8,c=Q[i];
    if(sh.vec){const sc=i===4?.09:.05;arrow(c,{x:c.x+(p.x-p.px)*120*sc,y:c.y+(p.y-p.py)*120*sc},i===4?'#ffe14d':'#4de6ff')}
    if(sh.norm&&on&&i<3){arrow(c,{x:c.x+g.ty*28,y:c.y-g.tx*28},'#7dff9a')}
    cx.fillStyle=on?'#ff3b3b':'#fff';cx.strokeStyle='#000';cx.beginPath();cx.arc(X(c.x),Y(c.y),(on?4.5:3)*d,0,6.2832);cx.fill();cx.stroke();
    if(sh.lab){cx.fillStyle='#fff';cx.fillText(NAMES[i],X(c.x)+6*d,Y(c.y)-5*d)}
    const age=now-dbg.impT[i];if(age<1500&&dbg.imp[i]>120){cx.globalAlpha=1-age/1500;cx.fillStyle='#ffa43a';cx.fillText('hit '+Math.round(dbg.imp[i]),X(c.x)+8*d,Y(c.y)+14*d-age*.01*d);cx.globalAlpha=1}});
  const q=spinL();cx.strokeStyle='#f0f';cx.beginPath();cx.moveTo(X(q.gx)-7*d,Y(q.gy));cx.lineTo(X(q.gx)+7*d,Y(q.gy));cx.moveTo(X(q.gx),Y(q.gy)-7*d);cx.lineTo(X(q.gx),Y(q.gy)+7*d);cx.stroke();   // centre of mass
  if(dbg.frozen||dbg.ts!==1){cx.fillStyle='#ffd24a';cx.font=(16*d)+'px system-ui';cx.fillText(dbg.frozen?'PAUSED':'SLOW-MO '+dbg.ts.toFixed(2)+'x',W/2-40*d,28*d)}
  cx.restore()};

// ---- readout + graph (10-20x per second)
const out=$('dbg-out'),gc=$('dbg-g'),gx=gc.getContext('2d'),f=(v,n=1)=>(+v).toFixed(n),deg=r=>r*57.2958,nrm=a=>{while(a>Math.PI)a-=6.2832;while(a<-Math.PI)a+=6.2832;return a};
let lastT=performance.now(),lastS=0,lastF=0,sps=0,fps=0;
function ang(a,b){return Math.atan2(P[b].y-P[a].y,P[b].x-P[a].x)}
function update(){const vis=dbg.on&&!paused;panel.style.display=vis?'flex':'none';if(!vis||!P||!st)return;
  const n=performance.now(),dt=(n-lastT)/1000;if(dt>.4){sps=(dbg.steps-lastS)/dt;fps=(frames-lastF)/dt;lastT=n;lastS=dbg.steps;lastF=frames}
  if($('d-ro').closest('.sb').hidden)return;
  const p=P[4],vx=(p.x-p.px)*120,vy=(p.y-p.py)*120,sp=Math.hypot(vx,vy),g=ter(p.x),tl=Math.hypot(g.tx,g.ty)||1,tx=g.tx/tl,ty=g.ty/tl,vt=vx*tx+vy*ty,vn=vx*ty-vy*tx,slope=deg(Math.atan2(ty,tx)),q=spinL(),w=q.L/(q.I||1)*120;
  const prot=skiBindingBoost(),th=touchMode?TOUCH_HOLD:1,bl=BODYOFF*(1+prot*4)*th,sl=SKIHARD*(1+prot*5)*th;
  const con=P.map((c,i)=>{const gg=ter(c.x),off=i<2?3:i===2?4:0;return c.y>=gg.y-off-.8?NAMES[i]:null}).filter(Boolean);
  const skiA=deg(nrm(ang(0,1)-Math.atan2(ty,tx))),ankle=deg(nrm(ang(2,3)-ang(0,1))),knee=Math.abs(deg(nrm(ang(3,2)-ang(3,4)))),hip=Math.abs(deg(nrm(ang(4,3)-ang(4,5))));
  const age=i=>dbg.impT[i]?f((n-dbg.impT[i])/1000,1)+'s ago':'-';
  out.textContent=
`FPS ${f(fps,0)}  physics ${f(sps,0)}/s  t=${f(st.time,2)}s
-- POSITION --
hip x,y     ${f(p.x,1)}, ${f(p.y,1)}
ground y    ${f(g.y,1)}   height ${f(g.y-p.y,1)} px
slope       ${f(slope,1)}°  (tan ${f(ty/(tx||1),3)})
-- VELOCITY (px/s) --
vx,vy       ${f(vx,0)}, ${f(vy,0)}
speed       ${f(sp,0)}
along/norm  ${f(vt,0)} / ${f(vn,0)}
-- ROTATION --
spin ω      ${f(w,2)} rad/s  (${f(w/6.2832,2)} rev/s)
ang. mom L  ${f(q.L,1)}   inertia I ${f(q.I,0)}
air rot     ${f(st.rot,2)} rad = ${f(st.rot/6.2832,2)} flips
flips f/b   ${st.ff||0} / ${st.bf||0}   air ${f(st.air,2)}s
-- STATE --
${st.onAir?'AIRBORNE':'ON SNOW '}  contact: ${con.join(', ')||'none'}
crash ${st.crash?'YES':'no'}  skisOff ${st.skisOff?'YES':'no'}  brake ${braking?'ON':'off'} (${f(brakeT,2)}s)
coyote gT ${f(gT,3)}  landT ${f(lndT,3)}  skiT ${f(skiT,3)}
-- DAMAGE --
ski dmg     ${f(dmg,1)} / ${DMGMAX}
adrenaline  ${f(st.adrenaline||0,1)}  protect ${f(prot,2)}
body limit  ${f(bl,0)}   ski limit ${f(sl,0)} px/s
last hit    tail ${f(dbg.imp[0],0)} (${age(0)})  tip ${f(dbg.imp[1],0)} (${age(1)})
body hit    hip ${f(dbg.imp[4],0)}  shoulder ${f(dbg.imp[5],0)}  head ${f(dbg.imp[6],0)}  max ${f(st.hv||0,0)}
-- POSE --
mouse ctl   ${f(ctl.x,2)}, ${f(ctl.y,2)}   smoothed ${f(sm.x,2)}, ${f(sm.y,2)}
pop ${f(pop,2)}   rise/step ${f(sm.y-prevY,4)}
ski vs slope ${f(skiA,1)}°   ankle ${f(ankle,1)}°
knee ${f(knee,1)}°   hip ${f(hip,1)}°
-- SCORE --
score ${st.score||0}  combo ${st.combo||0}  landings ${st.land||0}  maxV ${f(st.maxV||0,0)}`;
  const W2=gc.width,H2=gc.height,h=dbg.hist;gx.clearRect(0,0,W2,H2);gx.strokeStyle='#ffffff30';gx.beginPath();gx.moveTo(0,H2/2);gx.lineTo(W2,H2/2);gx.stroke();
  [[0,1500,'#7cf',0],[1,1000,'#fc6',1],[2,20,'#f7a',1],[3,100,'#8f8',0]].forEach(([k,sc,c,sg])=>{gx.strokeStyle=c;gx.beginPath();h.forEach((r,i)=>{const x=i/720*W2,v=Math.max(-1,Math.min(1,r[k]/sc)),y=sg?H2/2-v*H2/2*.95:H2-3-v*(H2-6);i?gx.lineTo(x,y):gx.moveTo(x,y)});gx.stroke()})}
setInterval(update,60);
})();
