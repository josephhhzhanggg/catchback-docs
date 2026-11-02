// Fails if partner-api/openapi.yaml mentions anything we keep out of the public reference,
// or if the docs site could send a live request from the API Reference tab.
//
//   node scripts/check-openapi.mjs [spec] [docs.json]
//
// The terms are hashed so that this public file doesn't spell out things we don't document.
// That stops someone reading them off, not someone confirming a good guess. The plain list is
// on CAT-923. A term is lowercase with its separators removed, and is matched against each word
// of the spec and each pair of adjacent words, across line breaks. It doesn't match inside a
// longer word, so add a new form of a term to the list.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const KEEP_OUT = new Set([
  '1ca8f24d66e99708', '2e6505c2f1cf0b7e', 'ca7fcb0e8f745e92',
  '49213055a243ac0a', '95d2def44fdc9f8f', '0aed7e3e032ea3f7',
  '4f6cb298555b90a7', '3d42b3ef2a38a10d', 'f02b95ed0b00ce45',
  '4e598cc1b984aa97', '66e6d5903c1e1854', '45c5dcd92541f65f',
  'ce2a9aad0c222ea8', '545875ce51049705', '9b2abfc29cc47494',
  '5c8ad06ea12c3b69', 'fe26032846536f01', 'ef7797e13d3a7552',
  'b8cb100b12807bd8', '160317613119435c', '2d6f8dacee836926',
  '6ef348bad176415e', 'aa5faecf9acc9ea8', '47eeb2eac350e192',
  '615666dae9d3625a', '603871c2ddd41c26', 'a34645ceb35b11e4',
  '4f69d3d8b502a5b8', '5d0105590ae2c809', '9fb50a3aaed3cae4',
]);
const NO_LIVE_CALLS = new Set(['simple', 'none']);

const specPath = process.argv[2] ?? new URL('../partner-api/openapi.yaml', import.meta.url);
const configPath = process.argv[3] ?? new URL('../docs.json', import.meta.url);
const hash = (term) => createHash('sha256').update(term).digest('hex').slice(0, 16);
const failures = [];

const words = [];
readFileSync(specPath, 'utf8').split('\n').forEach((line, i) => {
  for (const word of line.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) words.push({ word, line: i + 1 });
  // Page and tool overrides: x-mint can turn a page's playground on, x-mcp a docs-site tool.
  if (/\bx-(mint|mcp)\b|\bplayground\b/i.test(line)) failures.push(`spec line ${i + 1}: live-call override`);
});
words.forEach(({ word, line }, w) => {
  for (const term of [word, word + (words[w + 1]?.word ?? '')]) {
    if (KEEP_OUT.has(hash(term))) failures.push(`spec line ${line}: keep-out term "${term}"`);
  }
});

const display = JSON.parse(readFileSync(configPath, 'utf8')).api?.playground?.display;
if (!NO_LIVE_CALLS.has(display)) failures.push(`docs.json: api.playground.display is ${display ?? 'unset, which means interactive'}`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('openapi spec: no keep-out terms, no live calls');
