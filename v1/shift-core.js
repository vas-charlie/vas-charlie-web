import { saveTrip } from './offline-core.js';
const KEY='vc-active-shift';
export function getShift(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
export function startShift(){const s={id:crypto.randomUUID(),startedAt:new Date().toISOString(),pausedMinutes:0};localStorage.setItem(KEY,JSON.stringify(s));return s}
export function endShift(){const s=getShift();if(!s)return null;s.finishedAt=new Date().toISOString();localStorage.removeItem(KEY);return s}
export function shiftMinutes(s= getShift()){if(!s)return 0;return Math.max(0,Math.floor((Date.now()-Date.parse(s.startedAt))/60000)-(s.pausedMinutes||0))}
