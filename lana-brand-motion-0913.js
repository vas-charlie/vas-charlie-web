(() => {
  const BRAND_MESSAGES = [
    'VAŠ CHARLIE',
    'HVALA NA POVJERENJU',
    'DA NIJE VAS, NE BI BILO NI MENE!!'
  ];

  const DIRECTIONS = [
    {name:'left', x:-126, y:0},
    {name:'top-left', x:-96, y:-82},
    {name:'top', x:0, y:-96},
    {name:'top-right', x:96, y:-82},
    {name:'right', x:126, y:0},
    {name:'bottom-right', x:96, y:82},
    {name:'bottom', x:0, y:96},
    {name:'bottom-left', x:-96, y:82}
  ];

  const ENTER_MS = 3200;
  const EXIT_MS = 2400;
  const HOLD_MIN_MS = 6000;
  const HOLD_MAX_MS = 8000;

  let messageIndex = 0;
  let directionBag = [];
  let lastExitIndex = -1;
  let cycleTimer = 0;
  let box = null;

  function shuffle(items){
    const out = [...items];
    for(let i=out.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [out[i],out[j]] = [out[j],out[i]];
    }
    return out;
  }

  function nextEntryIndex(){
    if(!directionBag.length) directionBag = shuffle(DIRECTIONS.map((_,i)=>i));
    return directionBag.shift();
  }

  function nextExitIndex(entryIndex){
    const candidates = DIRECTIONS
      .map((_,i)=>i)
      .filter(i=>i!==entryIndex && i!==lastExitIndex);
    const pool = candidates.length ? candidates : DIRECTIONS.map((_,i)=>i).filter(i=>i!==entryIndex);
    const chosen = pool[Math.floor(Math.random()*pool.length)];
    lastExitIndex = chosen;
    return chosen;
  }

  function rand(min,max){ return Math.floor(min + Math.random()*(max-min+1)); }

  function escapeChar(ch){
    if(ch===' ') return '&nbsp;';
    return ch.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function letterMarkup(text){
    return [...text].map((ch,i)=>`<span class="charlie-letter" data-i="${i}">${escapeChar(ch)}</span>`).join('');
  }

  function getStage(){
    return document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
  }

  function createBox(){
    document.getElementById('charliePassengerMessage')?.remove();
    const stage = getStage();
    if(getComputedStyle(stage).position==='static') stage.style.position='relative';
    box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    stage.appendChild(box);
    return box;
  }

  function ensureBox(){
    const stage = getStage();
    if(!box || !box.isConnected){
      createBox();
    } else if(box.parentElement!==stage){
      stage.appendChild(box);
    }
    return box;
  }

  function cancelAnimations(){
    if(!box) return;
    box.getAnimations().forEach(a=>a.cancel());
    box.querySelectorAll('.charlie-letter').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
  }

  function animateLettersIn(letters){
    letters.forEach((el,i)=>{
      const side = i%2===0 ? -1 : 1;
      el.animate([
        {opacity:.12, transform:`translate3d(${side*8}px,${10+(i%3)*2}px,0) rotate(${side*7}deg) scale(.94)`},
        {opacity:1, transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
      ], {
        duration:980,
        delay:520+i*48,
        easing:'cubic-bezier(.18,.82,.22,1)',
        fill:'both'
      });
    });
  }

  function animateLettersPlay(letters, holdMs){
    const loops = Math.max(2, Math.floor(holdMs/1900));
    letters.forEach((el,i)=>{
      const tilt = i%2===0 ? -1.4 : 1.4;
      el.animate([
        {transform:'translateY(0) rotate(0deg)'},
        {transform:`translateY(-3px) rotate(${tilt}deg)`},
        {transform:'translateY(1px) rotate(0deg)'},
        {transform:'translateY(0) rotate(0deg)'}
      ], {
        duration:1850,
        delay:(i%7)*75,
        iterations:loops,
        easing:'ease-in-out'
      });
    });
  }

  function animateLettersOut(letters){
    letters.forEach((el,i)=>{
      const side = i%2===0 ? -1 : 1;
      el.animate([
        {opacity:1, transform:'translate3d(0,0,0) rotate(0deg)'},
        {opacity:.35, transform:`translate3d(${side*6}px,${side*4}px,0) rotate(${side*5}deg)`}
      ], {
        duration:760,
        delay:i*26,
        easing:'ease-in',
        fill:'forwards'
      });
    });
  }

  function showNext(){
    ensureBox();
    cancelAnimations();

    const text = BRAND_MESSAGES[messageIndex];
    messageIndex = (messageIndex+1)%BRAND_MESSAGES.length;

    const entryIndex = nextEntryIndex();
    const exitIndex = nextExitIndex(entryIndex);
    const entry = DIRECTIONS[entryIndex];
    const exit = DIRECTIONS[exitIndex];
    const holdMs = rand(HOLD_MIN_MS,HOLD_MAX_MS);

    box.className = text===BRAND_MESSAGES[2] ? 'signature' : '';
    box.innerHTML = letterMarkup(text);
    const letters = [...box.querySelectorAll('.charlie-letter')];

    box.animate([
      {opacity:0, transform:`translate3d(${entry.x}px,${entry.y}px,0) scale(.975)`, filter:'blur(4px)'},
      {opacity:1, offset:.72, transform:'translate3d(0,0,0) scale(1)', filter:'blur(.4px)'},
      {opacity:1, transform:'translate3d(0,0,0) scale(1)', filter:'blur(0px)'}
    ], {
      duration:ENTER_MS,
      easing:'cubic-bezier(.16,.78,.2,1)',
      fill:'forwards'
    });

    animateLettersIn(letters);

    const playTimer = setTimeout(()=>animateLettersPlay(letters,holdMs), ENTER_MS-350);

    const exitTimer = setTimeout(()=>{
      if(!box?.isConnected) return;
      animateLettersOut(letters);
      box.animate([
        {opacity:1, transform:'translate3d(0,0,0) scale(1)', filter:'blur(0px)'},
        {opacity:.92, offset:.2, transform:'translate3d(0,0,0) scale(1)', filter:'blur(.2px)'},
        {opacity:0, transform:`translate3d(${exit.x}px,${exit.y}px,0) scale(.975)`, filter:'blur(4px)'}
      ], {
        duration:EXIT_MS,
        easing:'cubic-bezier(.38,0,.62,.22)',
        fill:'forwards'
      });
    }, ENTER_MS+holdMs);

    clearTimeout(cycleTimer);
    cycleTimer = setTimeout(()=>{
      clearTimeout(playTimer);
      clearTimeout(exitTimer);
      showNext();
    }, ENTER_MS+holdMs+EXIT_MS+260);
    window.__charlieBrandTimer = cycleTimer;
  }

  function install(){
    if(window.__charlieBrandMotion0913Installed) return;
    window.__charlieBrandMotion0913Installed = true;

    if(window.__charlieBrandTimer) clearTimeout(window.__charlieBrandTimer);
    createBox();
    showNext();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
