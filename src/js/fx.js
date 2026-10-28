// ======================= LEVELS =======================
let sd=1;const rnd=()=>(sd=sd*16807%2147483647)/2147483647;     // seeded random: every level builds identically on retry
// ---- fireworks: in-world (rockets launched ahead of you as you ski) and on the results screen
const RM=Math.random,FW={on:0,next:0,rk:[],sp:[]};
// Phones and tablets get lighter fireworks: smaller bursts, thinner fountains and a hard cap on live sparks.
const LOWFX=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches),FX_SCALE=LOWFX?.45:1,FW_MAX=LOWFX?450:2500,FXP_MAX=LOWFX?500:3000;
function fwReset(){FW.rk.length=0;FW.sp.length=0;FW.on=!!(LVc&&LVc.fw);FW.next=FW.on?LVc.fw.from:0;FW.lips=findLips()}
// Every kicker lip (terrain that climbs uphill, then tips over) gets a pair of spark fountains.
function findLips(){const out=[],w=LVc&&LVc.water;let minS=0;
  for(let i=1;i<T.length;i++){const a=T[i-1],b=T[i],dx=b[0]-a[0];if(dx<=0)continue;const sl=(b[1]-a[1])/dx;
    if(sl<0)minS=Math.min(minS,sl);
    else{if(minS<-.2&&a[0]>350&&a[0]<FINISH&&!(w&&a[0]>w.x0-80&&a[0]<w.x1+400))out.push({x:a[0],y:a[1],h:Math.floor(RM()*360)});minS=0}}
  return out}
function fwFountains(){if(!FW.lips)return;const x0=cam.x-120,x1=cam.x+W/Z+120;
  for(const L of FW.lips){if(L.x<x0||L.x>x1)continue;
    for(const off of [-34,-12]){const g=ter(L.x+off),bx=L.x+off,by=g.y;
      for(let k=0;k<(LOWFX?1:2);k++){const gold=RM()<.7;FW.sp.push({x:bx+(RM()-.5)*3,y:by-9,vx:(RM()-.5)*1.1,vy:-(2.6+RM()*2.4),l:1,d:.018+RM()*.014,h:gold?35+RM()*20:L.h+RM()*60,z:1.8+RM()*1.2})}}}}
function fwDrawFountains(){if(!FW.lips)return;const x0=cam.x-120,x1=cam.x+W/Z+120;
  for(const L of FW.lips){if(L.x<x0||L.x>x1)continue;
    for(const off of [-34,-12]){const bx=L.x+off,by=ter(bx).y;cx.fillStyle='#3a2a52';cx.strokeStyle='#ffd36b';cx.lineWidth=1.5;
      cx.beginPath();cx.moveTo(bx-6,by+1);cx.lineTo(bx-3.5,by-10);cx.lineTo(bx+3.5,by-10);cx.lineTo(bx+6,by+1);cx.closePath();cx.fill();cx.stroke()}}}
// Leaving a ramp: a shower of sparks at the lip and a volley of rockets bursting along the flight path.
function fwJump(){const q=P[4],vx=Math.max(2,q.x-q.px);fwBurst(q.x,q.y+10,RM()*360,130,4.6,true);fwBurst(q.x,q.y+10,45,60,2.4,false);
  for(let n=0;n<5;n++)fwRocket(q.x+vx*(150+n*60)+RM()*80,q.y-40-RM()*110,n*8,q.y+120)}
// Sticking a landing: rockets go up around you, more for bigger tricks.
function fwLand(pts,flips){const q=P[4],n=Math.min(7,2+flips+Math.floor(pts/60000));
  for(let i=0;i<n;i++)fwRocket(q.x-120+RM()*520,q.y-110-RM()*170,i*7)}
