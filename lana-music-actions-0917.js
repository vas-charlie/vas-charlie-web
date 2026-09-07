(() => {
  const RELEASE = '0.9.17';

  function installStyle() {
    document.getElementById('lanaMusicActions0917Style')?.remove();
    const style = document.createElement('style');
    style.id = 'lanaMusicActions0917Style';
    style.textContent = `
      #lanaMusicPanel .lana-music-head small{font-weight:800;color:#4f6988}
      #lanaMusicPanel .lana-music-tabs{gap:5px;margin:6px 0 8px}
      #lanaMusicPanel .lana-music-tab{min-height:34px!important;border-radius:11px!important;font-size:.68rem!important;padding:5px 4px!important;font-weight:800!important}
      #lanaMusicPanel .lana-music-card[data-music-context="search"]{padding:10px;border-radius:15px}
      #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;width:100%;margin-top:2px}
      #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions button{width:100%!important;min-width:0!important;min-height:46px!important;padding:7px 5px!important;border-radius:12px!important;font-size:.72rem!important;font-weight:900!important;line-height:1.1}
      #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions .music-action-play{background:#2f6deb!important;color:#fff!important;border-color:#2f6deb!important}
      #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions .music-action-save{background:#fff1f5!important;color:#8b2749!important;border-color:#e7afc2!important}
      #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions .music-action-download{background:#eef9f2!important;color:#17643a!important;border-color:#a9d2b8!important}
      #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions .music-action-download:disabled{background:#f4f6f8!important;color:#7a8796!important;border-color:#d5dde6!important;opacity:1!important}
      #lanaMusicPanel .lana-music-card[data-music-context="saved"] .lana-music-actions,
      #lanaMusicPanel .lana-music-card[data-music-context="downloads"] .lana-music-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
      #lanaMusicPanel .lana-music-card[data-music-context="saved"] .lana-music-actions button,
      #lanaMusicPanel .lana-music-card[data-music-context="downloads"] .lana-music-actions button{width:100%!important;min-height:39px!important;font-weight:850!important}
      @media(max-width:420px){
        #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions{gap:5px}
        #lanaMusicPanel .lana-music-card[data-music-context="search"] .lana-music-actions button{min-height:44px!important;font-size:.66rem!important;padding:6px 3px!important}
        #lanaMusicPanel .lana-music-tab{font-size:.64rem!important}
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceCard(card) {
    if (!(card instanceof HTMLElement)) return;
    const root = card.closest('[data-music-pane]');
    const context = root?.dataset.musicPane || '';
    if (context) card.dataset.musicContext = context;

    const actions = card.querySelector('.lana-music-actions');
    if (!actions) return;

    const buttons = [...actions.querySelectorAll('button')];
    let hasDownload = false;

    for (const button of buttons) {
      const text = (button.textContent || '').trim();
      if (text.includes('Pusti')) button.classList.add('music-action-play');
      if (text.includes('Sačuvaj') || text.includes('Spremi')) {
        button.textContent = '❤️ Spremi';
        button.classList.add('music-action-save');
      }
      if (text.includes('Preuzmi') || text.includes('Preuzeto')) {
        hasDownload = true;
        button.classList.add('music-action-download');
      }
    }

    if (context === 'search' && !hasDownload) {
      const offline = [...card.querySelectorAll('.lana-music-badge')].some(b => (b.textContent || '').trim() === 'OFFLINE');
      const download = document.createElement('button');
      download.type = 'button';
      download.disabled = true;
      download.className = 'music-action-download';
      if (offline) {
        download.textContent = '✓ Preuzeto';
        download.title = 'Pjesma je već dostupna offline.';
      } else {
        download.textContent = '⬇️ Preuzmi';
        download.title = 'Ovaj izvor ne nudi dopušteno offline preuzimanje.';
      }
      actions.appendChild(download);
    }
  }

  function enhancePanel() {
    const panel = document.getElementById('lanaMusicPanel');
    if (!panel) return;
    const subtitle = panel.querySelector('.lana-music-head small');
    if (subtitle) subtitle.textContent = `▶️ Pusti  •  ❤️ Spremi  •  ⬇️ Preuzmi  •  v${RELEASE}`;
    panel.querySelectorAll('.lana-music-card').forEach(enhanceCard);
  }

  function install() {
    if (window.__lanaMusicActions0917Installed) return;
    window.__lanaMusicActions0917Installed = true;
    installStyle();
    enhancePanel();

    const observer = new MutationObserver(mutations => {
      let needsRefresh = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          needsRefresh = true;
          break;
        }
      }
      if (needsRefresh) requestAnimationFrame(enhancePanel);
    });

    const startObserver = () => {
      const panel = document.getElementById('lanaMusicPanel');
      if (!panel) return false;
      observer.observe(panel, { childList: true, subtree: true });
      enhancePanel();
      return true;
    };

    if (!startObserver()) {
      const wait = new MutationObserver(() => {
        if (startObserver()) wait.disconnect();
      });
      wait.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
