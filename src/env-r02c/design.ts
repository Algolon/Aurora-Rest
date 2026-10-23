/** ENV-R02C authored, site-specific landscape score.
 * Coordinates are world metres, not forest-anchor offsets: we work at the ACTUAL
 * POP corridor review camera (-350,-290), 458m from the forest anchor.
 * Visual study only. Source nature assets and canonical geography unchanged.
 */
export const GATEWAY = {
  version:'env-r02c-authored-gateway-a1',
  bounds:{west:-420,east:-268,north:-215,south:-388},
  route:[[-375,-357],[-360,-312],[-350,-290],[-328,-280],[-300,-266]] as readonly (readonly [number,number])[],
  clearing:{x:-316,z:-290,rx:18,rz:13},
  groves:[
    {id:'A',name:'Sheltered birches',center:[-378,-240],family:'birch',scale:1.0},
    {id:'B',name:'Mixed north edge',center:[-338,-260],family:'mixed',scale:1.05},
    {id:'C',name:'Eastern frame',center:[-296,-285],family:'birch',scale:.90},
    {id:'D',name:'Pine shelter',center:[-390,-302],family:'pine',scale:1.10},
    {id:'E',name:'Young birch shelter',center:[-358,-333],family:'birch',scale:1.0},
    {id:'F',name:'Dark ridge edge',center:[-314,-354],family:'mixed',scale:.90},
  ],
  groundCover:[
    {id:'G1',center:[-360,-280],rx:9,rz:7},
    {id:'G2',center:[-349,-304],rx:11,rz:9},
    {id:'G3',center:[-333,-291],rx:8,rz:11},
    {id:'G4',center:[-378,-271],rx:11,rz:7},
    {id:'G5',center:[-325,-322],rx:12,rz:8},
  ],
  cameras:[
    {id:'gateway-approach',x:-360,z:-312,heading:-2.72,label:'Gateway · sheltered approach on hero route'},
    {id:'gateway-trail',x:-350,z:-290,heading:-2.0,label:'Gateway · canonical route hinge'},
    {id:'gateway-reveal',x:-328,z:-280,heading:-2.04,label:'Gateway · north-east reveal'},
  ],
} as const;
/** Deliberate specific clusters, not a new procedural ecology.
 * From distant/near canopy pair to a lower, irregular herb/shrub proxy edge. */
export const GROVE_OFFSETS = [
 [-14,-4,1.08],[-12,10,.90],[-6,-12,1.04],[-2,5,.89],[2,-7,1.13],
 [6,12,.94],[8,-4,1.06],[13,4,1.12],[17,-10,.82],[4,18,.91]
] as const;
