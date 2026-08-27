const MODEL = 'openai/gpt-5.6-sol';

function textFromResponse(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim())
    return data.output_text.trim();

  const parts = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string')
        parts.push(content.text);
      else if (typeof content?.text === 'string')
        parts.push(content.text);
    }
  }

  return parts.join('\n').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history = [], language = 'hr' } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Nedostaje poruka.' });
    }

    const token =
      process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN;

    if (!token) {
      return res.status(503).json({
        error: 'AI autentikacija nije dostupna.'
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter(
            x =>
              x &&
              ['user', 'assistant'].includes(x.role) &&
              typeof x.content === 'string'
          )
      : [];

    const languageName =
      ({
        hr: 'hrvatskom',
        en: 'engleskom',
        de: 'njemačkom',
        it: 'talijanskom',
        fr: 'francuskom',
        es: 'španjolskom'
      })[language] || 'hrvatskom';

    const instructions =
      `Ti si Lana, glasovna AI asistentica u aplikaciji VAŠ CHARLIE. ` +
      `Odgovaraj prirodno, jasno i kratko, primarno na ${languageName} jeziku. ` +
      `Možeš voditi opći, privatni i poslovni razgovor. ` +
      `Ne tvrdi da si izvršila radnju u aplikaciji ako je stvarno nisi izvršila. ` +
      `Ako korisnik samo razgovara ili pita opće pitanje, normalno odgovori. ` +
      `Nemoj zahtijevati da korisnik ponavlja tvoje ime u svakoj poruci.`;

    const gateway = await fetch(
      'https://ai-gateway.vercel.sh/v1/responses',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          model: MODEL,
          instructions,
          input: [
            ...safeHistory,
            {
              role: 'user',
              content: message.trim().slice(0, 3000)
            }
          ],
          max_output_tokens: 300
        })
      }
    );

    const data = await gateway.json().catch(() => ({}));

    if (!gateway.ok) {
      console.error('AI Gateway error', gateway.status, data);

      return res.status(502).json({
        error: 'AI servis trenutno nije dostupan.'
      });
    }

    const reply = textFromResponse(data);

    if (!reply) {
      return res.status(502).json({
        error: 'AI nije vratio tekstualni odgovor.'
      });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Greška AI razgovora.'
    });
  }
}
