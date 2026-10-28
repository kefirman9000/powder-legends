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
// Backdrop: each frame the sky and the three mountain layers are drawn into ONE small offscreen canvas (~40% of the
// screen's resolution; the shapes are soft so it doesn't show) and then stretched onto the screen in a single copy.
// That costs about the same as a plain sky fill. (Painting three full-screen mountain images per frame was the single
// biggest cost in the game, and made it feel choppy on PCs.)
const BGC={cv:document.createElement('canvas'),g:null,s:.4,key:'',sky:null};
let skyCache={key:'',g:null};   // (kept for the customizer preview)
function drawMountains(){
  const s=COARSE||qLevel>=2?.33:.4,bw=Math.max(2,Math.round(W*s)),bh=Math.max(2,Math.round(H*s));
  if(BGC.cv.width!==bw||BGC.cv.height!==bh){BGC.cv.width=bw;BGC.cv.height=bh;BGC.g=BGC.cv.getContext('2d',{alpha:false});BGC.key=''}
  const g=BGC.g,key=bh+'|'+LVc.sky[0]+LVc.sky[1]+LVc.far;
  if(BGC.key!==key){BGC.key=key;const sg=g.createLinearGradient(0,0,0,bh);sg.addColorStop(0,LVc.sky[0]);sg.addColorStop(1,LVc.sky[1]);BGC.sky=sg;
    BGC.cols=MTN.map(L=>{const col=mixHex(LVc.far,LVc.sky[1],L.haze),top=mixHex(LVc.far,'#ffffff',.1+L.cap*.25);return{col,top}})}
  g.setTransform(1,0,0,1,0,0);g.fillStyle=BGC.sky;g.fillRect(0,0,bw,bh);
  const sc=ZB*zoom;if(mtnY0===null)mtnY0=cam.y;
  g.setTransform(s,0,0,s,0,0);   // draw in full-screen coordinates, scaled down
  const step=Math.max(16,Math.round(W/60));
  MTN.forEach((L,li)=>{
    const drift=Math.max(-.12*H,Math.min(.12*H,(cam.y-mtnY0)*L.py*sc)),baseY=H*L.base-drift,off=cam.x*L.px,c=BGC.cols[li];
    const gr=g.createLinearGradient(0,baseY-L.amp*sc,0,baseY+40*sc);gr.addColorStop(0,c.top);gr.addColorStop(.45,c.col);gr.addColorStop(1,c.col);
    g.fillStyle=gr;g.beginPath();g.moveTo(0,H);
    for(let X=0;X<=W+step;X+=step)g.lineTo(X,baseY-L.amp*sc*mtnHeight(L,X/sc+off));
    g.lineTo(W,H);g.closePath();g.fill();
  });
  cx.imageSmoothingEnabled=true;cx.drawImage(BGC.cv,0,0,W,H);
}
function mtnReset(){BGC.key=''}
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
