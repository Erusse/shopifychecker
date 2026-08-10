(()=>{
const dayMs=86400000;
function monthMeta(m){const [y,mo]=m.split('-').map(Number),now=new Date(),days=new Date(y,mo,0).getDate(),isCurrent=now.getFullYear()===y&&now.getMonth()+1===mo,day=isCurrent?now.getDate():days;return{days,day,isCurrent,remainingDays:Math.max(1,days-day+1)}}
function daysUntil(dateStr){return Math.ceil((new Date(dateStr+'T23:59:59')-new Date())/dayMs)}
function insightData(){
 const m=monthNow(),model=typeof budgetModel==='function'?budgetModel():null,c=currentCalc(),meta=monthMeta(m),spent=c.spent,life=Math.max(0,model?.life??d.life??0),left=life-spent,expected=life*(meta.day/meta.days),paceDelta=spent-expected,daily=left>0?left/meta.remainingDays:0;
 const used=categoryTotals(m),catAlerts=d.cats.map(([name,p])=>{const cap=life*Number(p)/100,val=used[name]||0;return{name,cap,val,ratio:cap?val/cap:0,left:cap-val}}).sort((a,b)=>b.ratio-a.ratio);
 const upcoming=[...d.deadlines].map(x=>({...x,days:daysUntil(x.next)})).filter(x=>x.days>=0&&x.days<=14).sort((a,b)=>a.days-b.days);
 const previous=(()=>{let [y,mo]=m.split('-').map(Number);mo--;if(mo===0){mo=12;y--}return `${y}-${String(mo).padStart(2,'0')}`})();
 const prevIncome=incomeFor(previous),prevOut=monthTotal(previous),prevSurplus=Math.max(0,prevIncome-prevOut);
 return{m,model,c,meta,spent,life,left,expected,paceDelta,daily,catAlerts,upcoming,previous,prevSurplus};
}
function makeInsights(){
 const x=insightData(),items=[];
 if(x.model&&x.model.income<=0)items.push({tone:'warn',icon:'€',title:'Registra le entrate del mese',text:'Inserisci le entrate nello Storico per avere budget, ritmo di spesa e obiettivi aggiornati.',action:'history',label:'Vai allo Storico'});
 if(x.life>0){
  if(x.left<0)items.push({tone:'bad',icon:'!',title:`Budget vita superato di ${eur(-x.left)}`,text:'Il piano può essere riequilibrato riducendo le categorie ancora disponibili.'});
  else if(x.paceDelta>x.life*.1)items.push({tone:'warn',icon:'↗',title:'Stai spendendo più velocemente del piano',text:`Al ritmo del mese sei circa ${eur(x.paceDelta)} sopra la traiettoria. Per arrivare a fine mese hai circa ${eur(x.daily)} al giorno.`});
  else if(x.paceDelta<-(x.life*.1)&&x.meta.day>=5)items.push({tone:'good',icon:'↘',title:`Sei ${eur(-x.paceDelta)} avanti sul ritmo`,text:`Ti restano ${eur(x.left)} per la vita quotidiana, circa ${eur(x.daily)} al giorno fino a fine mese.`});
  else items.push({tone:'neutral',icon:'◎',title:'Ritmo di spesa sotto controllo',text:`Ti restano ${eur(Math.max(0,x.left))}, circa ${eur(x.daily)} al giorno fino a fine mese.`});
 }
 const cat=x.catAlerts[0];if(cat&&cat.cap>0&&cat.ratio>=1)items.push({tone:'bad',icon:'%',title:`${cat.name}: budget superato`,text:`Sei oltre di ${eur(-cat.left)}. Puoi compensare con una categoria meno utilizzata.`});else if(cat&&cat.cap>0&&cat.ratio>=.8)items.push({tone:'warn',icon:'%',title:`${cat.name} quasi al limite`,text:`Hai usato ${Math.round(cat.ratio*100)}% del budget e ti restano ${eur(Math.max(0,cat.left))}.`});
 const dl=x.upcoming[0];if(dl)items.push({tone:dl.days<=3?'warn':'neutral',icon:'◷',title:dl.days===0?`${dl.name} scade oggi`:`${dl.name} tra ${dl.days} giorni`,text:`Importo previsto: ${eur(dl.amount)}. La scadenza è già considerata nel piano mensile.`,action:'deadlines',label:'Vedi scadenze'});
 if(x.meta.day<=5&&x.prevSurplus>0)items.push({tone:'good',icon:'✦',title:`Il mese scorso hai chiuso con ${eur(x.prevSurplus)}`,text:'Puoi lasciarli liberi oppure usarli per accelerare uno dei tuoi obiettivi.',action:'goals',label:'Vedi obiettivi'});
 return items.slice(0,4);
}
function renderInsights(){const box=document.getElementById('smartInsights');if(!box)return;const items=makeInsights();box.innerHTML=items.map(i=>`<div class="insight ${i.tone}"><div class="insightIcon">${i.icon}</div><div class="insightBody"><strong>${i.title}</strong><p>${i.text}</p>${i.action?`<button class="insightAction" onclick="openTab('${i.action}')">${i.label}</button>`:''}</div></div>`).join('')||'<div class="empty">Nessun avviso importante.</div>'}
function renderPace(){const box=document.getElementById('spendingPace');if(!box)return;const x=insightData();if(!x.life){box.innerHTML='<div class="empty">Imposta il budget vita per vedere il ritmo di spesa.</div>';return}const pct=Math.max(0,Math.min(100,x.spent/x.life*100)),timePct=Math.max(0,Math.min(100,x.meta.day/x.meta.days*100));box.innerHTML=`<div class="paceTop"><div><span>Speso</span><b>${eur(x.spent)}</b></div><div><span>Disponibile</span><b>${eur(Math.max(0,x.left))}</b></div><div><span>Al giorno</span><b>${eur(x.daily)}</b></div></div><div class="paceTrack"><i style="width:${pct}%"></i><em style="left:${timePct}%"></em></div><div class="paceLegend"><span>${Math.round(pct)}% budget usato</span><span>${Math.round(timePct)}% del mese trascorso</span></div>`}
function enhance(){renderInsights();renderPace()}
setTimeout(enhance,0);const prev=window.render;if(prev&&!prev.__insightsV1){const nr=function(){prev();enhance()};nr.__insightsV1=true;window.render=nr;window.render()}
})();