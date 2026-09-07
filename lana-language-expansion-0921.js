(() => {
  // DEV-ONLY language packs. Intentionally not injected by sw.js yet.
  // Current production language selector remains unchanged until each language is tested.
  const PACKS = {
    pl: {
      code: 'pl', speech: 'pl-PL', label: '🇵🇱 PL', name: 'Polski',
      greetings: {morning:'Dzień dobry!', day:'Miłego dnia!', evening:'Dobrego wieczoru!'},
      standard: {welcome:'Witamy w VAŠ CHARLIE.', ready:'Dokąd jedziemy?'},
      warm: {welcome:'Miło mi Państwa gościć.', ready:'Dokąd mogę Państwa zawieźć?'},
      short: {welcome:'Witamy!', ready:'Dokąd jedziemy?'},
      returning: {welcome:'Miło znów Państwa widzieć.', ready:'Dokąd jedziemy?'},
      exit: {thanks:'Dziękuję i życzę miłego dnia!', goodbye:'Do widzenia!'}
    },
    ru: {
      code: 'ru', speech: 'ru-RU', label: '🇷🇺 RU', name: 'Русский',
      greetings: {morning:'Доброе утро!', day:'Хорошего дня!', evening:'Добрый вечер!'},
      standard: {welcome:'Добро пожаловать в VAŠ CHARLIE.', ready:'Куда едем?'},
      warm: {welcome:'Рад вас приветствовать.', ready:'Куда вас отвезти?'},
      short: {welcome:'Добро пожаловать!', ready:'Куда едем?'},
      returning: {welcome:'Рад снова вас видеть.', ready:'Куда едем?'},
      exit: {thanks:'Спасибо и хорошего дня!', goodbye:'До свидания!'}
    },
    hu: {
      code: 'hu', speech: 'hu-HU', label: '🇭🇺 HU', name: 'Magyar',
      greetings: {morning:'Jó reggelt!', day:'Szép napot!', evening:'Jó estét!'},
      standard: {welcome:'Üdvözlöm a VAŠ CHARLIE-ban.', ready:'Hová menjünk?'},
      warm: {welcome:'Örülök, hogy Önöket fuvarozhatom.', ready:'Hová vihetem Önöket?'},
      short: {welcome:'Üdvözlöm!', ready:'Hová menjünk?'},
      returning: {welcome:'Örülök, hogy újra látom.', ready:'Hová menjünk?'},
      exit: {thanks:'Köszönöm, és szép napot kívánok!', goodbye:'Viszontlátásra!'}
    },
    sl: {
      code: 'sl', speech: 'sl-SI', label: '🇸🇮 SL', name: 'Slovenščina',
      greetings: {morning:'Dobro jutro!', day:'Lep dan želim!', evening:'Dober večer!'},
      standard: {welcome:'Dobrodošli v VAŠ CHARLIE.', ready:'Kam se peljemo?'},
      warm: {welcome:'Veseli me, da vas lahko peljem.', ready:'Kam vas lahko peljem?'},
      short: {welcome:'Dobrodošli!', ready:'Kam se peljemo?'},
      returning: {welcome:'Veseli me, da vas spet vidim.', ready:'Kam se peljemo?'},
      exit: {thanks:'Hvala in lep dan vam želim!', goodbye:'Nasvidenje!'}
    },
    ja: {
      code: 'ja', speech: 'ja-JP', label: '🇯🇵 日本語', name: '日本語',
      greetings: {morning:'おはようございます！', day:'良い一日を！', evening:'こんばんは！'},
      standard: {welcome:'VAŠ CHARLIEへようこそ。', ready:'どちらまで行きますか？'},
      warm: {welcome:'ご乗車ありがとうございます。', ready:'どちらまでお送りしましょうか？'},
      short: {welcome:'ようこそ！', ready:'どちらまで行きますか？'},
      returning: {welcome:'またお会いできてうれしいです。', ready:'どちらまで行きますか？'},
      exit: {thanks:'ありがとうございました。良い一日を！', goodbye:'またお会いしましょう！'}
    }
  };

  window.LanaLanguageExpansion = Object.freeze({
    version: '0921',
    languages: Object.freeze(PACKS),
    codes: Object.freeze(Object.keys(PACKS)),
    get(code) { return PACKS[code] || null; }
  });
})();
