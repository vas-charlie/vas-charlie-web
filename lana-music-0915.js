(() => {
  const RELEASE = '0.9.15';
  const STORAGE_KEY = 'lanaMusic0915V1';
  let tracks = [];
  let currentIndex = -1;
  let objectUrls = [];

  const $ = id => document.getElementById(id);
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

  function formatTime(seconds){
    if(!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds);
    const m = Math.floor(s/60);
    return `${m}:${String(s%60).padStart(2,'0')}`;
  }

  function loadState(){
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        volume: Number.isFinite(Number(state.volume)) ? clamp(Number(state.volume),0,1) : .72,
        remoteTracks: Array.isArray(state.remoteTracks) ? state.remoteTracks.filter(t=>t && t.url) : []
      };
    } catch {
      return {volume:.72,remoteTracks:[]};
    }
  }

  function saveState(){
    const audio = $('lanaMusicAudio');
    const remoteTracks = tracks.filter(t=>!t.local).map(({name,url})=>({name,url}));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      volume: audio ? audio.volume : .72,
      remoteTracks
    }));
  }

  function installStyle(){
    if($('lanaMusic0915Style')) return;
    const style = document.createElement('style');
    style.id = 'lanaMusic0915Style';
    style.textContent = `
      #lanaMusicOpen{position:relative}
      #lanaMusicOpen.lana-music-active::after{content:'♪';position:absolute;right:8px;top:5px;font-size:.8rem;animation:lanaMusicPulse 1.4s ease-in-out infinite}
      @keyframes lanaMusicPulse{0%,100%{transform:translateY(0);opacity:.55}50%{transform:translateY(-3px);opacity:1}}
      #lanaMusicPanel{position:fixed;z-index:72;right:12px;bottom:202px;width:min(520px,calc(100vw - 24px));max-height:min(620px,65vh);overflow:auto;background:rgba(250,253,255,.98);color:#14345f;border:1px solid #c8d9ec;border-radius:26px;box-shadow:0 24px 68px rgba(16,52,99,.28);padding:16px;pointer-events:auto;backdrop-filter:blur(10px)}
      #lanaMusicPanel[hidden]{display:none!important}
      .lana-music-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
      .lana-music-head strong{font-size:1.05rem;letter-spacing:.02em}.lana-music-head small{display:block;color:#6b7f99;margin-top:2px}
      .lana-music-close{width:42px!important;min-width:42px!important;height:42px!important;min-height:42px!important;border-radius:50%!important;padding:0!important;background:#e9f2ff!important;color:#173f75!important;border:1px solid #bfd3eb!important}
      .lana-music-now{background:#f2f7ff;border:1px solid #cfdded;border-radius:18px;padding:13px 14px;margin-bottom:12px;text-align:center}
      .lana-music-now .title{font-weight:900;font-size:1.02rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lana-music-now .state{font-size:.76rem;color:#6b7f99;margin-top:4px}
      .lana-music-progress{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:8px;font-size:.7rem;color:#6b7f99;margin:8px 0 12px}.lana-music-progress input{margin:0!important;min-height:24px!important;padding:0!important}
      .lana-music-controls{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:9px;margin-bottom:12px}.lana-music-controls button{min-height:54px!important;border-radius:16px!important;font-size:1.15rem!important;background:#e9f2ff!important;color:#173f75!important;border:1px solid #bfd3eb!important}.lana-music-controls .play{background:#2f6deb!important;color:#fff!important;border-color:#2f6deb!important;font-size:1.35rem!important}
      .lana-music-volume{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;background:#f7fbff;border:1px solid #d1dfef;border-radius:15px;padding:8px 11px;margin-bottom:12px}.lana-music-volume input{margin:0!important;min-height:28px!important}.lana-music-volume span{font-size:.76rem;font-weight:850;min-width:34px;text-align:right}
      .lana-music-source{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px}.lana-music-source button,.lana-music-source label{min-height:48px;border-radius:14px;border:1px solid #bfd3eb;background:#e9f2ff;color:#173f75;font-weight:850;display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;cursor:pointer}.lana-music-source input[type=file]{display:none}
      .lana-music-urlbox{background:#f7fbff;border:1px solid #d1dfef;border-radius:15px;padding:10px;margin-bottom:10px}.lana-music-urlbox input{width:100%;background:#fff!important;color:#12345f!important;border:1px solid #c5d6e9!important;border-radius:11px!important;min-height:44px!important;margin:0 0 8px!important;padding:0 10px!important}.lana-music-url-actions{display:grid;grid-template-columns:1fr auto;gap:8px}.lana-music-url-actions button{min-height:44px!important;width:auto!important;border-radius:11px!important}
      .lana-music-queue-title{display:flex;justify-content:space-between;align-items:center;margin:10px 2px 7px;font-size:.78rem;font-weight:900;color:#4c6584}.lana-music-queue-title button{width:auto!important;min-height:34px!important;padding:5px 9px!important;border-radius:10px!important;background:#eef5ff!important;color:#355d8c!important;border:1px solid #cfdded!important;font-size:.72rem!important}
      #lanaMusicQueue{display:grid;gap:6px}.lana-music-track{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;padding:8px 9px;border:1px solid #d6e2ef;border-radius:12px;background:#fff}.lana-music-track.current{border-color:#7fa8df;background:#edf5ff}.lana-music-track .num{font-size:.7rem;color:#7b8da4;min-width:18px}.lana-music-track .name{font-size:.8rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lana-music-track button{width:36px!important;min-width:36px!important;height:36px!important;min-height:36px!important;padding:0!important;border-radius:10px!important;background:#eaf2ff!important;color:#174578!important;border:1px solid #c7d8eb!important}
      .lana-music-empty{padding:14px;text-align:center;color:#7b8da4;font-size:.8rem;border:1px dashed #c7d8eb;border-radius:12px}
      @media(max-width:760px){#lanaMusicPanel{right:7px;bottom:195px;width:calc(100vw - 14px);max-height:57vh;border-radius:22px}}
      @media(max-width:420px){#lanaMusicPanel{max-height:43vh;padding:12px}.lana-music-source{grid-template-columns:1fr}.lana-music-controls button{min-height:50px!important}.lana-music-url-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function panelMarkup(){
    return `
      <div class="lana-music-head">
        <div><strong>🎵 Lana Glazba</strong><small>osnovni player • v${RELEASE}</small></div>
        <button class="lana-music-close" id="lanaMusicClose" type="button" aria-label="Zatvori glazbu">✕</button>
      </div>
      <div class="lana-music-now">
        <div class="title" id="lanaMusicTitle">Nema odabrane pjesme</div>
        <div class="state" id="lanaMusicState">Dodaj glazbu s uređaja ili audio poveznicu.</div>
      </div>
      <div class="lana-music-progress">
        <span id="lanaMusicElapsed">0:00</span>
        <input id="lanaMusicSeek" type="range" min="0" max="1000" value="0" aria-label="Pozicija pjesme">
        <span id="lanaMusicDuration">0:00</span>
      </div>
      <div class="lana-music-controls">
        <button id="lanaMusicPrev" type="button" aria-label="Prethodna">⏮️</button>
        <button class="play" id="lanaMusicPlay" type="button" aria-label="Pokreni ili pauziraj">▶️</button>
        <button id="lanaMusicNext" type="button" aria-label="Sljedeća">⏭️</button>
      </div>
      <div class="lana-music-volume">
        <span>🔈</span><input id="lanaMusicVolume" type="range" min="0" max="100" value="72" aria-label="Glasnoća"><span id="lanaMusicVolumeText">72%</span>
      </div>
      <div class="lana-music-source">
        <label for="lanaMusicFiles">📂 Glazba s uređaja<input id="lanaMusicFiles" type="file" accept="audio/*" multiple></label>
        <button id="lanaMusicUrlToggle" type="button">🔗 Audio poveznica</button>
      </div>
      <div class="lana-music-urlbox" id="lanaMusicUrlBox" hidden>
        <input id="lanaMusicUrlName" type="text" placeholder="Naziv pjesme / radija">
        <input id="lanaMusicUrl" type="url" inputmode="url" placeholder="https://… audio ili stream URL">
        <div class="lana-music-url-actions"><button id="lanaMusicAddUrl" type="button">Dodaj u red</button><button id="lanaMusicCancelUrl" type="button">Odustani</button></div>
      </div>
      <div class="lana-music-queue-title"><span>RED ZA REPRODUKCIJU</span><button id="lanaMusicClear" type="button">Očisti</button></div>
      <div id="lanaMusicQueue"></div>
    `;
  }

  function createUi(){
    if($('lanaMusicPanel')) return;
    installStyle();

    const open = document.createElement('button');
    open.id = 'lanaMusicOpen';
    open.type = 'button';
    open.textContent = '🎵 Glazba';
    open.setAttribute('aria-label','Otvori glazbu');
    const menuGrid = document.querySelector('.lana-menu-grid');
    if(menuGrid) menuGrid.appendChild(open);
    else {
      open.style.cssText = 'position:fixed;z-index:60;right:12px;bottom:205px;width:auto;min-width:92px;padding:8px 12px;border-radius:16px;background:#e9f2ff;color:#173f75;border:1px solid #bfd3eb;font-weight:850;';
      document.body.appendChild(open);
    }

    const panel = document.createElement('section');
    panel.id = 'lanaMusicPanel';
    panel.hidden = true;
    panel.setAttribute('aria-label','Lana glazbeni player');
    panel.innerHTML = panelMarkup();
    document.body.appendChild(panel);

    const audio = document.createElement('audio');
    audio.id = 'lanaMusicAudio';
    audio.preload = 'metadata';
    document.body.appendChild(audio);
  }

  function renderQueue(){
    const q = $('lanaMusicQueue');
    if(!q) return;
    if(!tracks.length){
      q.innerHTML = '<div class="lana-music-empty">Red je prazan. Odaberi nekoliko pjesama s uređaja ili dodaj audio poveznicu.</div>';
      return;
    }
    q.innerHTML = '';
    tracks.forEach((track,i)=>{
      const row = document.createElement('div');
      row.className = 'lana-music-track' + (i===currentIndex ? ' current' : '');
      const num = document.createElement('span');
      num.className = 'num'; num.textContent = String(i+1);
      const name = document.createElement('div');
      name.className = 'name'; name.textContent = track.name || `Pjesma ${i+1}`;
      name.title = track.name || '';
      name.addEventListener('click',()=>setTrack(i,true));
      const remove = document.createElement('button');
      remove.type='button'; remove.textContent='✕'; remove.setAttribute('aria-label','Ukloni iz reda');
      remove.addEventListener('click',()=>removeTrack(i));
      row.append(num,name,remove);
      q.appendChild(row);
    });
  }

  function updateNow(){
    const audio = $('lanaMusicAudio');
    const track = tracks[currentIndex];
    if($('lanaMusicTitle')) $('lanaMusicTitle').textContent = track?.name || 'Nema odabrane pjesme';
    if($('lanaMusicState')) $('lanaMusicState').textContent = !track ? 'Dodaj glazbu s uređaja ili audio poveznicu.' : (audio?.paused ? 'Pauzirano' : 'Svira');
    if($('lanaMusicPlay')) $('lanaMusicPlay').textContent = audio && !audio.paused ? '⏸️' : '▶️';
    $('lanaMusicOpen')?.classList.toggle('lana-music-active', !!audio && !audio.paused);
    renderQueue();

    if('mediaSession' in navigator && track){
      try { navigator.mediaSession.metadata = new MediaMetadata({title:track.name || 'Lana Glazba',artist:'VAŠ CHARLIE • Lana'}); } catch {}
    }
  }

  function updateProgress(){
    const audio = $('lanaMusicAudio');
    if(!audio) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    if($('lanaMusicElapsed')) $('lanaMusicElapsed').textContent = formatTime(current);
    if($('lanaMusicDuration')) $('lanaMusicDuration').textContent = formatTime(duration);
    if($('lanaMusicSeek')) $('lanaMusicSeek').value = duration > 0 ? String(Math.round(current/duration*1000)) : '0';
  }

  async function setTrack(index,autoplay=false){
    if(!tracks.length) return;
    const audio = $('lanaMusicAudio');
    index = (index + tracks.length) % tracks.length;
    currentIndex = index;
    const track = tracks[currentIndex];
    if(audio.src !== track.url) audio.src = track.url;
    updateNow();
    updateProgress();
    if(autoplay){
      try { await audio.play(); }
      catch { if($('lanaMusicState')) $('lanaMusicState').textContent = 'Dodirni ▶️ za pokretanje reprodukcije.'; }
    }
  }

  async function togglePlay(){
    const audio = $('lanaMusicAudio');
    if(!tracks.length){
      if($('lanaMusicState')) $('lanaMusicState').textContent='Prvo dodaj glazbu.';
      return;
    }
    if(currentIndex < 0) await setTrack(0,false);
    if(audio.paused){
      try { await audio.play(); }
      catch { if($('lanaMusicState')) $('lanaMusicState').textContent='Preglednik nije dopustio reprodukciju. Pokušaj ponovno dodirom na ▶️.'; }
    } else audio.pause();
  }

  function next(){ if(tracks.length) setTrack(currentIndex < 0 ? 0 : currentIndex+1,true); }
  function prev(){
    const audio = $('lanaMusicAudio');
    if(!tracks.length) return;
    if(audio.currentTime > 4){ audio.currentTime=0; return; }
    setTrack(currentIndex <= 0 ? tracks.length-1 : currentIndex-1,true);
  }

  function removeTrack(index){
    if(index < 0 || index >= tracks.length) return;
    const audio = $('lanaMusicAudio');
    const removed = tracks[index];
    if(removed.local && removed.url){ try { URL.revokeObjectURL(removed.url); } catch {} }
    tracks.splice(index,1);
    if(!tracks.length){
      audio.pause(); audio.removeAttribute('src'); audio.load(); currentIndex=-1;
    } else if(index === currentIndex){
      currentIndex = Math.min(index,tracks.length-1);
      setTrack(currentIndex,false);
    } else if(index < currentIndex) currentIndex--;
    saveState(); updateNow(); updateProgress();
  }

  function clearQueue(){
    const audio = $('lanaMusicAudio');
    audio.pause();
    objectUrls.forEach(url=>{ try{ URL.revokeObjectURL(url); }catch{} });
    objectUrls=[]; tracks=[]; currentIndex=-1;
    audio.removeAttribute('src'); audio.load();
    saveState(); updateNow(); updateProgress();
  }

  function addFiles(files){
    const list = [...files];
    if(!list.length) return;
    for(const file of list){
      const url = URL.createObjectURL(file);
      objectUrls.push(url);
      tracks.push({name:file.name.replace(/\.[^.]+$/,''),url,local:true});
    }
    if(currentIndex < 0) setTrack(0,false);
    saveState(); renderQueue();
  }

  function addRemote(){
    const url = $('lanaMusicUrl')?.value.trim();
    if(!url) return;
    const name = $('lanaMusicUrlName')?.value.trim() || (()=>{ try{return new URL(url).hostname}catch{return 'Audio poveznica'} })();
    tracks.push({name,url,local:false});
    $('lanaMusicUrl').value=''; $('lanaMusicUrlName').value=''; $('lanaMusicUrlBox').hidden=true;
    if(currentIndex < 0) setTrack(0,false);
    saveState(); renderQueue();
  }

  function wire(){
    const audio = $('lanaMusicAudio');
    const state = loadState();
    tracks = state.remoteTracks.map(t=>({name:t.name || 'Audio poveznica',url:t.url,local:false}));
    audio.volume = state.volume;
    $('lanaMusicVolume').value = String(Math.round(state.volume*100));
    $('lanaMusicVolumeText').textContent = `${Math.round(state.volume*100)}%`;
    if(tracks.length) setTrack(0,false); else updateNow();

    $('lanaMusicOpen').addEventListener('click',()=>{ $('lanaMusicPanel').hidden=false; document.getElementById('shellMenu')?.setAttribute('hidden',''); });
    $('lanaMusicClose').addEventListener('click',()=>{ $('lanaMusicPanel').hidden=true; });
    $('lanaMusicPlay').addEventListener('click',togglePlay);
    $('lanaMusicNext').addEventListener('click',next);
    $('lanaMusicPrev').addEventListener('click',prev);
    $('lanaMusicFiles').addEventListener('change',e=>{ addFiles(e.target.files); e.target.value=''; });
    $('lanaMusicUrlToggle').addEventListener('click',()=>{ $('lanaMusicUrlBox').hidden=false; $('lanaMusicUrlName').focus(); });
    $('lanaMusicCancelUrl').addEventListener('click',()=>{ $('lanaMusicUrlBox').hidden=true; });
    $('lanaMusicAddUrl').addEventListener('click',addRemote);
    $('lanaMusicClear').addEventListener('click',clearQueue);
    $('lanaMusicVolume').addEventListener('input',e=>{ audio.volume=clamp(Number(e.target.value)/100,0,1); $('lanaMusicVolumeText').textContent=`${Math.round(audio.volume*100)}%`; saveState(); });
    $('lanaMusicSeek').addEventListener('input',e=>{ if(Number.isFinite(audio.duration) && audio.duration>0) audio.currentTime=Number(e.target.value)/1000*audio.duration; });

    audio.addEventListener('play',updateNow);
    audio.addEventListener('pause',updateNow);
    audio.addEventListener('timeupdate',updateProgress);
    audio.addEventListener('loadedmetadata',updateProgress);
    audio.addEventListener('durationchange',updateProgress);
    audio.addEventListener('ended',next);
    audio.addEventListener('error',()=>{ if($('lanaMusicState')) $('lanaMusicState').textContent='Ovaj audio izvor se ne može reproducirati. Probaj drugi izvor.'; });

    if('mediaSession' in navigator){
      try { navigator.mediaSession.setActionHandler('play',()=>audio.play()); } catch {}
      try { navigator.mediaSession.setActionHandler('pause',()=>audio.pause()); } catch {}
      try { navigator.mediaSession.setActionHandler('previoustrack',prev); } catch {}
      try { navigator.mediaSession.setActionHandler('nexttrack',next); } catch {}
      try { navigator.mediaSession.setActionHandler('seekto',details=>{ if(details.seekTime!=null) audio.currentTime=clamp(details.seekTime,0,Number.isFinite(audio.duration)?audio.duration:details.seekTime); }); } catch {}
    }
  }

  function install(){
    if(window.__lanaMusic0915Installed) return;
    window.__lanaMusic0915Installed = true;
    createUi();
    wire();
    window.__lanaMusic0915 = {release:RELEASE,open:()=>{ $('lanaMusicPanel').hidden=false; },close:()=>{ $('lanaMusicPanel').hidden=true; },play:()=>$('lanaMusicAudio')?.play(),pause:()=>$('lanaMusicAudio')?.pause(),next,prev,toggle:togglePlay};
  }

  window.addEventListener('beforeunload',()=>objectUrls.forEach(url=>{ try{URL.revokeObjectURL(url)}catch{} }));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
