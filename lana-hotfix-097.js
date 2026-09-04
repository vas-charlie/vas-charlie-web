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

  function tinySpeechChunks(text){
    const cleaned = String(text || '').replace(/\s+/g,' ').trim();
    if (!cleaned) return [];
    const sentenceBits = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const out = [];
    for (const bit of sentenceBits) {
      const words = bit.trim().split(/\s+/);
      let part = '';
      for (const word of words) {
        const next = part ? part + ' ' + word : word;
        if (next.length > 30 && part) { out.push(part); part = word; }
        else part = next;
      }
      if (part) out.push(part);
    }
    return out;
  }

  let speechRun = 0;
  function speakPassengerFully(text, lang){
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance || !text) return;
    speechRun += 1;
    const run = speechRun;
    synth.cancel();
    const chunks = tinySpeechChunks(text);
    let index = 0;

    const say = (retry = 0) => {
      if (run !== speechRun || index >= chunks.length) return;
      const chunk = chunks[index];
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = LANG_VOICE[lang] || 'hr-HR';
      u.rate = 0.88;
      u.pitch = 1;
      u.volume = 1;
      let done = false;
      const advance = () => {
        if (done || run !== speechRun) return;
        done = true;
        index += 1;
        setTimeout(() => say(0), 180);
      };
      u.onend = advance;
      u.onerror = () => {
        if (done || run !== speechRun) return;
        done = true;
        if (retry < 2) setTimeout(() => { done = false; say(retry + 1); }, 280);
        else { index += 1; setTimeout(() => say(0), 220); }
      };
      synth.speak(u);
    };
    setTimeout(() => say(0), 120);
  }

  function installGreetingCapture(){
    document.addEventListener('click', (event) => {
      const b = event.target.closest?.('[data-passenger-message]');
      if (!b) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const key = b.dataset.passengerMessage;
      const {text,lang} = currentPassengerText(key);
      const status = document.getElementById('passengerStatus');
      if (status) status.textContent = text ? '🔊 ' + text : 'Poruka nije dostupna.';
      speakPassengerFully(text, lang);
    }, true);
  }

  function letterMarkup(text){
    return [...text].map((ch,i) => {
      const safe = ch === ' ' ? '&nbsp;' : ch.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `<span class="charlie-letter" style="--i:${i}">${safe}</span>`;
    }).join('');
  }

  function installBrandMessages(){
    document.getElementById('charliePassengerMessage')?.remove();
    document.getElementById('charlieHotfix097Style')?.remove();

    const style = document.createElement('style');
    style.id = 'charlieHotfix097Style';
    style.textContent = `
      .lana-portrait{animation:none!important;transform:none!important;filter:none!important}
      #charliePassengerMessage{
        position:absolute;z-index:24;left:31%;right:0;top:8%;bottom:28%;
        display:flex;align-items:center;justify-content:center;text-align:center;
        padding:32px 48px;color:#12376a;background:transparent;border:0;box-shadow:none;
        font-weight:950;letter-spacing:.05em;line-height:1.18;
        font-size:clamp(1.65rem,4.15vw,3.65rem);pointer-events:none;
        opacity:0;transform:translate3d(var(--enter-x,0),var(--enter-y,0),0) scale(.985);
        filter:blur(3px);
        transition:opacity 1.6s ease,transform 2.2s cubic-bezier(.18,.78,.22,1),filter 1.8s ease;
      }
      #charliePassengerMessage.show{opacity:1;transform:translate3d(0,0,0) scale(1);filter:blur(0)}
      #charliePassengerMessage.leaving{opacity:0;transform:translate3d(calc(var(--enter-x,0) * -.22),calc(var(--enter-y,0) * -.22),0) scale(.995);filter:blur(2px)}
      #charliePassengerMessage.signature{font-size:clamp(1.3rem,3.25vw,2.8rem);letter-spacing:.02em;max-width:92%}
      #charliePassengerMessage .charlie-letter{
        display:inline-block;opacity:0;transform:translateY(14px) scale(.96);filter:blur(2px);
      }
      #charliePassengerMessage.show .charlie-letter{
        animation:charlieLetterIn 1.25s cubic-bezier(.2,.8,.2,1) forwards;
        animation-delay:calc(var(--i) * 55ms + 350ms);
      }
      @keyframes charlieLetterIn{
        0%{opacity:0;transform:translateY(14px) rotate(-1.5deg) scale(.96);filter:blur(2px)}
        60%{opacity:1;transform:translateY(-2px) rotate(.4deg) scale(1.01);filter:blur(.2px)}
        100%{opacity:1;transform:translateY(0) rotate(0) scale(1);filter:blur(0)}
      }
      @media(max-width:700px){#charliePassengerMessage{left:29%;top:7%;bottom:29%;padding:22px 26px;font-size:clamp(1.25rem,4.7vw,2.45rem)}#charliePassengerMessage.signature{font-size:clamp(1rem,4vw,2rem)}}
      @media(max-width:430px){#charliePassengerMessage{left:38%;top:10%;bottom:30%;padding:12px 10px;font-size:clamp(.95rem,4.8vw,1.45rem)}#charliePassengerMessage.signature{font-size:clamp(.82rem,3.9vw,1.15rem)}}
    `;
    document.head.appendChild(style);

    const stage = document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
    const box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    stage.appendChild(box);

    const directions = [
      ['-42px','0px'], ['0px','-34px'], ['42px','0px'], ['0px','34px']
    ];
    let mi = 0, di = 0;

    function cycle(){
      const text = BRAND_MESSAGES[mi];
      const [x,y] = directions[di];
      mi = (mi + 1) % BRAND_MESSAGES.length;
      di = (di + 1) % directions.length;

      box.className = text === BRAND_MESSAGES[2] ? 'signature' : '';
      box.style.setProperty('--enter-x', x);
      box.style.setProperty('--enter-y', y);
      box.innerHTML = letterMarkup(text);
      box.classList.remove('show','leaving');
      void box.offsetWidth;
      requestAnimationFrame(() => box.classList.add('show'));

      setTimeout(() => box.classList.add('leaving'), 7000);
      setTimeout(cycle, 9000);
    }

    cycle();
  }

  function install(){
    installGreetingCapture();
    installBrandMessages();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
