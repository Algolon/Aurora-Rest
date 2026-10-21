/** E2A authored geology studies: all planes oriented outward, n·p <= d.
 * The independent silhouette parameters are deliberate, not random seeds.
 * Large plane sets are first-pass art candidates, NOT production-approved.
 */
import type {RockSpec,RockId} from './heroRockStudies.ts';
export const STUDIES:Record<RockId,RockSpec>={
 A:{
  id:'A',name:'Fractured Granite Mass',
  intent:'Grounded wide granite with raked northwest crown and one coherent diagonal fracture plane; front mass grows from same closed solid.',
  box:{x:[-2.26,2.16],y:[-.21,2.68],z:[-1.63,1.73]},
  fractureAxis:[-.58,.62,.53],defaultControls:{widthScale:1,heightScale:1,depthScale:1,lean:0},
  planes:[
   [.08,1,.13,2.48],          // principal tilted crown
   [-.56,.83,-.15,2.39],      // left shoulder plunges
   [.78,.58,.04,2.18],        // longer asymmetric right shoulder
   [-.95,.05,.22,2.09],       // west main wall
   [.86,.06,.25,1.91],        // east main wall
   [-.07,.17,1,1.60],        // front surface
   [.12,.16,-1,1.55],        // back broad face
   [-.65,.08,.79,2.10],      // front west bevel
   [.75,.05,.69,1.89],       // front eastern compression
   [-.79,.14,-.66,2.04],     // rear west shoulder
   [.73,.19,-.72,1.97],      // rear east
   [-.60,.67,.28,2.36],      // coherent diagonal fracture / plane direction
   [.31,.72,.59,2.28],       // sloping front crown
   [-.15,.65,-.83,2.21],     // rear transition
   [.61,-.53,.22,1.53],      // right low bevel / grounding
   [-.72,-.58,.15,1.62],     // left lower buttress
   [.10,-.64,.70,1.48],      // front base taper
   [-.26,-.69,-.53,1.35],    // rear base bevel
   [-.19,.34,1,1.89],       // restrained directional frontal facet
   [.48,.35,-.78,1.78],     // articulated rear
   [-.43,.23,-.88,1.83]
  ]
 },
 B:{
  id:'B',name:'Glacial Erratic',
  intent:'Broad squat off-centre erratic, one abraded calming windward side and a broken opposing edge; flat stable contact.',
  box:{x:[-2.6,2.33],y:[-.22,2.12],z:[-1.65,1.46]},
  fractureAxis:[.75,.25,-.61],defaultControls:{widthScale:1,heightScale:1,depthScale:1,lean:-.035},
  planes:[
   [.26,1,-.10,1.96],        // long sloping rubbed crown
   [-.28,.81,.28,2.06],      // flattened western top
   [.77,.65,-.13,1.96],      // broken right shoulder
   [-.87,.16,.18,2.23],      // calm left face
   [.95,.09,.22,2.01],       // right face
   [.05,.11,1,1.35],         // forward ice-smoothed surface
   [-.20,.08,-1,1.60],       // broken back
   [-.74,.02,.67,2.22],      // front west rounding by plane
   [.79,.12,.63,1.95],       // front east fracture direction
   [-.74,.18,-.65,2.16],     // calm rear west
   [.62,.10,-.88,1.93],      // back east fracture
   [-.51,.55,.36,2.07],      // softened western crown
   [.59,.36,.62,1.99],       // fracture-connected eastern edge
   [.33,.71,-.67,1.98],      // broken rear crown
   [-.45,.57,-.72,2.19],     // rear counterplane
   [-.55,-.55,.12,1.60],     // buried west foot
   [.64,-.52,.20,1.39],      // right foot fractured
   [.11,-.61,.64,1.25],      // calm front contact
   [-.09,-.58,-.72,1.44],    // rear contact
   [.92,-.18,-.35,2.01]     // chipped opposing edge
  ]
 },
 C:{
  id:'C',name:'Angular Nordic Outcrop',
  intent:'Tall windward outcrop with steep raked side planes, leaning summit and terraced but cohesive rock shoulders.',
  box:{x:[-1.68,1.72],y:[-.24,3.72],z:[-1.55,1.43]},
  fractureAxis:[.19,.91,-.37],defaultControls:{widthScale:1,heightScale:1,depthScale:1,lean:.11},
  planes:[
   [.34,1,.04,3.43],         // raked high crown
   [-.67,.72,-.03,3.30],     // asymmetric summit spur
   [.91,.55,.06,2.85],       // long eastern fall
   [-.93,.15,-.12,1.48],     // west vertical face
   [.91,.07,.16,1.49],       // east wall
   [.09,.13,1,1.36],         // front
   [-.13,.18,-1,1.36],       // rear
   [-.74,.20,.64,1.72],      // western bevel
   [.71,.23,.69,1.69],       // facing step
   [-.60,.31,-.77,1.69],     // rear-west ridge
   [.63,.27,-.72,1.74],      // rear-east ridge
   [.65,.75,.12,3.07],       // upper east fracture orientation
   [-.32,.72,.64,3.04],      // upper front
   [-.56,.62,-.62,2.90],     // rear crown
   [.38,.68,-.70,3.00],      // stepped rear directional plane
   [-.79,-.50,.10,1.30],    // anchored base
   [.71,-.61,.12,1.25],
   [.08,-.67,.59,1.29],
   [-.08,-.59,-.70,1.20],
   [.29,.28,1,1.63],         // strategic front plane
   [.72,.25,-.44,1.63],      // rear-east articulation
   [-.29,.35,-.83,1.66]
  ]
 }
};
export const STUDY_IDS=['A','B','C'] as const;
