/** ENV-R02A – opt-in, bounded ground-only artistic candidate. NEVER mutates the canonical MAT map.
 * This is a diagnostic local glade proposal, not validated ecology or approved art.
 * The fixed offset is referenced to the verified Birchwood anchor.
 */
import type {MaterialClassification} from '../terrain-material/types.ts';

export const ENV_R02A_DESIGN = Object.freeze({
  version: 'env-r02a-birchwood-glade-v1',
  offsetX: 85, offsetZ: -40, radiusX: 120, radiusZ: 80, peakTransfer: .52,
});
export interface PilotAudit {
  version:string; changedNodes:number; transferredWeightUnits:number; box:[number,number,number,number];
}
function strength(x:number,z:number,cx:number,cz:number):number {
  const d=ENV_R02A_DESIGN, dx=(x-cx)/d.radiusX, dz=(z-cz)/d.radiusZ;
  const outer=1-dx*dx-dz*dz;
  if(outer<=0)return 0;
  // Compact-support, asymmetric inner contour: no tile seams, no island-wide noise.
  const warpX=dx+.11*Math.sin(dz*4.1+dx*1.7);
  const warpZ=dz+.07*Math.sin(dx*5.2-dz*2.3);
  const shaped=Math.max(0,1-warpX*warpX-warpZ*warpZ);
  return outer*shaped*ENV_R02A_DESIGN.peakTransfer;
}
export function createEcotonePilot(base:MaterialClassification,forestAnchorX:number,forestAnchorZ:number):
 {classification:MaterialClassification;audit:PilotAudit}{
  const {lattice:l,materials}=base,d=ENV_R02A_DESIGN;
  if(materials.join('|')!=='forest-floor|meadow-turf|coastal-sand|bedrock')throw Error('ENV-R02A requires four unmodified MAT-01 material slots');
  if(base.weights.length!==l.width*l.height*4)throw Error('ENV-R02A requires a one-layer four-channel classification');
  const cx=forestAnchorX+d.offsetX,cz=forestAnchorZ+d.offsetZ,weights=base.weights.slice();
  const minI=Math.max(0,Math.floor((cx-d.radiusX-l.west)/l.cellM));
  const maxI=Math.min(l.width-1,Math.ceil((cx+d.radiusX-l.west)/l.cellM));
  const minJ=Math.max(0,Math.floor((l.north-(cz+d.radiusZ))/l.cellM));
  const maxJ=Math.min(l.height-1,Math.ceil((l.north-(cz-d.radiusZ))/l.cellM));
  let changedNodes=0,transferredWeightUnits=0;
  for(let j=minJ;j<=maxJ;j++)for(let i=minI;i<=maxI;i++){
    const x=l.west+i*l.cellM,z=l.north-j*l.cellM,k=(j*l.width+i)*4;
    const amount=Math.min(weights[k],Math.round(weights[k]*strength(x,z,cx,cz)));
    if(amount===0)continue;
    weights[k]-=amount;weights[k+1]+=amount;
    changedNodes++;transferredWeightUnits+=amount;
  }
  return {
    classification:{...base,weights,rulesVersion:base.rulesVersion+'+'+d.version},
    audit:{version:d.version,changedNodes,transferredWeightUnits,box:[cx-d.radiusX,cz-d.radiusZ,cx+d.radiusX,cz+d.radiusZ]},
  };
}
