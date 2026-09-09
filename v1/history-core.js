import { getAll } from './db.js';

const sum=(rows,type)=>rows.filter(x=>x.type===type).reduce((n,x)=>n+(Number(x.amount)||0),0);

export async function history(){
  const shifts=(await getAll('shifts')).slice().sort((a,b)=>Date.parse(b.finishedAt||b.startedAt)-Date.parse(a.finishedAt||a.startedAt));
  const trips=await getAll('trips');
  const transactions=await getAll('transactions');
  return shifts.map(shift=>{
    const ts=trips.filter(x=>x.shiftId===shift.id);
    const fs=transactions.filter(x=>x.shiftId===shift.id);
    const income=sum(fs,'income');
    const expense=sum(fs,'expense');
    const km=ts.reduce((n,x)=>n+(Number(x.km)||0),0);
    const minutes=Number(shift.durationMinutes)||0;
    return {...shift,income,expense,net:income-expense,rides:ts.length,km,transactions:fs,trips:ts};
  });
}

export async function kpis(){
  const shifts=await getAll('shifts');
  const trips=await getAll('trips');
  const transactions=await getAll('transactions');
  const now=new Date();
  const day=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const week=new Date(day); week.setDate(day.getDate()-6);
  const month=new Date(now.getFullYear(),now.getMonth(),1);
  const calc=start=>{
    const min=start.getTime();
    const ts=transactions.filter(x=>Date.parse(x.createdAt)>=min);
    const tr=trips.filter(x=>Date.parse(x.finishedAt||x.startedAt)>=min);
    const sh=shifts.filter(x=>Date.parse(x.finishedAt||x.startedAt)>=min);
    const income=sum(ts,'income'),expense=sum(ts,'expense');
    return {income,expense,net:income-expense,shifts:sh.length,rides:tr.length,km:tr.reduce((n,x)=>n+(Number(x.km)||0),0)};
  };
  return {today:calc(day),week:calc(week),month:calc(month)};
}
