// ======================= SCENERY: parallax mountains + weather =======================
// Both are drawn in screen space. Colours come from each level's sky / far colours, so every level gets
// a matching backdrop without extra setup. A level can set weather:'snow' | 'ash' | 'none' (default 'snow').
function hexRgb(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]}
function mixHex(a,b,t){const A=hexRgb(a),B=hexRgb(b);return'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'}
// three mountain layers: furthest first. px = sideways parallax, py = vertical drift with the descent,
// base = horizon height (fraction of screen), amp = peak height, sharp = how jagged the peaks are
const MTN=[{px:.04,py:.012,base:.44,amp:210,sharp:.55,seed:1.7,haze:.6,cap:1},
           {px:.09,py:.03,base:.56,amp:160,sharp:.35,seed:4.1,haze:.32,cap:.6},
           {px:.17,py:.06,base:.68,amp:110,sharp:.15,seed:7.3,haze:0,cap:0}];
let mtnY0=null;
function mtnHeight(L,wx){const s=L.seed;let h=Math.sin(wx/310+s)*.5+Math.sin(wx/131+s*2.3)*.3+Math.sin(wx/57+s*.7)*.2;   // -1..1 rolling
  const pk=1-Math.abs(Math.sin(wx/(190+s*20)+s));return (h*.5+.5)*(1-L.sharp)+pk*pk*L.sharp}                          // add pointy peaks
// Each layer is rendered once into its own image (wider and taller than the screen, at reduced resolution since the
// shapes are soft) and simply shifted as the camera moves. A layer is re-rendered only when it has slid past its margin,
// or the zoom, screen size, quality or level changes: three cheap image copies per frame instead of three big
// gradient-filled paths.
const MTC=MTN.map(()=>({cv:null,g:null,key:'',ox:0,dr:0,mw:0,pad:0}));
let skyCache={key:'',g:null};
function mtnRender(L,c,sc,off,drift){
  const mw=Math.round(W*.35),pad=Math.round(H*.16),cw=W+mw*2,ch=H+pad*2;
  const r=Math.min(qLevel>=2||COARSE?.5:.75,720/ch);
  if(!c.cv)c.cv=document.createElement('canvas');
  const pw=Math.max(2,Math.round(cw*r)),ph=Math.max(2,Math.round(ch*r));if(c.cv.width!==pw||c.cv.height!==ph){c.cv.width=pw;c.cv.height=ph}
  const g=c.cv.getContext('2d');g.setTransform(r,0,0,r,0,0);g.clearRect(0,0,cw,ch);
  const baseY=H*L.base-drift+pad,col=mixHex(LVc.far,LVc.sky[1],L.haze),top=mixHex(LVc.far,'#ffffff',.1+L.cap*.25);
  const gr=g.createLinearGradient(0,baseY-L.amp*sc,0,baseY+40*sc);gr.addColorStop(0,top);gr.addColorStop(.45,col);gr.addColorStop(1,col);
  g.fillStyle=gr;g.beginPath();g.moveTo(0,ch);const step=Math.max(12,Math.round(cw/90));
  for(let X=0;X<=cw+step;X+=step){const wx=(X-mw)/sc+off;g.lineTo(X,baseY-L.amp*sc*mtnHeight(L,wx))}
  g.lineTo(cw,ch);g.closePath();g.fill();
  c.ox=off;c.dr=drift;c.mw=mw;c.pad=pad;c.cw=cw;c.ch=ch;
}
function drawMountains(){
  const sc=ZB*zoom;if(mtnY0===null)mtnY0=cam.y;
  MTN.forEach((L,li)=>{
    const c=MTC[li],off=cam.x*L.px,drift=Math.max(-.12*H,Math.min(.12*H,(cam.y-mtnY0)*L.py*sc));
    const key=W+'x'+H+'@'+sc.toFixed(4)+'|'+qLevel+'|'+(LVc&&LVc.n);
    let dx=(off-c.ox)*sc,dy=drift-c.dr;
    if(c.key!==key||Math.abs(dx)>c.mw*.92||Math.abs(dy)>c.pad*.92){mtnRender(L,c,sc,off,drift);c.key=key;dx=0;dy=0}
    cx.drawImage(c.cv,-c.mw-dx,-c.pad-dy,c.cw,c.ch);
  });
}
function mtnReset(){MTC.forEach(c=>{c.key=''})}
// ---- weather: particles live in screen pixels and are pushed by the camera, nearer flakes moving more
const WX={n:COARSE?55:140,p:[],lastX:null,lastY:null,kind:null};
function weatherKind(){return(LVc&&LVc.weather)||'snow'}
function wxSpawn(p,anywhere){const k=WX.kind,d=.35+Math.random()*.65;p.d=d;p.x=Math.random()*W;p.y=anywhere?Math.random()*H:-10;p.ph=Math.random()*6.28;
  if(k==='ash'){p.ember=Math.random()<.18;p.vy=(p.ember?-25:35+Math.random()*25)*d;p.vx=(Math.random()-.5)*20;p.r=(p.ember?1.4:1.6+Math.random()*1.6)*d;if(p.ember&&!anywhere)p.y=H+10}
  else{p.ember=false;p.vy=(45+Math.random()*45)*d;p.vx=(Math.random()-.5)*15;p.r=(1+Math.random()*1.8)*d}}
function drawWeather(){
  const k=weatherKind();if(k==='none'||!st)return;
  if(WX.kind!==k||!WX.p.length){WX.kind=k;WX.p=Array.from({length:Math.round(WX.n*qCur().weather)},()=>{const p={};wxSpawn(p,true);return p})}
  const dpr=window.DPR||1,dt=Math.min(fdt,.05),dX=WX.lastX===null?0:(cam.x-WX.lastX)*Z,dY=WX.lastY===null?0:(cam.y-WX.lastY)*Z;WX.lastX=cam.x;WX.lastY=cam.y;
  const jump=Math.abs(dX)>W*.5||Math.abs(dY)>H*.5,t=performance.now()/1000;   // camera teleported (respawn / new level): don't smear
  cx.save();
  for(const p of WX.p){
    if(!paused||replayMode){p.x+=(p.vx+Math.sin(t*1.3+p.ph)*12)*dt*dpr-(jump?0:dX*p.d*.6);p.y+=p.vy*dt*dpr-(jump?0:dY*p.d*.6)}
    if(p.y>H+12){p.y-=H+20;p.x=Math.random()*W}else if(p.y<-14){p.y+=H+20;p.x=Math.random()*W}
    if(p.x<-12)p.x+=W+20;else if(p.x>W+12)p.x-=W+20;
    const r=p.r*dpr*1.3;
    if(p.ember){cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,'+(120+Math.round(60*Math.sin(t*6+p.ph)))+',40,'+(.55+.35*Math.sin(t*4+p.ph))+')';cx.beginPath();cx.arc(p.x,p.y,r,0,7);cx.fill()}
    else{cx.globalCompositeOperation='source-over';cx.fillStyle=k==='ash'?'rgba(70,64,62,'+(.35+.4*p.d)+')':'rgba(255,255,255,'+(.4+.5*p.d)+')';cx.fillRect(p.x-r,p.y-r,r*2,r*2)}
  }
  cx.restore();
}
function sceneryReset(){mtnY0=null;mtnReset();WX.lastX=null;WX.lastY=null;WX.p.length=0}
