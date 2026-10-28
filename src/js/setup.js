const cv=document.getElementById('c'),cx=cv.getContext('2d'),box=document.getElementById('w'),hud=document.getElementById('h'),scoreE=document.getElementById('sco'),scoreT=document.getElementById('sct'),trickScoreE=document.getElementById('trick-score'),trickStackE=document.getElementById('trick-stack');
const ZSTART=(window.matchMedia('(min-width: 800px) and (pointer: fine)').matches ? .48 : .64); // Desktop starts more zoomed out; preserve the existing mobile framing. 0 returns to this
let W,H,Z=1,ZB=1,zoom=ZSTART,zoomT=ZSTART;   // Z = ZB (fit to window) * zoom (mouse wheel)
const ZMIN=.35,ZMAX=3;
const DEFAULT_SKIER_COLORS={jacket:'#14b8c9',pants:'#232c46',helmet:'#ffcf33',skis:'#ff3d7f',boots:'#1a1a22'};   // teal jacket, navy pants, sunflower helmet, hot-pink skis
const COLOR_PALETTE=[{name:'Red',hex:'#ff0000'},{name:'Orange',hex:'#ff8800'},{name:'Yellow',hex:'#ffff00'},{name:'Green',hex:'#008000'},{name:'Blue',hex:'#0000ff'},{name:'Purple',hex:'#800080'},{name:'White',hex:'#ffffff'},{name:'Black',hex:'#000000'},{name:'Grey',hex:'#808080'},{name:'Teal',hex:'#14b8c9'},{name:'Navy',hex:'#232c46'},{name:'Sunflower',hex:'#ffcf33'},{name:'Hot Pink',hex:'#ff3d7f'},{name:'Charcoal',hex:'#1a1a22'},{name:'Mint',hex:'#5ff2b0'},{name:'Lilac',hex:'#b28cff'}];
let baseSkierColors={...DEFAULT_SKIER_COLORS},colorAdjustments=Object.fromEntries(Object.keys(DEFAULT_SKIER_COLORS).map(k=>[k,{brightness:100,saturation:100}])),skierColors={...DEFAULT_SKIER_COLORS};
function colorToHsl(hex){const n=parseInt(hex.slice(1),16),r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0,sat=0,l=(max+min)/2;if(d){sat=d/(1-Math.abs(2*l-1));switch(max){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4}h*=60;if(h<0)h+=360}return {h,s:sat*100,l:l*100}}
function adjustedHex(hex,adj){const hsl=colorToHsl(hex),sat=Math.max(0,Math.min(100,hsl.s*adj.saturation/100)),light=Math.max(0,Math.min(100,hsl.l*adj.brightness/100));return `hsl(${hsl.h} ${sat}% ${light}%)`}
try{const saved=JSON.parse(localStorage.getItem('skiSkierColors')||'null');if(saved){if(saved.baseSkierColors){baseSkierColors={...baseSkierColors,...saved.baseSkierColors};colorAdjustments={...colorAdjustments,...saved.colorAdjustments}}else{baseSkierColors={...baseSkierColors,...Object.fromEntries(Object.keys(DEFAULT_SKIER_COLORS).filter(k=>/^#[0-9a-f]{6}$/i.test(saved[k]||'')).map(k=>[k,saved[k]]))}}}}catch(e){}
function drawCustomizationPreview(){syncCustomizationPreview()}
function syncCustomizationPreview(Qdraw){const canvas=document.getElementById('custom-preview');if(!canvas||!cv||!cam||!P||!P.length)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);{const g0=c.createLinearGradient(0,0,0,h);g0.addColorStop(0,LVc&&LVc.sky?LVc.sky[0]:'#14283d');g0.addColorStop(1,LVc&&LVc.sky?LVc.sky[1]:'#14283d');c.fillStyle=g0}c.fillRect(0,0,w,h);if(customizer.style.display==='none')return;const q=Qdraw||P,pts=q.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));if(!pts.length)return;/* Frame the whole skier from all body/joint points, not one torso pivot. Keep source and destination aspect ratios identical so nothing stretches. */const xs=pts.map(p=>(p.x-cam.x)*Z),ys=pts.map(p=>(p.y-cam.y)*Z);let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const padX=Math.max(34,(maxX-minX)*.24),padY=Math.max(42,(maxY-minY)*.22);let bw=maxX-minX+padX*2,bh=maxY-minY+padY*2;const aspect=w/h;/* A little extra breathing room, then expand the shorter dimension to match preview aspect. */bw*=1.12;bh*=1.12;if(bw/bh<aspect)bw=bh*aspect;else bh=bw/aspect;/* Shift the crop center slightly left so the entire skier sits a touch right in the preview. */const cx=(minX+maxX)/2-bw*.045,cy=(minY+maxY)/2;const sw=Math.min(cv.width,bw),sh=sw/aspect,cropW=sh>cv.height?cv.height*aspect:sw,cropH=cropW/aspect;const x=Math.max(0,Math.min(cv.width-cropW,cx-cropW/2)),y=Math.max(0,Math.min(cv.height-cropH,cy-cropH/2));try{c.drawImage(cv,x,y,cropW,cropH,0,0,w,h)}catch(e){}}

const CUSTOM_PARTS=[['jacket','Jacket + gloves'],['pants','Pants'],['helmet','Helmet'],['skis','Skis'],['boots','Boots']];let selectedPartIndex=0;
function currentPart(){return CUSTOM_PARTS[selectedPartIndex][0]}
function renderCustomControls(){const part=currentPart(),hex=baseSkierColors[part],color=COLOR_PALETTE.find(c=>c.hex===hex)||{name:'Custom',hex};document.getElementById('part-name').textContent=CUSTOM_PARTS[selectedPartIndex][1];document.getElementById('custom-swatch').style.background=adjustedHex(hex,colorAdjustments[part]);document.getElementById('custom-color-name').textContent=color.name;document.querySelectorAll('#custom-color-picker input[data-filter]').forEach(input=>{const key=input.dataset.filter;input.value=colorAdjustments[part][key];input.nextElementSibling.textContent=input.value+'%'})}
function applySkierColors(){for(const part of Object.keys(DEFAULT_SKIER_COLORS))skierColors[part]=adjustedHex(baseSkierColors[part]||DEFAULT_SKIER_COLORS[part],colorAdjustments[part]||{brightness:100,saturation:100});try{localStorage.setItem('skiSkierColors',JSON.stringify({baseSkierColors,colorAdjustments}))}catch(e){}renderCustomControls()}
function stepPart(dir){selectedPartIndex=(selectedPartIndex+dir+CUSTOM_PARTS.length)%CUSTOM_PARTS.length;renderCustomControls()}
function stepColor(dir){const part=currentPart();let i=COLOR_PALETTE.findIndex(c=>c.hex===baseSkierColors[part]);i=(i+dir+COLOR_PALETTE.length)%COLOR_PALETTE.length;baseSkierColors[part]=COLOR_PALETTE[i].hex;applySkierColors()}
document.getElementById('part-prev').addEventListener('click',()=>stepPart(-1));document.getElementById('part-next').addEventListener('click',()=>stepPart(1));document.getElementById('color-prev').addEventListener('click',()=>stepColor(-1));document.getElementById('color-next').addEventListener('click',()=>stepColor(1));document.querySelectorAll('#custom-color-picker input[data-filter]').forEach(input=>input.addEventListener('input',()=>{colorAdjustments[currentPart()][input.dataset.filter]=Number(input.value);applySkierColors()}));
document.getElementById('custom-reset').addEventListener('click',()=>{baseSkierColors={...DEFAULT_SKIER_COLORS};colorAdjustments=Object.fromEntries(Object.keys(DEFAULT_SKIER_COLORS).map(k=>[k,{brightness:100,saturation:100}]));applySkierColors()});
const customizer=document.getElementById('customizer'),selPanel=document.getElementById('sel'),customOpen=document.getElementById('customize-open');
function showCustomize(){if(st&&(st.done||st.crash||st.skisOff||st.fireDeath||st.sharkDeath)&&!LVc.tutorial)reset();   // after a wipeout, burn or shark there's no skier to show: start the level fresh behind the menu
  customizer.style.display='block';if(window.gearPanel)gearPanel();customizer.setAttribute('aria-hidden','false');drawCustomizationPreview()}
function hideCustomize(){customizer.style.display='none';customizer.setAttribute('aria-hidden','true')}
customOpen.addEventListener('click',showCustomize);document.getElementById('custom-back').addEventListener('click',hideCustomize);
applySkierColors();
const COARSE=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
// ---- graphics quality: High / Medium / Low, picked automatically (Auto) or fixed in Settings.
// dpr: max pixel density (phones cap at 2x; a 3x screen draws ~55% fewer pixels, hard to tell apart)
// parts: one shared budget for every in-world particle (fireworks, snow puffs, gear sparks); weather: snowfall density
const Q_LEVELS=[{name:'High',dpr:2,parts:COARSE?700:2600,weather:1},{name:'Medium',dpr:COARSE?1.5:2,parts:COARSE?420:1400,weather:.6},{name:'Low',dpr:1,parts:COARSE?240:700,weather:.35}];
let qMode='auto',qLevel=0;try{qMode=localStorage.getItem('skiGfx')||'auto'}catch(e){}
if(qMode==='high')qLevel=0;else if(qMode==='medium')qLevel=1;else if(qMode==='low')qLevel=2;
const qCur=()=>Q_LEVELS[qLevel];
function partRoom(){return Math.max(0,qCur().parts-(typeof FW!=='undefined'?FW.sp.length:0)-(typeof snow!=='undefined'?snow.length:0)-(typeof gfx!=='undefined'?gfx.sp.length:0))}
function setQuality(level){if(level===qLevel)return;qLevel=level;fit();if(typeof WX!=='undefined')WX.p.length=0}
// Auto-quality, deliberately cautious: measured over 3-second windows of actual play. Two slow windows in a row
// (under ~40 fps) step down one level, but Auto never goes below Medium (Low is only by choice in Settings).
// Four smooth windows in a row (55+ fps) step back up, so a one-off slowdown doesn't stick for the session.
const QA={sum:0,n:0,skip:0,slow:0,fast:0};
function qualityTick(rawDt){
  if(qMode!=='auto'||paused||replayMode)return;
  if(rawDt>.25){QA.sum=QA.n=0;QA.skip=60;return}   // a hitch (tab switch, level load): ignore and wait a moment
  if(QA.skip>0){QA.skip--;return}
  QA.sum+=rawDt;QA.n++;
  if(QA.sum<3)return;
  const avg=QA.sum/QA.n;QA.sum=QA.n=0;
  if(avg>1/40){QA.fast=0;if(++QA.slow>=2&&qLevel<1){setQuality(qLevel+1);QA.slow=0;QA.skip=120}}
  else if(avg<1/55){QA.slow=0;if(++QA.fast>=4&&qLevel>0){setQuality(qLevel-1);QA.fast=0;QA.skip=120}}
  else{QA.slow=0;QA.fast=0}}
function setQualityMode(m){qMode=m;try{localStorage.setItem('skiGfx',m)}catch(e){}setQuality(m==='high'?0:m==='medium'?1:m==='low'?2:0);QA.sum=QA.n=QA.slow=QA.fast=0}
window.DPR=1;
function fit(){const r=box.getBoundingClientRect(),d=window.DPR=Math.min(devicePixelRatio||1,qCur().dpr);W=cv.width=Math.max(r.width*d,2);H=cv.height=Math.max(r.height*d,2);ZB=Math.min(W/520,H/300);Z=ZB*zoom}
addEventListener('resize',fit);fit();
if(COARSE)try{Object.defineProperty(cx,'shadowBlur',{get(){return 0},set(){}})}catch(e){}   // canvas shadow blur is one of the slowest mobile GPU operations: ignore it on touch devices
