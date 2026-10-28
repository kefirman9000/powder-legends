// --- terrain profiles (terrain control points are [x,y], y down; the skier starts at x=300)
// Smooth terrain builder: line() = straight run, ease() = slope changes smoothly (smoothstep) so ramps have no kinks
function track(){const t=[[-500,0],[0,0]];let x=0,y=0,s=0;const o={t,
  line(len,sl){x+=len;y+=len*sl;s=sl;t.push([x,y]);return o},
  ease(len,sl){const n=Math.max(2,Math.round(len/20)),dx=len/n,s0=s;for(let i=1;i<=n;i++){const a=(i-.5)/n;x+=dx;y+=dx*(s0+(sl-s0)*a*a*(3-2*a));t.push([x,y])}s=sl;return o},
  get x(){return x},get y(){return y}};return o}
const fwk=(()=>{const k=track();
  k.line(900,.45);k.ease(260,-.45);k.line(40,-.45);k.ease(160,.3);k.line(520,.3);k.ease(300,.5);k.line(900,.5);   // warm-up slope, first kicker
  k.ease(240,-.5);k.line(50,-.5);k.ease(180,.35);k.line(560,.35);k.ease(300,.45);k.line(900,.45);                    // second, bigger kicker
  k.ease(320,-.6);k.line(60,-.6);k.ease(200,.4);k.line(700,.4);k.ease(300,.45);k.line(2200,.45);return{t:k.t,fin:k.x-350}})();
const pine=(()=>{const k=track();
  k.line(1500,.5);k.ease(320,-.55);k.line(60,-.55);k.ease(180,.35);   // long curved kicker, then the ground falls away under the jump
  const lip=k.x;k.line(450,.35);k.ease(300,.45);k.line(1000,.45);
  k.ease(340,-.6);k.line(60,-.6);k.ease(180,.35);const lip2=k.x;k.line(450,.35);k.ease(300,.45);k.line(2500,.45);return{t:k.t,lip,lip2,fin:lip2+1500}})();
const rocky=(()=>{const k=track();   // repeating pattern: runway -> feature -> gentle landing slope -> long, very mellow stretch that bleeds off speed. Features grow a little each round.
  k.line(1400,.24);   // long, gentle opening runup before the first jump
  for(let i=0;i<8;i++){
    const g=Math.floor(i/2);   // round number: 0,0,1,1,2,2,3,3 (ramp then falloff, a bit bigger each round)
    k.line(450,.26);   // straight runway
    if(i%2===0){k.ease(110,-.45);k.line(70+g*20,-.45);k.ease(110,.4)}   // classic kicker: clear rising lip, then the snow falls away
    else{k.ease(70,1.25);k.line(110+g*30,1.25);k.ease(110,.4)}            // falloff: a sharp brink and a steep (but shorter-lived) drop
    k.line(260,.4);   // gentler landing slope
    k.ease(260,.04);k.line(900,.04);   // long, almost flat recovery so you can slow down and reset
    if(i%2===1){k.ease(200,.14);k.line(500,.14);k.ease(200,.0);k.line(350,.0)}   // after every falloff, an extra rolling breather
    k.ease(260,.26);   // slope picks back up gently for the next runway
  }
  k.line(300,.26);k.ease(200,.15);k.line(2200,.15);return{t:k.t,fin:k.x-450}})();
const wall=(()=>{const k=track();
  // Fast approach into a clear kicker lip, an open flight zone over the first wall, a sloped landing...
  k.line(1150,.48);k.ease(180,-.22);k.line(100,-.22);k.ease(170,.9);k.line(180,.9);
  const lip=k.x;
  k.ease(150,.08);k.line(180,.08);k.ease(260,.48);k.line(1600,.42);
  // ...then a second kicker into the second wall, and a long landing slope to the finish.
  k.ease(180,-.26);k.line(100,-.26);k.ease(170,.9);k.line(180,.9);
  const lip2=k.x;
  k.ease(150,.08);k.line(180,.08);k.ease(260,.48);k.line(2600,.42);return{t:k.t,lip,lip2,fin:lip2+2250}})();
