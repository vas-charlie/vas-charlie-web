import { LANGUAGES } from './translations.js';

const APP_VERSION='1.0.0';
const state={running:false,paused:false,startedAt:0,lastPosition:null,totalMeters:0,watchId:null};
const $=id=>document.getElementById(id);

function lang(){return localStorage.getItem('vc-language') || 'hr'}
function t(k){return LANGUAGES[lang()].strings[k] || LANGUAGES.hr.strings[k] || k}
function renderLanguage(){
  const l=LANGUAGES[lang()];
  $('appName').textContent=`${t('app')} 1.0`;
  $('subtitle').textContent=t('subtitle'); $('start').textContent=t('start'); $('finish').textContent=t('stop');
  $('pause').textContent=t('pause'); $('resume').textContent=t('resume'); $('navTitle').textContent='🗺️ '+t('navigation');
  $('settingsTitle').textContent='⚙️ '+t('settings'); $('languageLabel').textContent=t('language'); $('destination').placeholder=t('destination');
  document.documentElement.lang=lang();
}
function initLanguages(){const s=$('language'); Object.entries(LANGUAGES).forEach(([code,l])=>{const o=document.createElement('option');o.value=code;o.textContent=`${l.flag} ${l.name}`;s.append(o)});s.value=lang();s.onchange=()=>{localStorage.setItem('vc-language',s.value);renderLanguage()}}
function network(){const on=navigator.onLine;$('net').textContent=on?'● '+t('online'):'● '+t('offline');$('net').className='status '+(on?'online':'offline')}
function log(x){$('log').textContent=new Date().toLocaleTimeString()+'  '+x}
function distance(a,b){const R=6371000,p=Math.PI/180, dLat=(b.lat-a.lat)*p,dLon=(b.lon-a.lon)*p;const q=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function gpsStart(){if(!navigator.geolocation){$('gps').textContent='N/A';return}state.watchId=navigator.geolocation.watchPosition(pos=>{const p={lat:pos.coords.latitude,lon:pos.coords.longitude};$('gps').textContent='OK';if(state.running&&!state.paused&&state.lastPosition)state.totalMeters+=distance(state.lastPosition,p);state.lastPosition=p;$('km').textContent=(state.totalMeters/1000).toFixed(2)},()=>{$('gps').textContent='ERR'},{enableHighAccuracy:true,maximumAge:2000,timeout:10000})}
function start(){if(state.running)return;state.running=true;state.paused=false;state.startedAt=Date.now();state.totalMeters=0;state.lastPosition=null;gpsStart();log('Vožnja pokrenuta')}
function finish(){if(!state.running)return;state.running=false;state.paused=false;if(state.watchId!==null)navigator.geolocation.clearWatch(state.watchId);state.watchId=null;log(`Vožnja završena • ${(state.totalMeters/1000).toFixed(2)} km`);persist()}
function persist(){localStorage.setItem('vc-last-trip',JSON.stringify({version:APP_VERSION,finishedAt:new Date().toISOString(),km:state.totalMeters/1000}))}
$('start').onclick=start;$('finish').onclick=finish;$('pause').onclick=()=>{if(state.running)state.paused=true};$('resume').onclick=()=>{if(state.running)state.paused=false};
$('route').onclick=()=>{const d=$('destination').value.trim();if(!d)return;localStorage.setItem('vc-last-destination',d);log((navigator.onLine?'Online':'Offline')+' ruta: '+d);$('mapText').textContent=navigator.onLine?'Ruta će koristiti dostupni routing servis.':'Nema interneta: koristi se samo lokalni offline paket ako je za ovo područje instaliran.'};
window.addEventListener('online',network);window.addEventListener('offline',network);
initLanguages();renderLanguage();network();$('destination').value=localStorage.getItem('vc-last-destination')||'';

// Offline-first contract: data lives locally first; sync/navigation providers can be added without changing the taxi core.
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>log('SW: '+e.message));
