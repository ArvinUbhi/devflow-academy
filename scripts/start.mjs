import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn('java', ['-jar', join(root, 'devflow.jar'), ...process.argv.slice(2)], {stdio:'inherit'});
child.on('error', e => { console.error('Java 8+ must be installed and on PATH:', e.message); process.exitCode=1; });
child.on('exit', code => process.exitCode = code ?? 1);
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
