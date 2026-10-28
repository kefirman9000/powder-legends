// --- level select menu
const mEl=document.getElementById('m');
function thumb(l,c){const LT=l.endless?(l._preview=l._preview||endlessPreview()):l.T;const g=c.getContext('2d'),w=c.width,h=c.height,x1=l.endless?6500:l.fin+300,Q=LT.filter(p=>p[0]>=0&&p[0]<=x1),y0=Math.min(...Q.map(p=>p[1])),y1=Math.max(...Q.map(p=>p[1])),s=Math.min(w/x1,(h-14)/(y1-y0)),ox=(w-x1*s)/2;
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,l.sky[0]);gr.addColorStop(1,l.sky[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);
  {const xa=-ox/s,xb=(w-ox)/s,R=[[xa,ter2(LT,xa)],...LT.filter(p=>p[0]>xa&&p[0]<xb),[xb,ter2(LT,xb)]];   // run the ground flat past both ends so it always fills the full width
  g.beginPath();g.moveTo(0,h);R.forEach(([x,y])=>g.lineTo(ox+x*s,7+(y-y0)*s));g.lineTo(w,h);g.closePath()}g.fillStyle=l.snow;g.fill();g.strokeStyle=l.edge;g.lineWidth=2;g.stroke();if(l.lava)for(const L_ of l.lava){const yb=Math.max(...l.T.filter(p=>p[0]>=L_.x0&&p[0]<=L_.x1).map(p=>p[1]));g.fillStyle='#ff6a1a';g.fillRect(ox+L_.x0*s,7+(L_.y-y0)*s,(L_.x1-L_.x0)*s,Math.max(3,(yb-L_.y)*s))}if(l.water){const W_=l.water,yb=Math.max(...l.T.filter(p=>p[0]>=W_.x0&&p[0]<=W_.x1).map(p=>p[1]));g.fillStyle='#2a9bd6';g.fillRect(ox+W_.x0*s,7+(W_.y-y0)*s,(W_.x1-W_.x0)*s,Math.max(3,(yb-W_.y)*s))}}
const selE=document.getElementById('sel'),thC=document.getElementById('th'),cardE=document.getElementById('card'),lnE=document.getElementById('ln'),ldE=document.getElementById('ld'),lenE=document.getElementById('level-length'),dotsE=document.getElementById('dots'),hsnE=document.getElementById('hsn'),hsgE=document.getElementById('hsg'),faqE=document.getElementById('faqp');
LV.forEach((l,i)=>{const d=document.createElement('i');d.onclick=()=>{const dir=i>sel?1:-1;sel=i;showSel(dir)};dotsE.append(d)});
function showSel(dir){const l=LV[sel];thumb(l,thC);lnE.textContent=(sel+1)+'. '+l.n;ldE.textContent=l.d;const metres=Math.max(0,l.fin-300);lenE.textContent=l.endless?'LEVEL LENGTH · ENDLESS':'LEVEL LENGTH · '+(metres>=1000?(metres/1000).toFixed(1)+' km':Math.round(metres)+' m');
  [...dotsE.children].forEach((d,i)=>d.classList.toggle('on',i===sel));
  const s=best[sel],g=bestG[sel];hsnE.textContent=s?'BEST '+s.toLocaleString():'NOT PLAYED YET';if(LV[sel].endless&&endlessFarthest())hsnE.textContent+=' · FARTHEST '+endlessFarthest().toLocaleString()+' m';if(LV[sel].jump&&jumpRecord())hsnE.textContent+=' · RECORD '+jumpRecord().toFixed(1)+' m';hsnE.className=s?'':'no';
  hsgE.textContent=s&&g>=0?RATES[g][0]:'\u2013';hsgE.className=s&&g>=0?'g-'+RATES[g][0].replace('+','p'):'';
  if(dir){cardE.style.setProperty('--dx',dir*60+'px');cardE.style.animation='none';void cardE.offsetWidth;cardE.style.animation=''}}
