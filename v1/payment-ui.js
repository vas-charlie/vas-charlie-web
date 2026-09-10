import { getLanguage } from './translations.js';
const LABELS={
  hr:['💶 Gotovina','💳 Kartica','📱 Uber','📱 Bolt','Ostalo'],
  en:['💶 Cash','💳 Card','📱 Uber','📱 Bolt','Other'],
  de:['💶 Bar','💳 Karte','📱 Uber','📱 Bolt','Sonstiges'],
  it:['💶 Contanti','💳 Carta','📱 Uber','📱 Bolt','Altro'],
  sl:['💶 Gotovina','💳 Kartica','📱 Uber','📱 Bolt','Drugo'],
  sk:['💶 Hotovosť','💳 Karta','📱 Uber','📱 Bolt','Iné'],
  cs:['💶 Hotovost','💳 Karta','📱 Uber','📱 Bolt','Ostatní'],
  pl:['💶 Gotówka','💳 Karta','📱 Uber','📱 Bolt','Inne'],
  fr:['💶 Espèces','💳 Carte','📱 Uber','📱 Bolt','Autre'],
  es:['💶 Efectivo','💳 Tarjeta','📱 Uber','📱 Bolt','Otro'],
  pt:['💶 Dinheiro','💳 Cartão','📱 Uber','📱 Bolt','Outro'],
  hu:['💶 Készpénz','💳 Kártya','📱 Uber','📱 Bolt','Egyéb']
};
const VALUES=['cash','card','uber','bolt','other'];
function init(){
  const source=document.getElementById('source');
  if(!source)return;
  let select=document.getElementById('paymentMethod');
  if(!select){
    select=document.createElement('select');
    select.id='paymentMethod';
    source.parentElement?.append(select);
    select.onchange=()=>{window.vcPaymentMethod=select.value};
  }
  select.setAttribute('aria-label',LABELS[getLanguage()]?.[0]?.replace(/^[^ ]+ /,'')||'Način plaćanja');
  const current=select.value||'cash';
  const labels=LABELS[getLanguage()]||LABELS.hr;
  select.innerHTML='';
  VALUES.forEach((value,i)=>{const o=document.createElement('option');o.value=value;o.textContent=labels[i];select.append(o)});
  select.value=VALUES.includes(current)?current:'cash';
  window.vcPaymentMethod=select.value;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('vc-language-changed',init);
