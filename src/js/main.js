function loop(t){const dt=Math.min((t-last)/1000,.05);acc+=dt*(dbg.on?dbg.ts:1);last=t;fdt=dt;window.audioTick&&audioTick();
  if(replayMode){acc=0;replayIndex+=replaySpeed*dt*60;if(replayIndex<0){replayIndex=0;replaySpeed=0}if(replayIndex>=RP.n-1){replayIndex=RP.n-1;replaySpeed=0}const i=Math.floor(replayIndex),j=Math.min(RP.n-1,i+1),u=replayIndex-i;P=rpPose(i,j,u);snap=null;replaySetStatus();}
  else {if(paused)acc=0;if(dbg.on&&dbg.frozen){acc=dbg.stepN>0?1/120:0;if(dbg.stepN>0)dbg.stepN--}while(acc>=1/120){snap=P.map(p=>[p.x,p.y]);step();if(dbg.on)dbgPost();if(window.tutPost)tutPost();if(LVc.post)LVc.post();if(!replayMode&&P&&P.length) {if((RP.tick++&1)===0)rpPush();if(RP.n===2){document.getElementById('replay-open').style.display=''}if(st&&st.finishedLevel&&RP.n>1&&!st.rpMenuShown){st.rpMenuShown=true;document.getElementById('replay-menu').style.display=''}}acc-=1/120}}al=acc*120;
  // Behind the level select / results screen nothing moves, so redraw only ~4x a second (saves battery). The customizer previews the live canvas, so it keeps full rate.
  // Behind a menu: keep drawing at full speed for a moment so the camera can settle, then freeze the scene
  // (the canvas keeps its last frame). A still background looks clean through the see-through overlay and costs nothing;
  // the old ~4 fps trickle made moving things behind the menu look laggy. The customizer previews the live canvas, so it stays live.
  const idle=paused&&!replayMode&&customizer.style.display==='none';
  if(!idle)idleSince=0;else if(!idleSince)idleSince=t;
  if(!idle||t-idleSince<IDLE_SETTLE_MS||needRedraw){draw();if(dbg.on)dbgDraw();needRedraw=false}
  hapTick();if(window.tutFrame)tutFrame();
  requestAnimationFrame(loop)}
let idleSince=0,needRedraw=false;const IDLE_SETTLE_MS=900;
addEventListener('resize',()=>{needRedraw=true});   // a frozen frame still has to follow a resize
requestAnimationFrame(loop);