function selStep(d){sel=(sel+d+LV.length)%LV.length;showSel(d)}
document.getElementById('pv').onclick=()=>selStep(-1);document.getElementById('nx').onclick=()=>selStep(1);
cardE.onclick=()=>go(sel);document.getElementById('play').onclick=()=>go(sel);
const faqOpen=()=>faqE.style.display==='flex',openFaq=()=>{faqE.style.display='flex'},closeFaq=()=>{faqE.style.display='none'};
document.getElementById('faqb').onclick=openFaq;document.getElementById('faqx').onclick=closeFaq;faqE.onclick=e=>{if(e.target===faqE)closeFaq()};
const mh=document.getElementById('mh'),ms=document.getElementById('ms'),fb=document.getElementById('fb');
const scE=document.getElementById('sc'),snE=document.getElementById('sn'),sbE=document.getElementById('sb'),rowsE=document.getElementById('rows'),rtE=document.getElementById('rt'),awE=document.getElementById('aw');
// ---- ratings (S, A+, A, B, C, D, F) and awards. Tune SPAR (points for an S on a par-1 level) and each level's par
const SPAR=500000,RATES=[['S',1,'LEGENDARY'],['A+',.7,'INSANE'],['A',.5,'AWESOME'],['B',.32,'SOLID'],['C',.18,'DECENT'],['D',.08,'ROUGH'],['F',0,'NEEDS WORK']];
function rate(){if(st.sharkDeath)return{r:RATES[6],note:'Eaten by the shark!'};if(st.fireDeath)return{r:RATES[6],note:'FIRE!!! You touched the flames.'};const failed=!st.finishedLevel; if(st.timeoutF||failed)return{r:RATES[6],note:st.timeoutF?'No input for 3 seconds after losing your skis':'Failed to finish the level'};if(st.noSkiFinish)return resetsUsed?{r:RATES[3],note:'Reset Skis used '+resetsUsed+' time'+(resetsUsed===1?'':'s')+' — maximum grade B'}:{r:RATES[2],note:'(for effort)'};const m=LVc.endless?1:st.skisOff?.75:dmg<15?1.1:1,idx=st.score*m/(SPAR*(LVc.par||1));let ri=RATES.findIndex(r=>idx>=r[1]),note=st.skisOff?'Lost your skis: rating x0.75':dmg<15&&st.score>0?'Pristine skis: rating bonus':'';
  const n=st.ff+st.bf;if(st.done&&ri>5){ri=5;note='You finished the run: no F for that'}   // finishing a level always earns at least a D
  if(n>5&&ri>4){ri=4;note=n+' flips: at least a C'}                                     // more than 5 flips always earns at least a C
  // These are guaranteed minimum grades; score, flips, and other bonuses can still earn higher grades.
  const A=awards(),silver=A.some(a=>a.ti===1),gold=A.some(a=>a.ti===2),diamond=A.some(a=>a.ti===3);
  let floor=6,why='';
  if(A.length>=4){floor=4;why='4+ awards: at least a C'}
  if(silver&&gold){floor=3;why='Silver and gold awards: at least a B'}
  if(gold&&diamond){floor=2;why='Gold and diamond awards: at least an A'}
  if(ri>floor){ri=floor;note=why}
  if(resetsUsed>0&&ri<3){ri=3;note='Reset Skis used '+resetsUsed+' time'+(resetsUsed===1?'':'s')+' — maximum grade B'}
  return{r:RATES[ri],note}}
