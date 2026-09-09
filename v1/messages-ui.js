import { getLanguage } from './translations.js';

const MESSAGES={
  hr:['Dobro došao, Charlie.','Spreman za novu vožnju.','Lana prati smjenu.','Sretno i sigurno!','VAŠ CHARLIE OS radi offline.'],
  en:['Welcome, Charlie.','Ready for the next ride.','Lana is tracking the shift.','Drive safe!','VAŠ CHARLIE OS works offline.'],
  de:['Willkommen, Charlie.','Bereit für die nächste Fahrt.','Lana begleitet die Schicht.','Gute und sichere Fahrt!','VAŠ CHARLIE OS arbeitet offline.'],
  it:['Benvenuto, Charlie.','Pronto per la prossima corsa.','Lana segue il turno.','Buon viaggio e guida sicura!','VAŠ CHARLIE OS funziona offline.'],
  sl:['Dobrodošel, Charlie.','Pripravljen na novo vožnjo.','Lana spremlja izmeno.','Varno vožnjo!','VAŠ CHARLIE OS deluje brez povezave.'],
  sk:['Vitaj, Charlie.','Pripravený na ďalšiu jazdu.','Lana sleduje zmenu.','Šťastnú a bezpečnú jazdu!','VAŠ CHARLIE OS funguje offline.'],
  cs:['Vítej, Charlie.','Připraven na další jízdu.','Lana sleduje směnu.','Šťastnou a bezpečnou cestu!','VAŠ CHARLIE OS funguje offline.'],
  pl:['Witaj, Charlie.','Gotowy na kolejną jazdę.','Lana śledzi zmianę.','Szerokiej i bezpiecznej drogi!','VAŠ CHARLIE OS działa offline.'],
  fr:['Bienvenue, Charlie.','Prêt pour la prochaine course.','Lana suit le service.','Bonne route et prudence !','VAŠ CHARLIE OS fonctionne hors ligne.'],
  es:['Bienvenido, Charlie.','Listo para el próximo viaje.','Lana sigue el turno.','¡Buen viaje y conduce con cuidado!','VAŠ CHARLIE OS funciona sin conexión.'],
  pt:['Bem-vindo, Charlie.','Pronto para a próxima corrida.','Lana acompanha o turno.','Boa viagem e conduza com segurança!','VAŠ CHARLIE OS funciona offline.'],
  hu:['Üdv, Charlie.','Készen állunk a következő fuvarra.','Lana figyeli a műszakot.','Biztonságos utat!','A VAŠ CHARLIE OS offline is működik.']
};

const css=`.lane-messages{position:relative;min-height:210px;margin-top:14px;overflow:hidden;border:1px solid #263244;border-radius:18px;background:radial-gradient(circle at center,#111c32 0,#0b1220 62%,#080d18 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:22px}.lane-message{position:absolute;left:50%;top:50%;width:min(86%,520px);transform:translate(-50%,-50%);font-size:clamp(1.05rem,2.8vw,1.55rem);font-weight:800;line-height:1.3;letter-spacing:.02em;opacity:0;filter:blur(2px);text-align:center}.lane-message.show{animation:laneMessageCycle 8s ease-in-out forwards}.lane-message .letter{display:inline-block;opacity:0;transform:translateY(12px) rotate(-4deg) scale(.82);animation:laneLetterPlay .75s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:var(--d)}@keyframes laneMessageCycle{0%{opacity:0;filter:blur(7px);transform:translate(-50%,-50%) scale(.86)}10%{opacity:1;filter:blur(0);transform:translate(-50%,-50%) scale(1)}78%{opacity:1;filter:blur(0);transform:translate(-50%,-50%) scale(1.01)}100%{opacity:0;filter:blur(7px);transform:translate(-50%,-50%) scale(.9)}}@keyframes laneLetterPlay{0%{opacity:0;transform:translateY(13px) rotate(-5deg) scale(.82)}45%{opacity:1;transform:translateY(-3px) rotate(2deg) scale(1.08)}72%{transform:translateY(1px) rotate(-1deg) scale(.98)}100%{opacity:1;transform:translateY(0) rotate(0) scale(1)}}@media(prefers-reduced-motion:reduce){.lane-message.show{animation:none;opacity:1;filter:none}.lane-message .letter{animation:none;opacity:1;transform:none}}@media(max-width:620px){.lane-messages{min-height:180px}}`;

function init(){
  const el=document.getElementById('laneMessage');
  if(!el)return;
  if(!document.getElementById('laneMessageStyle')){const style=document.createElement('style');style.id='laneMessageStyle';style.textContent=css;document.head.append(style)}
  let index=0;
  const render=()=>{
    const list=MESSAGES[getLanguage()]||MESSAGES.hr;
    const text=list[index++%list.length];
    el.classList.remove('show');
    el.innerHTML='';
    [...text].forEach((ch,i)=>{const span=document.createElement('span');span.className='letter';span.style.setProperty('--d',`${Math.min(i*32,640)}ms`);span.textContent=ch===' '? '\u00a0':ch;el.append(span)});
    void el.offsetWidth;
    el.classList.add('show');
  };
  render();
  setInterval(render,8500);
  window.addEventListener('vc-language-changed',render);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
