// ======================= INTRO SCREEN: sunset + snow-gust title =======================
// Drawn on one canvas: sunset sky, glowing sun, drifting cloud streaks, three rim-lit mountain ranges, a foreground
// slope and falling snow. The title arrives as a gust of snow: flakes blow in from the left, swirl, and settle into the
// shape of the POWDER LEGENDS letters; then the solid title fades in and the loose powder blows away.
(function(){
const fc=document.getElementById('introFx'),g=fc.getContext('2d'),logo=document.getElementById('introLogo');
const reduceMotion=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let w=0,h=0,flakes=[],gust=[],revealed=false,t0=performance.now();
const GATHER_END=2.05,REVEAL_AT=1.95,BLOW_OFF=1.1;   // seconds: flakes settle by GATHER_END; title fades in at REVEAL_AT; leftover powder blows off over BLOW_OFF
function reveal(){if(revealed)return;revealed=true;logo.classList.add('revealed');intro.classList.add('revealed')}
function size(){const d=Math.min(devicePixelRatio||1,2);fc.width=Math.round(innerWidth*d);fc.height=Math.round(innerHeight*d);g.setTransform(d,0,0,d,0,0);w=innerWidth;h=innerHeight;
  flakes=Array.from({length:COARSE?40:90},()=>({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*1.8,v:12+Math.random()*28,p:Math.random()*6}))}
const onResize=()=>{if(intro.style.display==='none'){removeEventListener('resize',onResize);return}size();gust.length=0;reveal()};   // a resize mid-gust: just show the title
size();addEventListener('resize',onResize);

// ---- sample the real title's letter shapes into target points for the snow
function buildGust(){
  const spans=[...document.querySelectorAll('#introTitle span')];if(!spans.length)return[];
  const oc=document.createElement('canvas');oc.width=Math.ceil(w);oc.height=Math.ceil(h);const o=oc.getContext('2d');o.fillStyle='#fff';o.textBaseline='middle';
  for(const sp of spans){const r=sp.getBoundingClientRect(),cs=getComputedStyle(sp),ls=parseFloat(cs.letterSpacing)||0;
    o.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    const txt=sp.textContent,total=[...txt].reduce((a,ch)=>a+o.measureText(ch).width+ls,0)-ls;
    let x=r.left+(r.width-total-ls)/2+ls/2;const y=r.top+r.height/2;   // centre the run the same way the page does
    for(const ch of txt){o.fillText(ch,x,y);x+=o.measureText(ch).width+ls}}
  const area=spans.reduce((a,s)=>{const r=s.getBoundingClientRect();return a+r.width*r.height},0);
  const cap=COARSE?2200:4200,step=Math.max(2,Math.ceil(Math.sqrt(area*.4/cap)));   // keep the flake count bounded on any screen
  const img=o.getImageData(0,0,oc.width,oc.height).data,pts=[];
  for(let y=0;y<oc.height;y+=step)for(let x=0;x<oc.width;x+=step)if(img[(y*oc.width+x)*4+3]>140)pts.push([x+(Math.random()-.5)*step*.6,y+(Math.random()-.5)*step*.6]);
  return pts.map(([tx,ty])=>({tx,ty,
    sx:-40-Math.random()*w*.45,sy:ty+(Math.random()-.5)*h*.5-h*.08,   // start off-screen left, scattered
    delay:(tx/w)*.75+Math.random()*.25,dur:.85+Math.random()*.35,   // sweep in left to right
    sw:(Math.random()-.5)*60,ph:Math.random()*6.28,s:step*(.55+Math.random()*.35),
    bvx:30+Math.random()*90,bvy:-10-Math.random()*40,tw:Math.random()*6.28}));
}
if(reduceMotion)reveal();else requestAnimationFrame(()=>{gust=buildGust();if(!gust.length)reveal()});

const ridge=(x,s,sharp)=>{const a=Math.sin(x/180+s)*.5+Math.sin(x/77+s*2.1)*.3+Math.sin(x/33+s*.7)*.12,pk=1-Math.abs(Math.sin(x/(120+s*15)+s));return (a*.5+.5)*(1-sharp)+pk*pk*sharp};
const ground=x=>h*.76+(x/w)*h*.13;   // foreground slope, falling to the right
const ease=u=>1-Math.pow(1-u,3);
function frame(now){
  if(intro.style.display==='none'){removeEventListener('resize',onResize);gust.length=0;flakes.length=0;fc.width=fc.height=1;return}   // intro gone: free its canvas memory and listener
  const t=(now-t0)/1000;g.clearRect(0,0,w,h);
  // sky
  const sky=g.createLinearGradient(0,0,0,h);[[0,'#170a3a'],[.3,'#4b1a6e'],[.5,'#a3286f'],[.64,'#f0503f'],[.74,'#ff9a3c'],[.82,'#ffd27a']].forEach(([o,c])=>sky.addColorStop(o,c));
  g.fillStyle=sky;g.fillRect(0,0,w,h);
  // stars fading out toward the horizon
  for(let i=0;i<40;i++){const x=(i*137.5)%w,y=((i*71)%(h*.28)),a=(.25+.25*Math.sin(t*1.5+i))*(1-y/(h*.28));g.fillStyle='rgba(255,240,255,'+a+')';g.fillRect(x,y,1.4,1.4)}
  // sun with glow
  const sr=Math.min(w,h)*.15,sx=w*.64,sy=h*.6-sr*.45,M=Math.min(h,w*.9);   // M: mountain scale, so portrait phones don't get towering peaks
  let gl=g.createRadialGradient(sx,sy,sr*.6,sx,sy,sr*4.2);gl.addColorStop(0,'rgba(255,190,110,.55)');gl.addColorStop(.35,'rgba(255,110,80,.18)');gl.addColorStop(1,'rgba(255,90,90,0)');g.fillStyle=gl;g.fillRect(0,0,w,h);
  const sd=g.createLinearGradient(0,sy-sr,0,sy+sr);sd.addColorStop(0,'#fff6d2');sd.addColorStop(.6,'#ffc66b');sd.addColorStop(1,'#ff8a4a');g.fillStyle=sd;g.beginPath();g.arc(sx,sy,sr,0,7);g.fill();
  // cloud streaks
  for(let i=0;i<5;i++){const y=h*(.2+i*.08),x=((t*(8+i*3)+i*260)%(w+600))-300,len=220+i*60;
    const c=g.createLinearGradient(x,0,x+len,0);c.addColorStop(0,'rgba(255,150,170,0)');c.addColorStop(.5,'rgba(255,'+(150+i*15)+','+(170-i*10)+','+(.28-i*.03)+')');c.addColorStop(1,'rgba(255,150,170,0)');
    g.fillStyle=c;g.beginPath();g.ellipse(x+len/2,y,len/2,4+i*1.2,0,0,7);g.fill()}
  // three mountain ranges with rim light
  [[.6,.2,'#7b3a86',.6,1.3,.35,'rgba(255,170,140,.55)'],[.68,.16,'#4d2167',.4,3.7,.62,'rgba(255,130,110,.35)'],[.76,.12,'#2a1146',.15,6.1,1.1,null]].forEach(([base,amp,col,sharp,seed,par,rim])=>{
    const off=t*12*par;g.fillStyle=col;g.beginPath();g.moveTo(0,h);const pts=[];
    for(let x=0;x<=w+12;x+=12){const y=h*base-M*amp*ridge(x+off,seed,sharp);pts.push([x,y]);g.lineTo(x,y)}g.lineTo(w,h);g.closePath();g.fill();
    if(rim){g.strokeStyle=rim;g.lineWidth=1.5;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke()}});
  // foreground slope
  g.fillStyle='#14081f';g.beginPath();g.moveTo(0,h);for(let x=0;x<=w+8;x+=8)g.lineTo(x,ground(x));g.lineTo(w,h);g.closePath();g.fill();
  g.strokeStyle='rgba(255,140,110,.45)';g.lineWidth=1.5;g.beginPath();for(let x=0;x<=w+8;x+=8)x?g.lineTo(x,ground(x)):g.moveTo(x,ground(x));g.stroke();
  // falling snow
  g.fillStyle='rgba(255,240,245,.8)';for(const f of flakes){f.y+=f.v/60;f.x+=Math.sin(t+f.p)*.3;if(f.y>h){f.y=-4;f.x=Math.random()*w}g.globalAlpha=.4+f.r/3;g.beginPath();g.arc(f.x,f.y,f.r,0,7);g.fill()}g.globalAlpha=1;
  // vignette
  const vg=g.createRadialGradient(w/2,h*.45,Math.min(w,h)*.35,w/2,h*.5,Math.max(w,h)*.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,0,25,.55)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  // the snow gust that forms the title
  if(gust.length){
    if(t>=REVEAL_AT)reveal();
    const blow=Math.max(0,t-GATHER_END)/BLOW_OFF;   // 0 → 1 as the leftover powder blows away
    if(blow>=1)gust.length=0;
    else{g.fillStyle='#f6f9ff';
      for(const p of gust){const u=Math.min(1,Math.max(0,(t-p.delay)/p.dur));if(u<=0)continue;const e=ease(u);
        let x=p.sx+(p.tx-p.sx)*e+Math.sin(p.ph+u*7)*p.sw*(1-e),y=p.sy+(p.ty-p.sy)*e+Math.cos(p.ph+u*5)*p.sw*.5*(1-e);
        let a=Math.min(1,u*3)*(.75+.25*Math.sin(t*6+p.tw));
        if(blow>0){const b=blow*blow;x+=p.bvx*b;y+=p.bvy*b;a*=1-blow}
        g.globalAlpha=a;g.fillRect(x-p.s/2,y-p.s/2,p.s,p.s)}
      g.globalAlpha=1}
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
