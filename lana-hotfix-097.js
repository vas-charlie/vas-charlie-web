(() => {
  const MESSAGES = [
    'VAŠ CHARLIE',
    'HVALA NA POVJERENJU',
    'DA NIJE VAS, NE BI BILO NI MENE!!'
  ];

  function install() {
    if (document.getElementById('charliePassengerMessage')) return;

    const style = document.createElement('style');
    style.id = 'charlieHotfix097Style';
    style.textContent = `
      .lana-portrait{
        animation:charlieLanaPresence 8s ease-in-out infinite;
        transform-origin:48% 72%;
        will-change:transform,filter;
      }
      @keyframes charlieLanaPresence{
        0%,100%{transform:translate3d(0,0,0) scale(1);filter:drop-shadow(0 18px 28px rgba(30,64,175,.10))}
        50%{transform:translate3d(2px,-3px,0) scale(1.006);filter:drop-shadow(0 20px 30px rgba(30,64,175,.14))}
      }
      #charliePassengerMessage{
        position:absolute;
        z-index:24;
        top:42%;
        right:4.5%;
        width:min(410px,43vw);
        min-height:150px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        padding:22px 24px;
        border-radius:28px;
        color:#12376a;
        background:rgba(255,255,255,.72);
        border:1px solid rgba(169,195,228,.55);
        box-shadow:0 18px 46px rgba(30,64,175,.10);
        backdrop-filter:blur(10px);
        font-weight:950;
        letter-spacing:.055em;
        line-height:1.18;
        font-size:clamp(1.25rem,3.1vw,2.35rem);
        opacity:0;
        transform:translateY(8px) scale(.985);
        transition:opacity .7s ease,transform .7s ease;
        pointer-events:none;
      }
      #charliePassengerMessage.show{opacity:1;transform:translateY(0) scale(1)}
      #charliePassengerMessage.signature{font-size:clamp(1.05rem,2.55vw,1.9rem);letter-spacing:.035em}
      @media(max-width:700px){
        #charliePassengerMessage{right:2.5%;width:39vw;min-height:112px;padding:16px 14px;border-radius:22px;top:39%}
      }
      @media(max-width:430px){
        #charliePassengerMessage{right:2%;width:43vw;min-height:92px;padding:12px 10px;font-size:clamp(.9rem,4.2vw,1.2rem);top:38%}
        #charliePassengerMessage.signature{font-size:clamp(.78rem,3.6vw,1.02rem)}
      }
      @media(prefers-reduced-motion:reduce){.lana-portrait{animation:none!important}#charliePassengerMessage{transition:none}}
    `;
    document.head.appendChild(style);

    const stage = document.querySelector('.lana-stage') || document.querySelector('.lana-shell') || document.body;
    const box = document.createElement('div');
    box.id = 'charliePassengerMessage';
    box.setAttribute('aria-live','polite');
    stage.appendChild(box);

    let i = 0;
    const show = () => {
      box.classList.remove('show');
      setTimeout(() => {
        box.textContent = MESSAGES[i];
        box.classList.toggle('signature', i === 2);
        box.classList.add('show');
        i = (i + 1) % MESSAGES.length;
      }, 650);
    };

    show();
    setInterval(show, 5200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
