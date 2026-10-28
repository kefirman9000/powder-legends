const trees=[],rocks=[],best=Array(40).fill(0),bestG=Array(40).fill(-1);let cur=0,paused=true,sel=0;
// Replay: one preallocated Float32 ring buffer, recorded every 2nd physics step (60/s). No per-frame allocations, so no GC stutter.
const RP_MAX=45000,RP_W=32,RP={buf:new Float32Array(RP_MAX*RP_W),sh:new Array(RP_MAX),head:0,n:0,tick:0};
function rpClear(){RP.head=0;RP.n=0;RP.tick=0;RP.sh.fill(null)}
function rpSlot(i){return (RP.head+i)%RP_MAX}
function rpPush(){let s;if(RP.n<RP_MAX)s=rpSlot(RP.n++);else{s=RP.head;RP.head=(RP.head+1)%RP_MAX}const o=s*RP_W;for(let k=0;k<8;k++){const p=P[k];RP.buf[o+k*4]=p.x;RP.buf[o+k*4+1]=p.y;RP.buf[o+k*4+2]=p.px;RP.buf[o+k*4+3]=p.py}RP.sh[s]=sharkSnap()}
function rpPose(i,j,u){const a=rpSlot(i)*RP_W,b=rpSlot(j)*RP_W,B=RP.buf,out=[];for(let k=0;k<8;k++){const o=k*4,x=B[a+o],y=B[a+o+1];out.push({x:x+(B[b+o]-x)*u,y:y+(B[b+o+1]-y)*u,px:x,py:y})}return out}
let replayMode=false,replayIndex=0,replaySpeed=1,replayLiveP=null,replayLiveCam=null,replayLiveZoom=1;   // bestG: index into RATES of the best grade (0 = S), -1 = none yet
const save=()=>{try{const o={};LV.forEach((l,i)=>{if(best[i])o[l.n]={s:best[i],g:bestG[i]}});localStorage.setItem('skiBest4',JSON.stringify(o))}catch(e){}};
function loadBest(){let o={};try{['skiBest2','skiBest3'].forEach(k=>localStorage.removeItem(k));o=JSON.parse(localStorage.getItem('skiBest4')||'{}')||{}}catch(e){}   // skiBest4: fresh scores for the rebuilt levels; older saves are cleared
  LV.forEach((l,i)=>{const e=o[l.n];if(!e||!(e.s>0))return;best[i]=e.s|0;bestG[i]=e.g>=0?e.g|0:RATES.findIndex(r=>best[i]/(SPAR*(l.par||1))>=r[1])})}
function addBox(x,y,hw,hh,o){const b=Object.assign({x,y,a:0,vx:0,vy:0,w:0,hw,hh,m:Infinity,I:Infinity,fixed:true,m0:8},o);b.I0=b.m0*(4*hw*hw+4*hh*hh)/12;boxes.push(b);return b}
// --- bendy pine trees: a chain of 5 tapered segments hanging off a spring-loaded base. Landing on one bends it, then it springs back
const RHO=[0,.9,.72,.5,.28,.1],rad=(t,k)=>k?Math.max(4,t.W*RHO[k]):4;
function spine(t){const S=t.S;S.length=0;S.push([t.x,t.y]);let x=t.x,y=t.y;for(let k=0;k<5;k++){const th=2*t.a*(k+.5)/5;x+=Math.sin(th)*t.h/5;y-=Math.cos(th)*t.h/5;S.push([x,y])}}
function addTree(x,h){const g=ter(x),t={x,y:g.y+3,h,W:h*.3+rnd()*5,a:(rnd()-.5)*.08,w:0,S:[]};spine(t);trees.push(t)}
function stepTrees(){for(const t of trees){t.w+=-.0043*t.a-.0157*t.w;t.a=Math.max(-1.3,Math.min(1.3,t.a+t.w));spine(t)}}
// --- rocks: round obstacles. Fixed ones sit in the slope, dynamic ones are boulders that fall and roll
function addRock(x,r,dyn,y0){const g=ter(x);rocks.push({x,y:y0===undefined?g.y-r*.35:y0,r,vx:0,vy:0,a:rnd()*6,w:0,dyn,m:r*r/5,J:[0,1,2,3,4,5,6,7,8].map(()=>.72+rnd()*.5)})}
function stepRocks(){for(const q of rocks){if(!q.dyn)continue;q.vy+=GP;q.x+=q.vx;q.y+=q.vy;q.a+=q.w;
  const g=ter(q.x),nx=g.ty,ny=-g.tx,sdn=(q.y-g.y)*ny;
  if(sdn<q.r){const pen=q.r-sdn;q.x+=nx*pen;q.y+=ny*pen;const vn=q.vx*nx+q.vy*ny;if(vn<0){q.vx-=nx*vn*1.2;q.vy-=ny*vn*1.2}q.w+=((q.vx*g.tx+q.vy*g.ty)/q.r-q.w)*.15}}}
