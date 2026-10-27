/** ENV-NATURE-R01 · intentional, bounded visual composition.
 * World metres: x east, z north. Canonical R1 terrain and ecology untouched.
 * The overlapping glade shapes break up uniform circles; vista keeps a narrow
 * line of sight from woodland toward the valley without clearing the valley.
 * Never suppress rocks/ground cover; retained assets are byte-for-byte stable.
 */
import type {CompositionMask} from '../pop-01/composition.ts';
import type {ReviewCamera} from '../pop-02a/cameras.ts';
export const AUTHOR_MASKS:readonly CompositionMask[]=Object.freeze([
 {id:'N01-canopy-pocket-west',kind:'glade',x:-687,z:-99,radius:25,families:['birch','pine']},
 {id:'N02-offset-pocket',kind:'glade',x:-667,z:-112,radius:16,families:['birch','pine']},
 {id:'N03-trail-bend-clearing',kind:'glade',x:-358,z:-290,radius:24,families:['birch','pine']},
 {id:'N04-meadow-threshold',kind:'glade',x:-237,z:-174,radius:19,families:['birch','pine']},
 {id:'N05-valley-reveal',kind:'vista',x:-358,z:-290,range:145,heading:1.05,halfAngle:.11,families:['birch','pine']}
] as CompositionMask[]);
export const AUTHOR_VIEWPOINTS:readonly ReviewCamera[]=Object.freeze([
 {id:'nature-glade',label:'01 · Woodland enclosure → opening',region:'forest',x:-710,z:-105,kind:'walk',heading:-Math.PI/2,source:'Authored review eye 1.75 m above canonical terrain'},
 {id:'nature-turn',label:'02 · Trail bend and clearing',region:'forest',x:-360,z:-290,kind:'walk',heading:-1.12,source:'Authored review eye 1.75 m above canonical terrain'},
 {id:'nature-reveal',label:'03 · First valley reveal',region:'valley',x:-245,z:-175,kind:'walk',heading:-1.05,source:'Authored review eye 1.75 m above canonical terrain'}
]);
export const PILOT_BOUNDS={west:-770,east:-110,south:-380,north:15} as const;
export const COMPOSITION_POLICY='subset-only post-generation: no added, relocated or resized population descriptor; R1 geography untouched' as const;
