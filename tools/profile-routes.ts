import {writeFileSync} from 'node:fs';
import {ROUTES} from '../src/world/routes.ts';
import {heightAt,riverAt} from '../src/world/geography.ts';
import {WORLD} from '../src/world/config.ts';
import {walkHeightAt as sampledHeight,waterLevelAt} from '../src/world/surface.ts';

const profiles=Object.entries(ROUTES).map(([name,points])=>{
  let length=0,ascent=0,maxGrade=0,submerged=0,steepSamples=0;
  for(let i=1;i<points.length;i++){
    const [ax,az]=points[i-1],[bx,bz]=points[i],distance=Math.hypot(bx-ax,bz-az);
    const steps=Math.ceil(distance/5),step=distance/steps;
    for(let j=1;j<=steps;j++){
      const x=ax+(bx-ax)*j/steps,z=az+(bz-az)*j/steps,y=sampledHeight(x,z);
      const dy=y-sampledHeight(ax+(bx-ax)*(j-1)/steps,az+(bz-az)*(j-1)/steps);
      const grade=Math.abs(dy)/step;
      maxGrade=Math.max(maxGrade,grade);if(grade>.35)steepSamples++;
      length+=Math.hypot(step,dy);ascent+=Math.max(0,dy);
      if(y<waterLevelAt(x,z)+.25)submerged++;
    }
  }
  return {name,lengthM:Math.round(length),ascentM:Math.round(ascent),maxGrade,steepSamples,submerged,walkingMinutes:Math.round(length/1.4/60)};
});
const result=JSON.stringify({sampleSpacingM:5,profiles},null,2)+'\n';
if(process.argv[2])writeFileSync(process.argv[2],result);
console.log(result);
