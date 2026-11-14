import http from 'node:http';
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 8787);
let cachedToken;
let tokenExpires = 0;
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');

async function accessToken() {
  if (cachedToken && Date.now() < tokenExpires - 60000) return cachedToken;
  const { APPLE_MAPS_TEAM_ID: team, APPLE_MAPS_KEY_ID: keyId, APPLE_MAPS_PRIVATE_KEY_PATH: keyPath } = process.env;
  if (!team || !keyId || !keyPath) throw new Error('Apple Maps credentials are missing');
  const privateKey = await readFile(keyPath, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({ alg: 'ES256', kid: keyId, typ: 'JWT' }) + '.' + encode({ iss: team, iat: now, exp: now + 3600, scope: 'server_api' });
  const signer = createSign('SHA256');
  signer.update(unsigned);
  const signed = unsigned + '.' + signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  const response = await fetch('https://maps-api.apple.com/v1/token', { headers: { Authorization: 'Bearer ' + signed }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Apple token request failed: ' + response.status);
  const data = await response.json();
  if (!data.accessToken || !Number.isFinite(data.expiresInSeconds)) throw new Error('Invalid Apple token response');
  cachedToken = data.accessToken;
  tokenExpires = Date.now() + data.expiresInSeconds * 1000;
  return cachedToken;
}

http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method !== 'GET' || url.pathname !== '/api/places') {
    res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  const query = (url.searchParams.get('q') || '').trim();
  if (query.length < 2 || query.length > 120) {
    res.writeHead(400).end(JSON.stringify({ error: 'Enter 2 to 120 characters' }));
    return;
  }
  try {
    const token = await accessToken();
    const params = new URLSearchParams({ q: query, limitToCountries: 'VN', searchLocation: '16.061,108.218', lang: url.searchParams.get('lang') === 'en' ? 'en-US' : 'vi-VN' });
    const response = await fetch('https://maps-api.apple.com/v1/search?' + params, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Apple search failed: ' + response.status);
    const data = await response.json();
    const places = (data.results || []).slice(0, 5).map(place => ({ name: place.name || '', address: (place.formattedAddressLines || []).join(', '), coordinate: place.coordinate }));
    res.writeHead(200).end(JSON.stringify({ places }));
  } catch (error) {
    console.error('Place search failed:', error.message);
    res.writeHead(503).end(JSON.stringify({ error: 'Place search unavailable' }));
  }
}).listen(port, process.env.MAPS_SERVER_HOST || '127.0.0.1', () => console.log('Maps server listening on port ' + port));
