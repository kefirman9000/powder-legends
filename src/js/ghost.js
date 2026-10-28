// ======================= BEST-RUN GHOST =======================
// When you set a new best on a level, a compact copy of that run is saved: 20 frames a second, the hip position as
// two floats and the other seven body points as small offsets from it (22 bytes a frame, ~26 KB for a minute).
// Next time you play that level, a see-through ghost skier replays it in step with your run so you can race it.
// Not used on Ski School or the Endless Run (its course is different every time).
const GH={fps:20,per:6,frames:null,n:0,best:0,fade:0};   // per: physics steps (120/s) per ghost frame
const GH_KEY=n=>'skiGhost:'+n;
function ghostOn(){try{return localStorage.getItem('skiGhostOn')!=='0'}catch(e){return true}}
function setGhost(on){try{localStorage.setItem('skiGhostOn',on?'1':'0')}catch(e){}}
const ghostAllowed=l=>l&&!l.endless&&!l.tutorial;
function b64(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)}
function unb64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
// called by commitRun when this run beat the level's best
function ghostSave(){
  if(!ghostAllowed(LVc)||RP.head!==0||RP.n<GH.per)return;   // the recorder wrapped (very long run): nothing complete to save
  const step=GH.per/2,frames=Math.floor((RP.n-1)/step)+1,buf=new ArrayBuffer(frames*22),dv=new DataView(buf);
  for(let f=0;f<frames;f++){const o=rpSlot(f*step)*RP_W,hx=RP.buf[o+16],hy=RP.buf[o+17],at=f*22;
    dv.setFloat32(at,hx,true);dv.setFloat32(at+4,hy,true);let j=at+8;
    for(const k of [0,1,2,3,5,6,7]){dv.setInt8(j++,Math.max(-127,Math.min(127,Math.round(RP.buf[o+k*4]-hx))));dv.setInt8(j++,Math.max(-127,Math.min(127,Math.round(RP.buf[o+k*4+1]-hy))))}}
  try{localStorage.setItem(GH_KEY(LVc.n),JSON.stringify({v:1,s:st.score,d:b64(new Uint8Array(buf))}))}catch(e){}   // storage full: keep the old ghost
}
function ghostLoad(){
  GH.frames=null;GH.n=0;GH.fade=0;
  if(!ghostOn()||!ghostAllowed(LVc))return;
  try{const g=JSON.parse(localStorage.getItem(GH_KEY(LVc.n))||'null');if(!g||g.v!==1)return;
    const u=unb64(g.d);GH.frames=new DataView(u.buffer);GH.n=Math.floor(u.length/22);GH.best=g.s||0}catch(e){GH.frames=null}
}
function ghostClearAll(){try{Object.keys(localStorage).filter(k=>k.startsWith('skiGhost:')).forEach(k=>localStorage.removeItem(k))}catch(e){}GH.frames=null}
function ghostPose(f){   // body points for (fractional) ghost frame f
  const a=Math.max(0,Math.min(GH.n-1,Math.floor(f))),b=Math.min(GH.n-1,a+1),u=Math.max(0,Math.min(1,f-a)),dv=GH.frames,pts=new Array(8);
  const hx=dv.getFloat32(a*22,true)+(dv.getFloat32(b*22,true)-dv.getFloat32(a*22,true))*u,hy=dv.getFloat32(a*22+4,true)+(dv.getFloat32(b*22+4,true)-dv.getFloat32(a*22+4,true))*u;
  pts[4]={x:hx,y:hy};let j=8;
  for(const k of [0,1,2,3,5,6,7]){const ox=dv.getInt8(a*22+j)+(dv.getInt8(b*22+j)-dv.getInt8(a*22+j))*u,oy=dv.getInt8(a*22+j+1)+(dv.getInt8(b*22+j+1)-dv.getInt8(a*22+j+1))*u;pts[k]={x:hx+ox,y:hy+oy};j+=2}
  return pts}
function drawGhost(){
  if(!GH.frames||replayMode||!st)return;
  const f=(RP.tick+(paused?0:al))/GH.per;
  let alpha=.32;if(f>GH.n-1){GH.fade=Math.min(1,GH.fade+fdt);alpha*=1-GH.fade;if(alpha<=0)return}   // the ghost finished: fade it out
  const q=ghostPose(f);
  cx.save();cx.globalAlpha=alpha;cx.strokeStyle='#e8f6ff';cx.fillStyle='#e8f6ff';cx.lineCap='round';
  const seg=(a,b,w)=>{cx.lineWidth=w;cx.beginPath();cx.moveTo(q[a].x,q[a].y);cx.lineTo(q[b].x,q[b].y);cx.stroke()};
  seg(0,1,3.5);seg(2,3,5);seg(3,4,6);seg(4,5,7);seg(5,7,3.5);seg(5,6,3);
  cx.beginPath();cx.arc(q[6].x,q[6].y,6,0,7);cx.fill();
  cx.globalAlpha=alpha*1.4;cx.font='bold 10px system-ui';cx.textAlign='center';cx.fillText('BEST',q[6].x,q[6].y-12);
  cx.restore();
}
