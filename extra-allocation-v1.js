(()=>{
function ensureExtraAllocation(){
 if(!Number.isFinite(Number(d.lifeBase))) d.lifeBase=Number(d.life||200);
 if(!Number.isFinite(Number(d.extraLifePct))) d.extraLifePct=50;
 d.extraLifePct=Math.max(0,Math.min(100,Number(d.extraLifePct)));
 d.life=effectiveLifeBudget();
 localStorage.setItem(KEY,JSON.stringify(d));
}
function effectiveLifeBudget(){return Math.max(0,Number(d.lifeBase||0)+Math.max(0,Number(d.extra||0))*Number(d.extraLifePct||0)/100)}
function extraToLife(){return Math.max(0,Number(d.extra||0))*Number(d.extraLifePct||0)/100}
function extraToGoals(){return Math.max(0,Number(d.extra||0))-extraToLife()}
window.effectiveLifeBudget=effectiveLifeBudget;
window.extraToLife=extraToLife;
window.extraToGoals=extraToGoals;

const originalIncomeFor=window.incomeFor;
window.incomeFor=function(m){
 if(m===monthNow()) return Math.max(0,Number(d.salary||0))+Math.max(0,Number(d.extra||0));
 return originalIncomeFor?originalIncomeFor(m):0;
};

window.goalPlan=function(){
 d.life=effectiveLifeBudget();
 let cap=Math.max(0,Number(d.salary||0)+Math.max(0,Number(d.extra||0))-fixedMonthly()-essentialTotal()-d.life);
 let gs=d.goals.map((g,i)=>({...g,_i:i,need:Math.max(0,g.target-g.saved),theory:theoretical(g),assigned:0}));
 let priorities=[...new Set(gs.filter(g=>g.need>0).map(g=>g.priority))].sort((a,b)=>a-b),remaining=cap;
 priorities.forEach(p=>{let group=gs.filter(g=>g.need>0&&g.priority===p),total=group.reduce((s,g)=>s+g.theory,0);if(total<=0)return;let available=Math.min(remaining,total);group.forEach(g=>g.assigned=Math.min(g.theory,available*(g.theory/total)));remaining=Math.max(0,remaining-group.reduce((s,g)=>s+g.assigned,0))});
 gs.forEach(g=>{let months=g.need===0?0:(g.assigned>0?Math.ceil(g.need/g.assigned):Infinity),eta=null;if(Number.isFinite(months)){eta=new Date();eta.setMonth(eta.getMonth()+months)}g.eta=eta;g.onTime=g.need===0||!!(eta&&g.deadline&&eta<=new Date(g.deadline+'T23:59:59'));g.status=g.need===0?'COMPLETATO':!g.assigned?'IN ATTESA':g.onTime?'IN LINEA':'DATA POSTICIPATA'});
 return{capacity:cap,goals:gs,remaining};
};
window.currentCalc=function(){d.life=effectiveLifeBudget();let m=monthNow(),spent=monthTotal(m),lifeLeft=d.life-spent,plan=goalPlan();return{m,spent,lifeLeft,plan,fixed:fixedMonthly(),ess:essentialTotal()}};

function injectSettings(){
 let settings=document.getElementById('settings');if(!settings||document.getElementById('extraLifePct'))return;
 let extra=document.getElementById('extra');if(!extra)return;let row=extra.closest('.setting');if(!row)return;
 let alloc=document.createElement('div');alloc.className='setting extraAllocSetting';alloc.innerHTML=`<div><div class="name">Quota extra per vita quotidiana</div><div class="meta">Decidi quanta parte delle entrate extra puoi spendere. Il resto aumenta la capacità di risparmio.</div><div id="extraAllocPreview" class="extraAllocPreview"></div></div><div class="extraPctWrap"><input id="extraLifePct" type="number" min="0" max="100" step="5"><span>%</span></div>`;row.insertAdjacentElement('afterend',alloc);extraLifePct.addEventListener('change',()=>saveExtraAllocation());extraLifePct.addEventListener('input',renderAllocationPreview);
}
window.saveExtraAllocation=function(){let v=Math.max(0,Math.min(100,Number(extraLifePct.value||0)));d.extraLifePct=v;d.life=effectiveLifeBudget();localStorage.setItem(KEY,JSON.stringify(d));persist()};

window.saveSettings=function(){
 d.salary=Math.max(0,Number(salary.value||0));
 d.lifeBase=Math.max(0,Number(life.value||0));
 d.extra=Math.max(0,Number(extra.value||0));
 d.otherFixed=Math.max(0,Number(otherFixed.value||0));
 if(document.getElementById('extraLifePct'))d.extraLifePct=Math.max(0,Math.min(100,Number(extraLifePct.value||0)));
 d.life=effectiveLifeBudget();
 localStorage.setItem(KEY,JSON.stringify(d));persist();
};

function renderAllocationPreview(){
 d.life=effectiveLifeBudget();
 if(document.getElementById('life'))life.value=Number(d.lifeBase||0);
 if(document.getElementById('extraLifePct'))extraLifePct.value=Number(d.extraLifePct||0);
 let p=document.getElementById('extraAllocPreview');if(p)p.innerHTML=`Extra del mese: <b>${eur(d.extra)}</b> → <span class="good">${eur(extraToLife())} vita</span> · <span>${eur(extraToGoals())} risparmio/obiettivi</span><br>Budget vita totale del mese: <b>${eur(d.life)}</b>`;
 let salaryMeta=document.querySelector('#salary')?.closest('.setting')?.querySelector('.meta');if(salaryMeta)salaryMeta.textContent='Base mensile; le entrate extra vengono allocate secondo la percentuale scelta';
 let lifeMeta=document.querySelector('#life')?.closest('.setting')?.querySelector('.meta');if(lifeMeta)lifeMeta.textContent='Budget vita base, prima della quota delle entrate extra';
 let extraMeta=document.querySelector('#extra')?.closest('.setting')?.querySelector('.meta');if(extraMeta)extraMeta.textContent='Entrate aggiuntive del mese, allocabili tra vita e risparmio';
 let heroLabel=document.querySelector('.heroGrid .heroMini:last-child span'),heroValue=document.querySelector('.heroGrid .heroMini:last-child b');if(heroLabel&&heroValue){heroLabel.textContent='Entrate totali';heroValue.textContent=eur(Number(d.salary||0)+Number(d.extra||0))}
}

const css=document.createElement('style');css.textContent=`.extraPctWrap{display:flex;align-items:center;gap:7px}.extraPctWrap input{width:82px;text-align:center;font-weight:800}.extraPctWrap span{font-weight:800;color:#667085}.extraAllocPreview{margin-top:7px;font-size:11px;line-height:1.45;color:#667085;background:#f6f8fb;padding:8px 10px;border-radius:10px}.extraAllocPreview b{color:#121a2a}@media(max-width:480px){.extraAllocSetting{grid-template-columns:minmax(0,1fr) 96px!important}.extraPctWrap input{width:68px}}`;document.head.appendChild(css);
ensureExtraAllocation();injectSettings();renderAllocationPreview();
const oldRender=window.render;if(oldRender&&!oldRender.__extraAllocation){let nr=function(){d.life=effectiveLifeBudget();oldRender();injectSettings();renderAllocationPreview()};nr.__extraAllocation=true;window.render=nr;window.render()}
})();