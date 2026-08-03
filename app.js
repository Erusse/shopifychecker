const KEY='budgetHelperV1';
const FREQ={Mensile:1,Bimestrale:2,Trimestrale:3,Semestrale:6,Annuale:12};
const DEFAULT_DEADLINES=[
 {id:'bollo',name:'Bollo Auto',amount:290,freq:'Annuale',next:'2027-04-15'},
 {id:'assicurazione',name:'Rata Assicurazione',amount:335,freq:'Semestrale',next:'2026-08-15'},
 {id:'auto',name:'Rata Macchina',amount:336,freq:'Mensile',next:'2026-08-28'},
 {id:'bollette',name:'Bollette',amount:120,freq:'Bimestrale',next:'2026-10-10'}
];
const DEFAULT_INCOME={'2026-01':2607.44,'2026-02':2500,'2026-03':3250,'2026-04':2500,'2026-05':0,'2026-06':1689.33,'2026-07':1547.76};
const DEFAULT_ESS={'Generi alimentari':250,'Auto / trasporti':80,'Salute / benessere':50,'Casa / piccole spese':0};
const eur=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const monthNow=()=>new Date().toISOString().slice(0,7);
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
let d=JSON.parse(localStorage.getItem(KEY)||'null')||{};

function ensureSchema(){
 d.salary=Number(d.salary||1600); d.life=Number(d.life??200); d.extra=Number(d.extra||0);
 d.goals=Array.isArray(d.goals)?d.goals:[]; d.expenses=Array.isArray(d.expenses)?d.expenses:[];
 d.cats=Array.isArray(d.cats)&&d.cats.length?d.cats:[['Ristoranti / bar',40],['Svago / vacanze / abbigliamento',40],['Altro',20]];
 d.essentialBudgets={...DEFAULT_ESS,...(d.essentialBudgets||{})};
 d.deadlines=Array.isArray(d.deadlines)&&d.deadlines.length?d.deadlines:structuredClone(DEFAULT_DEADLINES);
 d.deadlines.forEach(x=>{x.id=x.id||uid();x.amount=Number(x.amount||0);x.freq=x.freq||'Mensile'});
 d.incomeHistory={...DEFAULT_INCOME,...(d.incomeHistory||{})};
 d.otherFixed=Number(d.otherFixed||0);
 d.monthOverrides=d.monthOverrides||{};
 d.goals.forEach(g=>{g.priority=Number(g.priority||1);g.target=Number(g.target||0);g.saved=Number(g.saved||0);g.deadline=g.deadline||''});
 d.expenses.forEach(x=>{x.id=x.id||uid();x.amount=Math.abs(Number(x.amount||0));x.month=x.month||monthNow()});
 localStorage.setItem(KEY,JSON.stringify(d));
}
ensureSchema();
function persist(){localStorage.setItem(KEY,JSON.stringify(d));render()}
function addMonths(dateStr,n){let dt=new Date(dateStr+'T12:00:00');dt.setMonth(dt.getMonth()+n);return dt.toISOString().slice(0,10)}
function monthsBetweenNow(dateStr){if(!dateStr)return 120;let now=new Date(),to=new Date(dateStr+'T23:59:59');let m=(to.getFullYear()-now.getFullYear())*12+to.getMonth()-now.getMonth();return Math.max(1,m)}
function fixedMonthly(){return d.otherFixed+d.deadlines.reduce((s,x)=>s+(Number(x.amount)||0)/(FREQ[x.freq]||1),0)}
function essentialTotal(){return Object.values(d.essentialBudgets).reduce((a,b)=>a+Number(b||0),0)}
function monthExpenses(m){return d.expenses.filter(x=>x.month===m)}
function monthTotal(m){return monthExpenses(m).reduce((s,x)=>s+Number(x.amount||0),0)}
function categoryTotals(m){let o={};monthExpenses(m).forEach(x=>o[x.cat]=(o[x.cat]||0)+Number(x.amount||0));return o}
function incomeFor(m){if(Object.prototype.hasOwnProperty.call(d.incomeHistory,m))return Number(d.incomeHistory[m]||0);return m>=monthNow()?d.salary:0}
function theoretical(g){let need=Math.max(0,g.target-g.saved);return need/monthsBetweenNow(g.deadline)}
function goalPlan(){
 let cap=Math.max(0,d.salary-fixedMonthly()-essentialTotal()-d.life)+d.extra;
 let gs=d.goals.map((g,i)=>({...g,_i:i,need:Math.max(0,g.target-g.saved),theory:theoretical(g),assigned:0}));
 let priorities=[...new Set(gs.filter(g=>g.need>0).map(g=>g.priority))].sort((a,b)=>a-b),remaining=cap;
 priorities.forEach(p=>{
   let group=gs.filter(g=>g.need>0&&g.priority===p),total=group.reduce((s,g)=>s+g.theory,0);
   if(total<=0)return;
   let available=Math.min(remaining,total);
   group.forEach(g=>g.assigned=Math.min(g.theory,available*(g.theory/total)));
   remaining=Math.max(0,remaining-group.reduce((s,g)=>s+g.assigned,0));
 });
 gs.forEach(g=>{
   let months=g.need===0?0:(g.assigned>0?Math.ceil(g.need/g.assigned):Infinity),eta=null;
   if(Number.isFinite(months)){eta=new Date();eta.setMonth(eta.getMonth()+months)}
   g.eta=eta; g.onTime=g.need===0||!!(eta&&g.deadline&&eta<=new Date(g.deadline+'T23:59:59'));
   g.status=g.need===0?'COMPLETATO':!g.assigned?'IN ATTESA':g.onTime?'IN LINEA':'DATA POSTICIPATA';
 });
 return {capacity:cap,goals:gs,remaining};
}
function currentCalc(){let m=monthNow(),spent=monthTotal(m),lifeLeft=d.life-spent,plan=goalPlan();return{m,spent,lifeLeft,plan,fixed:fixedMonthly(),ess:essentialTotal()}}
function fmtMonth(m){let [y,mo]=m.split('-');return new Date(+y,+mo-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'})}
function statusClass(s){return s==='IN LINEA'||s==='COMPLETATO'?'good':s==='DATA POSTICIPATA'?'warn':'bad'}

function render(){renderHome();renderExpenses();renderGoals();renderDeadlines();renderHistory();renderSettings();populateExpenseCats()}
function renderHome(){
 let c=currentCalc(),used=categoryTotals(c.m); monthLabel.textContent=fmtMonth(c.m);
 lifeLeft.textContent=eur(c.lifeLeft);spentM.textContent=eur(c.spent);saveM.textContent=eur(c.plan.capacity);fixedM.textContent=eur(c.fixed+c.ess);
 let ratio=d.life?c.spent/d.life:0;
 suggestion.innerHTML=ratio<=1?`Hai usato <b>${Math.round(ratio*100)}%</b> del budget vita. Ti restano <b class="${ratio<.7?'good':'warn'}">${eur(Math.max(0,c.lifeLeft))}</b>. Dopo fissi ed essenziali, il piano destina <b>${eur(c.plan.capacity)}</b> agli obiettivi.`:`Hai superato il budget vita di <b class="bad">${eur(-c.lifeLeft)}</b>. Il modo più semplice per non rallentare gli obiettivi è ridurre le categorie ancora sopra budget.`;
 budgetRows.innerHTML=d.cats.map(([n,p])=>{let cap=d.life*p/100,u=used[n]||0,left=cap-u,pc=cap?Math.min(100,u/cap*100):0;return `<div class="row"><div class="grow"><div class="name">${esc(n)}</div><div class="meta">${eur(u)} spesi su ${eur(cap)}</div><div class="bar"><i class="${u>cap?'badbar':u>cap*.8?'warnbar':''}" style="width:${pc}%"></i></div></div><div class="money ${left<0?'bad':''}">${eur(left)}</div></div>`}).join('');
 goalPreview.innerHTML=c.plan.goals.slice().sort((a,b)=>a.priority-b.priority).slice(0,4).map(g=>goalHtml(g,false)).join('')||'<div class="empty">Nessun obiettivo.</div>';
 let next=[...d.deadlines].sort((a,b)=>a.next.localeCompare(b.next)).slice(0,4);homeDeadlines.innerHTML=next.map(x=>deadlineHtml(x,false)).join('')||'<div class="empty">Nessuna scadenza.</div>';
}
function goalHtml(g,edit){let pct=g.target?Math.min(100,g.saved/g.target*100):0,eta=g.eta?g.eta.toLocaleDateString('it-IT',{month:'short',year:'numeric'}):'—';return `<div class="row"><div class="grow"><div class="name">${esc(g.name)} <span class="pill ${statusClass(g.status)}">P${g.priority} · ${g.status}</span></div><div class="meta">${eur(g.saved)} / ${eur(g.target)} · teorico ${eur(g.theory)}/m · assegnato ${eur(g.assigned)}/m<br>Target ${g.deadline?new Date(g.deadline+'T12:00:00').toLocaleDateString('it-IT'):'—'} · stima ${eta}</div><div class="bar"><i style="width:${pct}%"></i></div></div>${edit?`<div class="deadlineActions"><input aria-label="Priorità" style="width:58px" type="number" min="1" value="${g.priority}" onchange="setPrio(${g._i},this.value)"><button class="ghost" onclick="addSaving(${g._i})">+ €</button></div>`:''}</div>`}
function renderGoals(){let p=goalPlan();goalList.innerHTML=p.goals.slice().sort((a,b)=>a.priority-b.priority).map(g=>goalHtml(g,true)).join('')||'<div class="empty">Aggiungi il primo obiettivo.</div>';goalCapacity.textContent=eur(p.capacity);goalRemainder.textContent=eur(p.remaining)}
function renderExpenses(){let m=monthNow(),rows=monthExpenses(m).slice().reverse();expenseList.innerHTML=rows.map(x=>`<div class="row"><div class="grow"><div class="name">${esc(x.desc||x.cat)}</div><div class="meta">${esc(x.cat)}</div></div><div class="deadlineActions"><span class="money">${eur(x.amount)}</span><button class="ghost" onclick="deleteExpense('${x.id}')">×</button></div></div>`).join('')||'<div class="empty">Nessuna spesa inserita questo mese.</div>';expenseTotal.textContent=eur(monthTotal(m))}
function deadlineStatus(x){let today=new Date(),dt=new Date(x.next+'T23:59:59'),days=Math.ceil((dt-today)/86400000);if(days<0)return['SCADUTA','bad'];if(days<=30)return[`TRA ${days} GG`,'warn'];return['OK','good']}
function deadlineHtml(x,actions=true){let [s,cl]=deadlineStatus(x),monthly=x.amount/(FREQ[x.freq]||1);return `<div class="row"><div class="grow"><div class="name">${esc(x.name)} <span class="pill ${cl}">${s}</span></div><div class="meta">${esc(x.freq)} · prossima ${new Date(x.next+'T12:00:00').toLocaleDateString('it-IT')} · quota ${eur(monthly)}/mese</div></div><div class="deadlineActions"><span class="money">${eur(x.amount)}</span>${actions?`<button onclick="payDeadline('${x.id}')">Pagato</button><button class="ghost" onclick="deleteDeadline('${x.id}')">×</button>`:''}</div></div>`}
function renderDeadlines(){deadlineMonthly.textContent=eur(fixedMonthly());deadlineList.innerHTML=[...d.deadlines].sort((a,b)=>a.next.localeCompare(b.next)).map(x=>deadlineHtml(x,true)).join('')||'<div class="empty">Nessuna scadenza.</div>'}
function historyMonths(){let set=new Set(Object.keys(d.incomeHistory));d.expenses.forEach(x=>set.add(x.month));set.add(monthNow());return [...set].sort()}
let selectedHistory=monthNow(),chartMode='total';
function renderHistory(){let months=historyMonths();if(!months.includes(selectedHistory))selectedHistory=months.at(-1);historyMonth.innerHTML=months.map(m=>`<option value="${m}" ${m===selectedHistory?'selected':''}>${fmtMonth(m)}</option>`).join('');let inc=incomeFor(selectedHistory),out=monthTotal(selectedHistory),save=inc-out,rate=inc?save/inc:0;histIncome.value=inc||'';histOut.textContent=eur(out);histSave.textContent=eur(save);histRate.textContent=(rate*100).toFixed(1)+'%';let cats=categoryTotals(selectedHistory);historyCats.innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><div class="name">${esc(k)}</div><div class="money">${eur(v)}</div></div>`).join('')||'<div class="empty">Nessuna spesa.</div>';drawHistoryChart()}
function setHistoryMonth(v){selectedHistory=v;renderHistory()}
function shiftHistory(n){let ms=historyMonths(),i=ms.indexOf(selectedHistory),ni=Math.max(0,Math.min(ms.length-1,i+n));selectedHistory=ms[ni];renderHistory()}
function saveHistoryIncome(){d.incomeHistory[selectedHistory]=Number(histIncome.value||0);persist()}
function drawHistoryChart(){let cv=historyChart,ctx=cv.getContext('2d'),rect=cv.getBoundingClientRect(),ratio=window.devicePixelRatio||1;cv.width=rect.width*ratio;cv.height=rect.height*ratio;ctx.scale(ratio,ratio);let w=rect.width,h=rect.height,pad=28,months=historyMonths().slice(-12);ctx.clearRect(0,0,w,h);ctx.strokeStyle='#e5e7eb';ctx.lineWidth=1;for(let i=0;i<4;i++){let y=pad+(h-pad*2)*i/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-8,y);ctx.stroke()}
 if(chartMode==='total'){let vals=months.map(monthTotal),max=Math.max(1,...vals);ctx.strokeStyle='#0f172a';ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{let x=pad+(w-pad-16)*(months.length===1?.5:i/(months.length-1)),y=h-pad-(v/max)*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y);ctx.fillStyle='#0f172a';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();if(i===0){ctx.beginPath();ctx.moveTo(x,y)}});ctx.stroke();}
 else{let cats=[...new Set(d.expenses.map(x=>x.cat))].slice(0,8),colors=['#0f172a','#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#db2777'],max=Math.max(1,...months.flatMap(m=>Object.values(categoryTotals(m))));cats.forEach((cat,ci)=>{ctx.strokeStyle=colors[ci%colors.length];ctx.lineWidth=2;ctx.beginPath();months.forEach((m,i)=>{let v=categoryTotals(m)[cat]||0,x=pad+(w-pad-16)*(months.length===1?.5:i/(months.length-1)),y=h-pad-(v/max)*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()})}
 ctx.fillStyle='#64748b';ctx.font='10px system-ui';months.forEach((m,i)=>{if(i%Math.ceil(months.length/6)===0||i===months.length-1){let x=pad+(w-pad-16)*(months.length===1?.5:i/(months.length-1));ctx.fillText(m.slice(5),x-7,h-7)}})}
function switchChart(mode,b){chartMode=mode;document.querySelectorAll('#chartToggle button').forEach(x=>x.classList.remove('on'));b.classList.add('on');drawHistoryChart()}
function renderSettings(){salary.value=d.salary;life.value=d.life;extra.value=d.extra;otherFixed.value=d.otherFixed;essentialSettings.innerHTML=Object.entries(d.essentialBudgets).map(([k,v])=>`<div class="setting"><div><div class="name">${esc(k)}</div><div class="meta">Minimo mensile protetto</div></div><input type="number" min="0" value="${v}" onchange="d.essentialBudgets['${String(k).replaceAll("'","\\'")}']=+this.value||0;persist()"></div>`).join('');catSettings.innerHTML=d.cats.map((x,i)=>`<div class="setting"><div class="name">${esc(x[0])}</div><div><input type="number" min="0" max="100" value="${x[1]}" onchange="d.cats[${i}][1]=+this.value||0;persist()"></div></div>`).join('');fixedCalc.textContent=eur(fixedMonthly())}
function populateExpenseCats(){let names=[...Object.keys(d.essentialBudgets),...d.cats.map(x=>x[0]),'Utenze','Assicurazione/Bollo','Finanziamenti','Imposte'];exCat.innerHTML=[...new Set(names)].map(x=>`<option>${esc(x)}</option>`).join('')}

function addExpense(){let a=Number(exAmt.value);if(!(a>0))return;d.expenses.push({id:uid(),amount:a,cat:exCat.value,desc:exDesc.value.trim(),month:monthNow()});exAmt.value='';exDesc.value='';closeExpense();persist()}
function deleteExpense(id){d.expenses=d.expenses.filter(x=>x.id!==id);persist()}
function addGoal(){if(!gName.value.trim()||!(Number(gTarget.value)>0))return;d.goals.push({name:gName.value.trim(),target:Number(gTarget.value),saved:Number(gSaved.value||0),priority:Number(gPrio.value||1),deadline:gDate.value});gName.value=gTarget.value=gSaved.value=gDate.value='';gPrio.value=1;persist()}
function setPrio(i,v){d.goals[i].priority=Math.max(1,Number(v||1));persist()}
function addSaving(i){let a=Number(prompt('Quanto vuoi aggiungere a '+d.goals[i].name+'?')||0);if(a>0){d.goals[i].saved=Math.min(d.goals[i].target,d.goals[i].saved+a);persist()}}
function addDeadline(){if(!dlName.value.trim()||!(Number(dlAmount.value)>0)||!dlDate.value)return;d.deadlines.push({id:uid(),name:dlName.value.trim(),amount:Number(dlAmount.value),freq:dlFreq.value,next:dlDate.value});dlName.value=dlAmount.value=dlDate.value='';persist()}
function payDeadline(id){let x=d.deadlines.find(x=>x.id===id);if(!x)return;x.next=addMonths(x.next,FREQ[x.freq]||1);persist()}
function deleteDeadline(id){d.deadlines=d.deadlines.filter(x=>x.id!==id);persist()}
function saveSettings(){d.salary=Number(salary.value||0);d.life=Number(life.value||0);d.extra=Number(extra.value||0);d.otherFixed=Number(otherFixed.value||0);persist()}
function openExpense(){sheetBack.classList.add('on');setTimeout(()=>exAmt.focus(),100)}function closeExpense(){sheetBack.classList.remove('on')}
function tab(id,b){document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));document.getElementById(id).classList.add('on');document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));b.classList.add('on');scrollTo(0,0);if(id==='history')setTimeout(drawHistoryChart,30)}
function openTab(id){let b=document.querySelector(`[data-tab="${id}"]`);tab(id,b)}
window.addEventListener('resize',()=>{if(document.getElementById('history').classList.contains('on'))drawHistoryChart()});
render();