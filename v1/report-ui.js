import { LANGUAGES, getLanguage } from './translations.js';
import { report, csv } from './report-core.js';
import { listTransactions } from './finance-core.js';
import { history, kpis } from './history-core.js';
const t=k=>LANGUAGES[getLanguage()]?.strings[k]||LANGUAGES.hr.strings[k]||k;
const euro=n=>Number(n||0).toFixed(2)+' €';
const metric=r=>`${euro(r.net)} • ${r.rides} ${t('rides')} • ${r.km.toFixed(2)} km • ${r.shifts} ${t('shift')}`;
async function refresh(){
  const r=await report();
  const box=document.getElementById('reportValues');
  if(box)box.innerHTML=`<div>${t('last24h')}: <b>${euro(r.today.income-r.today.expense)}</b></div><div>${t('last7days')}: <b>${euro(r.week.income-r.week.expense)}</b></div><div>${t('month')}: <b>${euro(r.month.income-r.month.expense)}</b></div><div>${t('all')}: <b>${euro(r.all.income-r.all.expense)}</b></div>`;
  const k=await kpis();
  const kb=document.getElementById('kpiValues');
  if(kb)kb.innerHTML=`<div><b>${t('last24h')}</b><br>${metric(k.today)}</div><div><b>${t('last7days')}</b><br>${metric(k.week)}</div><div><b>${t('month')}</b><br>${metric(k.month)}</div>`;
  const hs=await history();
  const hb=document.getElementById('historyValues');
  if(hb)hb.innerHTML=hs.slice(0,10).map((s,i)=>`<details><summary>${new Date(s.finishedAt||s.startedAt).toLocaleString()} • ${euro(s.net)}</summary><div class="list"><div>${t('duration')}: ${s.durationMinutes||0} min</div><div>${t('rides')}: ${s.rides} • ${t('km')}: ${s.km.toFixed(2)}</div><div>${t('income')}: ${euro(s.income)} • ${t('expense')}: ${euro(s.expense)}</div></div></details>`).join('')||`<div>${t('noHistory')}</div>`;
}
function init(){
  const main=document.querySelector('main');
  const settings=document.querySelector('#settingsTitle')?.closest('.card');
  if(!main||!settings)return;
  const card=document.createElement('section');card.className='card';card.innerHTML=`<h2>📑 <span id="reportsTitle">${t('reports')}</span></h2><div id="reportValues" class="list"></div><button id="exportData" class="secondary" style="margin-top:10px">${t('exportCSV')}</button>`;main.insertBefore(card,settings);
  const kcard=document.createElement('section');kcard.className='card';kcard.innerHTML=`<h2>📊 ${t('analytics')}</h2><div id="kpiValues" class="list"></div>`;main.insertBefore(kcard,settings);
  const hcard=document.createElement('section');hcard.className='card';hcard.innerHTML=`<h2>🗂️ ${t('history')}</h2><div id="historyValues" class="list"></div>`;main.insertBefore(hcard,settings);
  document.getElementById('exportData').onclick=async()=>{const rows=await listTransactions();const blob=new Blob([csv(rows)],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='vas-charlie-financije.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  refresh();window.addEventListener('vc-finance-changed',refresh);window.addEventListener('vc-language-changed',()=>{location.reload()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