// Brushing through a soft obstacle (Lantern Forest): one-off speed loss, a little ski damage, a puff of snow
function brush(x,y,keep,dmgAmt){if(st.crash||st.done)return;P.forEach(q=>{q.px=q.x-(q.x-q.px)*keep;q.py=q.y-(q.y-q.py)*keep});hurt(dmgAmt);
  for(let k=0;k<12;k++)snow.push({x:x+(Math.random()-.5)*16,y:y+(Math.random()-.5)*10,vx:(Math.random()-.5)*2.2,vy:-Math.random()*1.8,l:1,d:.025,g:.04,s:.9})}
function collideProps(){
  P.forEach((p,i)=>{const m=M[i]*3;
    for(const t of trees){
      if(Math.abs(p.x-t.x)>t.h+t.W+10)continue;const I=t.h*t.h*.12;
      if(t.soft&&i<4){if(!t.hitT&&Math.abs(p.x-t.x)<t.W*.7&&p.y>t.y-t.h*.8){t.hitT=1;brush(t.x,t.y-t.h*.5,.88,12);t.w+=Math.sign((p.x-p.px)||1)*.05}continue}   // sapling brush: legs pass through it, but it costs speed and ski health
      for(let k=0;k<5;k++){
        const A=t.S[k],B=t.S[k+1],ex=B[0]-A[0],ey=B[1]-A[1],s=Math.max(0,Math.min(1,((p.x-A[0])*ex+(p.y-A[1])*ey)/(ex*ex+ey*ey))),
          qx=A[0]+ex*s,qy=A[1]+ey*s,r0=rad(t,k),R=r0+(rad(t,k+1)-r0)*s+2,dx=p.x-qx,dy=p.y-qy,d=Math.hypot(dx,dy);
        if(d>=R)continue;
        const nx=d?dx/d:0,ny=d?dy/d:-1,rx=qx-t.x,ry=qy-t.y,vn=(p.x-p.px+ry*t.w)*nx+(p.y-p.py-rx*t.w)*ny,pen=(R-d)*.5;
        p.x+=nx*pen;p.y+=ny*pen;p.px+=nx*pen;p.py+=ny*pen;hit=true;
        if(vn<0){const lev=rx*ny-ry*nx,j=-1.12*vn/(1/m+lev*lev/I);
          p.px-=nx*j/m;p.py-=ny*j/m;t.w+=j*(-lev-.45*ry)/I;          // the skier's weight (plus ski drag) bends the tree forward
          const sp=-vn*120,th=k===0?(i<4?(t.soft?1e9:420):(t.soft?520:250)):(i<4?1e9:520);   // treetops are soft; the trunk is not
          if(i<2)hurt((sp-200)*(t.soft?.008:.03));
          if(sp>th&&!st.crash&&!st.done){st.crash=true;st.msg=(k?'Crunched through the treetops!':'Hit a tree trunk!')+' Right-click, tap or press R to retry.'}}
      }
    }
    for(const q of rocks){if(q.deco)continue;
      if(q.soft&&i<4){if(!q.hitT&&Math.hypot(p.x-q.x,p.y-q.y)<q.r+3){q.hitT=1;brush(q.x,q.y-q.r,.92,8)}continue}   // low rock: a jolt that chips the skis, never a wall
      const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy),R=q.r+2;if(d>=R||!d)continue;
      let nx=dx/d,ny=dy/d;if(i<2&&!q.dyn){ny-=.6;const l=Math.hypot(nx,ny);nx/=l;ny/=l}   // skis ride up and over low rocks instead of being shoved backwards
      const k=q.dyn?(1/q.m)/(1/q.m+1/m):0,pen=R-d,E=q.dyn?.1:0;   // fixed rocks: no bounce at all, like the ground
      p.x+=nx*pen*(1-k);p.y+=ny*pen*(1-k);p.px+=nx*pen*(1-k);p.py+=ny*pen*(1-k);q.x-=nx*pen*k;q.y-=ny*pen*k;hit=true;
      const vn=(p.x-p.px-q.vx)*nx+(p.y-p.py-q.vy)*ny;
      if(vn<0){p.px+=nx*vn*(1+E)*(1-k);p.py+=ny*vn*(1+E)*(1-k);q.vx+=nx*vn*(1+E)*k;q.vy+=ny*vn*(1+E)*k;
        if(i<2)hurt((-vn*120-150)*(q.soft?.016:.04));
        if(-vn*120>(i<2?(q.soft?1300:380):i<4?(q.soft?700:260):150)&&!st.crash&&!st.done){st.crash=true;st.msg=(q.dyn?'Flattened by a boulder!':'Smashed into a rock!')+' Right-click, tap or press R to retry.'}}
    }
  });
}
function drawKind(b){const w=2*b.hw,h=2*b.hh;
  if(b.k==='fire-wall'){
    const now=performance.now()/1000;
    // Layered fire: a dark hot base, translucent outer flame, bright inner tongues,
    // wavering smoke and small embers. The wall itself stays visually unobtrusive.
    const flameTop=Math.max(112,b.hh*1.55), left=-b.hw-25, span=w+50, base=b.hh-2;
    const halo=cx.createRadialGradient(0,b.hh*.55,5,0,-b.hh*.15,flameTop*1.45);
    halo.addColorStop(0,'rgba(255,82,0,.34)');halo.addColorStop(.48,'rgba(255,48,0,.18)');halo.addColorStop(1,'rgba(255,28,0,0)');
    cx.fillStyle=halo;cx.fillRect(left,-b.hh-flameTop,span,h+flameTop);
    // Dark, heat-scorched barrier with a molten lower seam.
    const core=cx.createLinearGradient(0,-b.hh,0,b.hh);core.addColorStop(0,'#40130e');core.addColorStop(.48,'#781b0b');core.addColorStop(1,'#bd3005');
    cx.fillStyle=core;cx.fillRect(-b.hw,-b.hh,w,h);
    cx.fillStyle='rgba(255,75,0,.45)';cx.fillRect(-b.hw,base-10,w,10);
    cx.strokeStyle='rgba(255,105,25,.72)';cx.lineWidth=1.5;cx.strokeRect(-b.hw,-b.hh,w,h);
    // Broad, semi-transparent outer tongues give the fire an uneven, turbulent silhouette.
    const tongues=Math.max(13,Math.ceil(w/7));
    for(let i=0;i<tongues;i++){
      const fx=-b.hw-10+i*(w+20)/(tongues-1), phase=now*(5.2+(i%4)*.7)+i*2.13;
      const height=flameTop*(.55+.38*(.5+.5*Math.sin(phase*1.17)));
      const sway=Math.sin(phase*1.6)*8, width=7+(i%3)*2;
      cx.beginPath();cx.moveTo(fx-width,base);cx.bezierCurveTo(fx-width*1.8+sway,-b.hh-height*.28,fx+width*1.7-sway*.5,-b.hh-height*.66,fx+sway,-b.hh-height);cx.bezierCurveTo(fx+width*1.8+sway,-b.hh-height*.63,fx+width*.9,-b.hh-height*.24,fx+width,base);cx.closePath();
      const outer=cx.createLinearGradient(0,-b.hh-height,0,base);outer.addColorStop(0,'rgba(255,53,0,.04)');outer.addColorStop(.35,i%2?'rgba(255,67,0,.64)':'rgba(255,111,0,.72)');outer.addColorStop(.78,'rgba(255,136,0,.9)');outer.addColorStop(1,'rgba(255,48,0,.72)');
      cx.fillStyle=outer;cx.shadowColor='rgba(255,65,0,.75)';cx.shadowBlur=8;cx.fill();cx.shadowBlur=0;
      // Narrow yellow-white hot center, offset from the outer flame for a natural layered look.
      if(i%2===0){const ih=height*(.48+.12*Math.sin(phase));cx.beginPath();cx.moveTo(fx-width*.38,base);cx.quadraticCurveTo(fx-width*.8,-b.hh-ih*.3,fx+sway*.38,-b.hh-ih);cx.quadraticCurveTo(fx+width*.65,-b.hh-ih*.28,fx+width*.45,base);cx.closePath();const inner=cx.createLinearGradient(0,-b.hh-ih,0,base);inner.addColorStop(0,'rgba(255,238,150,.08)');inner.addColorStop(.42,'rgba(255,214,74,.8)');inner.addColorStop(1,'rgba(255,103,0,.75)');cx.fillStyle=inner;cx.fill()}
    }
    // Low rolling flame sheet across the base hides the individual tongues' seams.
    const bed=cx.createLinearGradient(0,-b.hh-25,0,base);bed.addColorStop(0,'rgba(255,50,0,0)');bed.addColorStop(.45,'rgba(255,94,0,.32)');bed.addColorStop(1,'rgba(255,174,18,.9)');
    cx.fillStyle=bed;cx.fillRect(-b.hw-5,-b.hh-25,w+10,h+25);
    // Smoke above the flames: soft, dark wisps drift and change position without scaling up.
    for(let i=0;i<9;i++){
      const phase=now*.8+i*1.91, x=-b.hw+(i+.5)*w/9+Math.sin(phase*1.3)*12;
      const y=-b.hh-flameTop*.72-((now*13+i*17)%48), r=8+(i%3)*3;
      cx.globalAlpha=.12+.08*(.5+.5*Math.sin(phase));const sg=cx.createRadialGradient(x-r*.2,y-r*.2,1,x,y,r);sg.addColorStop(0,'rgba(65,57,52,.8)');sg.addColorStop(1,'rgba(48,42,39,0)');cx.fillStyle=sg;cx.beginPath();cx.arc(x,y,r,0,Math.PI*2);cx.fill();
    }
    cx.globalAlpha=1;
    // A few sparks shoot up from the hot base and fade naturally.
    for(let i=0;i<15;i++){
      const phase=now*2.4+i*7.13, life=(now*1.6+i*.173)%1, x=-b.hw+((i*17)%Math.max(1,Math.round(w)))+Math.sin(phase)*7, y=base-life*(flameTop*.95);
      cx.globalAlpha=(1-life)*.8;cx.fillStyle=i%3?'#ffb32b':'#fff0a0';cx.beginPath();cx.ellipse(x,y,1.1,2.2,Math.sin(phase),0,Math.PI*2);cx.fill();
    }
    cx.globalAlpha=1;cx.shadowBlur=0;
  }
  else if(b.k==='wall'){cx.fillStyle='#8c9199';cx.fillRect(-b.hw,-b.hh,w,h);cx.strokeStyle='#4a4e55';cx.lineWidth=2;cx.strokeRect(-b.hw,-b.hh,w,h);cx.beginPath();
    for(let y=-b.hh+16,r=0;y<b.hh;y+=16,r++){cx.moveTo(-b.hw,y);cx.lineTo(b.hw,y);cx.moveTo(r%2?-4:4,y-16);cx.lineTo(r%2?-4:4,y)}cx.stroke();cx.fillStyle='#f6faff';cx.fillRect(-b.hw-2,-b.hh-5,w+4,7)}
  else{cx.fillStyle='#9a6a3a';cx.fillRect(-b.hw,-b.hh,w,h);cx.strokeStyle='#4b2e14';cx.lineWidth=1.5;cx.strokeRect(-b.hw,-b.hh,w,h);cx.beginPath();cx.moveTo(-b.hw+4,0);cx.lineTo(b.hw-4,0);cx.stroke()}}
