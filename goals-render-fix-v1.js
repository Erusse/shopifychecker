(()=>{
function forceGoalsRender(){
 const list=document.getElementById('goalList');
 if(!list||!Array.isArray(d.goals))return;
 try{
  const p=goalPlan();
  list.innerHTML=p.goals.slice().sort((a,b)=>a.priority-b.priority).map(g=>goalHtml(g,true)).join('')||'<div class="empty">Aggiungi il primo obiettivo.</div>';
  const cap=document.getElementById('goalCapacity'),rem=document.getElementById('goalRemainder');
  if(cap)cap.textContent=eur(p.capacity);if(rem)rem.textContent=eur(p.remaining);
  if(typeof addHistoryButtons==='function')addHistoryButtons();
 }catch(e){console.error('Goals render fix',e)}
}
const oldTab=window.tab;window.tab=function(id,b){oldTab(id,b);if(id==='goals')requestAnimationFrame(forceGoalsRender)};
const oldOpen=window.openTab;if(oldOpen)window.openTab=function(id){oldOpen(id);if(id==='goals')requestAnimationFrame(forceGoalsRender)};
setTimeout(forceGoalsRender,50);
})();