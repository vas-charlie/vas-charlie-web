(() => {
  const BRAND_MESSAGES = [
    'VAŠ CHARLIE',
    'HVALA NA POVJERENJU',
    'DA NIJE VAS, NE BI BILO NI MENE!!'
  ];

  const HR_FALLBACK = {
    standard:'{greeting} i dobrodošli. Hvala vam što ste odabrali VAŠ CHARLIE. Želim vam ugodnu vožnju.',
    warm:'{greeting}. Smjestite se udobno. Ako vam nešto zatreba tijekom vožnje, slobodno recite. Želim vam ugodnu vožnju.',
    short:'{greeting} i dobrodošli. Želim vam ugodnu vožnju.',
    returning:'{greeting} i dobrodošli ponovno. Drago mi je što ste opet s VAŠ CHARLIE. Želim vam ugodnu vožnju.',
    exit:'Hvala vam na vožnji i povjerenju. Ako želite, nakon vožnje slobodno ostavite iskrenu recenziju. Želim vam sretan nastavak dana.'
  };

  const FIELD_BY_KEY = {
    standard:'passengerMsgStandard', warm:'passengerMsgWarm', short:'passengerMsgShort',
    returning:'passengerMsgReturning', top:'passengerMsgTop', exit:'passengerMsgExit'
  };
  const LANG_VOICE = {hr:'hr-HR',en:'en-US',de:'de-DE',it:'it-IT',fr:'fr-FR',es:'es-ES'};

  function greetingFor(lang='hr'){
    const h = new Date().getHours();
    const slot = h < 11 ? 'morning' : h < 18 ? 'day' : 'evening';
    const map = {
      hr:{morning:'Dobro jutro',day:'Dobar dan',evening:'Dobra večer'},
      en:{morning:'Good morning',day:'Good afternoon',evening:'Good evening'},
      de:{morning:'Guten Morgen',day:'Guten Tag',evening:'Guten Abend'},
      it:{morning:'Buongiorno',day:'Buon pomeriggio',evening:'Buonasera'},
      fr:{morning:'Bonjour',day:'Bonjour',evening:'Bonsoir'},
      es:{morning:'Buenos días',day:'Buenas tardes',evening:'Buenas noches'}
    };
    return (map[lang] || map.hr)[slot];
  }

  function currentPassengerText(key){
    const lang = document.getElementById('passengerLanguage')?.value || document.getElementById('appLanguage')?.value || 'hr';
    let text = '';
    try {
      const saved = JSON.parse(localStorage.getItem('lanaPassengerMessagesV01') || '{}');
      text = String(saved?.[lang]?.[key] || '').trim();
    } catch {}
    if (!text) text = String(document.getElementById(FIELD_BY_KEY[key])?.value || '').trim();
    if (!text && lang === 'hr') text = HR_FALLBACK[key] || '';
    return {text:text.replaceAll('{greeting}', greetingFor(lang)), lang};
  }

  function sentenceChunks(text){
    const cleaned = String(text || '').replace(/\s+/g,' ').trim();
    if (!cleaned) return [];
    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const out = [];
    for (const raw of sentences) {
      const s = raw.trim();
      if (s.length <= 95) { out.push(s); continue; }
      const words = s.split(/\s+/);
      let part = '';
      for (const word of words) {
        const next = part ? `${part} ${word}` : word;
        if (next.length > 88 && part) { out.push(part); part = word; }
        else part = next;
      }
      if (part) out.push(part);
    }
    return out;
  }

  function speakPassengerFully(text, lang){
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance || !text) return;

    synth.cancel();
    const parts = sentenceChunks(text);
    const refs = [];
    window.__charlieSpeechRefs = refs;

    const status = document.getElementById('passengerStatus');
    if (status) status.textContent = '🔊 ' + text;

    setTimeout(() => {
      for (let i = 0; i < parts.length; i++) {
        const u = new SpeechSynthesisUtterance(parts[i]);
        u.lang = LANG_VOICE[lang] || 'hr-HR';
        u.rate = 0.87;
        u.pitch = 1;
        u.volume = 1;
        if (i === parts.length - 1) {
          u.onend = () => {
            if (window.__charlieSpeechRefs === refs) window.__charlieSpeechRefs = [];
          };
        }
        refs.push(u);
      }
      refs.forEach(u => synth.speak(u));
    }, 220);
  }

  function installGreetingCapture(){
    document.addEventListener('click', (event) => {
      const direct = event.target.closest?.('[data-greet]');
      const panel = event.target.closest?.('[data-passenger-message]');
      if (!direct && !panel) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const key = direct?.dataset.greet || panel?.dataset.passengerMessage;
      const {text,lang} = currentPassengerText(key);
      if (!text) {
        const status = document.getElementById('passengerStatus');
        if (status) status.textContent = 'Poruka nije dostupna.';
        return;
      }
      speakPassengerFully(text, lang);
    }, true);
  }

  function escapeChar(ch){
    if (ch === ' ') return '&nbsp;';
    return ch.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function letterMarkup(text){
    return [...text].map((ch,i) => `<span class="charlie-letter" data-i="${i}">${escapeChar(ch)}</span>`).join('');
  }

  function installBrandMessages(){
    document.getElementById('charliePassengerMessage')?.remove();
    document.getElementById('charlieHotfix097Style')?.remove();
    if (window.__charlieBrandTimer) clearTimeout(window.__charlieBrandTimer);

    const style = document.createElement('style');
    style.id = 'charlieHotfix097Style';
    style.textContent = `
      .lana-portrait{animation:none!important;transform:none!important;filter:none!important}
      #charliePassengerMessage{
        position:absolute;z-index:24;left:31%;right:2%;top:9%;bottom:29%;
        display:flex;align-items:center;justify-content:center;text-align:center;
        padding:28px 36px;color:#12376a;background:transparent;border:0;box-shadow:none;
        font-weight:950;letter-spacing:.05em;line-height:1.17;
        font-size:clamp(1.6rem,4.1vw,3.55rem);pointer-events:none;
        opacity:0;transform:translate3d(0,0,0);will-change:transform,opacity,filter;
      }
      #charliePassengerMessage.signature{font-size:clamp(1.25rem,3.2vw,2.75rem);letter-spacing:.018em}
      #charliePassengerMessage .charlie-letter{display:inline-block;opacity:1;transform:translateY(0)}
      @media(max-width:700px){#charliePassengerMessage{left:29%;right:1%;top:8%;bottom:29%;padding:20px 20px;font-size:clamp(1.2rem,4.6vw,2.35rem)}#charliePassengerMessage.signature{font-size:clamp(1rem,3.9vw,1.95rem)}}
      @media(max-width:430px){#charliePassengerMessage{left:38%;right:1%;top:10%;bottom:30%;padding:10px 8px;font-size:clamp(.95rem,4.7vw,1.4rem)}#charliePassengerMessage.signature{font-size:clamp(.8rem,3.8vw,1.12rem)}}
    `;
    document.head.appendChild(style);

    const stage = document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';

    const box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    stage.appendChild(box);

    const directions = [
      {x:-58,y:0},
      {x:0,y:-48},
      {x:58,y:0},
      {x:0,y:48}
    ];
    let messageIndex = 0;
    let directionIndex = 0;

    function ensureAttached(){
      const currentStage = document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
      if (!box.isConnected || box.parentElement !== currentStage) currentStage.appendChild(box);
    }

    function showNext(){
      ensureAttached();
      const text = BRAND_MESSAGES[messageIndex];
      const dir = directions[directionIndex];
      messageIndex = (messageIndex + 1) % BRAND_MESSAGES.length;
      directionIndex = (directionIndex + 1) % directions.length;

      box.className = text === BRAND_MESSAGES[2] ? 'signature' : '';
      box.innerHTML = letterMarkup(text);

      box.getAnimations().forEach(a => a.cancel());
      box.querySelectorAll('.charlie-letter').forEach(el => el.getAnimations().forEach(a => a.cancel()));

      box.animate([
        {opacity:0, transform:`translate3d(${dir.x}px,${dir.y}px,0) scale(.985)`, filter:'blur(3px)'},
        {opacity:1, transform:'translate3d(0,0,0) scale(1)', filter:'blur(0px)'}
      ], {duration:2600, easing:'cubic-bezier(.18,.78,.22,1)', fill:'forwards'});

      [...box.querySelectorAll('.charlie-letter')].forEach((el,i) => {
        el.animate([
          {opacity:.18, transform:'translateY(8px) scale(.985)'},
          {opacity:1, transform:'translateY(0) scale(1)'}
        ], {duration:650, delay:420 + i*42, easing:'cubic-bezier(.2,.8,.2,1)', fill:'both'});
      });

      const hold = 7200;
      setTimeout(() => {
        if (!box.isConnected) return;
        box.animate([
          {opacity:1, filter:'blur(0px)'},
          {opacity:0, filter:'blur(1.5px)'}
        ], {duration:1400, easing:'ease-in-out', fill:'forwards'});
      }, hold);

      window.__charlieBrandTimer = setTimeout(showNext, hold + 1700);
    }

    showNext();
  }

  function install(){
    installGreetingCapture();
    installBrandMessages();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