function ter2(t,x){for(let i=0;i<t.length-1;i++){if(x<=t[i+1][0]){const a=t[i],b=t[i+1];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}}return t[t.length-1][1]}
const shk=(()=>{const k=track();
  // Same fast approach and kicker as the Inferno Wall, but the flat after the jump is cut away into a pool.
  k.line(3000,.48);k.ease(180,-.22);k.line(100,-.22);k.ease(170,.9);k.line(180,.9);
  const lip=k.x;
  k.ease(150,.08);k.line(60,.08);
  const rimX=k.x,rimY=k.y;
  const wy=rimY+60, SL=3.4;
  k.ease(40,SL);k.line(150,SL);k.ease(40,0);k.line(260,0);   // near wall: near-vertical drop into a deep, wide pool floor
  k.ease(40,-SL);k.line(139,-SL);   // far wall: mirror of the near wall, crest ~100px above the water
  const bankX=k.x;
  k.ease(100,.7);k.line(900,.7);k.ease(300,.42);k.line(1100,.42);   // raised landing ramp: you land sooner, on a gentler slope
  k.ease(300,-.5);k.line(60,-.5);k.ease(180,.35);const lip2=k.x;k.line(450,.35);k.ease(300,.45);k.line(2500,.45);   // second jump: a plain kicker on dry land
  const water={y:wy,x0:0,x1:0,depth:700};
  for(let x=rimX;x<bankX;x+=1){if(ter2(k.t,x)>wy){water.x0=x;break}}
  for(let x=bankX;x>rimX;x-=1){if(ter2(k.t,x)>wy){water.x1=x;break}}
  return{t:k.t,lip,lip2,fin:lip2+1700,water}})();
const mega=(()=>{const k=track();
  k.line(1700,.55);k.ease(450,-.8);k.line(90,-.8);k.ease(250,.5);const lip=k.x;k.line(2200,.5);
  k.ease(400,-.7);k.line(80,-.7);k.ease(250,.5);const lip2=k.x;k.line(2400,.5);k.ease(500,0);return{t:k.t,lip,lip2,fin:lip2+2700}})();
const crt=(()=>{const k=track();
  k.line(1400,.5);k.ease(320,-.5);k.line(60,-.5);k.ease(160,1.2);const lip=k.x;k.line(200,1.2);k.ease(250,0);k.line(350,0);   // flat run-out where the crate pyramids sit
  k.ease(300,.5);k.line(1300,.5);
  k.ease(320,-.5);k.line(60,-.5);k.ease(160,1.2);const lip2=k.x;k.line(200,1.2);k.ease(250,0);k.line(350,0);
  k.ease(300,.5);k.line(2700,.5);k.ease(400,0);return{t:k.t,lip,lip2,fin:lip2+3550}})();   // ...then the ground rolls away into a long landing slope past the crates
const mog=(()=>{const k=track(),M=[];
  // Flowing rollers you can pop off (each has a short uphill back side), a kicker after each set, and a big finale kicker.
  const roll=(n,len,dn,up)=>{for(let i=0;i<n;i++){k.ease(len*.6,-up);M.push(k.x);k.ease(len*.7,dn);k.line(len*1.1,dn);k.ease(len*.8,.25);k.line(len*.5,.25)}k.ease(len,.45)};   // each roller: gentle lip, then a long downhill landing (never land on an uphill face)
  const kick=(up,L)=>{k.ease(L,-up);k.line(60,-up);k.ease(180,.35);const lip=k.x;k.line(450,.35);k.ease(300,.45);return lip};
  k.line(700,.45);roll(4,230,.6,.12);k.line(500,.45);kick(.5,300);k.line(700,.45);
  roll(5,240,.65,.16);k.line(550,.45);kick(.58,320);k.line(800,.45);
  k.ease(300,.55);k.line(600,.55);const l3=kick(.7,380);k.line(2400,.45);return{t:k.t,M,fin:l3+2300}})();
const pipe=(()=>{const k=track();
  k.line(1800,.6);k.ease(450,0);k.line(400,0);k.ease(420,-1.4);const lip=k.x;k.line(40,-1.4);k.ease(260,.5);k.line(1800,.55);
  k.ease(400,0);k.line(200,0);k.ease(380,-1.3);const lip2=k.x;k.line(40,-1.3);k.ease(260,.5);k.line(2600,.5);k.ease(400,0);return{t:k.t,lip,lip2,fin:lip2+2200}})();
