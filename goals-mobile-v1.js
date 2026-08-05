(()=>{const css=document.createElement('style');css.textContent=`
@media(max-width:560px){
 #goals #goalList .row{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;padding:16px!important;margin:0 0 10px!important;border:1px solid #e8ecf2!important;border-radius:20px!important;background:#fff!important;align-items:stretch!important;overflow:hidden!important}
 #goals #goalList .grow{display:block!important;width:100%!important;min-width:0!important}
 #goals #goalList .name{font-size:17px!important;line-height:1.25!important;margin-bottom:7px!important;display:flex!important;align-items:flex-start!important;gap:6px!important;flex-wrap:wrap!important}
 #goals #goalList .meta{font-size:12px!important;line-height:1.55!important;margin-top:0!important;word-break:normal!important;overflow-wrap:normal!important;white-space:normal!important}
 #goals #goalList .bar{margin-top:10px!important;width:100%!important}
 #goals #goalList .deadlineActions{display:grid!important;grid-template-columns:minmax(0,1.6fr) auto 62px auto auto!important;gap:7px!important;width:100%!important;margin-top:2px!important;align-items:end!important;justify-content:stretch!important}
 #goals #goalList .goalDateEdit{grid-column:1!important;min-width:0!important;width:100%!important}
 #goals #goalList .goalDateEdit input{width:100%!important;min-width:0!important;height:42px!important;min-height:42px!important;font-size:12px!important;padding:7px 8px!important}
 #goals #goalList .deadlineActions>input[aria-label="Priorità"]{grid-column:3!important;width:62px!important;height:42px!important;min-height:42px!important;padding:7px!important;text-align:center!important}
 #goals #goalList .deadlineActions button{height:42px!important;min-height:42px!important;padding:7px 9px!important;white-space:nowrap!important;border-radius:12px!important}
 #goals #goalList .deadlineActions .goalHistoryBtn{grid-column:2!important}
 #goals #goalList .deadlineActions .danger{grid-column:5!important}
}
@media(max-width:390px){
 #goals #goalList .deadlineActions{grid-template-columns:minmax(0,1fr) 58px auto!important;align-items:end!important}
 #goals #goalList .goalDateEdit{grid-column:1 / -1!important}
 #goals #goalList .deadlineActions>input[aria-label="Priorità"]{grid-column:1!important;grid-row:2!important;width:100%!important}
 #goals #goalList .deadlineActions button{grid-row:2!important}
 #goals #goalList .deadlineActions .goalHistoryBtn{grid-column:auto!important}
 #goals #goalList .deadlineActions .danger{grid-column:auto!important}
}
`;document.head.appendChild(css);
function labelActions(){document.querySelectorAll('#goalList .deadlineActions').forEach(a=>{[...a.querySelectorAll('button')].forEach(b=>{if((b.textContent||'').trim()==='Storico')b.classList.add('goalHistoryBtn')})})}
const obs=new MutationObserver(()=>labelActions());obs.observe(document.documentElement,{subtree:true,childList:true});labelActions();})();