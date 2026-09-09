const METHODS=[['cash','💶 Gotovina'],['card','💳 Kartica'],['uber','📱 Uber'],['bolt','📱 Bolt'],['other','Ostalo']];
function init(){
  const source=document.getElementById('source');
  if(!source||document.getElementById('paymentMethod'))return;
  const select=document.createElement('select');
  select.id='paymentMethod';
  select.setAttribute('aria-label','Način plaćanja');
  METHODS.forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)});
  source.parentElement?.append(select);
  window.vcPaymentMethod=select.value;
  select.onchange=()=>{window.vcPaymentMethod=select.value};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
