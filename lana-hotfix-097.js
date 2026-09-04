(() => {
  const MESSAGES = [
    'VAŠ CHARLIE',
    'HVALA NA POVJERENJU',
    'DA NIJE VAS, NE BI BILO NI MENE!!'
  ];
  const ENTER_CLASSES = ['from-left','from-top','from-right','from-bottom'];

  function installReliablePassengerSpeech(){
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;

    let speechToken = 0;
    let keepAliveTimer = null;

    function stopKeepAlive(){
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }

    function splitSpeech(text){
      const normalized = String(text || '').replace(/\s+/g,' ').trim();
      if (!normalized) return [];
      const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized];
      const chunks = [];
      for (const sentence of sentences) {
        const s = sentence.trim();
        if (s.length <= 105) { chunks.push(s); continue; }
        const words = s.split(' ');
        let part = '';
        for (const word of words) {
          const next = part ? part + ' ' + word : word;
          if (next.length > 95 && part) { chunks.push(part); part = word; }
          else part = next;
        }
        if (part) chunks.push(part);
      }
      return chunks;
    }

    window.speakPassengerText = function(text, lang){
      const chunks = splitSpeech(text);
      if (!chunks.length) return;

      speechToken += 1;
      const token = speechToken;
      stopKeepAlive();
      window.speechSynthesis.cancel();

      try {
        window.lanaSpeaking = true;
        window.lastSpokenText = String(text || '');
      } catch {}

      let index = 0;
      const finish = () => {
        if (token !== speechToken) return;
        stopKeepAlive();
        try {
          window.lanaSpeaking = false;
          window.lastSpokenText = '';
          window.ignoreSpeechUntil = Date.now() + 1000;
        } catch {}
      };

      const speakNext = () => {
        if (token !== speechToken) return;
        if (index >= chunks.length) { finish(); return; }
        const utterance = new SpeechSynthesisUtterance(chunks[index++]);
        const voiceMap = window.LANG_VOICE || {};
        utterance.lang = voiceMap[lang] || (lang === 'hr' ? 'hr-HR' : 'en-US');
        utterance.rate = 0.94;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => setTimeout(speakNext, 90);
        utterance.onerror = (event) => {
          if (event && (event.error === 'interrupted' || event.error === 'canceled')) return;
          setTimeout(speakNext, 120);
        };
        window.speechSynthesis.speak(utterance);
      };

      keepAliveTimer = setInterval(() => {
        if (token !== speechToken) { stopKeepAlive(); return; }
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          setTimeout(() => { if (token === speechToken) window.speechSynthesis.resume(); }, 60);
        }
      }, 9000);

      setTimeout(speakNext, 80);
    };
  }

  function installPassengerBrandMessages() {
    if (document.getElementById('charliePassengerMessage')) return;

    const style = document.createElement('style');
    style.id = 'charlieHotfix097Style';
    style.textContent = `
      .lana-portrait{animation:none!important;transform:none!important;filter:none!important}
      #charliePassengerMessage{
        position:absolute;
        z-index:24;
        left:39%;
        right:2.5%;
        top:16%;
        bottom:30%;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        padding:28px 32px;
        color:#12376a;
        background:transparent;
        border:0;
        box-shadow:none;
        font-weight:950;
        letter-spacing:.055em;
        line-height:1.14;
        font-size:clamp(1.55rem,4vw,3.45rem);
        opacity:0;
        pointer-events:none;
        transition:opacity .75s ease, transform .9s cubic-bezier(.2,.8,.2,1);
      }
      #charliePassengerMessage.signature{font-size:clamp(1.25rem,3.25vw,2.7rem);letter-spacing:.025em}
      #charliePassengerMessage.from-left{transform:translateX(-90px) scale(.97)}
      #charliePassengerMessage.from-right{transform:translateX(90px) scale(.97)}
      #charliePassengerMessage.from-top{transform:translateY(-70px) scale(.97)}
      #charliePassengerMessage.from-bottom{transform:translateY(70px) scale(.97)}
      #charliePassengerMessage.show{opacity:1;transform:translate(0,0) scale(1)}
      @media(max-width:700px){
        #charliePassengerMessage{left:36%;right:2%;top:14%;bottom:31%;padding:18px 16px;font-size:clamp(1.2rem,4.6vw,2.35rem)}
        #charliePassengerMessage.signature{font-size:clamp(1rem,3.9vw,1.95rem)}
      }
      @media(max-width:430px){
        #charliePassengerMessage{left:42%;right:1.5%;top:16%;bottom:32%;padding:12px 8px;font-size:clamp(.95rem,4.7vw,1.4rem)}
        #charliePassengerMessage.signature{font-size:clamp(.82rem,3.9vw,1.16rem)}
      }
      @media(prefers-reduced-motion:reduce){#charliePassengerMessage{transition:opacity .2s ease;transform:none!important}}
    `;
    document.head.appendChild(style);

    const stage = document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
    const box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    stage.appendChild(box);

    let i = 0;
    let direction = 0;
    const show = () => {
      box.classList.remove('show', ...ENTER_CLASSES);
      const enterClass = ENTER_CLASSES[direction % ENTER_CLASSES.length];
      direction += 1;
      box.classList.add(enterClass);
      setTimeout(() => {
        box.textContent = MESSAGES[i];
        box.classList.toggle('signature', i === 2);
        requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('show')));
        i = (i + 1) % MESSAGES.length;
      }, 520);
    };

    show();
    setInterval(show, 5600);
  }

  function install(){
    installReliablePassengerSpeech();
    installPassengerBrandMessages();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
