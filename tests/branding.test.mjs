import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('DevFlow credits its creator in the accessible site footer', async () => {
  const html = await readFile(new URL('../src/main/resources/web/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/main/resources/web/styles.css', import.meta.url), 'utf8');
  const footer = html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1];
  assert.ok(footer, 'site footer exists');
  assert.match(footer, /Created by/);
  assert.match(footer, /Arvin Ubhi/);
  assert.match(footer, /href="https:\/\/github.com\/ArvinUbhi"/);
  assert.match(footer, /class="footer-credit"/);
  assert.match(css, /\.site-footer \.footer-credit\{/);
});
