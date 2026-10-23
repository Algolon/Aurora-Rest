// Keep recovered tests byte-identical. Partition only the exact historical test.
import {readFileSync, writeFileSync, readdirSync, mkdtempSync, mkdirSync, symlinkSync, copyFileSync, rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';

export const pop = '4d562187c10e64884e2193a0b09ced6eed3b4b08';
const source = readFileSync('tests/env-p01.test.ts', 'utf8');
const manifest = JSON.parse(readFileSync('docs/recovery/SOURCE_MANIFEST.json'));
assert.equal(createHash('sha256').update(source).digest('hex'),
  manifest.files.find(f => f.path === 'tests/env-p01.test.ts').sha256);
const start = source.indexOf("test('ENV preserves all POP source, nature assets and canonical geography byte for byte',");
const end = source.indexOf('\n});', start) + '\n});'.length;
assert.ok(start > 0 && end > start, 'Historical assertion boundary must exist');
export const assertion = source.slice(start, end);
assert.equal((assertion.match(/test\(/g) ?? []).length, 1);
const preamble = source.split('\n')[0] + '\n' + source.split('\n').find(l => l.startsWith('const pop=')) + '\n';

export function runTests(historical = false) {
  // Reconstruct a temporary view of original paths: the protected old workflow
  // is now retained outside Actions' active directory. All other inputs are live.
  const fixture = mkdtempSync(join(tmpdir(), 'aurora-recovered-tests-'));
  const file = 'tests/recovery-env.ts';
  try {
    for (const entry of readdirSync('.')) {
      if (entry !== 'tests' && entry !== '.github') symlinkSync(resolve(entry), join(fixture, entry));
    }
    mkdirSync(join(fixture, 'tests'));
    for (const entry of readdirSync('tests')) {
      if (entry.endsWith('.test.ts') && entry !== 'env-p01.test.ts') copyFileSync('tests/' + entry, join(fixture, 'tests', entry));
    }
    mkdirSync(join(fixture, '.github/workflows'), {recursive:true});
    copyFileSync('docs/recovery/original/checks.yml', join(fixture, '.github/workflows/checks.yml'));
    copyFileSync('.github/copilot-instructions.md', join(fixture, '.github/copilot-instructions.md'));
    // The original assertion is executed verbatim, with its original Node imports.
    writeFileSync(join(fixture, file), historical ? preamble + assertion + '\n' : source.slice(0, start) + source.slice(end));
    const files = historical ? [file] : readdirSync(join(fixture, 'tests')).filter(f => f.endsWith('.test.ts')).sort().map(f => 'tests/' + f).concat(file);
    const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', '--test-reporter=tap', ...files], {cwd:fixture, encoding:'utf8', maxBuffer:30e6});
    const count = name => Number(result.stdout?.match(new RegExp('^# ' + name + ' (\\d+)$', 'm'))?.[1] ?? NaN);
    assert.ok(historical ? count('tests') === 1 : count('tests') >= 73, 'Expected original test coverage is mandatory');
    for (const name of ['skipped', 'cancelled', 'todo']) assert.equal(count(name), 0, 'No original check may be silently omitted');
    return result;
  } finally { rmSync(fixture, {recursive:true, force:true}); }
}
