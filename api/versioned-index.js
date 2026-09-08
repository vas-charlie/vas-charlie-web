export default async function handler(req, res) {
  try {
    const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const upstream = await fetch(`${origin}/index.html?versioned=0919`, { cache: 'no-store' });
    if (!upstream.ok) {
      return res.status(upstream.status).send('Unable to load application shell.');
    }

    let html = await upstream.text();
    html = html.replace(/const\s+APP_VERSION\s*=\s*['"][^'"]*['"]\s*;/g, "const APP_VERSION='0.9.19';");
    html = html.replace(/\bLANA\s+v0\.9\.0\b/g, 'LANA v0.9.19');
    html = html.replace(/LANA SHELL v0\.9\.0/g, 'LANA SHELL v0.9.19');
    html = html.replace(/Lana v0\.9\.0/g, 'Lana v0.9.19');
    html = html.replace(/v0\.9\.0/g, 'v0.9.19');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Lana-Version', '0.9.19');
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).send('Unable to load application shell.');
  }
}
