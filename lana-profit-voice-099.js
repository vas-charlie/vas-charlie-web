(() => {
  const RELEASE = '0.9.9';
  const REQUIRED = ['offer','pickupKm','passengerKm','returnKm','minutes'];
  const LABELS = {
    offer:'ponuđeni iznos',
    pickupKm:'prazni kilometri do putnika',
    passengerKm:'kilometri s putnikom',
    returnKm:'mogući prazni povratak',
    minutes:'ukupno vrijeme'
  };
  const QUESTIONS = {
    offer:'Koliki je ponuđeni iznos?',
    pickupKm:'Koliko imaš praznih kilometara do putnika?',
    passengerKm:'Koliko kilometara ima vožnja s putnikom?',
    returnKm:'Koliki očekuješ prazni povratak? Reci nula ako ga ne očekuješ.',
    minutes:'Koliko ukupno minuta očekuješ, od polaska do završetka cijelog kretanja?'
  };

  const state = {
    values:{},
    pendingKey:'',
    mode:'',
    lastTranscript:'',
    lastTranscriptAt:0,
    active:false,
    recognition:null
  };

  const $ = id => document.getElementById(id);
  const num = v => {
    if (v == null) return null;
    const n = Number(String(v).replace(',','.'));
    return Number.isFinite(n) ? n : null;
  };

  const WORD_NUMBERS = {
    'nula':0,'jedan':1,'jedna':1,'jedno':1,'dva':2,'dvije':2,'tri':3,'četiri':4,'cetiri':4,'pet':5,'šest':6,'sest':6,'sedam':7,'osam':8,'devet':9,'deset':10,
    'jedanaest':11,'dvanaest':12,'trinaest':13,'četrnaest':14,'cetrnaest':14,'petnaest':15,'šesnaest':16,'sesnaest':16,'sedamnaest':17,'osamnaest':18,'devetnaest':19,
    'dvadeset':20,'trideset':30,'četrdeset':40,'cetrdeset':40,'pedeset':50,'šezdeset':60,'sezdeset':60,'sedamdeset':70,'osamdeset':80,'devedeset':90,'sto':100
  };

  function normalizeText(text){
    return String(text||'').toLowerCase().replace(/\s+/g,' ').trim();
  }

  function firstNumeric(text){
    const digit = String(text||'').match(/\d+(?:[.,]\d+)?/);
    if (digit) return num(digit[0]);
    const words = normalizeText(text).replace(/[^a-zčćžšđ\s]/gi,' ').split(/\s+/).filter(Boolean);
    for (let i=0;i<words.length;i++) {
      if (!(words[i] in WORD_NUMBERS)) continue;
      let total = WORD_NUMBERS[words[i]];
      if (total >= 20 && total < 100 && i+1<words.length && WORD_NUMBERS[words[i+1]]>0 && WORD_NUMBERS[words[i+1]]<10) total += WORD_NUMBERS[words[i+1]];
      return total;
    }
    return null;
  }

  function matchNumber(text, patterns){
    for (const re of patterns) {
      const m = text.match(re);
      if (m) return num(m[1]);
    }
    return null;
  }

  function parseOffer(text){
    const t = normalizeText(text);
    return matchNumber(t,[
      /(?:nude\s+mi|ponuda(?:\s+je)?|ponuđeno|ponudeno|iznos(?:\s+je)?|dobijem|dobivam)\s*(\d+(?:[.,]\d+)?)\s*(?:€|eur|eura?)/i,
      /(?:za)\s*(\d+(?:[.,]\d+)?)\s*(?:€|eur|eura?)/i,
      /(\d+(?:[.,]\d+)?)\s*(?:€|eur|eura?)/i
    ]);
  }

  function parseProfit(text){
    const lower = normalizeText(text);
    const out = {};

    const offer = parseOffer(lower); if (offer != null) out.offer = offer;

    let v = matchNumber(lower,[
      /(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)\s*(?:prazn(?:og|i|ih|o)?\s*)?(?:do\s+putnika|do\s+preuzimanja|dolaska)/i,
      /(?:do\s+putnika|do\s+preuzimanja|prazn(?:i|ih|o)?\s+dola(?:zak|ska))\D{0,18}(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)/i,
      /(?:imam|je)\s*(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)\s*(?:do\s+putnika|do\s+preuzimanja)/i
    ]); if (v != null) out.pickupKm = v;

    v = matchNumber(lower,[
      /(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)\s*(?:s|sa)\s+putnik(?:om|a)/i,
      /(?:s|sa)\s+putnik(?:om|a)\D{0,18}(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)/i,
      /(?:vožnja|voznja)(?:\s+s\s+putnikom)?\s*(?:je|ima|iznosi)?\D{0,8}(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)/i
    ]); if (v != null) out.passengerKm = v;

    if (/(?:bez\s+(?:praznog\s+)?povratka|ne\s+vraćam\s+se|ne\s+vracam\s+se|povratak\s+(?:je\s+)?nula)/i.test(lower)) out.returnKm = 0;
    else {
      v = matchNumber(lower,[
        /(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)\s*(?:prazn(?:og|i|ih|o)?\s*)?(?:povratka|povratak)/i,
        /(?:prazn(?:i|ih|o)?\s+)?povrat(?:ak|ka)\D{0,18}(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)/i,
        /(?:vraćam|vracam)\s+se\D{0,18}(\d+(?:[.,]\d+)?)\s*(?:km|kilomet(?:ar|ra|ara)?)/i
      ]); if (v != null) out.returnKm = v;
    }

    v = matchNumber(lower,[/(\d+(?:[.,]\d+)?)\s*(?:min|minute|minuta)/i]); if (v != null) out.minutes = v;

    v = matchNumber(lower,[/(?:cestarina|parking|ostali\s+(?:direktni\s+)?trošak|ostali\s+(?:direktni\s+)?trosak)\D{0,12}(\d+(?:[.,]\d+)?)\s*(?:€|eur|eura?)/i]);
    if (v != null) out.otherCost = v;

    return out;
  }

  function profitabilityIntent(text){
    const t = normalizeText(text);
    return /(?:isplati\s+li\s+se|isplativost|analiziraj\s+(?:ovu\s+)?(?:vožnju|voznju|ponudu)|procijeni\s+(?:ovu\s+)?(?:vožnju|voznju|ponudu)|nude\s+mi\s+\d)/i.test(t);
  }

  function setField(key,value){
    const ids={offer:'profitOffer',pickupKm:'profitPickupKm',passengerKm:'profitPassengerKm',returnKm:'profitReturnKm',minutes:'profitMinutes',otherCost:'profitOtherCost'};
    const el=$(ids[key]);
    if (el && value != null) el.value=String(value);
  }

  function currentFieldValue(key){
    const ids={offer:'profitOffer',pickupKm:'profitPickupKm',passengerKm:'profitPassengerKm',returnKm:'profitReturnKm',minutes:'profitMinutes',otherCost:'profitOtherCost'};
    return num($(ids[key])?.value);
  }

  function openPanel(){
    const overlay=$('profitOverlay');
    if (overlay?.hidden) $('openProfitPanel')?.click();
  }

  function status(text){
    const el=$('profitStatus');
    if (el) el.textContent=text;
    const a=$('assistantStatus');
    if (a) a.textContent=text;
  }

  function say(text,after){
    const synth=window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) { if(after)setTimeout(after,120); return; }
    try {
      synth.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='hr-HR';u.rate=.92;u.pitch=1;u.volume=1;
      if(after){u.onend=()=>after();u.onerror=()=>after();}
      synth.speak(u);
    } catch { if(after)setTimeout(after,120); }
  }

  function nextMissing(){
    for (const key of REQUIRED) {
      const value = state.values[key] != null ? state.values[key] : currentFieldValue(key);
      if (value == null || (key==='minutes' && value<=0)) return key;
    }
    return '';
  }

  function fillKnown(){
    Object.entries(state.values).forEach(([k,v])=>setField(k,v));
    if (currentFieldValue('otherCost')==null) setField('otherCost',0);
  }

  function finishCalculation(){
    fillKnown();
    state.pendingKey='';
    state.active=false;
    status('Imam sve podatke. Računam stvarnu isplativost…');
    setTimeout(()=>{
      $('calculateProfit')?.click();
      setTimeout(()=>{
        const verdict=$('profitVerdict')?.textContent?.trim()||'';
        const returnKm=currentFieldValue('returnKm')||0;
        const warning=$('profitWarning');
        if (warning && returnKm>0 && /GRANIČNO|NE ISPLATI SE/i.test(verdict)) {
          const extra=' Ako očekuješ novu vožnju na odredištu, ponovi procjenu s manjim praznim povratkom.';
          if (!warning.textContent.includes('očekuješ novu vožnju')) warning.textContent=(warning.textContent+' '+extra).trim();
        }
      },80);
    },40);
  }

  function askMissing(){
    fillKnown();
    const key=nextMissing();
    if (!key) { finishCalculation(); return; }
    state.pendingKey=key;
    state.active=true;
    const q=QUESTIONS[key];
    status('🎙️ '+q);
    if (state.mode==='oneshot') say(q,()=>setTimeout(()=>startOneShot(false),180));
    else say(q);
  }

  function applyAnswer(key,text){
    const t=normalizeText(text);
    let value=firstNumeric(t);
    if (key==='returnKm' && /(?:nula|bez\s+povratka|ne\s+vraćam|ne\s+vracam)/i.test(t)) value=0;
    if (value==null) {
      const q='Nisam čula broj za '+LABELS[key]+'. '+QUESTIONS[key];
      status(q);
      if(state.mode==='oneshot')say(q,()=>setTimeout(()=>startOneShot(false),180));else say(q);
      return false;
    }
    state.values[key]=value;
    setField(key,value);
    state.pendingKey='';
    askMissing();
    return true;
  }

  function beginFlow(text,mode='assistant'){
    openPanel();
    state.mode=mode;
    state.active=true;
    state.values={...state.values,...parseProfit(text)};
    fillKnown();
    askMissing();
  }

  function handleTranscript(text,source='assistant'){
    const clean=String(text||'').trim();
    if (!clean) return;
    const now=Date.now();
    if (clean===state.lastTranscript && now-state.lastTranscriptAt<1200) return;
    state.lastTranscript=clean;state.lastTranscriptAt=now;
    if (/hvala\s+ti\s+lana/i.test(clean)) { state.pendingKey='';state.active=false;return; }
    if (state.pendingKey) { applyAnswer(state.pendingKey,clean); return; }
    if (state.active && state.mode==='oneshot') { beginFlow(clean,'oneshot'); return; }
    if (profitabilityIntent(clean)) beginFlow(clean,source);
  }

  function startOneShot(first=true){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) { status('Ovaj preglednik ne podržava glasovni unos za brzu procjenu.'); return; }
    try { state.recognition?.abort?.(); } catch {}
    const rec=new SR();state.recognition=rec;rec.lang='hr-HR';rec.interimResults=false;rec.maxAlternatives=1;rec.continuous=false;
    rec.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript?.trim()||'';handleTranscript(text,'oneshot')};
    rec.onerror=e=>{if(e.error!=='aborted'&&e.error!=='no-speech')status('Mikrofon: '+e.error)};
    rec.onend=()=>{if(state.recognition===rec)state.recognition=null};
    if(first){state.mode='oneshot';state.active=true;state.values={};state.pendingKey='';openPanel();status('🎙️ Reci ponudu prirodno. Primjer: “Nude mi 26 eura, 9 kilometara do putnika, vožnja 12 kilometara, povratak 10 kilometara, ukupno 55 minuta.”');}
    try{rec.start()}catch{status('Mikrofon se nije mogao pokrenuti.')}
  }

  function installButton(){
    if($('profitVoiceQuick099'))return;
    const calc=$('calculateProfit');
    if(!calc)return;
    const btn=document.createElement('button');
    btn.id='profitVoiceQuick099';btn.type='button';btn.className='secondary';btn.textContent='🎙️ Reci ponudu';btn.style.marginBottom='10px';
    btn.addEventListener('click',()=>{
      const globalOn=($('toggleAssistant')?.textContent||'').includes('Isključi');
      if(globalOn){state.mode='assistant';state.active=true;state.values={};state.pendingKey='';openPanel();status('🎙️ Reci sada: “Molim te Lana, isplati li se ova vožnja…”');say('Reci ponudu. Slušam kroz Lanu.');}
      else startOneShot(true);
    });
    calc.parentElement?.insertBefore(btn,calc);
  }

  function installAssistantObserver(){
    const target=$('assistantStatus');if(!target)return;
    const observer=new MutationObserver(records=>{
      for(const rec of records){
        const candidates=[];
        if(rec.type==='characterData'&&rec.target?.data)candidates.push(rec.target.data);
        for(const n of rec.addedNodes||[])if(n?.textContent)candidates.push(n.textContent);
        for(const raw of candidates){
          const m=String(raw).match(/^Čula sam:\s*(.+)$/i);
          if(m){setTimeout(()=>handleTranscript(m[1],'assistant'),0);return}
        }
      }
    });
    observer.observe(target,{subtree:true,childList:true,characterData:true});
  }

  function install(){
    installButton();
    installAssistantObserver();
    window.__lanaProfitVoice099={release:RELEASE,parse:parseProfit,handleTranscript,startOneShot};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
