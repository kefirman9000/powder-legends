// ===== IN-GAME UPDATER =====
// Reads index.html straight from the GitHub repo, compares its GAME_VERSION with this one, and on "Install"
// stores the new game in localStorage and reloads. The bootloader in <head> then runs the stored version.
// Works when opened as a local file, on GitHub Pages, or anywhere else.
(function(){
const $=id=>document.getElementById(id),modal=$('upd-modal'),msgE=$('upd-msg'),notesE=$('upd-notes'),actE=$('upd-act');
const running=window.__SKI_FROM_UPDATE||GAME_VERSION;

let found=null,busy=false;
const RAW=()=>'https://raw.githubusercontent.com/'+UPDATE_REPO+'/'+UPDATE_BRANCH+'/index.html?t='+Date.now();
const API=()=>'https://api.github.com/repos/'+UPDATE_REPO+'/contents/index.html?ref='+UPDATE_BRANCH;
async function fetchLatest(){
  let html=null;
  try{const r=await fetch(RAW(),{cache:'no-store'});if(r.ok)html=await r.text()}catch(e){}
  if(!html){const r=await fetch(API(),{cache:'no-store',headers:{Accept:'application/vnd.github.raw'}});if(!r.ok)throw new Error(r.status===404?'repo-missing':'http-'+r.status);html=await r.text()}
  const v=(html.match(/window\.GAME_VERSION\s*=\s*['"]([\d.]+)['"]/)||[])[1];
  if(!v||!/<html[\s>]/i.test(html))throw new Error('bad-file');
  const notes=((html.match(/window\.GAME_NOTES\s*=\s*'((?:[^'\\]|\\.)*)'/)||[])[1]||'').replace(/\\'/g,"'");
  return{v,notes,html};
}
function show(title,text,notes,buttons){$('upd-title').textContent=title;msgE.textContent=text;notesE.style.display=notes?'block':'none';notesE.textContent=notes||'';actE.replaceChildren(...buttons.map(([label,fn,cls])=>{const b=document.createElement('button');b.className='b '+(cls||'');b.textContent=label;b.onclick=fn;return b}));modal.style.display='flex'}
const close=()=>{modal.style.display='none'};
modal.addEventListener('pointerdown',e=>{if(e.target===modal&&!busy)close()});
modal.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'&&!busy)close()});
function badge(on){   // an update was found: show the install banner on the main menu (hidden otherwise)
  const b=$('upd-banner');if(!b)return;b.hidden=!on;if(on&&found){$('upd-banner-txt').textContent='Version '+found.v+' is ready'}}
window.updCheck=()=>check();window.updRunning=running;
function undoBtn(){return window.__SKI_FROM_UPDATE?[['Undo update',()=>{try{localStorage.removeItem('skiUpdateVer');localStorage.removeItem('skiUpdateHTML')}catch(e){}location.reload()},'ghost']]:[]}
async function check(){
  if(busy)return;busy=true;show('Checking for updates…','Looking at github.com/'+UPDATE_REPO,'',[]);
  try{
    found=await fetchLatest();busy=false;
    if(verCmp(found.v,running)>0){badge(true);
      show('Update available!','You have v'+running+'. Version '+found.v+' is ready to install.',found.notes,[['Later',close,'ghost'],['Install v'+found.v,install]])}
    else{badge(false);show('You\'re up to date','You\'re running the latest version (v'+running+').','',[...undoBtn(),['OK',close]])}
  }catch(e){busy=false;
    const why=e.message==='repo-missing'?'The update repo github.com/'+UPDATE_REPO+' wasn\'t found. Make sure it exists, is public, and has index.html on the '+UPDATE_BRANCH+' branch.':e.message==='bad-file'?'The file on GitHub doesn\'t look like a valid game build (no GAME_VERSION found).':'Couldn\'t reach GitHub. Check your internet connection and try again.';
    show('Update check failed',why,'',[...undoBtn(),['OK',close]])}
}
function install(){
  if(!found)return;busy=true;show('Installing v'+found.v+'…','Saving the new version…','',[]);
  try{localStorage.setItem('skiUpdateHTML',found.html);localStorage.setItem('skiUpdateVer',found.v);
    show('Installed!','Version '+found.v+' is installed. Restarting the game…','',[]);setTimeout(()=>{const u=location.href.replace(/([?&])noupdate\b[^&]*&?/,'$1');location.replace(u)},700)}
  catch(e){busy=false;   // storage full or blocked (e.g. private mode): hand over the file instead
    const url=URL.createObjectURL(new Blob([found.html],{type:'text/html'}));
    show('Couldn\'t install automatically','Your browser blocked saving the update. Download the new version and open it instead.','',[['Close',close,'ghost'],['Download v'+found.v,()=>{const a=document.createElement('a');a.href=url;a.download='Ski_Stunt_Simulator_v'+found.v+'.html';a.click()}]])}
}
$('upd-banner-go').addEventListener('click',()=>{if(found)install()});
$('upd-banner-more').addEventListener('click',()=>{if(found)show('Update available!','You have v'+running+'. Version '+found.v+' is ready to install.',found.notes,[['Later',close,'ghost'],['Install v'+found.v,install]])});
// quiet background check shortly after launch: just lights up the NEW badge
setTimeout(async()=>{try{const f=await fetchLatest();if(verCmp(f.v,running)>0){found=f;badge(true)}}catch(e){}},4000);
})();
