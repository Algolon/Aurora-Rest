import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {pop, runTests} from './test-partition.mjs';

export function audit(out) {
  mkdirSync(out, {recursive:true});
  const available = spawnSync('git', ['cat-file', '-e', pop + '^{commit}'], {encoding:'utf8'});
  const result = runTests(true); // Always execute the original assertion, even when blocked.
  writeFileSync(out + '/historical-test.txt', (result.stdout ?? '') + (result.stderr ?? ''));
  const missing = available.status !== 0 && /Not a valid object name/.test(available.stderr ?? '');
  const blocked = missing && result.status === 1 && /fatal: not a tree object/.test(result.stdout + result.stderr);
  const status = result.status === 0 && !missing ? 'PASS' : blocked ? 'BLOCKED' : 'FAIL';
  const report = {status, commit:pop, assertion:'tests/env-p01.test.ts (executed verbatim)', exitCode:result.status,
    reason:blocked ? 'Original POP Git commit/tree is unavailable; recovered-byte equivalence does not prove historical ancestry.' : status === 'PASS' ? 'Original Git-object comparison passed.' : 'Unexpected audit failure; inspect historical-test.txt.'};
  writeFileSync(out + '/historical-audit.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`Historical POP Git-object audit: ${status}. ${report.reason}`);
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = audit(process.env.RECOVERY_CI_OUTPUT ?? '/tmp/aurora-rest-recovery-ci');
  process.exitCode = result.status === 'PASS' ? 0 : result.status === 'BLOCKED' ? 2 : 1;
}
