(() => {
  const synth = window.speechSynthesis;
  if (!synth || synth.__charliePronunciationPatched) return;

  const originalSpeak = synth.speak.bind(synth);

  function normalizeBrandForSpeech(text, lang = '') {
    const raw = String(text ?? '');
    const isCroatian = /^hr(?:-|$)/i.test(String(lang || ''));

    if (isCroatian) {
      return raw
        .replace(/VAŠ\s+CHARLIE/giu, 'Vaš Čarli')
        .replace(/CHARLIE/giu, 'Čarli');
    }

    return raw
      .replace(/VAŠ\s+CHARLIE/giu, 'Vash Charlie')
      .replace(/Čarli/gu, 'Charlie')
      .replace(/CHARLIE/giu, 'Charlie');
  }

  synth.speak = function(utterance) {
    try {
      if (utterance && typeof utterance.text === 'string') {
        utterance.text = normalizeBrandForSpeech(utterance.text, utterance.lang);
      }
    } catch {}
    return originalSpeak(utterance);
  };

  synth.__charliePronunciationPatched = true;
})();
