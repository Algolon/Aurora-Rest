/** Capture final observed HEAD after committing, without self-referential committed SHAs. */
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const output=process.argv[2];if(!output)throw Error('Provide an output path outside the Git checkout');
const files=[];function walk(path){for(const name of readdirSync(path)){const p=path+'/'+name;if(statSync(p).isDirectory())walk(p);else files.push(p);}}
for(const root of ['src/pop-01','docs/pop-01','tools/pop-01'])walk(root);files.push('pop-01.html','tests/pop-01.test.ts','vite.config.ts');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const report={repository:git('remote','get-url','origin'),source:'90d0cb745e8e51a3dc737bd4dc11d6f8c322758b',branch:git('branch','--show-current'),finalCommit:git('rev-parse','HEAD'),worktreeStatus:git('status','--porcelain'),scope:'POP-01 review only. Local branch; no push, merge or deployment.',artifacts:Object.fromEntries(files.sort().map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]))};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({branch:report.branch,finalCommit:report.finalCommit,worktreeStatus:report.worktreeStatus,artifactCount:files.length},null,2));