const TIERC=['#cd8a4a','#d5dce4','#ffd700','#6fe7ff'],TIERN=['BRONZE','SILVER','GOLD','DIAMOND'];
const AWD=[
 {k:'FLIPS',ic:'\u{1F300}',v:q=>q.ff+q.bf,u:(n,q)=>n+' flip'+(n>1?'s':'')+' ('+q.ff+' front, '+q.bf+' back)',t:[[1,'Flipper'],[3,'Flip Fiend'],[6,'Spin Doctor'],[10,'Human Gyroscope']]},
 {k:'COMBO',ic:'\u{1F4A5}',v:q=>q.combo,u:n=>n+' flips in one jump',t:[[2,'Double Trouble'],[3,'Triple Threat'],[4,'Quad Squad'],[5,'Rotation Royalty']]},
 {k:'AIR',ic:'\u{1F680}',v:q=>q.bAir,u:n=>n.toFixed(1)+' s longest air',t:[[.8,'Hopper'],[1.5,'Hang Time'],[2.5,'Sky King'],[4,'Astronaut']]},
 {k:'LANDINGS',ic:'\u{1F3AF}',v:q=>q.land,u:n=>n+' clean landing'+(n>1?'s':''),t:[[1,'Soft Touch'],[3,'Smooth Operator'],[5,'Landing Legend'],[8,'Velcro Boots']]},
 {k:'STYLE',ic:'\u{1F9C8}',v:q=>q.perfect||0,u:n=>n+' perfect landing'+(n>1?'s':''),t:[[1,'Butter'],[3,'Silky'],[5,'Surgeon'],[8,'Perfectionist']]},
 {k:'SPEED',ic:'\u26A1',v:q=>q.maxV,u:n=>Math.round(n/10)+' km/h top speed',t:[[900,'Quick'],[1300,'Speed Demon'],[1700,'Mach Skier'],[2200,'Sonic Boom']]}];
function awards(){const out=[];for(const a of AWD){const v=a.v(st);let ti=-1;a.t.forEach((x,i)=>{if(v>=x[0])ti=i});if(ti>=0)out.push({ic:a.ic,k:a.k,name:a.t[ti][1],det:a.u(v,st),ti})}
  if(st.skisOff&&st.noSkiFinish)out.push({ic:'\u{1F9B6}',k:'STYLE',name:'Barefoot Legend',det:'Finished with no skis',ti:3});if(!st.skisOff&&dmg<10&&st.score>0)out.push({ic:'\u{1F3BF}',k:'STYLE',name:'Pristine Skis',det:'Barely a scratch',ti:2});if(resetsUsed>0)out.push({ic:'\u{1F9A8}',k:'STINKY',name:'Stinky Reset',det:'Reset Skis used '+resetsUsed+' time'+(resetsUsed===1?'':'s')+' · −'+resetPenaltyTotal.toLocaleString()+' points',ti:0});return out}