// mellow kicker: gentle curved ramp, then the ground falls away under the jump. Returns the x of the lip
const jmp=(k,up,L=320,L2=180)=>{k.ease(L,-up);k.line(60,-up);k.ease(L2,.35);return k.x};
const dbl=(()=>{const k=track();
  k.line(1400,.5);jmp(k,.5,300);k.line(450,.35);k.ease(300,.42);k.line(1100,.42);
  const l2=jmp(k,.58,330);k.line(450,.35);k.ease(300,.45);k.line(2500,.45);return{t:k.t,fin:l2+2250}})();
// --- shared pieces for the newer levels
// gorge(): sheer drop, flat floor, sheer climb back to the same height. Returns the two rim x's and the rim height.
function gorge(k,span,depth){const x0=k.x,y0=k.y,w=depth/4;k.line(w,4);k.line(Math.max(40,span-2*w),0);k.line(w,-4);return{x0,x1:k.x,y:y0}}
// bridge(): a deck of planks spanning a gorge. Touch a plank and it lets go a moment later; each falling plank
// shakes its neighbour loose, so the collapse chases you across. hold = steps before a touched plank drops,
// chain = steps for the collapse to spread one plank (lower = faster chase).
function bridge(g,hold,chain){const PW=46,n=Math.ceil((g.x1-g.x0)/(PW-2)),step=(g.x1-g.x0)/n,hh=9;let prev=null;
  for(let i=0;i<n;i++){const b=addBox(g.x0+step*(i+.5),g.y+hh,step/2+1,hh,{k:'plank',deck:true,hold,chain,mu:.02,lim:[1800,420],say:'Smashed into the bridge!'});if(prev){prev.next=b;b.prev=prev}prev=b}}
// lavaPit(): like the shark pool, a sunken pit; returns the lava surface span for LVc.lava
function lavaPit(k,floor){k.ease(150,.08);k.line(60,.08);const rimX=k.x,rimY=k.y,ly=rimY+60,SL=3.4;
  k.ease(40,SL);k.line(150,SL);k.ease(40,0);k.line(floor,0);k.ease(40,-SL);k.line(139,-SL);const bankX=k.x;
  const p={y:ly,x0:0,x1:0};for(let x=rimX;x<bankX;x++){if(ter2(k.t,x)>ly){p.x0=x;break}}for(let x=bankX;x>rimX;x--){if(ter2(k.t,x)>ly){p.x1=x;break}}
  k.ease(100,.7);k.line(700,.7);k.ease(300,.42);return p}
const brg=(()=>{const k=track();
  k.line(1300,.42);k.ease(260,.08);k.line(200,.08);k.ease(100,0);
  const g1=gorge(k,640,520);k.line(120,0);k.ease(260,.42);k.line(1100,.45);              // bridge 1: a short warm-up crossing
  const lip=jmp(k,.4,300);k.ease(80,0);const g2=gorge(k,1050,560);k.line(140,0);           // bridge 2: launch off a kicker and land on the deck
  k.ease(260,.4);k.line(1300,.45);k.ease(260,.08);k.line(250,.05);k.ease(100,0);
  const g3=gorge(k,1350,620);k.line(160,0);k.ease(300,.42);k.line(2400,.42);              // bridge 3: the long one, so keep your speed
  return{t:k.t,g:[g1,g2,g3],fin:g3.x1+1800}})();
const vol=(()=>{const k=track(),walls=[];
  k.line(1200,.46);k.ease(180,-.22);k.line(100,-.22);k.ease(170,.9);k.line(180,.9);walls.push(k.x+320);k.ease(150,.08);k.line(180,.08);k.ease(260,.48);k.line(1300,.44);   // kicker over a fire wall
  jmp(k,.5,320);const p1=lavaPit(k,260);k.line(1100,.42);                                           // kicker over the first lava pit
  k.ease(300,.55);k.line(700,.55);jmp(k,.72,400,240);const p2=lavaPit(k,520);k.line(500,.42);      // the big one: a much wider pit
  k.ease(180,-.24);k.line(100,-.24);k.ease(170,.9);k.line(180,.9);walls.push(k.x+330);k.ease(150,.08);k.line(180,.08);k.ease(260,.48);k.line(2400,.42);   // last wall
  return{t:k.t,walls,lava:[p1,p2],fin:walls[1]+2000}})();
