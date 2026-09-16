import { put, getAll, uid } from './db.js';
const KEY='vc-active-shift';
export function getShift(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
export function startShift(){const s={id:uid(),startedAt:new Date().toISOString(),pausedMinutes:0};localStorage.setItem(KEY,JSON.stringify(s));return s}
export async function endShift(){const s=getShift();if(!s)return null;s.finishedAt=new Date().toISOString();s.durationMinutes=Math.max(0,Math.floor((Date.parse(s.finishedAt)-Date.parse(s.startedAt))/60000)-(s.pausedMinutes||0));await put('shifts',s);localStorage.removeItem(KEY);return s}
export function shiftMinutes(s=getShift()){if(!s)return 0;const end=s.finishedAt?Date.parse(s.finishedAt):Date.now();return Math.max(0,Math.floor((end-Date.parse(s.startedAt))/60000)-(s.pausedMinutes||0))}
export function listShifts(){return getAll('shifts')}
