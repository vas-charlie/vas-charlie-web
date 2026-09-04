(() => {
  const MESSAGES = [
    'VAŠ CHARLIE',
    'HVALA NA POVJERENJU',
    'DA NIJE VAS, NE BI BILO NI MENE!!'
  ];

  function splitIntoSafeChunks(text){
    const normalized = String(text || '').replace(/\s+/g,' ').trim();
    if (!normalized) return [];
    const units = normalized.match(/[^,;:.!?]+[,;:.!?]+|[^,;:.!?]+$/g) || [normalized];
    const chunks = [];
    for (const raw of units) {
      const unit = raw.trim();
      if (!unit) continue;
      if (unit.length <= 48) { chunks.push(unit); continue; }
      const words = unit.split(' ');
      let part = '';
      for (const word of words) {
        const next = part ? part + ' ' + word : word;
        if (next.length > 44 && part) { chunks.push(part); part = word; }
        else part = next;
      }
      if (part) chunks.push(part);
    }
    return chunks;
  }

  function installSpeechSynthesisGuard(){
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance || synth.__charlieGuardInstalled) return;
    synth.__charlieGuardInstalled = true;

    const nativeSpeak = synth.speak.bind(synth);
    synth.speak = function(original){
      if (!original || original.__charlieChunk) return nativeSpeak(original);
      const text = String(original.text || '').trim();
      const chunks = splitIntoSafeChunks(text);
      if (chunks.length <= 1) return nativeSpeak(original);

      let i = 0;
      let ended = false;
      const finalEnd = original.onend;
      const finalError = original.onerror;

      const speakNext = () => {
        if (i >= chunks.length) {
          if (!ended) {
            ended = true;
            try { if (typeof finalEnd === 'function') finalEnd.call(original, new Event('end')); } catch {}
          }
          return;
        }

        const u = new SpeechSynthesisUtterance(chunks[i++]);
        u.__charlieChunk = true;
        try { u.lang = original.lang || 'hr-HR'; } catch {}
        try { u.rate = original.rate || 1; } catch {}
        try { u.pitch = original.pitch || 1; } catch {}
        try { u.volume = original.volume ?? 1; } catch {}
        try { if (original.voice) u.voice = original.voice; } catch {}

        let watchdog = setTimeout(() => {
          watchdog = null;
          try { synth.cancel(); } catch {}
          setTimeout(speakNext, 80);
        }, 6500);

        u.onend = () => {
          if (watchdog) clearTimeout(watchdog);
          setTimeout(speakNext, 90);
        };
        u.onerror = (ev) => {
          if (watchdog) clearTimeout(watchdog);
          const err = ev && ev.error;
          if (err === 'canceled' || err === 'interrupted') {
            setTimeout(speakNext, 120);
            return;
          }
          if (i < chunks.length) setTimeout(speakNext, 120);
          else if (!ended) {
            ended = true;
            try { if (typeof finalError === 'function') finalError.call(original, ev); } catch {}
          }
        };
        nativeSpeak(u);
      };

      speakNext();
    };
  }

  function installPassengerBrandMessages(){
    const old = document.getElementById('charliePassengerMessage');
    if (old) old.remove();
    document.getElementById('charlieHotfix097Style')?.remove();

    const style = document.createElement('style');
    style.id = 'charlieHotfix097Style';
    style.textContent = `
      .lana-portrait{animation:none!important;transform:none!important;filter:none!important}
      #charliePassengerMessage{
        position:absolute;
        z-index:24;
        left:31%;
        right:0;
        top:8%;
        bottom:28%;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        padding:30px 42px;
        color:#12376a;
        background:transparent;
        border:0;
        box-shadow:none;
        font-weight:950;
        letter-spacing:.055em;
        line-height:1.14;
        font-size:clamp(1.65rem,4.2vw,3.7rem);
        opacity:0;
        pointer-events:none;
        will-change:transform,opacity;
      }
      #charliePassengerMessage.signature{
        font-size:clamp(1.3rem,3.35vw,2.85rem);
        letter-spacing:.025em;
      }
      @media(max-width:700px){
        #charliePassengerMessage{left:29%;right:0;top:7%;bottom:29%;padding:20px 22px;font-size:clamp(1.25rem,4.8vw,2.45rem)}
        #charliePassengerMessage.signature{font-size:clamp(1rem,4vw,2rem)}
      }
      @media(max-width:430px){
        #charliePassengerMessage{left:38%;right:0;top:10%;bottom:30%;padding:12px 10px;font-size:clamp(.95rem,4.8vw,1.45rem)}
        #charliePassengerMessage.signature{font-size:clamp(.82rem,3.9vw,1.15rem)}
      }
    `;
    document.head.appendChild(style);

    const stage = document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
    const box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    stage.appendChild(box);

    const directions = [
      'translate3d(-34vw,0,0) scale(.96)',
      'translate3d(0,-28vh,0) scale(.96)',
      'translate3d(34vw,0,0) scale(.96)',
      'translate3d(0,28vh,0) scale(.96)'
    ];
    let messageIndex = 0;
    let directionIndex = 0;
    let timer = null;

    function nextMessage(){
      const currentMessage = messageIndex;
      const currentDirection = directionIndex;
      messageIndex = (messageIndex + 1) % MESSAGES.length;
      directionIndex = (directionIndex + 1) % directions.length;

      box.textContent = MESSAGES[currentMessage];
      box.classList.toggle('signature', currentMessage === 2);
      box.style.transition = 'none';
      box.style.opacity = '0';
      box.style.transform = directions[currentDirection];
      void box.offsetWidth;
      box.style.transition = 'opacity .72s ease, transform .95s cubic-bezier(.2,.8,.2,1)';
      requestAnimationFrame(() => {
        box.style.opacity = '1';
        box.style.transform = 'translate3d(0,0,0) scale(1)';
      });

      setTimeout(() => {
        box.style.opacity = '0';
      }, 3500);
      timer = setTimeout(nextMessage, 4300);
    }

    nextMessage();
    window.addEventListener('pagehide',()=>{ if(timer) clearTimeout(timer); },{once:true});
  }

  function install(){
    installSpeechSynthesisGuard();
    installPassengerBrandMessages();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