const lan=(()=>{const k=track(),secs=[];
  k.line(900,.36);
  for(let i=0;i<4;i++){k.ease(220,.12);secs.push(k.x);k.line(760,.12);if(i<3){jmp(k,.26+i*.04,220);k.line(320,.35);k.ease(250,.3)}}
  k.line(300,.32);const lip=jmp(k,.5,330);k.line(500,.35);k.ease(300,.42);k.line(2400,.42);
  return{t:k.t,secs,fin:lip+2250}})();
// Lantern Forest scenery: dark pine silhouettes behind the slope and warm lanterns along the run
const hash=n=>{n=Math.sin(n*127.1)*43758.5453;return n-Math.floor(n)};
function lanternBack(){   // a distant pine forest band behind the slope (screen space, parallax) so it never looks like it's on the track
  cx.save();cx.setTransform(1,0,0,1,0,0);const sc=ZB*zoom,par=.3,base=H*.66,step=Math.max(10,Math.round(26*sc));
  for(const [k,col,a] of [[0,'#16234a',.9],[1,'#0e1736',1]]){cx.fillStyle=col;cx.globalAlpha=a;cx.beginPath();cx.moveTo(0,H);
    const off=cam.x*(par+k*.12)*sc;for(let X=-step;X<=W+step;X+=step){const i=Math.floor((X+off)/step),x=i*step-off,hh=(48+hash(i+k*31)*60)*sc*(1+k*.25),yb=base+k*28*sc;
      cx.lineTo(x-step*.5,yb);cx.lineTo(x,yb-hh);cx.lineTo(x+step*.5,yb)}
    cx.lineTo(W,H);cx.closePath();cx.fill()}
  cx.restore()}
function lanternFront(){const t=performance.now()/1000,x0=Math.floor((cam.x-100)/420),x1=Math.ceil((cam.x+W/Z+100)/420);
  for(let i=Math.max(1,x0);i<=x1;i++){const x=i*420+90,y=ter(x).y,fl=.85+.15*Math.sin(t*7+i*2.3)*Math.sin(t*3.1+i);
    cx.strokeStyle='#2a2238';cx.lineWidth=2.5;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x,y-46);cx.lineTo(x+9,y-46);cx.stroke();
    const g=cx.createRadialGradient(x+9,y-38,1,x+9,y-38,46*fl);g.addColorStop(0,'rgba(255,214,120,.75)');g.addColorStop(.35,'rgba(255,160,60,.25)');g.addColorStop(1,'rgba(255,140,40,0)');
    cx.fillStyle=g;cx.beginPath();cx.arc(x+9,y-38,46*fl,0,7);cx.fill();cx.fillStyle='#ffd27a';cx.fillRect(x+5,y-43,8,10);cx.strokeStyle='#3a2a1a';cx.lineWidth=1.2;cx.strokeRect(x+5,y-43,8,10)}}
const gla=(()=>{const k=track();
  k.line(900,.45);for(let i=0;i<3;i++){k.ease(260,.15);k.ease(260,.5)}k.line(500,.45);   // gentle rollers to build speed
  jmp(k,.5,300);k.line(500,.35);k.ease(300,.4);k.line(1200,.4);
  jmp(k,.6,340);k.line(500,.35);k.ease(300,.4);k.line(1400,.4);k.ease(300,.55);k.line(700,.55);
  const l3=jmp(k,.8,450,250);k.line(700,.35);k.ease(400,.5);k.line(3000,.5);return{t:k.t,fin:l3+2850}})();
