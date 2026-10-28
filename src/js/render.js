function draw(){
  if(st&&st.crash&&!crashWasActive)damagePulseAt=performance.now();
  crashWasActive=!!(st&&st.crash);
  const Q=P.map((p,i)=>snap?{x:snap[i][0]+(p.x-snap[i][0])*al,y:snap[i][1]+(p.y-snap[i][1])*al}:p); // draw between the last two physics steps so motion stays smooth
  cx.setTransform(1,0,0,1,0,0);
  const sk=cx.createLinearGradient(0,0,0,H);sk.addColorStop(0,LVc.sky[0]);sk.addColorStop(1,LVc.sky[1]);
  cx.fillStyle=sk;cx.fillRect(0,0,W,H);
  drawMountains();   // parallax mountain layers (scenery.js)
  const camHold=paused&&!replayMode;   // behind a menu: no easing, the camera is placed exactly where it belongs
  zoom+=(zoomT-zoom)*(camHold?1:1-Math.pow(.75,fdt*60));camTick(Q);Z=ZB*zoom*camK.z;   // camK: speed-aware pull-back (camera.js)   // eased zoom; the camera below re-centres on the skier at the new scale
  const ck=camHold?1:1-Math.pow(.9,fdt*60);if(!st.sharkDeath){cam.x+=(Q[4].x+camK.lx-W/Z*CAMX-cam.x)*ck;cam.y+=(Q[4].y+camK.ly-H/Z*CAMY-cam.y)*ck;}   // camera stays put once the shark has you
  cx.setTransform(Z,0,0,Z,-cam.x*Z,-cam.y*Z);
  if(LVc.drawBack){cx.save();LVc.drawBack();cx.restore()}   // scenery behind the slope
  {   // ground: only the stretch on screen (plus a margin). Huge off-screen coordinates made some phone GPUs draw a torn, shimmering edge
    const m=60/Z,x0=cam.x-m,x1=cam.x+W/Z+m;let lo=-1e9;
    let i=0,hi=T.length-1;while(i<hi){const mid=(i+hi)>>1;if(T[mid][0]<x0)i=mid+1;else hi=mid}   // first point at or after the left edge
    cx.beginPath();const y0=ter(x0).y;cx.moveTo(x0,y0);lo=y0;
    for(;i<T.length&&T[i][0]<x1;i++){cx.lineTo(T[i][0],T[i][1]);if(T[i][1]>lo)lo=T[i][1]}
    const y1=ter(x1).y;cx.lineTo(x1,y1);lo=Math.max(lo,y1,cam.y+H/Z)+60;
    cx.lineTo(x1,lo);cx.lineTo(x0,lo);cx.closePath()}

  cx.fillStyle=LVc.snow;cx.fill();cx.strokeStyle=LVc.edge;cx.lineWidth=3;cx.lineJoin='round';cx.stroke();
  drawCheckpoints();
  for(const b of boxes){cx.save();cx.translate(b.x,b.y);cx.rotate(b.a);if(b.k){drawKind(b);cx.restore();continue}cx.fillStyle='#b8793c';cx.strokeStyle='#5a3414';cx.lineWidth=2;
    cx.fillRect(-b.hw,-b.hh,2*b.hw,2*b.hh);cx.strokeRect(-b.hw,-b.hh,2*b.hw,2*b.hh);
    cx.beginPath();cx.moveTo(-b.hw,-b.hh);cx.lineTo(b.hw,b.hh);cx.moveTo(b.hw,-b.hh);cx.lineTo(-b.hw,b.hh);cx.stroke();cx.restore()}
  fwStep();fwDrawFountains();fwDraw();if(LVc.drawFront){cx.save();LVc.drawFront();cx.restore()}drawProps();{const g=ter(FINISH);cx.fillStyle='#222';cx.fillRect(FINISH-2,g.y-90,4,90);cx.fillStyle='#fff';cx.fillRect(FINISH+2,g.y-90,36,22);cx.fillStyle='#111';cx.fillRect(FINISH+2,g.y-90,12,11);cx.fillRect(FINISH+26,g.y-90,12,11);cx.fillRect(FINISH+14,g.y-79,12,11)}
  cx.fillStyle='#fff';cx.strokeStyle='#a9c4e0';cx.lineWidth=1;for(const q of snow){cx.globalAlpha=Math.max(0,q.l);cx.beginPath();cx.arc(q.x,q.y,(q.s||1)*(1.5+(1-q.l)*2.5),0,7);cx.fill();cx.stroke()}cx.globalAlpha=1;
  const ln=(a,b,w,c)=>{cx.strokeStyle=c;cx.lineWidth=w;cx.lineCap='round';cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()};
  const mid={x:(Q[0].x+Q[1].x)/2,y:(Q[0].y+Q[1].y)/2};
  const ad=Math.max(0,Math.min(100,st.adrenaline||0));
  if(ad>1){
    const glow=ad/100, radius=8+glow*11;
    cx.save();cx.globalCompositeOperation='lighter';
    // Keep the aura broad but low-key; let the torso, arms and legs carry the glow.
    const center={x:(Q[2].x+Q[3].x+Q[4].x+Q[5].x)/4,y:(Q[2].y+Q[3].y+Q[4].y+Q[5].y)/4};
    const halo=cx.createRadialGradient(center.x,center.y,2,center.x,center.y,radius*3.1);
    halo.addColorStop(0,`rgba(95,210,255,${.06+glow*.15})`);halo.addColorStop(.52,`rgba(145,105,255,${.04+glow*.11})`);halo.addColorStop(1,'rgba(80,255,200,0)');
    cx.fillStyle=halo;cx.beginPath();cx.arc(center.x,center.y,radius*3.1,0,Math.PI*2);cx.fill();
    // Even, restrained rim light on the limbs and torso. Head glow is deliberately minimal.
    cx.lineCap='round';cx.lineJoin='round';cx.shadowBlur=3+glow*10;cx.shadowColor=`hsl(${190+glow*55} 100% 65%)`;
    cx.strokeStyle=`rgba(90,220,255,${.10+glow*.24})`;cx.lineWidth=5+glow*5;
    for(const [i,j] of [[2,3],[3,4],[4,5],[5,7]]){cx.beginPath();cx.moveTo(Q[i].x,Q[i].y);cx.lineTo(Q[j].x,Q[j].y);cx.stroke()}
    cx.strokeStyle=`rgba(90,220,255,${.025+glow*.07})`;cx.lineWidth=3+glow*2;
    cx.beginPath();cx.arc(Q[6].x,Q[6].y,6,0,Math.PI*2);cx.stroke();
    if(ad>=99){
      // Emit separate rainbow ribbons from several points on the skier, not one central trail.
      const trailParts=[6,7,5,4,3,2,0,1]; // head, hand, shoulder, hip, knee, ankle, and both ski tips
      adrenalineTrail.push({points:trailParts.map(part=>({part,x:Q[part].x,y:Q[part].y})),t:performance.now()});
      cx.lineCap='round';cx.lineJoin='round';cx.shadowBlur=5;
      const now=performance.now();
      while(adrenalineTrail.length>28||adrenalineTrail.length&&now-adrenalineTrail[0].t>780)adrenalineTrail.shift();
      for(let partIndex=0;partIndex<trailParts.length;partIndex++){
        for(let i=1;i<adrenalineTrail.length;i++){
          const a=adrenalineTrail[i-1],b=adrenalineTrail[i],age=(now-b.t)/780;
          const pa=a.points[partIndex],pb=b.points[partIndex];
          cx.strokeStyle=`hsla(${(now*.14+partIndex*43+i*3)%360},100%,${partIndex%2?68:73}%,${(1-age)*(.32+ad/150)})`;
          cx.lineWidth=1.8+(1-age)*(partIndex<2?2.4:1.4);
          cx.shadowColor=cx.strokeStyle;cx.beginPath();cx.moveTo(pa.x,pa.y);cx.lineTo(pb.x,pb.y);cx.stroke();
        }
      }
      // Short rainbow accents remain attached to the skier, making the effect read as speed/energy.
      for(let k=0;k<[[0,1],[2,3],[3,4],[4,5],[5,7],[5,6]].length;k++){
        const seg=[[0,1],[2,3],[3,4],[4,5],[5,7],[5,6]][k];
        cx.strokeStyle=`hsla(${(now*.12+k*58)%360},100%,70%,.58)`;cx.lineWidth=k===0?4:3;
        cx.shadowColor=cx.strokeStyle;cx.beginPath();cx.moveTo(Q[seg[0]].x,Q[seg[0]].y);cx.lineTo(Q[seg[1]].x,Q[seg[1]].y);cx.stroke();
      }
      cx.shadowBlur=0;
    }else adrenalineTrail.length=0;
    cx.restore();
  }else adrenalineTrail.length=0;
  const burnAge=st.fireDeath?(performance.now()-st.fireStarted)/1000:0;
  let sharkAlpha=1;
  if(st.sharkDeath){const sk=st.sk,wt=LVc&&LVc.water;   // skier fades out together with the shark as it sinks
    if(!sk||!wt||sk.done)sharkAlpha=0;else if(sk.vy>0&&sk.y>wt.y)sharkAlpha=Math.max(0,1-(sk.y-wt.y)/230)}
  if((!st.fireDeath || burnAge<3.15)&&(!st.sharkDeath||sharkAlpha>0)){
  cx.save();if(st.fireDeath)cx.globalAlpha=Math.max(0,1-burnAge/3.15);if(st.sharkDeath)cx.globalAlpha=sharkAlpha;
  {const ga=cx.globalAlpha;drawGearBack(Q);cx.globalAlpha=ga}   // unlockable gear: trails and wings (gear.js)
  ln(Q[0],Q[1],4,st.fireDeath?'#111111':dmg>70?'#8f2f26':dmg>35?'#b8362b':skierColors.skis);
  { // flat boot: sole lies along the ski, heel under the ankle, toe pointing forward
    const ux=(Q[1].x-Q[0].x),uy=(Q[1].y-Q[0].y),l=Math.hypot(ux,uy)||1,u={x:ux/l,y:uy/l},n={x:u.y,y:-u.x};
    let bx=mid.x-u.x*BOOT_BACK,by=mid.y-u.y*BOOT_BACK;
    if(st.skisOff){const sx=Q[3].x-Q[2].x,sy=Q[3].y-Q[2].y,sl=Math.hypot(sx,sy)||1,nn={x:sx/sl,y:sy/sl};u.x=-nn.y;u.y=nn.x;n.x=nn.x;n.y=nn.y;bx=Q[2].x-nn.x*8;by=Q[2].y-nn.y*8}   // boot now hangs on the shin, not on the ski
    const pt=(a,b)=>[bx+u.x*a+n.x*b,by+u.y*a+n.y*b];
    cx.fillStyle=st.fireDeath?'#090909':damageTint(skierColors.boots);cx.beginPath();
    [[-7,2],[16,2],[17,5],[8,7],[4,11],[-4,11],[-7,7]].forEach(([a,b],i)=>{const p=pt(a,b);i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1])});
    cx.closePath();cx.fill();}ln(Q[2],Q[3],5,st.fireDeath?'#111111':damageTint(skierColors.pants));ln(Q[3],Q[4],6,st.fireDeath?'#111111':damageTint(skierColors.pants));
  const bodyColor=st.fireDeath?'#050505':damageTint(skierColors.jacket);
  ln(Q[4],Q[5],7,bodyColor);ln(Q[5],Q[7],3.5,bodyColor);
  // Face and helmet. Rotate the helmet with the torso so it doesn't stay level
  // while the skier leans, tucks, or rotates through a trick.
  cx.fillStyle=st.fireDeath?'#080808':'#fcd9b8';cx.beginPath();cx.arc(Q[6].x,Q[6].y,5.5,0,Math.PI*2);cx.fill();
  {const torsoAngle=Math.atan2(Q[5].y-Q[4].y,Q[5].x-Q[4].x);cx.save();cx.translate(Q[6].x,Q[6].y);cx.rotate(torsoAngle+Math.PI/4); // slight 45-degree right tilt of the head/helmet
   cx.fillStyle=st.fireDeath?'#080808':damageTint(skierColors.helmet);cx.beginPath();cx.arc(0,-2,6,Math.PI,Math.PI*2);cx.lineTo(6,0);cx.lineTo(-6,0);cx.closePath();cx.fill();cx.restore();}
  {const ga=cx.globalAlpha;drawGearFront(Q);cx.globalAlpha=ga}   // unlockable gear: glowing skis, suit, helmet (gear.js)
  // Fire clings to the whole skier after contact: separate small, flickering tongues
  // follow the skis/boots, legs, torso, arms, and head without scaling the body.
  if(st.fireDeath&&burnAge<2.35){
    const fireAnchors=[Q[0],Q[1],Q[2],Q[3],Q[4],Q[5],Q[6],Q[7]];
    cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=Math.max(0,1-burnAge/2.35);
    for(let i=0;i<fireAnchors.length;i++){
      const a=fireAnchors[i],phase=performance.now()*.018+i*2.17;
      const count=(i===4||i===5)?3:2;
      for(let j=0;j<count;j++){
        const x=a.x+Math.sin(phase+j*2.4)*3+(j-(count-1)/2)*2;
        const y=a.y-2+Math.cos(phase*1.25+j)*2;
        const h=7+Math.abs(Math.sin(phase+j*1.9))*7,w=2.3+Math.abs(Math.cos(phase+j))*1.6;
        cx.fillStyle=j%2?'rgba(255,65,12,.78)':'rgba(255,190,35,.9)';
        cx.beginPath();cx.moveTo(x-w,y+3);cx.quadraticCurveTo(x-w*1.3,y-h*.35,x+Math.sin(phase+j)*w*.45,y-h);cx.quadraticCurveTo(x+w*1.4,y-h*.38,x+w,y+3);cx.closePath();cx.fill();
        cx.fillStyle='rgba(255,235,135,.78)';cx.beginPath();cx.ellipse(x,y+1,w*.45,h*.22,0,0,Math.PI*2);cx.fill();
      }
    }
    cx.restore();
  }
  // A hard head impact gets a short red pulse and dizzy orbit; it fades quickly rather than staying as a permanent injury effect.
  {const age=(performance.now()-headHitFx)/1000;if(headHitFx>0&&age>=0&&age<2){const fade=1-age/2,pulse=.5+.5*Math.sin(age*25),hx=Q[6].x,hy=Q[6].y-2,rr=10+pulse*5;
    cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=fade*(.28+pulse*.34);const hg=cx.createRadialGradient(hx,hy,2,hx,hy,rr*1.8);hg.addColorStop(0,'rgba(255,35,45,.72)');hg.addColorStop(.55,'rgba(255,45,60,.28)');hg.addColorStop(1,'rgba(255,35,45,0)');cx.fillStyle=hg;cx.beginPath();cx.arc(hx,hy,rr*1.8,0,Math.PI*2);cx.fill();cx.restore();
    cx.save();cx.globalAlpha=fade;cx.textAlign='center';cx.textBaseline='middle';cx.font='bold 13px sans-serif';
    for(let k=0;k<3;k++){const a=age*5.5+k*Math.PI*2/3,orbit=13+Math.sin(age*8+k)*2,xx=hx+Math.cos(a)*orbit,yy=hy-10+Math.sin(a)*7;cx.save();cx.translate(xx,yy);cx.rotate(a+age*2);cx.fillStyle=k===1?'#ff4a55':'#fff0a8';cx.shadowColor='#ff263d';cx.shadowBlur=8;cx.fillText(k===2?'✦':'✧',0,0);cx.restore()}
    cx.restore();
  }}
  cx.restore();
  }
  if(st.fireDeath){
    const age=(performance.now()-st.fireStarted)/1000;
    // Smoke comes from the full skier silhouette: skis/boots, both legs, torso, arms, and head.
    // Puffs drift gently upward at a fixed size; they never scale up as they rise.
    const smokeAnchors=[Q[0],Q[1],Q[2],Q[3],Q[4],Q[5],Q[6],Q[7]];
    for(let i=0;i<88;i++){
      const born=i*.034, a=age-born;if(a<0||a>3.15)continue;
      const u=a/3.15, seed=i*12.9898, anchor=smokeAnchors[i%smokeAnchors.length];
      const x=anchor.x+Math.sin(seed*1.7+a*1.15)*(3+a*2.2)+Math.cos(seed)*a*1.1;
      const y=anchor.y- a*(10+(i%4)*1.5)-Math.abs(Math.sin(seed))*3;
      const r=4.5+(i%4)*.8, alpha=(1-u)*.27;
      const puff=cx.createRadialGradient(x-r*.25,y-r*.25,1,x,y,r);
      puff.addColorStop(0,`rgba(190,190,190,${alpha})`);puff.addColorStop(.55,`rgba(105,105,105,${alpha*.8})`);puff.addColorStop(1,'rgba(60,60,60,0)');
      cx.fillStyle=puff;cx.beginPath();cx.arc(x,y,r,0,Math.PI*2);cx.fill();
    }
  }
  drawShark();drawWaterFront();drawLava();
  cx.setTransform(1,0,0,1,0,0);drawWeather();   // falling snow / ash in front of everything (scenery.js)
  const t=st.msg||'';
  if(hud.textContent!==t){hud.textContent=t;hud.style.display=t?'block':'none'}
  // If a collision marks the just-processed touchdown as a crash later in the same frame,
  // roll back that landing's banked points. Older, genuinely completed landings stay banked.
  if(st.crash&&st.lastLandingPts>0&&!st.lastLandingRolledBack&&performance.now()-st.lastLandingAt<45){
    st.score=Math.max(0,st.score-st.lastLandingPts);st.aPts=Math.max(0,st.aPts-(st.lastLandingAPts||0));st.fPts=Math.max(0,st.fPts-(st.lastLandingFPts||0));st.hPts=Math.max(0,st.hPts-(st.lastLandingHPts||0));st.lastLandingHPts=0;st.lastLandingRolledBack=true;st.pendingPts=0;st.failedPendingShown=false;st.lastLandingPts=0;
    trickScoreE.classList.remove('landed');trickScoreE.classList.add('failed');trickScoreE.dataset.result='failed';
  }
  scoreTick();flushAdrenalineUI();
  if(customizer&&customizer.style.display!=='none')syncCustomizationPreview(Q);
}
