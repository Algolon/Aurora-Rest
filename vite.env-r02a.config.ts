import {defineConfig} from 'vite';
/** Separate opt-in review build: protected vite.config.ts and ENV-P01 entry remain byte-identical. */
export default defineConfig({worker:{format:'es'},build:{rollupOptions:{input:{environmentPilot:'env-r02a.html'}}}});
