import {defineConfig} from 'vite';
export default defineConfig({worker:{format:'es'},build:{rollupOptions:{input:{woodlandCohesion:'env-r02d.html'}}}});
