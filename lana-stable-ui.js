(() => {
  'use strict';

  const VERSION = 'stable-rebuild-0.1';
  const BRAND_MESSAGES = [
    'VAŠ CHARLIE',
    'HVALA NA POVJERENJU',
    'DA NIJE VAS, NE BI BILO NI MENE!!'
  ];
  const LANG_VOICE = {hr:'hr-HR',en:'en-US',de:'de-DE',it:'it-IT',fr:'fr-FR',es:'es-ES'};
  const FALLBACK_HR = {
    standard:'{greeting} i dobrodošli. Hvala vam što ste odabrali VAŠ CHARLIE. Želim vam ugodnu vožnju.',
    warm:'{greeting}. Smjestite se udobno. Ako vam nešto zatreba tijekom vožnje, slobodno recite. Želim vam ugodnu vožnju.',
    short:'{greeting} i dobrodošli. Želim vam ugodnu vožnju.',
    returning:'{greeting} i dobrodošli ponovno. Drago mi je što ste opet s VAŠ CHARLIE. Želim vam ugodnu vožnju.',
    exit:'Hvala vam na vožnji i povjerenju. Ako želite, nakon vožnje slobodno ostavite iskrenu recenziju. Želim vam sretan nastavak dana.'
  };

  function greeting(lang='hr') {
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

  function currentPassengerText(key) {
    const lang = document.getElementById('passengerLanguage')?.value || document.getElementById('appLanguage')?.value || 'hr';
    let text = '';
    try {
      const saved = JSON.parse(localStorage.getItem('lanaPassengerMessagesV01') || '{}');
      text = String(saved?.[lang]?.[key] || '').trim();
    } catch {}
    if (!text && lang === 'hr') text = FALLBACK_HR[key] || '';
    return { lang, text: text.replaceAll('{greeting}', greeting(lang)) };
  }

  const speech = {
    run: 0,
    current: null,
    queue: [],
    busy: false,
    stop() {
      this.run += 1;
      this.queue = [];
      this.busy = false;
      this.current = null;
      try { window.speechSynthesis?.cancel(); } catch {}
    },
    speak(text, lang='hr') {
      const synth = window.speechSynthesis;
      if (!synth || !window.SpeechSynthesisUtterance || !text) return false;
      this.stop();
      const run = this.run;
      this.queue = String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s=>s.trim()).filter(Boolean) || [String(text).trim()];
      const next = () => {
        if (run !== this.run) return;
        const sentence = this.queue.shift();
        if (!sentence) {
          this.busy = false;
          this.current = null;
          document.documentElement.dataset.lanaPassengerSpeaking = '0';
          return;
        }
        this.busy = true;
        document.documentElement.dataset.lanaPassengerSpeaking = '1';
        const u = new SpeechSynthesisUtterance(sentence);
        this.current = u; // keep a strong reference for Android
        u.lang = LANG_VOICE[lang] || 'hr-HR';
        u.rate = 0.92;
        u.pitch = 1;
        u.volume = 1;
        let finished = false;
        const done = () => {
          if (finished || run !== this.run) return;
          finished = true;
          this.current = null;
          setTimeout(next, 220);
        };
        u.onend = done;
        u.onerror = (ev) => {
          if (run !== this.run) return;
          if (ev?.error === 'canceled' || ev?.error === 'interrupted') {
            setTimeout(() => {
              if (run !== this.run) return;
              try { synth.resume(); } catch {}
              done();
            }, 250);
            return;
          }
          done();
        };
        synth.speak(u);
      };
      setTimeout(next, 120);
      return true;
    }
  };

  function installGreetingButtons() {
    document.addEventListener('click', (event) => {
      const direct = event.target.closest?.('[data-greet]');
      const panel = event.target.closest?.('[data-passenger-message]');
      if (!direct && !panel) return;

      let key = panel?.dataset.passengerMessage || direct?.dataset.greet;
      if (key === 'warm') key = 'warm';
      if (key === 'returning') key = 'returning';
      if (key === 'exit') key = 'exit';
      if (key === 'standard') key = 'standard';
      if (!['standard','warm','short','returning','exit'].includes(key)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      const {text, lang} = currentPassengerText(key);
      const status = document.getElementById('passengerStatus');
      if (status) status.textContent = text ? '🔊 ' + text : 'Poruka nije dostupna.';
      speech.speak(text, lang);
    }, true);
  }

  function installBrandStage() {
    document.getElementById('charliePassengerMessage')?.remove();
    document.getElementById('charlieStableStyle')?.remove();

    const style = document.createElement('style');
    style.id = 'charlieStableStyle';
    style.textContent = `
      #charliePassengerMessage{
        position:absolute;z-index:24;left:31%;right:0;top:8%;bottom:28%;
        display:flex;align-items:center;justify-content:center;text-align:center;
        padding:28px 42px;color:#12376a;background:transparent;border:0;box-shadow:none;
        font-weight:950;letter-spacing:.045em;line-height:1.16;
        font-size:clamp(1.55rem,4vw,3.5rem);pointer-events:none;overflow:hidden;
      }
      #charliePassengerMessage.signature{font-size:clamp(1.25rem,3.1vw,2.65rem);letter-spacing:.015em}
      #charliePassengerMessage .word{display:inline-block;white-space:nowrap;margin:.08em .11em}
      #charliePassengerMessage .letter{display:inline-block;opacity:0;transform:translate(var(--sx),var(--sy)) scale(.94);filter:blur(3px)}
      #charliePassengerMessage.play .letter{animation:charlieLetterSettle 1.45s cubic-bezier(.18,.82,.2,1) forwards;animation-delay:calc(var(--i) * 70ms)}
      #charliePassengerMessage.hold .letter{opacity:1;transform:none;filter:none}
      #charliePassengerMessage.exit .letter{animation:charlieLetterOut .9s ease forwards;animation-delay:calc(var(--ri) * 20ms)}
      @keyframes charlieLetterSettle{0%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(.94);filter:blur(3px)}65%{opacity:1;transform:translate(calc(var(--sx)*-.05),calc(var(--sy)*-.05)) scale(1.01);filter:blur(.3px)}100%{opacity:1;transform:translate(0,0) scale(1);filter:blur(0)}}
      @keyframes charlieLetterOut{to{opacity:0;transform:translate(calc(var(--sx)*-.18),calc(var(--sy)*-.18)) scale(.985);filter:blur(2px)}}
      @media(max-width:700px){#charliePassengerMessage{left:29%;top:7%;bottom:29%;padding:20px 22px;font-size:clamp(1.18rem,4.6vw,2.35rem)}#charliePassengerMessage.signature{font-size:clamp(.98rem,3.9vw,1.9rem)}}
      @media(max-width:430px){#charliePassengerMessage{left:38%;top:10%;bottom:30%;padding:10px 8px;font-size:clamp(.92rem,4.6vw,1.38rem)}#charliePassengerMessage.signature{font-size:clamp(.8rem,3.8vw,1.08rem)}}
    `;
    document.head.appendChild(style);

    const stage = document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
    const box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    stage.appendChild(box);

    const sources = [
      [-84,0],[0,-58],[84,0],[0,58],[-62,-42],[62,42]
    ];
    let messageIndex = 0;
    let directionIndex = 0;
    let cycleTimer = null;

    function build(text, direction) {
      box.replaceChildren();
      box.className = text === BRAND_MESSAGES[2] ? 'signature' : '';
      let letterIndex = 0;
      const words = text.split(' ');
      words.forEach((word, wi) => {
        const w = document.createElement('span');
        w.className = 'word';
        [...word].forEach((ch) => {
          const s = document.createElement('span');
          s.className = 'letter';
          s.textContent = ch;
          s.style.setProperty('--i', letterIndex);
          s.style.setProperty('--ri', Math.max(0, text.length - letterIndex));
          s.style.setProperty('--sx', direction[0] + 'px');
          s.style.setProperty('--sy', direction[1] + 'px');
          letterIndex += 1;
          w.appendChild(s);
        });
        box.appendChild(w);
      });
    }

    function cycle() {
      const text = BRAND_MESSAGES[messageIndex];
      const direction = sources[directionIndex % sources.length];
      messageIndex = (messageIndex + 1) % BRAND_MESSAGES.length;
      directionIndex += 1;
      build(text, direction);
      requestAnimationFrame(() => box.classList.add('play'));
      setTimeout(() => {
        box.classList.remove('play');
        box.classList.add('hold');
      }, 3900);
      setTimeout(() => {
        box.classList.remove('hold');
        box.classList.add('exit');
      }, 8500);
      cycleTimer = setTimeout(cycle, 10300);
    }

    cycle();
    window.addEventListener('pagehide', () => { if (cycleTimer) clearTimeout(cycleTimer); speech.stop(); }, {once:true});
  }

  function install() {
    installGreetingButtons();
    installBrandStage();
    console.info('[Lana stable rebuild]', VERSION);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
