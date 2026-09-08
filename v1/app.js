import { LANGUAGES, getLanguage } from './translations.js';

const APP_VERSION='1.0.0';
const state={running:false,paused:false,startedAt:0,pausedAt:0,lastPosition:null,totalMeters:0,watchId:null,timerId:null};
const $=id=>document.getElementById(id);

function lang(){return getLanguage()}
function t(k){return LANGUAGES[lang()]?.strings[k] || LANGUAGES.hr.strings[k] || k}
function renderLanguage(){
  $('appName').textContent=`${t('app')} 1.0`;
  $('subtitle').textContent=t('subtitle'); $('start').textContent=t('start'); $('finish').textContent=t('stop');
  $('pause').textContent=t('pause'); $('resume').textContent=t('resume'); $('navTitle').textContent='🗺️ '+t('navigation');
  $('settingsTitle').textContent='⚙️ '+t('settings'); $('languageLabel').textContent=t('language'); $('destination').placeholder=t('destination');
  document.documentElement.lang=lang();
  network();
}
function initLanguages(){
  const s=$('language');
  Object.entries(LANGUAGES).forEach(([code,l])=>{const o=document.createElement('option');o.value=code;o.textContent=`${l.flag} ${l.name}`;s.append(o)});
  s.value=lang();
  s.onchange=()=>{localStorage.setItem('vc-language',s.value);renderLanguage()};
}
function network(){
  const on=navigator.onLine;
  $('net').textContent=on?'● '+t('online'):'● '+t('offline');
  $('net').className='status '+(on?'online':'offline');
}
function log(x){$('log').textContent=new Date().toLocaleTimeString()+'  '+x}
function distance(a,b){
  const R=6371000,p=Math.PI/180,dLat=(b.lat-a.lat)*p,dLon=(b.lon-a.lon)*p;
  const q=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(q));
}
function updateMinutes(){
  if(!state.running)return;
  const elapsed=Math.max(0,Date.now()-state.startedAt-(state.pausedAt?Date.now()-state.pausedAt:0));
  $('mins').textContent=Math.floor(elapsed/60000);
}
function saveState(){
  localStorage.setItem('vc-active-trip',JSON.stringify({version:APP_VERSION,running:state.running,paused:state.paused,startedAt:state.startedAt,pausedAt:state.pausedAt,totalMeters:state.totalMeters,lastPosition:state.lastPosition}));
}
function loadState(){
  try{
    const x=JSON.parse(localStorage.getItem('vc-active-trip')||'null');
    if(!x||!x.running)return;
    state.running=true;state.paused=!!x.paused;state.startedAt=Number(x.startedAt)||Date.now();state.pausedAt=Number(x.pausedAt)||0;state.totalMeters=Number(x.totalMeters)||0;state.lastPosition=x.lastPosition||null;
    $('km').textContent=(state.totalMeters/1000).toFixed(2); gpsStart(); startTimer(); log('Aktivna vožnja vraćena nakon ponovnog otvaranja aplikacije');
  }catch{}
}
function gpsStart(){
  if(!navigator.geolocation){$('gps').textContent='N/A';return}
  if(state.watchId!==null)navigator.geolocation.clearWatch(state.watchId);
  state.watchId=navigator.geolocation.watchPosition(pos=>{
    const p={lat:pos.coords.latitude,lon:pos.coords.longitude}; $('gps').textContent='OK';
    if(state.running&&!state.paused&&state.lastPosition){const d=distance(state.lastPosition,p);if(d<250)state.totalMeters+=d}
    state.lastPosition=p;$('km').textContent=(state.totalMeters/1000).toFixed(2);saveState();
  },()=>{$('gps').textContent='ERR'},{enableHighAccuracy:true,maximumAge:2000,timeout:10000});
}
function startTimer(){if(state.timerId===null)state.timerId=setInterval(updateMinutes,1000);updateMinutes()}
function stopTimer(){if(state.timerId!==null)clearInterval(state.timerId);state.timerId=null}
function start(){
  if(state.running)return;
  state.running=true;state.paused=false;state.startedAt=Date.now();state.pausedAt=0;state.totalMeters=0;state.lastPosition=null;
  gpsStart();startTimer();saveState();log('Vožnja pokrenuta');
}
function pause(){if(!state.running||state.paused)return;state.paused=true;state.pausedAt=Date.now();saveState();log('Vožnja pauzirana')}
function resume(){
  if(!state.running||!state.paused)return;
  const pauseDuration=Date.now()-state.pausedAt;state.startedAt+=pauseDuration;state.paused=false;state.pausedAt=0;state.lastPosition=null;saveState();log('Vožnja nastavljena');
}
function finish(){
  if(!state.running)return;
  updateMinutes(); const km=state.totalMeters/1000; const mins=$('mins').textContent;
  state.running=false;state.paused=false;stopTimer();
  if(state.watchId!==null)navigator.geolocation.clearWatch(state.watchId);state.watchId=null;
  localStorage.removeItem('vc-active-trip');
  localStorage.setItem('vc-last-trip',JSON.stringify({version:APP_VERSION,finishedAt:new Date().toISOString(),km,minutes:Number(mins)||0}));
  log(`Vožnja završena • ${km.toFixed(2)} km • ${mins} min`);
}
$('start').onclick=start;$('finish').onclick=finish;$('pause').onclick=pause;$('resume').onclick=resume;
$('route').onclick=()=>{
  const d=$('destination').value.trim();if(!d)return;
  localStorage.setItem('vc-last-destination',d);
  log((navigator.onLine?'Online':'Offline')+' ruta: '+d);
  $('mapText').textContent=navigator.onLine?'Ruta je spremna za povezivanje s routing servisom.':'Offline: koristi se lokalni paket karata/routinga kada je instaliran za područje.';
};
window.addEventListener('online',network);window.addEventListener('offline',network);
initLanguages();renderLanguage();$('destination').value=localStorage.getItem('vc-last-destination')||'';loadState();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>log('SW: '+e.message));
