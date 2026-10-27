#!/usr/bin/env node
/** ENV-NATURE-R01R · independent artistic evidence gate, not an art score.
 * Reads the real-WebGL review.json produced by capture.mjs.
 * Protects against conflating unchanged views with an approved reveal.
 * "visible change" is necessary but not sufficient for artistic quality. */
import {readFileSync,writeFileSync} from 'node:fs';
const input=process.argv[2]??'review.json';
const output=process.argv[3]??'art-audit.json';
const r=JSON.parse(readFileSync(input,'utf8'));
if(!Array.isArray(r.matched)||r.matched.length!==3)throw Error('Expected three camera-matched WebGL comparisons');
const rows=r.matched.map(v=>({
 viewpoint:v.view,
 sourcePopulation:v.sourceCount,
 authoredPopulation:v.authoredCount,
 suppressedTrees:v.removedCount,
 cameraIdentity:v.cameraIdentity===true,
 terrainAndMATIdentity:v.terrainAndMaterialIdentity===true,
 retainedDescriptorIdentity:v.fullDescriptorIdentityForRetained===true,
 visibleFrameDifference:v.pixelIdentical===false,
 visuallyEffective: 'NOT_ASSESSED_AUTOMATICALLY'
}));
const technical=rows.every(v=>v.cameraIdentity&&v.terrainAndMATIdentity&&v.retainedDescriptorIdentity);
const allViewsChanged=rows.every(v=>v.visibleFrameDifference);
const required=['nature-glade','nature-turn','nature-reveal'];
if(rows.some((v,i)=>v.viewpoint!==required[i]))throw Error('Incorrect or reordered art review cameras');
const result={
 schema:'aurora-rest-art-gate/1',
 milestone:'ENV-NATURE-R01R',
 sourceRun:'https://github.com/Algolon/Aurora-Rest/actions/runs/40536613933',
 technical:technical?'PASS':'FAIL',
 visualVisibility:allViewsChanged?'CHANGES_VISIBLE_ALL_CAMERAS':'FAIL_UNCHANGED_REVIEW_CAMERA',
 artDecision:'NOT_APPROVED',
 reasons:[
  ...(allViewsChanged?[]:['The claimed valley-reveal view has no source-vs-authored pixel difference']),
  'Changing image pixels does not establish a credible forest -> glade -> valley art composition',
  'Manual reference-first visual QA documented a barren foreground and dominant uncomposed slope',
  'No contiguous walk-through along verified traversable route or user art approval'
 ],
 measurements:rows,
 instruction:'Do not increase clearing radius or remove more trees by default. Preserve canonical terrain and source asset placement. Run a separate asset-first stylized framing study with one modest, measured composition and genuine 1.75 m views.'
};
writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({technical:result.technical,visualVisibility:result.visualVisibility,artDecision:result.artDecision,views:rows.map(v=>[v.viewpoint,v.suppressedTrees,v.visibleFrameDifference])}));
if(!technical)process.exitCode=1; // technical evidence failed; artistic NO-GO is an honest tracked finding
