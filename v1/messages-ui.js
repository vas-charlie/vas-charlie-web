import { getLanguage } from './translations.js';

const MESSAGES = {
  hr: ['Dobro došao, Charlie.', 'Spreman za novu vožnju.', 'Lana prati smjenu.', 'Sretno i sigurno!', 'VAŠ CHARLIE OS radi offline.'],
  en: ['Welcome, Charlie.', 'Ready for the next ride.', 'Lana is tracking the shift.', 'Drive safe!', 'VAŠ CHARLIE OS works offline.'],
  de: ['Willkommen, Charlie.', 'Bereit für die nächste Fahrt.', 'Lana begleitet die Schicht.', 'Gute und sichere Fahrt!', 'VAŠ CHARLIE OS arbeitet offline.'],
  it: ['Benvenuto, Charlie.', 'Pronto per la prossima corsa.', 'Lana segue il turno.', 'Buon viaggio e guida sicura!', 'VAŠ CHARLIE OS funziona offline.'],
  sl: ['Dobrodošel, Charlie.', 'Pripravljen na novo vožnjo.', 'Lana spremlja izmeno.', 'Varno vožnjo!', 'VAŠ CHARLIE OS deluje brez povezave.'],
  sk: ['Vitaj, Charlie.', 'Pripravený na ďalšiu jazdu.', 'Lana sleduje zmenu.', 'Šťastnú a bezpečnú jazdu!', 'VAŠ CHARLIE OS funguje offline.'],
  cs: ['Vítej, Charlie.', 'Připraven na další jízdu.', 'Lana sleduje směnu.', 'Šťastnou a bezpečnou cestu!', 'VAŠ CHARLIE OS funguje offline.'],
  pl: ['Witaj, Charlie.', 'Gotowy na kolejną jazdę.', 'Lana śledzi zmianę.', 'Szerokiej i bezpiecznej drogi!', 'VAŠ CHARLIE OS działa offline.'],
  fr: ['Bienvenue, Charlie.', 'Prêt pour la prochaine course.', 'Lana suit le service.', 'Bonne route et prudence !', 'VAŠ CHARLIE OS fonctionne hors ligne.'],
  es: ['Bienvenido, Charlie.', 'Listo para el próximo viaje.', 'Lana sigue el turno.', '¡Buen viaje y conduce con cuidado!', 'VAŠ CHARLIE OS funciona sin conexión.'],
  pt: ['Bem-vindo, Charlie.', 'Pronto para a próxima corrida.', 'Lana acompanha o turno.', 'Boa viagem e conduza com segurança!', 'VAŠ CHARLIE OS funciona offline.'],
  hu: ['Üdv, Charlie.', 'Készen állunk a következő fuvarra.', 'Lana figyeli a műszakot.', 'Biztonságos utat!', 'A VAŠ CHARLIE OS offline is működik.']
};

const css = `.lana-space{min-height:92px;margin-top:14px;border:1px solid #334155;border-radius:18px;background:linear-gradient(135deg,#0b1220,#111827);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}.lana-space:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(96,165,250,.09),transparent 65%)}.lana-message{position:relative;z-index:1;padding:14px 22px;text-align:center;font-weight:700;color:#e2e8f0;opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease;max-width:90%}.lana-message.show{opacity:1;transform:translateY(0)}.lana-message.hide{opacity:0;transform:translateY(-18px)}`;

function init(){
  if(document.getElementById('lanaMessageSpace')) return;
  const brand=document.querySelector('.top');
  if(!brand) return;
  const style=document.createElement('style'); style.textContent=css; document.head.append(style);
  const space=document.createElement('div'); space.id='lanaMessageSpace'; space.className='lana-space';
  const msg=document.createElement('div'); msg.className='lana-message'; space.append(msg);
  brand.after(space);
  let index=0;
  const render=()=>{
    const list=MESSAGES[getLanguage()]||MESSAGES.hr;
    msg.classList.remove('show'); msg.classList.add('hide');
    setTimeout(()=>{msg.textContent=list[index++%list.length];msg.classList.remove('hide');msg.classList.add('show')},550);
  };
  render(); setInterval(render,4800);
  window.addEventListener('vc-language-changed',render);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