function drawCliffs(){cx.lineJoin='round';
  const th=x=>28+13*Math.sin(x*.21)+8*Math.sin(x*.53),v0=cam.x-60,v1=cam.x+W/Z+60,steep=j=>(T[j+1][1]-T[j][1])/(T[j+1][0]-T[j][0])>=.4,at=(p,o)=>[p[0],p[1]+o*th(p[0])];
  for(let k=0;k<T.length-1;){
    if(T[k][0]<0||!steep(k)){k++;continue}
    let e=k;while(e+1<T.length-1&&steep(e+1))e++;                       // one run of consecutive steep segments k..e = one rock face
    if(T[e+1][0]>=v0&&T[k][0]<=v1){
      const Q=[];for(let j=k;j<=e;j++){const [x0,y0]=T[j],[x1,y1]=T[j+1],n=Math.max(1,Math.round((x1-x0)/12));for(let m=0;m<n;m++){const u=m/n;Q.push([x0+(x1-x0)*u,y0+(y1-y0)*u])}}Q.push(T[e+1]);
      cx.beginPath();Q.forEach((p,j)=>{const q=at(p,0);j?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1])});for(let j=Q.length-1;j>=0;j--){const q=at(Q[j],1);cx.lineTo(q[0],q[1])}cx.closePath();
      cx.fillStyle='#70747c';cx.fill();cx.strokeStyle='#44484f';cx.lineWidth=2;cx.stroke();
      for(const o of [.35,.68]){cx.beginPath();Q.forEach((p,j)=>{const q=at(p,o+.08*Math.sin(j*1.7));j?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1])});cx.strokeStyle='#585c64';cx.lineWidth=1.5;cx.stroke()}
      cx.beginPath();Q.forEach((p,j)=>j?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.strokeStyle='#f2f5f9';cx.lineWidth=5;cx.stroke()}
    k=e+1}}
