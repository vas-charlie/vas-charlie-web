(() => {
  const BRAND_MESSAGES = [
    'VAŠ CHARLIE',
    'HVALA NA POVJERENJU',
    'DA NIJE VAS, NE BI BILO NI MENE!!'
  ];

  const DIRECTIONS = [
    'left','top-left','top','top-right','right','bottom-right','bottom','bottom-left'
  ];

  const ENTER_MS = 6200;
  const EXIT_MS = 5200;
  const HOLD_MIN_MS = 6500;
  const HOLD_MAX_MS = 8000;
  const EDGE_PAD = 14;

  let box = null;
  let messageIndex = 0;
  let directionBag = [];
  let lastExitIndex = -1;
  let cycleTimer = 0;
  let phaseTimer = 0;
  let letterAnimations = [];

  function shuffle(items){
    const out = [...items];
    for(let i=out.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [out[i],out[j]] = [out[j],out[i]];
    }
    return out;
  }

  function rand(min,max){
    if(max<=min) return min;
    return Math.floor(min + Math.random()*(max-min+1));
  }

  function nextEntryIndex(){
    if(!directionBag.length) directionBag = shuffle(DIRECTIONS.map((_,i)=>i));
    return directionBag.shift();
  }

  function nextExitIndex(entryIndex){
    const candidates = DIRECTIONS.map((_,i)=>i).filter(i=>i!==entryIndex && i!==lastExitIndex);
    const pool = candidates.length ? candidates : DIRECTIONS.map((_,i)=>i).filter(i=>i!==entryIndex);
    const chosen = pool[Math.floor(Math.random()*pool.length)];
    lastExitIndex = chosen;
    return chosen;
  }

  function escapeChar(ch){
    return ch.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function letterMarkup(text){
    return [...text].map((ch,i)=>{
      if(ch===' ') return '<span class="charlie-space">&nbsp;</span>';
      return `<span class="charlie-letter" data-i="${i}">${escapeChar(ch)}</span>`;
    }).join('');
  }

  function getStage(){
    return document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
  }

  function getHost(){
    return document.querySelector('.lana-shell') || document.body;
  }

  function isVisible(el){
    if(!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    return r.width>0 && r.height>0;
  }

  function blankArea(){
    const stage = getStage();
    const r = stage.getBoundingClientRect();
    const topbar = document.querySelector('.lana-topbar');
    const speech = document.querySelector('.lana-speech');
    const topbarRect = topbar?.getBoundingClientRect();
    const speechRect = isVisible(speech) ? speech.getBoundingClientRect() : null;

    const leftRatio = window.innerWidth<=430 ? 0.46 : (window.innerWidth<=760 ? 0.42 : 0.39);
    let left = r.left + r.width*leftRatio;
    let right = r.right - Math.max(12,r.width*0.025);
    let top = Math.max(r.top+r.height*0.16,(topbarRect?.bottom || r.top)+24);
    let bottom = r.bottom - Math.max(18,r.height*0.055);

    if(speechRect && speechRect.right>left) top = Math.max(top,speechRect.bottom+22);

    if(right-left<130){
      left = r.left+r.width*0.42;
      right = r.right-10;
    }
    if(bottom-top<150){
      top = r.top+r.height*0.30;
      bottom = r.bottom-14;
    }

    return {
      left,right,top,bottom,
      x:(left+right)/2,
      y:(top+bottom)/2
    };
  }

  function installStyle(){
    document.getElementById('charlieBrandMotion0914Style')?.remove();
    const style = document.createElement('style');
    style.id = 'charlieBrandMotion0914Style';
    style.textContent = `
      #charliePassengerMessage{
        position:fixed!important;
        z-index:20!important;
        right:auto!important;
        bottom:auto!important;
        width:min(58vw,620px)!important;
        max-width:min(58vw,620px)!important;
        min-height:72px!important;
        padding:8px 10px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
        pointer-events:none!important;
        opacity:0;
        transform:translate3d(-50%,-50%,0);
        will-change:transform,opacity;
      }
      #charliePassengerMessage .charlie-letter{
        display:inline-block;
        transform-origin:50% 72%;
        will-change:transform,opacity;
      }
      #charliePassengerMessage .charlie-space{
        display:inline-block;
        width:.34em;
      }
      @media(max-width:760px){
        #charliePassengerMessage{width:min(60vw,430px)!important;max-width:min(60vw,430px)!important;}
      }
      @media(max-width:430px){
        #charliePassengerMessage{width:58vw!important;max-width:58vw!important;padding:6px 4px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function createBox(){
    document.getElementById('charliePassengerMessage')?.remove();
    const host = getHost();
    if(getComputedStyle(host).position==='static') host.style.position='relative';
    box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    host.appendChild(box);
    return box;
  }

  function ensureBox(){
    const host = getHost();
    if(!box || !box.isConnected) createBox();
    else if(box.parentElement!==host) host.appendChild(box);
    return box;
  }

  function clearLetterAnimations(){
    letterAnimations.forEach(a=>{try{a.cancel()}catch{}});
    letterAnimations = [];
    if(box) box.querySelectorAll('.charlie-letter').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
  }

  function cancelAll(){
    clearLetterAnimations();
    if(box) box.getAnimations().forEach(a=>a.cancel());
    clearTimeout(phaseTimer);
  }

  function baseTransform(dx=0,dy=0,scale=1){
    return `translate3d(-50%,-50%,0) translate3d(${Math.round(dx)}px,${Math.round(dy)}px,0) scale(${scale})`;
  }

  function edgePoint(direction,target,rect,area){
    const halfW = rect.width/2;
    const halfH = rect.height/2;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const leftX = -halfW-EDGE_PAD;
    const rightX = w+halfW+EDGE_PAD;
    const topY = -halfH-EDGE_PAD;
    const bottomY = h+halfH+EDGE_PAD;

    const safeY1 = Math.max(halfH+8,area.top);
    const safeY2 = Math.min(h-halfH-8,area.bottom);
    const safeX1 = Math.max(halfW+8,area.left-80);
    const safeX2 = Math.min(w-halfW-8,area.right+30);
    const sideY = rand(Math.round(safeY1),Math.round(Math.max(safeY1,safeY2)));
    const sideX = rand(Math.round(safeX1),Math.round(Math.max(safeX1,safeX2)));

    switch(direction){
      case 'left': return {x:leftX,y:sideY};
      case 'top-left': return {x:leftX,y:topY};
      case 'top': return {x:sideX,y:topY};
      case 'top-right': return {x:rightX,y:topY};
      case 'right': return {x:rightX,y:sideY};
      case 'bottom-right': return {x:rightX,y:bottomY};
      case 'bottom': return {x:sideX,y:bottomY};
      case 'bottom-left': return {x:leftX,y:bottomY};
      default: return target;
    }
  }

  function startTravelLetterPlay(letters){
    clearLetterAnimations();
    letterAnimations = letters.map((el,i)=>{
      const side = i%2===0 ? -1 : 1;
      const lift = 3+(i%4);
      return el.animate([
        {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'},
        {transform:`translate3d(${side*2}px,-${lift}px,0) rotate(${side*2.8}deg) scale(1.025)`},
        {transform:`translate3d(${-side*2}px,${Math.max(1,lift-2)}px,0) rotate(${-side*2.2}deg) scale(.985)`},
        {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
      ],{
        duration:1450+(i%5)*95,
        delay:(i%9)*70,
        iterations:Math.ceil(ENTER_MS/1300)+1,
        easing:'ease-in-out'
      });
    });
  }

  function startHoldLetterPlay(letters){
    clearLetterAnimations();
    letterAnimations = letters.map((el,i)=>{
      const side = i%2===0 ? -1 : 1;
      const mode = i%4;
      let frames;
      if(mode===0){
        frames=[
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'},
          {transform:`translate3d(${side*2}px,-9px,0) rotate(${side*5}deg) scale(1.08)`},
          {transform:`translate3d(${-side*2}px,3px,0) rotate(${-side*3}deg) scale(.97)`},
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
        ];
      }else if(mode===1){
        frames=[
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'},
          {transform:`translate3d(${side*5}px,-4px,0) rotate(${side*6}deg) scale(1.04)`},
          {transform:`translate3d(${-side*4}px,4px,0) rotate(${-side*5}deg) scale(1)`},
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
        ];
      }else if(mode===2){
        frames=[
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'},
          {transform:`translate3d(0,-6px,0) rotate(${side*3}deg) scale(1.12)`},
          {transform:`translate3d(${side*3}px,2px,0) rotate(${-side*3}deg) scale(.98)`},
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
        ];
      }else{
        frames=[
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'},
          {transform:`translate3d(${side*3}px,5px,0) rotate(${-side*4}deg) scale(.99)`},
          {transform:`translate3d(${-side*3}px,-7px,0) rotate(${side*5}deg) scale(1.06)`},
          {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
        ];
      }
      return el.animate(frames,{
        duration:1050+(i%6)*110,
        delay:(i%10)*80,
        iterations:Infinity,
        easing:'ease-in-out'
      });
    });
  }

  function animateLettersOut(letters){
    clearLetterAnimations();
    letterAnimations = letters.map((el,i)=>{
      const side = i%2===0 ? -1 : 1;
      return el.animate([
        {opacity:1,transform:'translate3d(0,0,0) rotate(0deg) scale(1)'},
        {opacity:.9,transform:`translate3d(${side*5}px,-4px,0) rotate(${side*5}deg) scale(1.03)`},
        {opacity:.28,transform:`translate3d(${side*12}px,${side*8}px,0) rotate(${side*10}deg) scale(.94)`}
      ],{
        duration:1150,
        delay:(i%9)*45,
        easing:'ease-in',
        fill:'forwards'
      });
    });
  }

  function showNext(){
    ensureBox();
    cancelAll();

    const text = BRAND_MESSAGES[messageIndex];
    messageIndex = (messageIndex+1)%BRAND_MESSAGES.length;

    box.className = text===BRAND_MESSAGES[2] ? 'signature' : '';
    box.innerHTML = letterMarkup(text);

    const area = blankArea();
    box.style.left = `${Math.round(area.x)}px`;
    box.style.top = `${Math.round(area.y)}px`;
    box.style.opacity = '0';
    box.style.transform = baseTransform();

    const rect = box.getBoundingClientRect();
    const target = {x:area.x,y:area.y};
    const entryIndex = nextEntryIndex();
    const exitIndex = nextExitIndex(entryIndex);
    const entry = edgePoint(DIRECTIONS[entryIndex],target,rect,area);
    const exit = edgePoint(DIRECTIONS[exitIndex],target,rect,area);
    const entryDx = entry.x-target.x;
    const entryDy = entry.y-target.y;
    const exitDx = exit.x-target.x;
    const exitDy = exit.y-target.y;
    const holdMs = rand(HOLD_MIN_MS,HOLD_MAX_MS);
    const letters = [...box.querySelectorAll('.charlie-letter')];

    const travel = box.animate([
      {opacity:.38,transform:baseTransform(entryDx,entryDy,.985)},
      {opacity:.72,offset:.18,transform:baseTransform(entryDx*.82,entryDy*.82,.99)},
      {opacity:1,offset:.42,transform:baseTransform(entryDx*.57,entryDy*.57,1)},
      {opacity:1,transform:baseTransform(0,0,1)}
    ],{
      duration:ENTER_MS,
      easing:'linear',
      fill:'forwards'
    });

    startTravelLetterPlay(letters);

    travel.finished.then(()=>{
      if(!box?.isConnected) return;
      startHoldLetterPlay(letters);
      phaseTimer = setTimeout(()=>{
        if(!box?.isConnected) return;
        animateLettersOut(letters);
        box.animate([
          {opacity:1,transform:baseTransform(0,0,1)},
          {opacity:1,offset:.62,transform:baseTransform(exitDx*.62,exitDy*.62,1)},
          {opacity:.82,offset:.80,transform:baseTransform(exitDx*.80,exitDy*.80,.995)},
          {opacity:.18,transform:baseTransform(exitDx,exitDy,.985)}
        ],{
          duration:EXIT_MS,
          easing:'linear',
          fill:'forwards'
        });
      },holdMs);
    }).catch(()=>{});

    clearTimeout(cycleTimer);
    cycleTimer = setTimeout(showNext,ENTER_MS+holdMs+EXIT_MS+320);
    window.__charlieBrandTimer = cycleTimer;
  }

  function install(){
    if(window.__charlieBrandMotion0914Installed) return;
    window.__charlieBrandMotion0914Installed = true;

    if(window.__charlieBrandTimer) clearTimeout(window.__charlieBrandTimer);
    clearTimeout(cycleTimer);
    clearTimeout(phaseTimer);
    installStyle();
    createBox();
    showNext();

    window.addEventListener('resize',()=>{
      if(!box?.isConnected) return;
      const area = blankArea();
      box.style.left = `${Math.round(area.x)}px`;
      box.style.top = `${Math.round(area.y)}px`;
    },{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
