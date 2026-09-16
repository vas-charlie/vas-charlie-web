import { put, getByShift, getAll, uid } from './db.js';
export const INCOME_SOURCES=['Uber','Bolt','Taxi','Napojnica','Ostalo'];
export const EXPENSE_CATEGORIES=['Troškovi u smjeni','Privatni troškovi','Poslovni troškovi','Projekt troškovi'];
export async function addTransaction({type,amount,source,category,note='',shiftId=null,paymentMethod='',tripId=null}){const value=Number(String(amount).replace(',','.'));if(!Number.isFinite(value)||value<=0)throw new Error('Iznos mora biti veći od 0');if(!['income','expense'].includes(type))throw new Error('Neispravna vrsta transakcije');const result=await put('transactions',{id:uid(),type,amount:Math.round(value*100)/100,currency:'EUR',source:type==='income'?source:'',category:type==='expense'?category:'',note:String(note||'').trim(),shiftId,tripId,paymentMethod,createdAt:new Date().toISOString()});window.dispatchEvent(new CustomEvent('vc-finance-changed'));return result}
export function listTransactions(shiftId=null){return shiftId?getByShift('transactions',shiftId):getAll('transactions')}
export function summarize(rows){return rows.reduce((a,x)=>{if(x.type==='income')a.income+=Number(x.amount)||0;else if(x.type==='expense')a.expense+=Number(x.amount)||0;return a},{income:0,expense:0})}
export async function shiftSummary(shiftId){const rows=await listTransactions(shiftId);const s=summarize(rows);return {...s,net:s.income-s.expense,rows}}
if(typeof document!=='undefined')import('./report-ui.js').catch(()=>{});
