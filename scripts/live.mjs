// Starts every live backend the phone uses, in one terminal:
//   vision + shared reports  server/vision.mjs    port VISION_PORT   (default 8789)
//   NCHMF bulletins          server/bulletin.mjs  port BULLETIN_PORT (default 8788)
// Both listen on the LAN so a phone on the same Wi-Fi can reach them.
// Prints the .env lines the app needs. Ctrl+C stops both.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

const lan =
  Object.values(networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address ?? '127.0.0.1';
const visionPort = process.env.VISION_PORT || '8789';
const bulletinPort = process.env.BULLETIN_PORT || '8788';
const envFile = existsSync('.env') ? ['--env-file=.env'] : [];

const servers = [
  { name: 'vision  ', script: 'server/vision.mjs', env: { VISION_SERVER_HOST: '0.0.0.0', VISION_PORT: visionPort } },
  { name: 'bulletin', script: 'server/bulletin.mjs', env: { BULLETIN_SERVER_HOST: '0.0.0.0', BULLETIN_PORT: bulletinPort } },
];

const children = servers.map(({ name, script, env }) => {
  const child = spawn(process.execPath, [...envFile, script], { env: { ...process.env, ...env } });
  const tag = (stream, out) =>
    stream.on('data', (d) => String(d).split('\n').filter(Boolean).forEach((l) => out.write(`[${name}] ${l}\n`)));
  tag(child.stdout, process.stdout);
  tag(child.stderr, process.stderr);
  child.on('exit', (code) => {
    if (code) console.error(`[${name}] stopped (exit ${code}). Is another server already using its port? Stop it and rerun.`);
  });
  return child;
});

console.log(`
Phone and laptop on the same Wi-Fi. In .env (then restart Expo):
  EXPO_PUBLIC_VISION_SERVER_URL=http://${lan}:${visionPort}
  EXPO_PUBLIC_BULLETIN_SERVER_URL=http://${lan}:${bulletinPort}
Real AI depth check: set GEMINI_API_KEY in .env (empty = labeled mock).
`);

const stop = () => { children.forEach((c) => c.kill()); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
