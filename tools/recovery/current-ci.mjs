import {mkdirSync, writeFileSync, appendFileSync} from 'node:fs';
import {spawnSync, execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {runTests} from './test-partition.mjs';
import {audit} from './historical-audit.mjs';
const out = resolve(process.env.RECOVERY_CI_OUTPUT ?? '/tmp/aurora-rest-recovery-ci');
mkdirSync(out, {recursive:true});
const checks = [];
function record(name, result) {
  writeFileSync(`${out}/${name}.txt`, (result.stdout ?? '') + (result.stderr ?? ''));
  checks.push({name, status:result.status === 0 ? 'PASS' : 'FAIL', exitCode:result.status});
  console.log(`${name}: ${checks.at(-1).status}`);
  if (result.status !== 0) console.error(result.stdout, result.stderr, result.error ?? '');
}
let historical;
try {
  record('source-integrity', spawnSync('python3', ['tools/recovery/verify-source.py'], {encoding:'utf8'}));
  record('functional-tests', runTests());
  record('typecheck', spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], {encoding:'utf8'}));
  record('build', spawnSync('npm', ['run', 'build'], {encoding:'utf8'}));
  if (checks.every(c => c.status === 'PASS')) {
    record('browser', spawnSync(process.execPath, ['tools/recovery/browser.mjs'], {
      encoding:'utf8', maxBuffer:30e6, env:{...process.env, RECOVERY_OUTPUT:out + '/browser'}
    }));
  } else checks.push({name:'browser', status:'NOT RUN', reason:'Prerequisite checks failed'});
} catch (error) {
  checks.push({name:'runner', status:'FAIL', reason:String(error)});
} finally {
  // Mandatory: a green current-source result cannot omit historical provenance.
  try { historical = audit(out); }
  catch (error) { historical = {status:'FAIL', reason:String(error)}; }
  const current = checks.length === 5 && checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
  const report = {checkpoint:'74eeffe7a5c7e010bd6bad23e296064fdeee67fa',
    head:execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(), currentSource:current, checks, historical,
    originalBytes:'558 original files retained; only original CI workflow relocated verbatim to docs/recovery/original/checks.yml'};
  writeFileSync(out + '/provenance.json', JSON.stringify(report, null, 2) + '\n');
  const summary = `## Recovery provenance\n\nCurrent-source checks: **${current}**\n\nHistorical POP Git-object comparison: **${historical.status}**\n\n${historical.reason}\n\n` +
    checks.map(c => `- ${c.name}: ${c.status}`).join('\n') + '\n';
  writeFileSync(out + '/provenance.md', summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
  process.exitCode = current === 'PASS' && ['PASS', 'BLOCKED'].includes(historical.status) ? 0 : 1;
}
