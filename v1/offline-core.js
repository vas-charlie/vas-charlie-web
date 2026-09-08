import { openDB, put, getAll, uid } from './db.js';
export { openDB };
const STORE='trips';
export async function saveTrip(trip){return put(STORE,{...trip,id:trip.id||uid(),updatedAt:new Date().toISOString()})}
export function listTrips(){return getAll(STORE)}
export function distanceMeters(a,b){const R=6371000,p=Math.PI/180,dLat=(b.lat-a.lat)*p,dLon=(b.lon-a.lon)*p;const q=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
