import { getAll, replaceAll } from './db.js';

const stores=['shifts','trips','transactions'];
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

async function snapshot(){
  const data={schema:2,app:'VAŠ CHARLIE OS',version:'1.0.0',createdAt:new Date().toISOString(),stores:{}};
  for(const store of stores)data.stores[store]=await getAll(store);
  data.local={
    activeShift:localStorage.getItem('vc-active-shift'),
    activeTrip:localStorage.getItem('vc-active-trip'),
    lastTrip:localStorage.getItem('vc-last-trip'),
    language:localStorage.getItem('vc-language'),
    destination:localStorage.getItem('vc-last-destination')
  };
  return data;
}

async function restore(data){
  if(!data||![1,2].includes(data.schema)||data.app!=='VAŠ CHARLIE OS'||!data.stores)throw new Error('Neispravna sigurnosna kopija');
  await replaceAll(data.stores);
  if(data.schema>=2&&data.local){
    const keys=['vc-active-shift','vc-active-trip','vc-last-trip','vc-language','vc-last-destination'];
    const map={
      'vc-active-shift':'activeShift','vc-active-trip':'activeTrip','vc-last-trip':'lastTrip',
      'vc-language':'language','vc-last-destination':'destination'
    };
    for(const key of keys){localStorage.removeItem(key);const value=data.local[map[key]];if(value!==null&&value!==undefined)localStorage.setItem(key,value)}
  }
}

function init(){
  const main=document.querySelector('main');
  const settings=document.querySelector('#settingsTitle')?.closest('.card');
  if(!main||!settings)return;
  const card=document.createElement('section');
  card.className='card';
  card.innerHTML='<h2>💾 Sigurnosna kopija</h2><p class="sub">Izvezi ili vrati lokalne smjene, vožnje, financije i osnovne postavke.</p><div class="grid"><button id="backupExport" class="secondary">Izvezi backup</button><label class="file"><input id="backupImport" type="file" accept="application/json,.json" hidden><button type="button" id="backupChoose" class="secondary">Vrati backup</button></label></div><div id="backupStatus" class="log"></div>';
  main.insertBefore(card,settings);
  const status=document.getElementById('backupStatus');
  document.getElementById('backupExport').onclick=async()=>{
    try{
      const data=await snapshot();
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`vas-charlie-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
      status.textContent=`Backup izrađen • ${Object.values(data.stores).reduce((n,r)=>n+r.length,0)} zapisa`;
    }catch(e){status.textContent='Backup: '+e.message}
  };
  document.getElementById('backupChoose').onclick=()=>document.getElementById('backupImport').click();
  document.getElementById('backupImport').onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{const data=JSON.parse(await file.text());await restore(data);status.textContent='Backup vraćen. Osvježavam podatke…';setTimeout(()=>location.reload(),500)}catch(err){status.textContent='Vraćanje: '+err.message}
    e.target.value='';
  };
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
