import { experimental_generateSpeech as generateSpeech } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, voice = 'shimmer' } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Nedostaje tekst.' });
    }

    const safeText = text.trim().slice(0, 1200);
    const allowedVoices = new Set(['alloy','echo','fable','onyx','nova','shimmer']);
    const selectedVoice = allowedVoices.has(voice) ? voice : 'shimmer';

    const result = await generateSpeech({
      model: gateway.speechModel('openai/tts-1-hd'),
      text: safeText,
      voice: selectedVoice,
      outputFormat: 'mp3'
    });

    const bytes = result.audio?.uint8Array;
    if (!bytes?.length) return res.status(502).json({ error: 'TTS nije vratio zvuk.' });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).send(Buffer.from(bytes));
  } catch (err) {
    console.error('Lana speech error', err);
    return res.status(500).json({ error: 'Greška pri stvaranju Lanina glasa.' });
  }
}
