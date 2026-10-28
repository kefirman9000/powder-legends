// ======================= INTRO SCREEN: animated sunset =======================
// Drawn on one canvas: sunset sky, glowing sun, drifting cloud streaks, three rim-lit mountain ranges, a
// foreground slope with a kicker, a silhouetted skier backflipping across the sun on a loop, and falling snow.
(function(){
const fc=document.getElementById('introFx'),g=fc.getContext('2d');let w=0,h=0,flakes=[];
function size(){const d=Math.min(devicePixelRatio||1,2);fc.width=Math.round(innerWidth*d);fc.height=Math.round(innerHeight*d);g.setTransform(d,0,0,d,0,0);w=innerWidth;h=innerHeight;
  flakes=Array.from({length:COARSE?40:90},()=>({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*1.8,v:12+Math.random()*28,p:Math.random()*6}))}
size();addEventListener('resize',size);
const ridge=(x,s,sharp)=>{const a=Math.sin(x/180+s)*.5+Math.sin(x/77+s*2.1)*.3+Math.sin(x/33+s*.7)*.12,pk=1-Math.abs(Math.sin(x/(120+s*15)+s));return (a*.5+.5)*(1-sharp)+pk*pk*sharp};
const ground=x=>h*.76+(x/w)*h*.13;                       // foreground slope, falling to the right
const KX=()=>w*.3;                                        // kicker position
function groundK(x){const k=KX(),u=(x-(k-w*.07))/(w*.07);return ground(x)-(u>0&&u<=1?Math.sin(u*Math.PI/2)*h*.035:0)}
function skier(x,y,ang,crouch){   // simple silhouette: skis, legs, body, arm, head
  g.save();g.translate(x,y);g.rotate(ang);g.strokeStyle='#14081f';g.fillStyle='#14081f';g.lineCap='round';
  const s=Math.max(.7,Math.min(1.4,h/700));g.scale(s,s);
  g.lineWidth=3.5;g.beginPath();g.moveTo(-24,0);g.lineTo(26,0);g.stroke();                               // skis
  const kn=crouch?[-4,-14]:[-1,-17],hp=crouch?[-10,-22]:[-6,-30],sh=crouch?[2,-34]:[0,-46];
  g.lineWidth=5;g.beginPath();g.moveTo(0,-3);g.lineTo(kn[0],kn[1]);g.lineTo(hp[0],hp[1]);g.lineTo(sh[0],sh[1]);g.stroke();   // legs + body
  g.lineWidth=3.5;g.beginPath();g.moveTo(sh[0],sh[1]+3);g.lineTo(sh[0]+14,sh[1]+(crouch?6:10));g.stroke();                   // arm
  g.beginPath();g.arc(sh[0]+3,sh[1]-7,6,0,7);g.fill();g.restore();
}
let t0=performance.now();
function frame(now){
  if(intro.style.display==='none')return;
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
  // foreground slope with kicker
  g.fillStyle='#14081f';g.beginPath();g.moveTo(0,h);for(let x=0;x<=w+8;x+=8)g.lineTo(x,groundK(x));g.lineTo(w,h);g.closePath();g.fill();
  g.strokeStyle='rgba(255,140,110,.45)';g.lineWidth=1.5;g.beginPath();for(let x=0;x<=w+8;x+=8)x?g.lineTo(x,groundK(x)):g.moveTo(x,groundK(x));g.stroke();
  // skier loop: ride in, launch off the kicker, backflip across the sun, land, ride out
  {const P=4.2,u=(t%P)/P,k=KX(),x1=w*.8;let x,y,a,cr=false;
    if(u<.3){x=-w*.06+(k+w*.06)*(u/.3);y=groundK(x);a=Math.atan(h*.13/w);cr=u>.18}
    else if(u<.72){const v=(u-.3)/.42;x=k+(x1-k)*v;const y0=groundK(k),y1=ground(x1);y=y0+(y1-y0)*v-Math.sin(v*Math.PI)*Math.min(h*.3,w*.32);a=Math.atan(h*.13/w)-v*Math.PI*2;cr=v>.2&&v<.8}
    else{const v=(u-.72)/.28;x=x1+(w*1.08-x1)*v;y=ground(x);a=Math.atan(h*.13/w);cr=v<.15}
    skier(x,y,a,cr)}
  // falling snow
  g.fillStyle='rgba(255,240,245,.8)';for(const f of flakes){f.y+=f.v/60;f.x+=Math.sin(t+f.p)*.3;if(f.y>h){f.y=-4;f.x=Math.random()*w}g.globalAlpha=.4+f.r/3;g.beginPath();g.arc(f.x,f.y,f.r,0,7);g.fill()}g.globalAlpha=1;
  // vignette
  const vg=g.createRadialGradient(w/2,h*.45,Math.min(w,h)*.35,w/2,h*.5,Math.max(w,h)*.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,0,25,.55)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
