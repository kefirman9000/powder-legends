// graffiti popups (DOM, CSS-animated: flash, then dissipate)
const popsE=document.getElementById('pops');
function glowOf(v){return Math.min(1,Math.log10(1+Math.max(0,v)/2000)/3.2)}   // 0 at no points .. 1 at a few million
function spray(txt,sub,big,pts,extraClass=''){const d=document.createElement('div');d.className='pp'+(extraClass?' '+extraClass:'');d.innerHTML='<span>'+txt+'</span>'+(sub?'<i>'+sub+'</i>':'');if(big)d.style.setProperty('--s','1.15');d.style.setProperty('--g','0');d.style.setProperty('--r','0deg');d.style.setProperty('--h','44');popsE.append(d);setTimeout(()=>d.remove(),1200)}
function celebrateLanding(pts){
  // A real landing: powder sprays up off the snow where the skis touch down, bigger for bigger tricks.
  const g=ter((P[0].x+P[1].x)/2),tl=Math.hypot(g.tx,g.ty)||1,tx=g.tx/tl,ty=g.ty/tl,nx=ty,ny=-tx,
    hp=P[4],vt=(hp.x-hp.px)*tx+(hp.y-hp.py)*ty,power=1+Math.min(2.2,Math.sqrt(Math.max(0,pts))/180),
    count=Math.round(26+Math.min(90,Math.sqrt(Math.max(0,pts))/3.5));
  for(let i=0;i<count;i++){
    const src=P[i%2],u=Math.random(),back=Math.random()<.22,
      along=back?-(.4+Math.random()*1.2):vt*(.25+.75*u)+(Math.random()-.5)*1.5,
      up=(.5+Math.random()*1.5)*power*(back?.7:1);
    if(partRoom()>0)snow.push({x:src.x+(Math.random()-.5)*14,y:src.y-2,vx:tx*along+nx*up,vy:ty*along+ny*up,l:1,
      d:.009+Math.random()*.01,g:.045,s:.8+Math.random()*1.1*power});
  }
}
let shown=-1;
function queueTrickResult(points,result){
  const d=document.createElement('div');d.className='trick-result '+result;d.textContent='TRICK TOTAL: '+(result==='failed'?'−':' +').replace(' ','')+Math.abs(points).toLocaleString();
  // Queue results one after another so every total remains readable and fades in order.
  const now=performance.now();
  if(!queueTrickResult.nextAt||queueTrickResult.nextAt<now)queueTrickResult.nextAt=now;
  const wait=Math.max(0,queueTrickResult.nextAt-now);d.style.setProperty('--wait',wait+'ms');
  queueTrickResult.nextAt+=result==='failed'?1900:1150;
  trickStackE.appendChild(d);setTimeout(()=>d.remove(),wait+2900);
}
function scoreTick(){
  // A clean-landing celebration always wins over any stale failure styling.
  if(trickScoreE.dataset.result==='landed'||trickScoreE.classList.contains('landed')){trickScoreE.classList.remove('failed');}
  const v=st.score;
  if(scoreT.textContent!=='SCORE: '+v.toLocaleString()){const up=shown>=0&&v>shown;shown=v;scoreT.textContent='SCORE: '+v.toLocaleString();const g=glowOf(v);scoreE.style.setProperty('--g',g.toFixed(3));scoreT.className='';if(up)scoreE.className=''}
  let showPending=!st.fireDeath&&st.pendingPts>0&&st.air>.4&&(st.onAir||st.failedPendingShown);
  if(st.failedPendingShown&&st.air>.4&&st.pendingPts>0&&trickScoreE.dataset.result!=='failed'&&trickScoreE.dataset.result!=='landed'&&!trickScoreE.classList.contains('landed')){
    queueTrickResult(st.pendingPts,'failed');st.pendingPts=0;st.failedPendingShown=false;showPending=false;
    trickScoreE.textContent='';trickScoreE.dataset.value='';trickScoreE.dataset.result='';trickScoreE.classList.remove('failed','power-1','power-2','power-3','power-4');
  }
  if(showPending){
    if(trickScoreE.dataset.value!==String(st.pendingPts)||!trickScoreE.textContent){
      trickScoreE.dataset.value=String(st.pendingPts);
      trickScoreE.textContent='TRICK TOTAL: +'+st.pendingPts.toLocaleString();
    }
    const power=Math.max(0,Math.min(4,Math.floor(Math.log10(1+st.pendingPts/250))));
    const scale=1+Math.min(.95,Math.log10(1+st.pendingPts/300)*.24);
    trickScoreE.style.setProperty('--power',power.toFixed(2));
    trickScoreE.style.setProperty('--scale',scale.toFixed(2));
    trickScoreE.classList.remove('power-1','power-2','power-3','power-4');
    if(power>0)trickScoreE.classList.add('power-'+power);
    if(st.failedPendingShown&&trickScoreE.dataset.result!=='landed'&&!trickScoreE.classList.contains('landed')){trickScoreE.classList.remove('power-1','power-2','power-3','power-4');trickScoreE.classList.add('failed');trickScoreE.dataset.result='failed'}
  }else if(!st.failedPendingShown&&!trickScoreE.classList.contains('landed')){
    trickScoreE.textContent='';trickScoreE.dataset.value='';
    trickScoreE.classList.remove('failed','power-1','power-2','power-3','power-4');
  }
}   // The same trick total banks on a clean landing and melts away red on failure
