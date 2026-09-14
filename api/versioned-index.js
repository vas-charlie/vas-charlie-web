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

    const seoNav = `\n<nav aria-label="Taxi Osijek" style="max-width:760px;margin:28px auto 0;padding:12px 16px;text-align:center;font:600 14px system-ui,sans-serif"><a href="/taxi-osijek/" style="margin:0 10px">Taxi Osijek</a><a href="/taksi-osijek/" style="margin:0 10px">Taksi Osijek</a></nav>\n`;
    html = html.replace(/<\/body>/i, `${seoNav}</body>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Lana-Version', '0.9.19');
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).send('Unable to load application shell.');
  }
}
