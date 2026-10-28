/* ===== VERSION + UPDATE BOOTLOADER =====
   To ship an update: bump GAME_VERSION (and GAME_NOTES), commit index.html to the GitHub repo below.
   Players press "Update" in the menu, accept, and the new version installs and runs from then on. */
window.GAME_VERSION='1.3.0';
window.GAME_NOTES='Endless Run mode, graded landings (PERFECT pays extra, landings that are not flat score nothing), a new sunset intro, taller mountains, and no more saplings on the Lantern Forest track. All saved scores have been reset for the new landing grades.';
window.UPDATE_REPO='kefirman9000/powder-legends';
window.UPDATE_BRANCH='main';
window.verCmp=function(a,b){a=String(a).split('.').map(Number);b=String(b).split('.').map(Number);for(var i=0;i<Math.max(a.length,b.length);i++){var d=(a[i]||0)-(b[i]||0);if(d)return d>0?1:-1}return 0};
(function(){try{
  if(window.__SKI_FROM_UPDATE)return;                       // already running an installed update
  var v=localStorage.getItem('skiUpdateVer'),h=localStorage.getItem('skiUpdateHTML');
  if(v&&h&&verCmp(v,GAME_VERSION)>0&&!/[?&]noupdate\b/.test(location.search)){
    window.__SKI_FROM_UPDATE=v;
    document.write('<plaintext style="display:none">');    // swallow the old game so none of it runs
    addEventListener('DOMContentLoaded',function(){document.open();document.write(h);document.close()});
  }else if(v&&verCmp(v,GAME_VERSION)<=0){                   // this file is already as new: drop the stored copy
    localStorage.removeItem('skiUpdateVer');localStorage.removeItem('skiUpdateHTML');
  }
}catch(e){}})();
