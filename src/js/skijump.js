// ======================= SKI JUMP HILL =======================
// One big Olympic-style jump. Distance is measured along the landing hill from the edge of the takeoff table
// to where the skis first touch down. A clean landing pays 1,000 points per metre, and the longest clean jump
// is saved as the hill record (shown on the hill as a gold flag and on the level-select card).
const JUMP_PX_PER_M=15,JUMP_K=120,JUMP_PTS_PER_M=1000;
const sjh=(()=>{const k=track();
  k.line(380,.12);                                   // start gate
  k.ease(320,.62);k.line(600,.62);k.ease(560,.2);k.line(220,.2);const edge=k.x,edgeY=k.y;   // inrun and takeoff table
  k.ease(480,.72);k.line(1100,.72);k.ease(500,.95);k.line(1000,.95);   // knoll + landing slope that steepens further down, so long flights still meet it at a shallow angle
  k.ease(1300,.04);k.line(500,0);k.ease(420,-.12);k.line(260,-.12);k.ease(220,0);k.line(1400,0);   // outrun: flattens, then a gentle rise to bleed off speed
  return{t:k.t,edge,edgeY,fin:k.x-900}})();
function jumpRecord(){try{return+localStorage.getItem('skiJumpRecord')||0}catch(e){return 0}}
function hillDist(xa,xb){let d=0,x=xa,y=ter(xa).y;const n=Math.max(4,Math.ceil((xb-xa)/20));for(let i=1;i<=n;i++){const nx=xa+(xb-xa)*i/n,ny=ter(nx).y;d+=Math.hypot(nx-x,ny-y);x=nx;y=ny}return d}
const jumpTrack={on:false,land:0,landX:0,confirm:0};
function jumpPost(){   // runs every physics step on Ski Jump Hill
  if(!st||st.done&&!st.finishedLevel)return;const mx=(P[0].x+P[1].x)/2,now=performance.now();
  if(st.onAir&&!jumpTrack.on&&!jumpTrack.landX&&mx>sjh.edge-90&&mx<sjh.edge+450&&!st.crash){jumpTrack.on=true}   // left the table
  if(jumpTrack.on&&!st.onAir){jumpTrack.on=false;jumpTrack.landX=mx;jumpTrack.confirm=now}                          // first touchdown
  if(jumpTrack.landX&&jumpTrack.confirm&&now-jumpTrack.confirm>400){jumpTrack.confirm=0;                         // still on your feet a moment later?
    const m=Math.round(hillDist(sjh.edge,jumpTrack.landX)/JUMP_PX_PER_M*10)/10;
    if(st.crash||st.skisOff){spray(m.toFixed(1)+' m','fell, so it doesn\'t count');return}
    const pts=Math.round(m*JUMP_PTS_PER_M),rec=jumpRecord(),isRec=m>rec;
    st.score+=pts;st.dPts=(st.dPts||0)+pts;st.jumpM=Math.max(st.jumpM||0,m);
    spray(m.toFixed(1)+' m'+(m>=JUMP_K?' · PAST K!':''),'+'+pts.toLocaleString()+(isRec?' · NEW HILL RECORD!':''),true,pts,'landed');
    if(isRec){try{localStorage.setItem('skiJumpRecord',String(m))}catch(e){}if(m>=50)fwFinale()}
    if(window.gearJump)gearJump(m);
  }
}
function jumpReset(){jumpTrack.on=false;jumpTrack.landX=0;jumpTrack.confirm=0}
function jumpDrawFront(){   // distance markers along the landing hill, the K line and the record flag
  const rec=jumpRecord(),x0=cam.x-60,x1=cam.x+W/Z+60;cx.textAlign='center';cx.font='bold 13px system-ui';
  // walk the hill once, dropping a marker every 10 m
  let d=0,x=sjh.edge,y=ter(x).y,next=10;
  for(let i=0;i<1400&&x<x1+200;i++){const nx=x+4,ny=ter(nx).y;d+=Math.hypot(4,ny-y);x=nx;y=ny;
    const m=d/JUMP_PX_PER_M;if(m<next)continue;const mm=next;next+=10;if(x<x0)continue;
    const k=mm===JUMP_K,big=mm%50===0;cx.strokeStyle=k?'#e0242c':big?'#1d3a6a':'#5f7fb0';cx.lineWidth=k?4:big?3:1.5;
    cx.beginPath();cx.moveTo(x,y+2);cx.lineTo(x,y-(k?26:big?18:9));cx.stroke();
    if(k||big||mm%20===0){cx.fillStyle=k?'#e0242c':'#1d3a6a';cx.fillText(k?'K '+mm:String(mm),x,y-(k?31:big?23:14))}}
  if(rec>0){let d2=0,xx=sjh.edge,yy=ter(xx).y;while(d2/JUMP_PX_PER_M<rec&&xx<sjh.edge+8000){const nx=xx+3,ny=ter(nx).y;d2+=Math.hypot(3,ny-yy);xx=nx;yy=ny}
    if(xx>x0&&xx<x1){cx.strokeStyle='#5b4512';cx.lineWidth=2;cx.beginPath();cx.moveTo(xx,yy);cx.lineTo(xx,yy-48);cx.stroke();cx.fillStyle='#ffc93a';cx.beginPath();cx.moveTo(xx+1,yy-48);cx.lineTo(xx+30,yy-40);cx.lineTo(xx+1,yy-32);cx.closePath();cx.fill();
      cx.fillStyle='#5b4512';cx.font='bold 11px system-ui';cx.textAlign='left';cx.fillText('RECORD '+rec.toFixed(1)+' m',xx+5,yy-53)}}
  // the takeoff table edge
  {const ex=sjh.edge,ey=ter(ex).y;cx.fillStyle='#1d3a6a';cx.fillRect(ex-3,ey,6,22);cx.fillStyle='#e0242c';cx.fillRect(ex-30,ey-1,30,3)}
}