function drawProps(){
  if(LVc.cliff)drawCliffs();
  for(const t of trees){const S=t.S;cx.lineCap='round';cx.strokeStyle='#5b3a1e';cx.lineWidth=7;cx.beginPath();cx.moveTo(S[0][0],S[0][1]);cx.lineTo(S[1][0],S[1][1]);cx.stroke();
    for(let k=1;k<=4;k++){const A=S[k],B=S[k+1],ex=B[0]-A[0],ey=B[1]-A[1],l=Math.hypot(ex,ey),nx=ey/l,ny=-ex/l,w=t.W*(1.05-.2*(k-1)),ax=A[0]-ex*.35,ay=A[1]-ey*.35;
      cx.fillStyle=k%2?'#2f6b3d':'#3a7d48';cx.beginPath();cx.moveTo(ax-nx*w,ay-ny*w);cx.lineTo(B[0]+ex*.5,B[1]+ey*.5);cx.lineTo(ax+nx*w,ay+ny*w);cx.closePath();cx.fill();
      cx.strokeStyle='#e9f2ff';cx.lineWidth=3;cx.beginPath();cx.moveTo(ax-nx*w,ay-ny*w);cx.lineTo(B[0]+ex*.5,B[1]+ey*.5);cx.stroke()}}
  for(const q of rocks){cx.save();cx.translate(q.x,q.y);cx.rotate(q.a);cx.beginPath();q.J.forEach((j,i)=>{const a=i/9*6.2832;cx[i?'lineTo':'moveTo'](Math.cos(a)*q.r*j,Math.sin(a)*q.r*j)});cx.closePath();cx.fillStyle='#6d7179';cx.fill();cx.strokeStyle='#3b3e44';cx.lineWidth=2;cx.lineJoin='round';cx.stroke();cx.restore()}
}
