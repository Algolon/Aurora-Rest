import {defineConfig} from 'vite';
/** Optional sidecar: protected original Vite build and ENV-P01 source stay unchanged. */
export default defineConfig({worker:{format:'es'},build:{rollupOptions:{input:{woodlandComposition:'env-r02b.html'}}}});
