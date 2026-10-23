import {defineConfig} from 'vite';
/** Visual-only candidate: original Vite configuration and recovered source remain untouched. */
export default defineConfig({worker:{format:'es'},build:{rollupOptions:{input:{gateway:'env-r02c.html'}}}});