// ---- the end-of-level tally: air and flip points add up one row at a time, then the rating slams in, then the awards drop one by one
let tId=0,fast=false;
const wait=ms=>new Promise(r=>setTimeout(r,fast?0:ms));
function setScore(v){snE.textContent=v.toLocaleString();snE.style.setProperty('--g',glowOf(v).toFixed(3))}
function count(a,b,D,ok){return new Promise(res=>{const t0=performance.now(),f=t=>{if(!ok())return res();const u=fast?1:Math.min(1,(t-t0)/D),e=1-Math.pow(1-u,3);setScore(Math.round(a+(b-a)*e));if(!fast&&window.sndTick)sndTick(u);if(u<1)requestAnimationFrame(f);else res()};requestAnimationFrame(f)})}
async function tally(){const id=++tId,ok=()=>id===tId;fast=false;fxStop();scE.style.setProperty('display','block','important');scE.style.visibility='visible';rowsE.innerHTML='';rtE.innerHTML='';awE.innerHTML='';sbE.textContent='\u00a0';sbE.className='';scE.style.zoom='';awE.style.zoom='';awE.style.setProperty('--fo','0');setScore(0);
  const rows=[['AIR TIME',st.tAir.toFixed(1)+' s in the air',st.aPts],['FLIPS',(st.ff+st.bf)+' flip'+(st.ff+st.bf===1?'':'s')+' ('+st.ff+' front, '+st.bf+' back)',st.fPts]];if(st.hPts>0)rows.push(['HAZARD BONUS',st.hNames||'Cleared a hazard',st.hPts]);if(LVc.endless)rows.push(['DISTANCE',(st.endM||0).toLocaleString()+' m before the crash',st.ePts||0]);if(st.dPts>0)rows.push(['DISTANCE','Longest jump '+(st.jumpM||0).toFixed(1)+' m'+(st.jumpM>=JUMP_K?' (past K!)':''),st.dPts]);if(resetPenaltyTotal>0)rows.push(['RESET PENALTY',resetsUsed+' Reset Skis use'+(resetsUsed===1?'':'s'),-resetPenaltyTotal]);const rowSum=rows.reduce((n,r)=>n+r[2],0),adjustment=st.score-rowSum;if(adjustment!==0)rows.push(['SCORE ADJUSTMENT','Other score corrections',adjustment]);
  // Put the first line on screen immediately so the finish panel never looks like a title-only screen.
  let cum=0;for(const [l,d,p] of rows){const r=document.createElement('div');r.className='row';r.innerHTML='<b>'+l+'</b><span>'+d+'</span><em>'+(p<0?'−':'+')+Math.abs(p).toLocaleString()+'</em>';rowsE.append(r)}
  // Lay out the grade and every award now (hidden), so the screen can be sized to fit once and never jumps while they appear.
  const R=rate(),noSkiEffort=st.noSkiFinish&&!resetsUsed,gradeWord=st.fireDeath?'FOR FIRE!!!':st.sharkDeath?'FOR FISH!!!':noSkiEffort?'(for effort)':R.r[2],gradeNote=noSkiEffort?'':R.note;
  rtE.innerHTML='<div class="stamp pend g-'+R.r[0].replace('+','p')+(st.fireDeath?' fire-grade':'')+(st.sharkDeath?' shark-grade':'')+'"><div class="L">'+R.r[0]+'</div><div class="W">'+gradeWord+'</div></div>'+(gradeNote?'<div class="note" style="visibility:hidden">'+gradeNote+'</div>':'')+(resetsUsed?'<div class="note" style="visibility:hidden">↻ Reset count: '+resetsUsed+' · points deducted: '+resetPenaltyTotal.toLocaleString()+'</div>':'');
  const A=awards(),cards=A.map(a=>{const d=document.createElement('div');d.className='aw pend t'+a.ti;d.style.setProperty('--tc',TIERC[a.ti]);d.title=a.name+' · '+a.k+' · '+a.det;d.innerHTML='<div class="ic">'+a.ic+'</div><b>'+a.name+'</b><i>'+a.k+' \u00b7 '+a.det+'</i><u>'+TIERN[a.ti]+'</u>';awE.append(d);return d});
  for(const g of gearNewUnlocks()){const d=document.createElement('div');d.className='aw pend t3';d.style.setProperty('--tc','#c58bff');d.title='Unlocked '+g.name;   // new gear joins the award reveal
    d.innerHTML='<div class="ic">'+g.ic+'</div><b>'+g.name+'</b><i>NEW GEAR · equip it in Customize</i><u>UNLOCKED</u>';awE.append(d);cards.push(d);A.push({ti:3})}
  if(!A.length){awE.innerHTML='<div class="none" style="visibility:hidden">No awards this run. Go land a flip!</div>'}
  fitResults();
  await wait(350);for(let i=0;i<rows.length;i++){const [l,d,p]=rows[i];if(!ok())return;const r=rowsE.children[i];await count(cum,cum+p,p?900:200,ok);cum+=p;if(p&&!fast&&window.sndRow)sndRow();await wait(300)}
  if(!ok())return;setScore(st.score);await wait(300);if(!ok())return;
  rtE.querySelector('.stamp').classList.remove('pend');rtE.querySelectorAll('.note').forEach(n=>n.style.visibility='');fxStart(R.r[0],noSkiEffort,!!st.fireDeath,!!st.sharkDeath);await wait(1100);
  if(!A.length){const n=awE.querySelector('.none');if(n)n.style.visibility='';growFrame()}
  for(let i=0;i<cards.length;i++){if(!ok())return;const d=cards[i],a=A[i];d.classList.remove('pend');growFrame();if(window.sndAward)sndAward(a.ti);if(a.ti>=1)fxAt(d,a.ti);await wait(450)}
  if(!ok())return;
  /* Start every award's shine on the same frame after the sequential reveal. */
  awE.querySelectorAll('.aw.t1,.aw.t2,.aw.t3').forEach(d=>{d.classList.remove('shine-sync');void d.offsetWidth;d.classList.add('shine-sync')});
  if(!ok())return;const nb=!st.noSkiFinish&&!st.fireDeath&&!st.sharkDeath&&st.score>st.pb;sbE.textContent=nb?'\u2605 NEW BEST \u2605':'Best '+best[cur].toLocaleString();sbE.className=nb?'nb':''}
