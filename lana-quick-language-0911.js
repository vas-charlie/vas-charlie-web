(() => {
  const STORAGE_KEY = 'lanaQuickPassengerLanguageV1';
  const LANGS = [
    ['hr','🇭🇷 HR'],
    ['en','🇬🇧 EN'],
    ['de','🇩🇪 DE'],
    ['it','🇮🇹 IT'],
    ['fr','🇫🇷 FR'],
    ['es','🇪🇸 ES']
  ];

  function setPassengerLanguage(lang, {persist=true, syncQuick=true} = {}) {
    if (!LANGS.some(([code]) => code === lang)) lang = 'hr';
    const target = document.getElementById('passengerLanguage');
    if (target && target.value !== lang) {
      target.value = lang;
      target.dispatchEvent(new Event('change', {bubbles:true}));
    }
    if (persist) localStorage.setItem(STORAGE_KEY, lang);
    if (syncQuick) {
      const quick = document.getElementById('lanaQuickPassengerLanguage');
      if (quick && quick.value !== lang) quick.value = lang;
    }
  }

  function install() {
    if (document.getElementById('lanaQuickPassengerLanguageWrap')) return;
    const strip = document.querySelector('.lana-greetings');
    const title = strip?.querySelector('.lana-greetings-title');
    if (!strip) return;

    const style = document.createElement('style');
    style.id = 'lanaQuickPassengerLanguageStyle';
    style.textContent = `
      #lanaQuickPassengerLanguageWrap{flex:0 0 82px;width:82px;display:flex;flex-direction:column;gap:3px;align-items:stretch;justify-content:center}
      #lanaQuickPassengerLanguageWrap span{font-size:.58rem;font-weight:900;color:#557296;text-align:center;line-height:1}
      #lanaQuickPassengerLanguage{width:82px;min-height:48px;height:48px;margin:0;padding:0 7px;border-radius:15px;border:1px solid #b9cde5;background:#eef5ff;color:#173d72;font-weight:900;font-size:.75rem;box-shadow:0 4px 12px rgba(29,74,130,.08)}
      #lanaQuickPassengerLanguage:focus{outline:2px solid #2f6deb;outline-offset:1px}
      @media(max-width:420px){#lanaQuickPassengerLanguageWrap{flex-basis:76px;width:76px}#lanaQuickPassengerLanguage{width:76px;font-size:.7rem}}
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'lanaQuickPassengerLanguageWrap';
    wrap.innerHTML = '<span>JEZIK</span>';

    const select = document.createElement('select');
    select.id = 'lanaQuickPassengerLanguage';
    select.setAttribute('aria-label','Brzi jezik pozdrava putnika');
    for (const [code,label] of LANGS) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = label;
      select.appendChild(option);
    }
    wrap.appendChild(select);

    if (title?.nextSibling) strip.insertBefore(wrap, title.nextSibling);
    else strip.prepend(wrap);

    const saved = localStorage.getItem(STORAGE_KEY);
    const current = document.getElementById('passengerLanguage')?.value;
    const initial = LANGS.some(([code]) => code === saved) ? saved : (LANGS.some(([code]) => code === current) ? current : 'hr');
    select.value = initial;
    setPassengerLanguage(initial, {persist:true, syncQuick:false});

    select.addEventListener('change', () => setPassengerLanguage(select.value, {persist:true, syncQuick:false}));

    const passengerSelect = document.getElementById('passengerLanguage');
    passengerSelect?.addEventListener('change', () => {
      const lang = passengerSelect.value;
      if (!LANGS.some(([code]) => code === lang)) return;
      select.value = lang;
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, {once:true});
  } else {
    install();
  }
})();
