// Controls are driven by mouse MOVEMENT (deltas), not position.
// ctl.y / ctl.x are a pose that the mouse pushes around and that clamps at its limits.
const SENS_Y=.6,SENS_X=.5; // tweak: pose travel per screen size, flip strength per px
let lastMove=0;
// Classic controls (as in the original game): where the pointer is on the game screen IS the pose. Top = stand, bottom = crouch, right = lean forward.
// The pose spans a box in the middle of the screen (CPW x CPH of its width/height), not the whole screen: the original ran in a small
// window, and a full-screen browser would otherwise need huge arm movements. Outside the box the pose just stays at its limit.
let lastAim=null;   // last pointer position seen (Classic controls), so a restart can begin in that pose
function aimAt(cx_,cy_){const r=cv.getBoundingClientRect(),w=r.width*CPW,h=r.height*CPH;lastMove=performance.now();lastAim={x:cx_,y:cy_};
  ctl.x=Math.min(1,Math.max(0,(cx_-(r.left+(r.width-w)/2))/w));ctl.y=Math.min(1,Math.max(0,1-(cy_-(r.top+(r.height-h)/2))/h))}
// Touch version of Classic controls: a drag moves the pose by the same amount the pointer box would (no glide), so a touch
// anywhere never makes the skier jump.
function dragAim(dx,dy){const r=cv.getBoundingClientRect();lastMove=performance.now();
  ctl.x=Math.min(1,Math.max(0,ctl.x+dx/(r.width*CPW)));ctl.y=Math.min(1,Math.max(0,ctl.y-dy/(r.height*CPH)))}
function move(dx,dy){if(dx||dy)lastMove=performance.now();
  const r=cv.getBoundingClientRect();
  // A head impact briefly makes the controls feel sluggish for the full 2-second dizzy period.
  const headAge=(performance.now()-headHitFx)/1000,headDull=headHitFx>0&&headAge>=0&&headAge<2?.32:1;
  const fireDull=st&&st.fireDeath?.5:1,controlDull=headDull*fireDull;
  cvy-=dy/(r.height*SENS_Y)*(1-DAMP)*GAIN*controlDull;   // damage makes steering deliberately sluggish
  cvx+=dx/(r.width*SENS_X)*(1-DAMP)*GAIN*controlDull;
}
// Mouse: move = pose, hold left button = brake, right click = restart.
// Touch: ONE finger drags to move; a SECOND finger held down brakes. (The finger that is moving never brakes.) Tap after a crash to restart.
const TOUCH_BOOST=1.2,TOUCH_ACCEL=.25,TOUCH_ACCEL_MAX=.5;   // touch only: base gain, extra gain per px/ms of finger speed, and cap on that extra
const fingers=[];   // active touch/pen pointers, in the order they went down: fingers[0] moves, any extra finger brakes
cv.addEventListener('pointermove',e=>{
  if(classicCtl&&e.pointerType==='mouse'){aimAt(e.clientX,e.clientY);return}   // Classic controls, mouse: the pointer's position is the pose
  if(classicCtl&&fingers[0]&&fingers[0].id===e.pointerId){const f=fingers[0];dragAim(e.clientX-f.x,e.clientY-f.y);f.x=e.clientX;f.y=e.clientY;f.t=e.timeStamp;return}   // Classic controls, touch: drag moves the pose
  if(e.pointerType==='mouse'){if(document.pointerLockElement===cv)move(e.movementX,e.movementY);else{if(lastM)move(e.clientX-lastM.x,e.clientY-lastM.y);lastM={x:e.clientX,y:e.clientY}}return}
  const f=fingers.find(q=>q.id===e.pointerId);if(!f)return;
  if(f===fingers[0]){
    // touch acceleration: a small base boost plus extra gain the faster the finger swipes, so phone controls feel less dampened
    const ddx=e.clientX-f.x,ddy=e.clientY-f.y,dtm=Math.max(4,e.timeStamp-(f.t||e.timeStamp-16)),spd=Math.hypot(ddx,ddy)/dtm;
    const m=TOUCH_BOOST+Math.min(TOUCH_ACCEL_MAX,spd*TOUCH_ACCEL);
    move(ddx*m,ddy*m)}
  f.x=e.clientX;f.y=e.clientY;f.t=e.timeStamp});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomT=Math.min(ZMAX,Math.max(ZMIN,zoomT*Math.exp(-e.deltaY*(e.deltaMode===1?.05:.0015))))},{passive:false});   // scroll wheel / trackpad pinch
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')lastM=null});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{
  e.preventDefault();lastMove=performance.now();
  touchMode=e.pointerType!=='mouse';
  if(e.pointerType==='mouse'){
    if(e.button===2){reset();return}                       // right click: restart
    lastM={x:e.clientX,y:e.clientY};if(e.button===0)braking=true;   // left click: brake
    // Keep the system mouse cursor visible; movement controls work without pointer lock.
    if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock();return}
  if(st.crash||st.done){reset();return}                    // tap after a wipeout / finish: restart
  fingers.push({id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp});
  // Classic controls on touch: putting a finger down does NOT jump the pose to where you touched (that straightened the legs
  // in one go and launched the skier). The pose stays put and dragging moves it from there.
  braking=fingers.length>1;                                // second finger down = brake
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
});
const upPtr=e=>{
  if(e.pointerType==='mouse'){if(e.button===0||e.type==='pointercancel')braking=false;return}
  const k=fingers.findIndex(q=>q.id===e.pointerId);if(k<0)return;fingers.splice(k,1);braking=fingers.length>1};
addEventListener('pointerup',upPtr);addEventListener('pointercancel',upPtr);addEventListener('blur',()=>{braking=false;fingers.length=0});
addEventListener('keydown',e=>{lastMove=performance.now();if(faqOpen()){if(e.key==='Escape'||e.key==='m'||e.key==='M')closeFaq();return}
  if(paused&&selE.style.display!=='none'){if(e.key==='ArrowLeft'){selStep(-1);return}if(e.key==='ArrowRight'){selStep(1);return}if(e.key==='Enter'){e.preventDefault();go(sel);return}}
  if(e.key==='m'||e.key==='M'||e.key==='Escape'){paused?closeMenu():openMenu();return}if(e.key>='1'&&e.key<='9'&&+e.key<=LV.length){go(+e.key-1);return}if(e.key==='n'||e.key==='N'){go((cur+1)%LV.length);return}if(paused){if((e.key==='r'||e.key==='R'||e.key===' ')&&fb.style.display==='flex'){e.preventDefault();go(cur)}return}if(e.key==='r'||e.key==='R'||e.key===' '){e.preventDefault();reset()}
  
  if(e.key==='+'||e.key==='=')zoomT=Math.min(ZMAX,zoomT*1.15);
  if(e.key==='-'||e.key==='_')zoomT=Math.max(ZMIN,zoomT/1.15);
  if(e.key==='0')zoomT=ZSTART;
  if(e.key==='f'||e.key==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()}});