scE.onclick=()=>{fast=true};
// Keep the whole results screen inside the window: if it is too tall, first shrink the awards frame, then (rarely, e.g. a phone held sideways) the whole panel.
function fitResults(){if(mEl.style.display==='none'||scE.style.display==='none')return;scE.style.zoom='';awE.style.zoom='';
  const wide=innerWidth>innerHeight*1.3&&innerHeight<520;scE.classList.toggle('wide',wide);scE.style.setProperty('display',wide?'grid':'block','important');
  const over=()=>mEl.scrollHeight-mEl.clientHeight>0;let z=1;
  while(over()&&z>.8){z=+(z-.04).toFixed(2);awE.style.zoom=z}
  let z2=1;while(over()&&z2>.4){z2=+(z2-.04).toFixed(2);scE.style.zoom=z2}
  if(awE.style.getPropertyValue('--fo')==='1'){awE.classList.add('snap');growFrame();void awE.offsetWidth;awE.classList.remove('snap')}}
// Size the awards frame to wrap only what is showing. The first award snaps the frame into place, later ones stretch it.
function growFrame(){const els=[...awE.querySelectorAll('.aw:not(.pend)'),...[...awE.querySelectorAll('.none')].filter(n=>n.style.visibility!=='hidden')];
  if(!els.length){awE.style.setProperty('--fo','0');return}
  let l=1e9,t=1e9,r=-1e9,b=-1e9;for(const e of els){l=Math.min(l,e.offsetLeft);t=Math.min(t,e.offsetTop);r=Math.max(r,e.offsetLeft+e.offsetWidth);b=Math.max(b,e.offsetTop+e.offsetHeight)}
  const pad=6,first=awE.style.getPropertyValue('--fo')!=='1',set=()=>{awE.style.setProperty('--fl',(l-pad)+'px');awE.style.setProperty('--ft',(t-pad)+'px');awE.style.setProperty('--fw',(r-l+2*pad)+'px');awE.style.setProperty('--fh',(b-t+2*pad)+'px')};
  if(first){awE.classList.add('snap');set();void awE.offsetWidth;awE.classList.remove('snap');awE.style.setProperty('--fo','1')}else set()}
