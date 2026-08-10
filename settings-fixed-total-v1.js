(()=>{
function fixedFromDeadlines(){return (d.deadlines||[]).reduce((sum,x)=>sum+(Number(x.amount)||0)/(FREQ[x.freq]||1),0)}
function renderFixedTotal(){
 const el=document.getElementById('fixedCalc');
 if(!el)return;
 const recurring=fixedFromDeadlines();
 const manual=Math.max(0,Number(d.otherFixed||0));
 el.textContent=eur(recurring+manual);
 const row=el.closest('.row');
 if(row){
  const meta=row.querySelector('.meta');
  if(meta)meta.textContent=`${eur(recurring)} da scadenze + ${eur(manual)} altri costi fissi`;
 }
}
window.fixedFromDeadlines=fixedFromDeadlines;
setTimeout(renderFixedTotal,0);
const oldRender=window.render;
if(oldRender&&!oldRender.__fixedTotalV1){
 const nr=function(){oldRender();renderFixedTotal()};
 nr.__fixedTotalV1=true;
 window.render=nr;
 window.render();
}
})();