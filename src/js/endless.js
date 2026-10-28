// ======================= ENDLESS RUN =======================
// A course that builds itself ahead of you forever, getting harder as you go. The run ends at your first crash
// (or when your skis come off); your score at that moment is saved as your best for the level.
// Landing zones scale with your top speed, so going faster never means less room to land.
const EN_PX_PER_M=15,EN_PTS_PER_M=20;
const EN={k:null,features:0,maxV:900,rand:Math.random,last:'',m:0,mStep:1000,defer:null};   // defer: while set, props are queued instead of placed
const enProp=f=>{if(EN.defer)EN.defer.push(f);else f()};
function enSeeded(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function endlessNewTrack(){const k=track();k.line(1100,.38);EN.k=k;EN.features=0;EN.maxV=900;EN.last='';EN.m=0;EN.rand=enSeeded(Math.random()*4294967296);endlessExtend(9000);return k.t}
function endlessExtend(toX){while(EN.k.x<toX)endlessFeature()}
function endlessFeature(){
  const k=EN.k,r=EN.rand,d=Math.min(1,EN.features/24),v=Math.max(900,EN.maxV),gap=600+v*.8;   // d: 0 → 1 difficulty; gap: landing room for your speed
  const pool=[['kicker',4],['rollers',2]];if(EN.features>=3)pool.push(['drop',2]);if(EN.features>=5)pool.push(['bridge',2]);
  let kind;for(let tries=0;tries<6;tries++){let t=r()*pool.reduce((a,p)=>a+p[1],0);kind=pool.find(p=>(t-=p[1])<0)[0];if(kind!==EN.last||kind==='kicker')break}
  EN.last=kind;k.ease(260,.4);k.line(250+r()*250,.4);   // short run-in before every feature
  if(kind==='kicker'){jmp(k,.32+.4*d+r()*.1,270+130*d);k.line(gap,.35);k.ease(300,.42);k.line(250,.42)}
  else if(kind==='rollers'){const n=2+Math.floor(r()*2+d*2);for(let i=0;i<n;i++){k.ease(150,-.1-.08*d);k.ease(190,.55);k.line(220,.55);k.ease(160,.3)}k.line(gap*.6,.35)}
  else if(kind==='drop'){k.ease(60,.25);k.ease(70,1.2);k.line(90+130*d,1.2);k.ease(150,.42);k.line(gap,.42)}
  else if(kind==='bridge'){k.ease(260,.08);k.line(200,.08);k.ease(100,0);const g=gorge(k,520+520*d,520);enProp(()=>bridge(g,30,10));k.line(140,0);k.ease(260,.42);k.line(gap*.6,.45)}
  EN.features++;
  if(EN.features%4===0){k.ease(300,.05);k.line(700+v*.35,.05);k.ease(300,.35)}   // breather: a long, nearly flat stretch that bleeds off speed
}
function endlessReset(kind){   // reset() clears all props after this runs, so queue them and place them in build()
  if(kind==='respawn')return;
  EN.defer=[];LVc.T=T=endlessNewTrack();EN.queued=EN.defer;EN.defer=null;
}
function endlessBuild(){(EN.queued||[]).forEach(f=>f());EN.queued=null}
function endlessPreview(){   // a throwaway course for the level-select thumbnail; leaves any live run untouched
  const saved=Object.assign({},EN);EN.defer=[];const t=endlessNewTrack();Object.assign(EN,saved);return t}
function endlessPost(){
  if(!st)return;const h=P[4];
  if(!st.done){EN.maxV=Math.max(EN.maxV,Math.hypot(h.x-h.px,h.y-h.py)*120)}
  if(EN.k.x<h.x+9000)endlessExtend(h.x+13000);   // keep the course built well ahead
  if(T.length>600&&T[300][0]<h.x-6000)T.splice(2,298);   // drop terrain far behind you
  if(boxes.length&&boxes[0].x<h.x-4000){for(let i=boxes.length-1;i>=0;i--)if(boxes[i].x<h.x-4000)boxes.splice(i,1)}
  if(rocks.length&&rocks[0].x<h.x-4000){for(let i=rocks.length-1;i>=0;i--)if(rocks[i].x<h.x-4000)rocks.splice(i,1)}
  // distance points, and a shout every 1,000 m
  if(!st.done&&!st.crash){const m=Math.max(0,Math.floor((h.x-300)/EN_PX_PER_M));if(m>(st.endM||0)){const add=(m-(st.endM||0))*EN_PTS_PER_M;st.score+=add;st.ePts=(st.ePts||0)+add;st.endM=m;
    if(Math.floor(m/EN.mStep)>Math.floor((m-1)/EN.mStep)){spray(m.toLocaleString()+' m!','keep it going',true);fwBurst(h.x,h.y-60,RM()*360,70,3.4,true)}}}
  // first crash (or lost skis) ends the run; your score is banked as-is and any trick in progress is lost
  if(!st.done&&(st.crash||st.skisOff||st.fireDeath)){
    st.done=true;st.finishedLevel=true;st.noSkiFinish=false;st.pb=best[cur];st.fin=0;st.shown=false;st.msg='';st.pendLand=null;
    try{if((st.endM||0)>+(localStorage.getItem('skiEndlessM')||0))localStorage.setItem('skiEndlessM',String(st.endM||0))}catch(e){}
  }
}
function endlessFarthest(){try{return+localStorage.getItem('skiEndlessM')||0}catch(e){return 0}}
