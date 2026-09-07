(() => {
  const synth = window.speechSynthesis;
  if (!synth || synth.__charliePronunciationPatched) return;

  const originalSpeak = synth.speak.bind(synth);

  function normalizeBrandForSpeech(text) {
    return String(text ?? '')
      .replace(/VAŠ\s+CHARLIE/giu, 'Vaš Čarli')
      .replace(/CHARLIE/giu, 'Čarli');
  }

  synth.speak = function(utterance) {
    try {
      if (utterance && typeof utterance.text === 'string') {
        utterance.text = normalizeBrandForSpeech(utterance.text);
      }
    } catch {}
    return originalSpeak(utterance);
  };

  synth.__charliePronunciationPatched = true;
})();
