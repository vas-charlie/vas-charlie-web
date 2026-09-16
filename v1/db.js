const DB='vc-os-db';
const VERSION=2;
const STORES={trips:'trips',shifts:'shifts',transactions:'transactions'};
export function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORES.trips))db.createObjectStore(STORES.trips,{keyPath:'id'});if(!db.objectStoreNames.contains(STORES.shifts))db.createObjectStore(STORES.shifts,{keyPath:'id'});if(!db.objectStoreNames.contains(STORES.transactions)){const s=db.createObjectStore(STORES.transactions,{keyPath:'id'});s.createIndex('shiftId','shiftId',{unique:false});s.createIndex('type','type',{unique:false});s.createIndex('createdAt','createdAt',{unique:false})}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export function put(store,value){return openDB().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error)}))}
export function getAll(store){return openDB().then(db=>new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}))}
export function getByShift(store,shiftId){return openDB().then(db=>new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).index('shiftId').getAll(shiftId);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}))}
export const uid=()=>crypto.randomUUID();