const ava=(()=>{const k=track();k.line(450,.52);for(let i=0;i<5;i++){k.ease(130,.95);k.line(100,.95);k.ease(180,.18);k.line(250,.18)}k.ease(260,-.48);k.line(65,-.48);k.ease(210,.4);k.line(2500,.4);return{t:k.t,fin:k.x-350}})();
const slalom=(()=>{const k=track();k.line(500,.35);for(let i=0;i<7;i++){k.ease(150,i%2?-.28:.62);k.line(140,i%2?-.28:.62);k.ease(150,.35);k.line(180,.35)}k.ease(240,-.5);k.line(60,-.5);k.ease(190,.38);k.line(2100,.38);return{t:k.t,fin:k.x-350}})();
const longHaul=(()=>{const k=track();
  // A deliberately epic endurance course: distinct terrain chapters separated by long, fast runouts.
  k.line(1100,.38);k.ease(260,-.48);k.line(55,-.48);k.ease(190,.32);k.line(650,.32);k.ease(260,.44);k.line(850,.44);
  k.ease(320,-.62);k.line(65,-.62);k.ease(210,.38);k.line(1050,.38);k.ease(280,.52);k.line(1000,.52);
  for(let i=0;i<5;i++){k.ease(170,i%2?-.32:.58);k.line(70,i%2?-.32:.58);k.ease(160,.34);k.line(420,.34)}
  k.line(1500,.42);k.ease(360,-.72);k.line(75,-.72);k.ease(230,.42);k.line(1250,.42);
  for(let i=0;i<4;i++){k.ease(260,.12);k.ease(260,.5);k.line(330,.5)}
  k.ease(420,-.86);k.line(90,-.86);k.ease(280,.32);k.line(1800,.32);k.ease(300,.48);k.line(2400,.48);
  return{t:k.t,fin:k.x-350}})();
// Ski School: the tutorial course (flat practice area, a long run to learn the brake, a small kicker, a big kicker)
const school=(()=>{const k=track();k.line(700,0);k.ease(300,.3);k.line(1500,.3);
  const L1=jmp(k,.35,260);k.line(400,.35);k.ease(300,.42);k.line(1100,.42);
  const L2=jmp(k,.6,340);k.line(500,.35);k.ease(300,.45);k.line(2600,.45);return{t:k.t,L1,L2}})();