addEventListener('resize',()=>fitResults());addEventListener('orientationchange',()=>setTimeout(fitResults,250));
function openMenu(fin){paused=true;customizer.style.display='none';document.getElementById('sc').style.display='';selPanel.style.display='';document.exitPointerLock&&document.exitPointerLock();updateResetButton();let runTally=false;
  closeFaq();scE.style.display=fin?'block':'none';selE.style.display=fin?'none':'';if(!fin){sel=cur;showSel(0)}
  if(fin){mh.textContent=LVc.endless?'⛷️ Run over · '+(st.endM||0).toLocaleString()+' m':st.sharkDeath?'🦈 Shark snack!':st.fireDeath?'🔥 Burned to a crisp!':'\u{1F3C1} '+LVc.n+' complete!';ms.textContent=st.sharkDeath?'The shark got you. Jump higher next time!':st.fireDeath?(st.lavaDeath?'You fell in the lava. F FOR FIRE!!!':'You touched the flames. F FOR FIRE!!!'):'';fb.style.display='flex';document.getElementById('replay-menu').style.display=RP.n>1?'':'none';runTally=true}
  else{tId++;fxStop();mh.textContent='Powder Legends';ms.textContent='Choose a level';fb.style.display='none'}
  document.getElementById('customizer').style.display='none';document.getElementById('sc').style.display='';customOpen.style.display=fin?'none':'';
  mEl.style.display='flex';
  if(runTally){scE.style.setProperty('display','block','important');scE.style.visibility='visible';scE.style.opacity='1';tally()}
}
document.getElementById('again').onclick=()=>go(cur);
document.getElementById('all').onclick=()=>openMenu();
document.getElementById('next').onclick=()=>go((cur+1)%LV.length);
document.getElementById('replay-open').onclick=()=>startReplay();document.getElementById('replay-menu').onclick=()=>startReplay();
function replaySetStatus(){const el=document.getElementById('replay-status');el.textContent=(replaySpeed===0?'PAUSED':replaySpeed<0?'REWIND':replaySpeed<1?'SLOW MO':'PLAY')+' · '+Math.max(0,Math.min(100,Math.round(replayIndex/Math.max(1,RP.n-1)*100)))+'%'}
function startReplay(){if(RP.n<2)return;const controls=document.getElementById('replay-controls');if(controls.parentElement!==document.body)document.body.appendChild(controls);replayLiveP=P.map(p=>({...p}));replayLiveCam={...cam};replayLiveZoom=zoom;replayMode=true;paused=true;replayIndex=0;replaySpeed=1;P=rpPose(0,0,0);snap=null;controls.style.setProperty('display','flex','important');controls.style.setProperty('visibility','visible','important');controls.style.setProperty('opacity','1','important');controls.style.setProperty('pointer-events','auto','important');controls.style.zIndex='2147483647';document.getElementById('replay-open').style.display='none';mEl.style.display='none';document.exitPointerLock&&document.exitPointerLock();replaySetStatus()}
function stopReplay(){if(!replayMode)return;replayMode=false;document.getElementById('replay-controls').style.removeProperty('display');document.getElementById('replay-controls').style.display='none';if(replayLiveP)P=replayLiveP; if(replayLiveCam)cam=replayLiveCam;zoom=replayLiveZoom;replayLiveP=null;replayLiveCam=null;document.getElementById('replay-open').style.display=RP.n>1?'':'none';if(st&&st.finishedLevel){paused=true;mEl.style.display='flex'}else{paused=false;lastM=null}updateResetButton()}
document.getElementById('rp-rewind').onclick=()=>{replaySpeed=-1.5;replaySetStatus()};document.getElementById('rp-forward').onclick=()=>{replaySpeed=1;replaySetStatus()};document.getElementById('rp-slow').onclick=()=>{replaySpeed=.25;replaySetStatus()};document.getElementById('rp-pause').onclick=()=>{replaySpeed=replaySpeed===0?1:0;replaySetStatus()};document.getElementById('rp-exit').onclick=stopReplay;
function closeMenu(){fxStop();paused=false;lastM=null;mEl.style.display='none';updateResetButton()}
function go(i){tId++;fxStop();popsE.replaceChildren();cur=i;LVc=LV[i];T=LVc.T;FINISH=LVc.fin;closeMenu();reset();document.getElementById('reset-skis').style.display=LVc.endless?'none':''}   // no checkpoint resets in the endless run
document.getElementById('lb').onclick=()=>paused?closeMenu():openMenu();
loadBest();go(0);
const intro=document.getElementById('intro');
let introTimer;
function skipIntro(){if(intro.style.display==='none')return;intro.style.display='none';clearTimeout(introTimer);if(window.tutAutoStart&&tutAutoStart())return;openMenu()}
intro.addEventListener('pointerdown',skipIntro);
addEventListener('keydown',e=>{if(intro.style.display!=='none'){e.preventDefault();skipIntro()}},true);
introTimer=setTimeout(skipIntro,5000);
let last=performance.now(),acc=0;
