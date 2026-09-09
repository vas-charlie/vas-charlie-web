import { getAll, put } from './db.js';

const stores=['shifts','trips','transactions'];
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

async function snapshot(){
  const data={schema:1,app:'VAŠ CHARLIE OS',createdAt:new Date().toISOString(),stores:{}};
  for(const store of stores)data.stores[store]=await getAll(store);
  return data;
}

async function restore(data){
  if(!data||data.schema!==1||!data.stores)throw new Error('Neispravna sigurnosna kopija');
  for(const store of stores){
    const rows=Array.isArray(data.stores[store])?data.stores[store]:[];
    for(const row of rows)if(row&&row.id)await put(store,row);
  }
}

function init(){
  const main=document.querySelector('main');
  const settings=document.querySelector('#settingsTitle')?.closest('.card');
  if(!main||!settings)return;
  const card=document.createElement('section');
  card.className='card';
  card.innerHTML='<h2>💾 Sigurnosna kopija</h2><p class="sub">Izvezi ili vrati lokalne smjene, vožnje i financije. Podaci ostaju na uređaju dok ih ne izvezeš.</p><div class="grid"><button id="backupExport" class="secondary">Izvezi backup</button><label class="file"><input id="backupImport" type="file" accept="application/json,.json" hidden><button type="button" id="backupChoose" class="secondary">Vrati backup</button></label></div><div id="backupStatus" class="log"></div>';
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
