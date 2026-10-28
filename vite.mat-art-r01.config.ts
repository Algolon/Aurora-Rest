import {mergeConfig} from 'vite';
import baseline from './vite.config.ts';
/** Adds the isolated MAT-ART-R01 review entry without altering the protected default build configuration. */
export default mergeConfig(baseline,{build:{rollupOptions:{input:{groundReview:'mat-art-r01.html'}}}});