const LV=[
 {n:'Ski School',d:'New here? Start with this. Six quick steps teach the controls: crouch, stand, lean, brake, jump and flip. No score and no pressure; skip it any time.',
  T:school.t,fin:1e9,tutorial:true,L1:school.L1,L2:school.L2,sky:['#5aa7e8','#e3f2fc'],far:'#a8c2dc',snow:'#f8fbff',edge:'#8bb2d8'},
 {n:'Pine Hop',d:'Launch off two kickers and clear both pine groves. Come up short and you land on the treetops: they bend under you and spring back.',
  T:pine.t,fin:pine.fin,
  sky:['#5c9be0','#cfe6fa'],far:'#9db7d4',snow:'#f6faff',edge:'#7ea6d0',
  build(){for(const lp of [pine.lip,pine.lip2])for(let x=lp+200;x<lp+520;x+=78)addTree(x+(rnd()-.5)*16,70+rnd()*30)}},
 {n:'Death Valley',d:'A mountain of classic ramps and sheer falloffs with smooth slopes in between. Launch, drop, land and survive.',
  T:rocky.t,fin:rocky.fin,cliff:true,sky:['#6b7686','#c9cfd8'],far:'#8a919c',snow:'#eef1f5',edge:'#6f7f94',
  },
 {n:'Inferno Walls',d:'Two kickers, two blazing walls of fire. Build speed and launch cleanly over both, because touching the flames ends your run in smoke. Each wall you clear gives a x2 bonus on that jump (x3 if you skim just over it).',
  T:wall.t,fin:wall.fin,
  sky:['#4f8fd8','#d8ecfb'],far:'#a3b5c9',snow:'#f6faff',edge:'#7ea6d0',
  build(){for(const lp of [wall.lip,wall.lip2]){const wx=lp+320, ground=ter(wx).y, wallHalfHeight=90;addBox(wx,ground+8-wallHalfHeight,12,wallHalfHeight,{k:'fire-wall',lim:[420,200],say:'Touched the fire!',mu:.08})}}},
 {n:'Shark Pool',d:'Launch off the kicker and sail over a pool of hungry sharks. Stay low and a shark leaps out to grab you; fall short and you are lunch. Clear the water high to earn a x2 bonus (x3 for a close shave), then send the second kicker on dry land.',
  T:shk.t,fin:shk.fin,water:shk.water,
  sky:['#3aa6d8','#e4f6fb'],far:'#8fb8cf',snow:'#f4fbff',edge:'#6fb0cc'},
 {n:'Mega Ramp',d:'A huge drop-in feeds two giant kickers. Get massive air, stack up flips, and stick the long landing slope.',
  T:mega.t,fin:mega.fin,sky:['#3f7fd0','#bfe0f7'],far:'#8fb0d3',snow:'#f6faff',edge:'#7ea6d0'},
 {n:'Crate Stack',d:'Launch off two kickers and soar over the crate pyramids waiting on each flat. Clip one and you will know about it.',
  T:crt.t,fin:crt.fin,sky:['#d9843f','#fbe3b8'],far:'#c49a72',snow:'#fbf5ee',edge:'#c9a07a',
  build(){for(const lp of [crt.lip,crt.lip2]){pyramid(lp+CRX[0],CRX[1]);pyramid(lp+CRX[2],CRX[3])}}},
 {n:'Mogul Field',d:'Two sets of big, flowing rollers, each ending in a kicker, then a big finale jump. Stand up off the back of a roller to pop some air, and save your flips for the kickers.',
  T:mog.t,fin:mog.fin,sky:['#5aa7e8','#e0f1fb'],far:'#a8c2dc',snow:'#f8fbff',edge:'#8bb2d8',
  },
 {n:'Quarter Pipe',d:'Build up speed through the bowl, then rocket up the wall for a huge vertical launch. Then do it again on the second wall. Time for big flips.',
  T:pipe.t,fin:pipe.fin,sky:['#8a4fb0','#f2b8d9'],far:'#a07ab8',snow:'#f7f0fa',edge:'#a58ac0'},
 {n:'Sunset Double',d:'Two mellow kickers back to back, each with a long, forgiving landing slope. Get comfortable, then stack flips on the second one.',
  T:dbl.t,fin:dbl.fin,sky:['#e0704a','#fbd9a0'],far:'#b8808a',snow:'#fdf3ea',edge:'#d2a08a'},
 {n:'Rickety Bridge',d:'Three old plank bridges over bottomless gorges. Every plank you touch gives way behind you, and the collapse chases you across, so carry your speed. The middle bridge you reach by launching off a kicker and landing on the deck.',
  T:brg.t,fin:brg.fin,cliff:true,sky:['#6f8fb5','#e6d9c5'],far:'#8d97a6',snow:'#f4f2ee',edge:'#a49a8a',
  build(){brg.g.forEach((g,i)=>bridge(g,i===2?26:30,i===2?9:10))}},
 {n:'Volcano Run',d:'Ash-grey snow on the flank of a live volcano. Jump two walls of fire and two pools of lava; touch either and you go up in smoke. Every hazard you clear pays a x2 bonus on that jump (x3 if you skim just over it).',
  T:vol.t,fin:vol.fin,lava:vol.lava,weather:'ash',sky:['#2a0d10','#c4471f'],far:'#4a2420',snow:'#d6d0cc',edge:'#6b4c44',
  build(){for(const wx of vol.walls){const hh=90;addBox(wx,ter(wx).y+8-hh,12,hh,{k:'fire-wall',lim:[420,200],say:'Touched the fire!',mu:.08})}}},
 {n:'Lantern Forest',d:'A quiet night run through a lantern-lit pine forest. Three little kickers to warm up your timing, then one proper jump at the end. Keep it smooth and stomp every landing.',
  T:lan.t,fin:lan.fin,sky:['#060b20','#1f2d58'],far:'#121a38',snow:'#dbe4f5',edge:'#7c8fc2',drawBack:lanternBack,drawFront:lanternFront,
  },
 {n:'Ski Jump Hill',d:'One giant Olympic-style ski jump. Crouch on the inrun, pop off the edge of the table, and lean forward in the air so you do not rotate onto your back. Fly as far as you can and land it clean: every metre is worth 1,000 points, and your longest jump is saved as the hill record. K marks 120 m. Land past it and the hill flattens out under you, so the landings get harder.',
  T:sjh.t,fin:sjh.fin,jump:true,post:jumpPost,onReset:jumpReset,drawFront:jumpDrawFront,sky:['#3f86d6','#d9ecfb'],far:'#93add0',snow:'#f8fbff',edge:'#7ea6d0'},
 {n:'Fireworks Hill',d:'A night run down a long hill with three kickers while fireworks go off in the sky ahead of you the whole way down. Flip in time with the show.',
  T:fwk.t,fin:fwk.fin,sky:['#060924','#3a2866'],far:'#1b1842',snow:'#dfe6ff',edge:'#8d9ee0',fw:{from:500,gap:230}},
 {n:'Glacier Run',d:'The long one. Roll over gentle swells to build speed, clear two mellow jumps, then send the big glacier kicker at the end.',
  T:gla.t,fin:gla.fin,sky:['#3aa6c8','#d6f4fb'],far:'#8fc0d2',snow:'#f2fbff',edge:'#7fbad0'},
 {n:'Avalanche Escape',d:'A steep, stepped chute. Keep your speed up, use the shelves to launch, and send the big kicker at the bottom.',
  T:ava.t,fin:ava.fin,sky:['#66788b','#e4edf4'],far:'#8b9eaf',snow:'#f4f8fb',edge:'#a9c5d8'},
 {n:'Icefall Slalom',d:'A technical icy course with alternating steep banks, flowing slalom lines and one final kicker. Pick your line carefully before sending the last jump. No loose rocks obstruct the run.',
  T:slalom.t,fin:slalom.fin,sky:['#173b62','#b8e8f2'],far:'#5c91aa',snow:'#edfaff',edge:'#7bc4d8'},
 {n:'The Long Haul',d:'The endurance run. A huge, clear mountain descent with rolling warm-ups, repeated jump sections, mogul-like rhythm changes and a final glacier-sized send. Settle in — this one is built to show off extended level length, with no stray trees or rocks blocking the route.',
  T:longHaul.t,fin:longHaul.fin,sky:['#18294f','#f2a16c'],far:'#596b91',snow:'#f4f6ff',edge:'#a5b7e8',par:2.5}
,
 {n:'Endless Run',d:'A mountain that never ends. The course builds itself ahead of you and keeps getting harder: kickers, rollers, sudden drops and crumbling bridges. The run ends at your first crash, and your score at that moment is your record. Every metre is worth 20 points, and landing zones grow with your speed.',
  T:[[-500,0],[0,0],[1100,418]],fin:1e9,endless:true,par:2,post:endlessPost,onReset:endlessReset,build:endlessBuild,sky:['#1e3c72','#f2a65a'],far:'#5d6f96',snow:'#f6f8ff',edge:'#8fa6d6'}
];
// Finish lines sit a bit farther down every course so there's room to land and settle before crossing. The shark pool gets extra.
const FIN_EXTRA=500,FIN_EXTRA_SHARK=900;
// Level order, easiest first (based on jump size, hazards, length and how often a hands-off test run crashes).
const LEVEL_ORDER=['Ski School','Sunset Double','Pine Hop','Icefall Slalom','Avalanche Escape','Lantern Forest','Crate Stack','Rickety Bridge','Fireworks Hill','Mogul Field','Glacier Run','Quarter Pipe','Ski Jump Hill','Mega Ramp','Inferno Walls','Shark Pool','Volcano Run','Death Valley','The Long Haul','Endless Run'];
LV.sort((a,b)=>LEVEL_ORDER.indexOf(a.n)-LEVEL_ORDER.indexOf(b.n));
LV.forEach(l=>{if(l.endless||l.tutorial)return;const add=l.water?FIN_EXTRA_SHARK:FIN_EXTRA;l.fin+=add;const e=l.T[l.T.length-1];if(e[0]<l.fin+800)l.T.push([l.fin+800,e[1]])});   // flat ground already continues past a course's last point; the extra point just keeps it drawn past the new line
let CRX=[480,5,680,4];
const PAR={'Ski Jump Hill':.55,'Pine Hop':.8,'Death Valley':.8,'Inferno Walls':1,'Shark Pool':.9,'Mega Ramp':1.5,'Crate Stack':1.1,'Mogul Field':1.1,'Quarter Pipe':1.5,'Sunset Double':.9,'Rickety Bridge':1,'Volcano Run':1.1,'Lantern Forest':.8,'Glacier Run':1.6,'Fireworks Hill':1};
LV.forEach(l=>l.par=l.par||PAR[l.n]||1);   // par: how big a score counts as an S on each level (times SPAR)
