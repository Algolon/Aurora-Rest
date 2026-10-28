import {mergeConfig} from 'vite';
import baseline from './vite.config.ts';
export default mergeConfig(baseline,{build:{rollupOptions:{input:{woodlandReview:'env-nature-r02.html'}}}});
