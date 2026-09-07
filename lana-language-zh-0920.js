(() => {
  // Lana v0.9.20 preparation only.
  // This file is intentionally NOT injected by sw.js yet.
  // Spoken language: Standard Mandarin. Text: simplified + traditional Chinese.

  const PACK = {
    code: 'zh',
    speech: 'zh-CN',
    label: '🇨🇳 中文',
    name: '中文 / Chinese',
    speechName: '普通话 / Standard Mandarin',
    scripts: {
      simplified: '简体中文',
      traditional: '繁體中文'
    },
    greetings: {
      morning: { simplified: '早上好', traditional: '早上好' },
      day: { simplified: '您好', traditional: '您好' },
      evening: { simplified: '晚上好', traditional: '晚上好' }
    },
    messages: {
      standard: {
        simplified: '{greeting}，欢迎您。感谢您选择 VAŠ CHARLIE。祝您旅途愉快。',
        traditional: '{greeting}，歡迎您。感謝您選擇 VAŠ CHARLIE。祝您旅途愉快。'
      },
      warm: {
        simplified: '{greeting}。请坐得舒服一些。如果旅途中需要任何帮助，请随时告诉我。祝您旅途愉快。',
        traditional: '{greeting}。請坐得舒服一些。如果旅途中需要任何幫助，請隨時告訴我。祝您旅途愉快。'
      },
      short: {
        simplified: '{greeting}，欢迎您。祝您旅途愉快。',
        traditional: '{greeting}，歡迎您。祝您旅途愉快。'
      },
      returning: {
        simplified: '{greeting}，欢迎再次乘坐 VAŠ CHARLIE。很高兴再次见到您。祝您旅途愉快。',
        traditional: '{greeting}，歡迎再次乘坐 VAŠ CHARLIE。很高興再次見到您。祝您旅途愉快。'
      },
      exit: {
        simplified: '感谢您的乘坐和信任。如果您愿意，欢迎在行程结束后留下真实的评价。祝您接下来一切顺利。',
        traditional: '感謝您的乘坐和信任。如果您願意，歡迎在行程結束後留下真實的評價。祝您接下來一切順利。'
      },
      top: {
        simplified: '',
        traditional: ''
      }
    },
    ui: {
      chooseLanguageSimplified: '语言',
      chooseLanguageTraditional: '語言',
      simplified: '简体',
      traditional: '繁體'
    }
  };

  window.LanaLanguageZh = Object.freeze(PACK);
})();
