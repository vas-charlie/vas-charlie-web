const DB='vc-os-db';
const STORE='trips';
export function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function saveTrip(trip){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({...trip,id:trip.id||crypto.randomUUID(),updatedAt:new Date().toISOString()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export async function listTrips(){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export function distanceMeters(a,b){const R=6371000,p=Math.PI/180,dLat=(b.lat-a.lat)*p,dLon=(b.lon-a.lon)*p;const q=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