function fwBurst(x,y,h,n,sp,rain){n=Math.ceil(n*FX_SCALE);for(let i=0;i<n;i++){const a=RM()*6.283,v=sp*(.25+RM()*.75);FW.sp.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,d:.008+RM()*.01,h:rain?RM()*360:h+RM()*40-20,z:1.2+RM()*1.4,s:100})}}
function fwTrick(x,y,flips){
  if(flips<2)return; // Keep the first rotation clean; fireworks begin on rotation two.
  const n=flips,level=Math.min(n-2,4);
  const count=Math.min(270,155+level*42),speed=4.0+level*.72,glow=2.8+level*.65,hue=RM()*360,start=FW.sp.length;
  // Each additional rotation gets brighter, faster, and more layered, with a hard cap
  // on particles so the celebration stays lightweight during gameplay.
  fwBurst(x,y,hue,count,speed,true);
  fwBurst(x,y,hue+155,Math.floor(count*(.62+level*.035)),speed*.78,true);
  if(n>=3)fwBurst(x,y,hue+45,Math.floor(count*(n>=4?.48:.32)),speed*.55,false);
  if(n>=4)fwBurst(x,y,hue+220,Math.floor(count*.28),speed*1.12,true);
  for(let i=start;i<FW.sp.length;i++){
    const p=FW.sp[i];p.s=100;p.z*=(i-start<count?glow:1.8);p.l=1;
    p.d=.0045+RM()*.003;p.vy-=.28+level*.035;
  }
}
function fwRocket(x,ty,wait,y0){const g=ter(x);FW.rk.push({x,y:y0===undefined?g.y:Math.min(g.y,y0),vy:-(11+RM()*3),ty,h:RM()*360,r:RM()<.25,w:wait||0})}
function fwFinale(){const g=ter(FINISH);for(let i=0;i<8;i++)fwRocket(FINISH-260+i*90+RM()*40,g.y-230-RM()*160,i*14)}
function fwStep(){if(paused)return;const dt=Math.min(fdt,.05)*60;fwFountains();
  if(FW.on&&!st.crash&&P[4].x>FW.next){const q=P[4];for(let n=0;n<2;n++)fwRocket(q.x+380+n*240+RM()*200,q.y-70-RM()*110);FW.next=q.x+LVc.fw.gap*(.7+RM()*.7)}
  for(const r of FW.rk){if(r.w>0){r.w-=dt;continue}r.y+=r.vy*dt;r.vy*=Math.pow(.99,dt);FW.sp.push({x:r.x,y:r.y,vx:0,vy:.3,l:.5,d:.05,h:r.h,z:1.2});
    if(r.y<=r.ty||r.vy>-2.2){r.dead=1;fwBurst(r.x,r.y,r.h,r.r?90:64,3.2,r.r);fwBurst(r.x,r.y,r.h+40,22,1.6,r.r)}}
  FW.rk=FW.rk.filter(r=>!r.dead);
  for(const p of FW.sp){p.l-=p.d*dt;p.vx*=Math.pow(.97,dt);p.vy=p.vy*Math.pow(.97,dt)+.06*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
  FW.sp=FW.sp.filter(p=>p.l>0);if(FW.sp.length>FW_MAX)FW.sp.splice(0,FW.sp.length-FW_MAX)}
function fwDraw(){if(FW.sp.length){cx.save();{const c=parseInt((LVc.sky[0]||'#000').slice(1),16),lum=(.3*(c>>16&255)+.59*(c>>8&255)+.11*(c&255))/255;cx.globalCompositeOperation=lum<.35?'lighter':'source-over'}cx.lineCap='round';
  for(const p of FW.sp){cx.strokeStyle='hsla('+p.h+','+(p.s||100)+'%,'+(50+p.l*30)+'%,'+Math.max(0,p.l)+')';cx.lineWidth=p.z*Math.max(.4,p.l);cx.beginPath();cx.moveTo(p.x-p.vx*2.5,p.y-p.vy*2.5);cx.lineTo(p.x,p.y);cx.stroke()}cx.restore()}
}

// results-screen effects (screen space): fireworks, twinkles and confetti for good grades, stink clouds and flies for bad ones
const fxC=document.getElementById('fx'),fg=fxC.getContext('2d');if(COARSE)try{Object.defineProperty(fg,'shadowBlur',{get(){return 0},set(){}})}catch(e){}let fxP=[],fxR=[],fxK={},fxRun=false,fxL=0;
function fxSize(){fxC.width=innerWidth;fxC.height=innerHeight}addEventListener('resize',fxSize);fxSize();
const FXC={'S':{fw:.05,rain:1,tw:.5,conf:.35,hue:0},'A+':{fw:.028,hue:48,tw:.35,conf:.1},'A':{fw:.014,hue:135,tw:.2},'B':{tw:.12,hue:205},'C':{tw:.04,hue:50},'D':{gross:.5},'F':{gross:1,flies:1}};
function fxBurst(x,y,h,n,sp,rain){n=Math.ceil(n*FX_SCALE);for(let i=0;i<n;i++){const a=RM()*6.283,v=sp*(.25+RM()*.75);fxP.push({k:0,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,d:.008+RM()*.01,h:rain?RM()*360:h+RM()*40-20,z:1.5+RM()*1.5})}}
function fxAt(el,ti){const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;if(!fxRun){fxRun=true;fxL=performance.now();requestAnimationFrame(fxLoop)}
  fxBurst(x,y,ti===1?205:ti===2?48:0,ti===3?100:60,ti===3?6:4.4,ti===3);for(let i=0;i<8;i++)fxP.push({k:1,x:x+(RM()-.5)*r.width,y:y+(RM()-.5)*r.height,vx:0,vy:0,l:1,d:.015,h:ti===1?200:48,z:6+RM()*10,a:RM()*3})}
function fxStop(){fxRun=false;fxP=[];fxR=[];fg.clearRect(0,0,fxC.width,fxC.height)}
function fxStart(g,joke=false,fire=false,shark=false){fxStop();fxK=shark?{shark:true,hue:200}:fire?{fire:true,hue:18}:({...FXC[g]||{}});fxK.joke=!!joke;fxK.fire=!!fire;fxK.shark=!!shark;fxRun=true;fxL=performance.now();
  // The grade reveal itself triggers a bright explosion around the letter, with larger celebrations for better grades.
  const w=fxC.width,h=fxC.height,stamp=rtE.querySelector('.stamp'),letter=rtE.querySelector('.stamp .L');
  if(stamp)stamp.classList.add('reveal');
  const r=letter?letter.getBoundingClientRect():{left:w*.35,top:h*.22,width:w*.3,height:h*.25};
  const x=r.left+r.width/2,y=r.top+r.height*.55;
  const show=g==='S'?10:g==='A+'?8:g==='A'?6:g==='B'?3:g==='C'?2:0;
  const hue=g==='S'?0:g==='A+'?48:g==='A'?135:g==='B'?205:50;
  // Grade-specific emoji bursts: randomized assortments keep each results reveal fresh.
  const gradeEmojis=shark?['🦈','🐟','🌊','🫧','🐠','🐡','🦈']:fire?['🔥','😱','🧯','🔥','💀','😵‍💫','🚒']:joke?['😂','🤣','😆','😭','💀','🤡']:
    g==='S'?['🏆','🥇','🔥','✨','🚀','💎','🤩']:
    g==='A+'?['🤯','💥','⭐','🚀','🔥','🙌','😎']:
    g==='A'?['😎','🔥','💫','👏','⭐','🙌','💪']:
    g==='B'?['👍','😅','⭐','💪','🙂','👏','🤏']:
    g==='C'?['🙂','🫡','❄️','😌','👎','😬','💩']:
    g==='D'?['💩','👎','🤡','😬','🥶','💦','🫣','🤮','😭']:
    ['💩','👎','🤡','💀','😭','🫠','😵','🪦','🤮','🫵'];
  const emojiCount=shark?18:fire?18:joke?16:g==='S'?18:g==='A+'?15:g==='A'?12:g==='B'?9:g==='C'?7:8;
  for(let i=0;i<emojiCount;i++){
    const a=RM()*Math.PI*2,v=2.0+RM()*5.6;
    fxP.push({k:5,x:x+(RM()-.5)*Math.max(8,r.width*.22),y:y+(RM()-.5)*Math.max(8,r.height*.18),vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.7,l:1.7+RM()*.5,d:.008+RM()*.005,h:50,z:19+RM()*15,emoji:gradeEmojis[Math.floor(RM()*gradeEmojis.length)]});
  }
  if(show){
    // One hot white core makes the letter feel like it erupts out of the blast.
    fxBurst(x,y,0,g==='S'?240:g==='A+'?205:170,g==='S'?8.2:7.1,true);
    fxBurst(x,y,hue,g==='S'?180:g==='A+'?155:125,g==='S'?6.8:5.8,g==='S');
    const ring=show;
    for(let i=0;i<ring;i++){
      const a=(Math.PI*2*i/ring)+(RM()-.5)*.22,dist=Math.max(r.width,r.height)*(.48+RM()*.24);
      const bx=x+Math.cos(a)*dist,by=y+Math.sin(a)*dist*.72;
      fxBurst(bx,by,hue+(g==='S'?RM()*360:RM()*40-20),g==='S'?105:g==='A+'?90:75,g==='S'?5.7:5.0,g==='S');
      fxBurst(bx,by,hue+160,32,3.4,g==='S');
    }
    // Follow-up pops make S / A+ / A feel like a multi-burst finale, not a single flash.
    if(show>=6){for(let j=0;j<show-2;j++){setTimeout(()=>{if(!fxRun)return;const xx=w*(.12+RM()*.76),yy=h*(.12+RM()*.45);fxBurst(xx,yy,hue+(g==='S'?RM()*360:RM()*28-14),g==='S'?105:85,g==='S'?5.8:5.1,g==='S');fxBurst(xx,yy,hue+145,38,3.3,g==='S')},140+j*95)}}
  }
  requestAnimationFrame(fxLoop)}
function fxLoop(t){if(!fxRun)return;const dt=Math.min(.05,(t-fxL)/1000)*60;fxL=t;const K=fxK,w=fxC.width,h=fxC.height,rate=(a)=>RM()<(a||0)*dt;
  if(rate(K.fw))fxR.push({x:w*(.1+RM()*.8),y:h+10,vy:-(9+RM()*4),ty:h*(.1+RM()*.4),h:(K.hue||0)+RM()*40,r:K.rain});
  if(rate(K.tw))fxP.push({k:1,x:RM()*w,y:RM()*h,vx:0,vy:0,l:1,d:.012+RM()*.012,h:K.rain?RM()*360:K.hue,z:4+RM()*9,a:RM()*3});
  if(rate(K.conf))fxP.push({k:2,x:RM()*w,y:-10,vx:(RM()-.5)*2,vy:1.5+RM()*2,l:1,d:.002,h:RM()*360,z:5+RM()*5,a:RM()*6,w:(RM()-.5)*.3});
  if(!K.fire&&rate((K.gross||0)*.12))fxP.push({k:3,x:w*(.25+RM()*.5),y:h*(.5+RM()*.5),vx:(RM()-.5)*.8,vy:-.6-RM(),l:1,d:.006+RM()*.006,h:80+RM()*30,z:14+RM()*26});
  if(K.shark&&rate(.5))fxP.push({k:7,x:w*(.15+RM()*.7),y:h*(.75+RM()*.25),vx:(RM()-.5)*.5,vy:-.8-RM()*1.6,l:1.2+RM()*.8,d:.006+RM()*.006,h:0,z:3+RM()*9,ph:RM()*6});
  if(K.fire&&rate(.32))fxP.push({k:6,x:w*(.22+RM()*.56),y:h*(.38+RM()*.32),vx:(RM()-.5)*1.2,vy:-1.2-RM()*2,l:.75+RM()*.5,d:.018+RM()*.012,h:RM()<.25?48:RM()<.6?24:8,z:8+RM()*17});
  if(!K.fire&&K.flies&&fxP.filter(p=>p.k===4).length<14&&RM()<.05)fxP.push({k:4,x:w*(.3+RM()*.4),y:h*(.3+RM()*.3),vx:0,vy:0,l:1,d:.004,h:0,z:2,a:0});
  fg.globalCompositeOperation='source-over';fg.clearRect(0,0,w,h);
  for(const r of fxR){r.y+=r.vy*dt;r.vy*=Math.pow(.992,dt);fxP.push({k:0,x:r.x,y:r.y,vx:0,vy:.4,l:.5,d:.05,h:r.h,z:1.5});if(r.y<=r.ty||r.vy>-2.5){r.dead=1;fxBurst(r.x,r.y,r.h,r.r?90:70,5.2,r.r);fxBurst(r.x,r.y,r.h+40,24,2.4,r.r)}}
  fxR=fxR.filter(r=>!r.dead);
  for(const p of fxP){p.l-=p.d*dt;const a=Math.max(0,p.l);
    if(p.k===0){p.vx*=Math.pow(.97,dt);p.vy=p.vy*Math.pow(.97,dt)+.07*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;fg.globalCompositeOperation='lighter';fg.fillStyle='hsla('+p.h+',100%,'+(50+a*30)+'%,'+a+')';fg.beginPath();fg.arc(p.x,p.y,p.z*Math.max(.3,a),0,7);fg.fill()}
    else if(p.k===1){fg.globalCompositeOperation='lighter';const s=p.z*Math.sin(Math.min(1,a)*3.14),c='hsla('+p.h+',100%,80%,'+a+')';fg.fillStyle=c;fg.save();fg.translate(p.x,p.y);fg.rotate(p.a);fg.beginPath();fg.moveTo(0,-s);fg.quadraticCurveTo(0,0,s,0);fg.quadraticCurveTo(0,0,0,s);fg.quadraticCurveTo(0,0,-s,0);fg.quadraticCurveTo(0,0,0,-s);fg.fill();fg.restore()}
    else if(p.k===2){p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.w*dt;fg.globalCompositeOperation='source-over';fg.fillStyle='hsl('+p.h+',90%,60%)';fg.save();fg.translate(p.x,p.y);fg.rotate(p.a);fg.scale(1,Math.abs(Math.sin(p.a*2))+.2);fg.fillRect(-p.z/2,-p.z/3,p.z,p.z*.66);fg.restore()}
    else if(p.k===3){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=.12*dt;fg.globalCompositeOperation='source-over';fg.fillStyle='hsla('+p.h+',70%,32%,'+a*.35+')';fg.beginPath();fg.arc(p.x,p.y,p.z,0,7);fg.fill()}
    else if(p.k===5){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.035*dt;fg.globalCompositeOperation='source-over';fg.globalAlpha=a;fg.font='bold '+Math.round(p.z)+'px system-ui, sans-serif';fg.textAlign='center';fg.textBaseline='middle';fg.fillText(p.emoji,p.x,p.y);fg.globalAlpha=1}
    else if(p.k===7){p.x+=p.vx*dt+Math.sin(p.ph+p.l*5)*.35*dt;p.y+=p.vy*dt;fg.globalCompositeOperation='source-over';fg.globalAlpha=a*.8;fg.strokeStyle='#9be4ff';fg.fillStyle='rgba(120,210,255,.18)';fg.lineWidth=1.6;fg.beginPath();fg.arc(p.x,p.y,p.z,0,7);fg.fill();fg.stroke();fg.fillStyle='rgba(255,255,255,.7)';fg.beginPath();fg.arc(p.x-p.z*.35,p.y-p.z*.35,p.z*.22,0,7);fg.fill();fg.globalAlpha=1}
    else if(p.k===6){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z*=.994;fg.globalCompositeOperation='lighter';fg.globalAlpha=a;fg.fillStyle=p.h<15?'#ff2700':p.h<35?'#ff8a00':'#fff19a';fg.shadowColor='#ff3b00';fg.shadowBlur=p.z;fg.beginPath();fg.moveTo(p.x,p.y-p.z);fg.quadraticCurveTo(p.x+p.z*.85,p.y-p.z*.1,p.x,p.y+p.z*.55);fg.quadraticCurveTo(p.x-p.z*.75,p.y-p.z*.1,p.x,p.y-p.z);fg.fill();fg.shadowBlur=0;fg.globalAlpha=1}
    else{p.vx+=(RM()-.5)*.9*dt;p.vy+=(RM()-.5)*.9*dt;p.vx*=.9;p.vy*=.9;p.x=(p.x+p.vx*dt*2+w)%w;p.y=(p.y+p.vy*dt*2+h)%h;fg.globalCompositeOperation='source-over';fg.fillStyle='#111';fg.beginPath();fg.arc(p.x,p.y,p.z,0,7);fg.fill();fg.fillStyle='#fff7';fg.fillRect(p.x-3,p.y-2,2,1);fg.fillRect(p.x+1,p.y-2,2,1)}}
  fxP=fxP.filter(p=>p.l>0&&p.y<h+30);if(fxP.length>FXP_MAX)fxP.splice(0,fxP.length-FXP_MAX);requestAnimationFrame(fxLoop)}
