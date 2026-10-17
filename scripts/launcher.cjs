'use strict';
const {spawn} = require('node:child_process');
const {existsSync} = require('node:fs');
const {join, resolve} = require('node:path');
const {homedir} = require('node:os');
const {createHash} = require('node:crypto');
const {createServer} = require('node:net');
const version = require('../package.json').version;
const jar = join(__dirname, '..', 'devflow.jar');

async function health(url) {
  try {
    const response = await fetch(url + '/api/health', {signal: AbortSignal.timeout(1200)});
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
function openBrowser(url) {
  const platform = process.platform;
  const command = platform === 'win32' ? 'rundll32.exe' : platform === 'darwin' ? 'open' : 'xdg-open';
  const args = platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  const child = spawn(command, args, {stdio: 'ignore', detached: true});
  let reported = false;
  const fallback = () => {if (!reported) {reported = true; console.log('Open ' + url + ' in your browser.');}};
  child.on('error', fallback);
  child.on('exit', code => {if (code) fallback();});
  child.unref();
}
function available(port) {
  return new Promise(resolve => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}
async function launch(args = []) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('DevFlow: node start.cjs [--port=8765] [--no-browser]\nJava 8+ and Node 22+ on PATH. No install or build. Ctrl+C stops the app.');
    return;
  }
  const invalid = args.find(x => x !== '--no-browser' && !/^--port=\d+$/.test(x));
  if (invalid) throw Error('Unknown option: ' + invalid + '. Use --help.');
  const explicit = args.find(x => x.startsWith('--port='))?.slice(7) ?? process.env.DEVFLOW_PORT;
  const preferred = Number(explicit ?? 8765);
  if (!Number.isInteger(preferred) || preferred < 1 || preferred > 65535) throw Error('Port must be between 1 and 65535.');
  if (!existsSync(jar)) throw Error('devflow.jar is missing. Download and unzip the complete DevFlow folder.');
  const dataDir = resolve(process.env.DEVFLOW_HOME || join(homedir(), '.devflow'));
  const dataId = createHash('sha256').update(dataDir).digest('hex');
  const same = info => info?.app === 'DevFlow' && info.version === version && info.dataId === dataId;
  let port;
  for (let candidate = preferred; candidate <= Math.min(65535, preferred + (explicit ? 0 : 19)); candidate++) {
    const url = 'http://127.0.0.1:' + candidate;
    const info = await health(url);
    if (same(info)) {
      console.log('DevFlow is already running: ' + url);
      if (!args.includes('--no-browser')) openBrowser(url);
      return;
    }
    if (info?.app === 'DevFlow' && info.version !== version) {
      throw Error('An older or different DevFlow version is running at ' + url + '. Close it with Ctrl+C (or close its IDE), then run this command again.');
    }
    if (await available(candidate)) {port = candidate; break;}
  }
  if (!port) throw Error('The selected port is busy. Run node start.cjs --port=8877.');
  const url = 'http://127.0.0.1:' + port;
  console.log('Starting DevFlow…');
  const child = spawn('java', ['-Xmx128m', '-jar', jar, '--port=' + port, '--no-browser'], {
    stdio: ['ignore', 'pipe', 'pipe'], env: {...process.env, DEVFLOW_HOME: dataDir}
  });
  let output = '', exited = false, stopping = false;
  const stop = () => {stopping = true; child.kill('SIGTERM');};
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  const done = new Promise((resolve, reject) => {
    child.once('error', () => {exited = true; reject(Error('Java 8+ must be on PATH. Check java -version, then run this command again.'));});
    child.once('exit', code => {exited = true; resolve(code);});
  });
  // Attach a rejection handler immediately while readiness is being checked.
  done.catch(() => {});
  child.stdout.on('data', data => {output = (output + data).slice(-8192);});
  child.stderr.on('data', data => {output = (output + data).slice(-8192);});
  let ready = false;
  try {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (same(await health(url))) {ready = true; break;}
      if (exited) break;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    if (!ready) {
      if (!exited) stop();
      await done;
      throw Error('Could not start the app. ' + (output.trim() || 'Check that Java 8+ is on PATH.'));
    }
    console.log('DevFlow is ready: ' + url + '\nKeep this terminal open. Press Ctrl+C to stop.');
    if (!args.includes('--no-browser')) openBrowser(url);
    const code = await done;
    // A simultaneous second launch may attach to the first process instead.
    if (code && !stopping && !(await health(url))) throw Error('Java stopped unexpectedly. ' + output.trim());
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}
module.exports = {launch, openBrowser};
