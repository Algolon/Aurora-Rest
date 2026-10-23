import {defineConfig} from 'vite';
export default defineConfig({worker:{format:'es'},build:{rollupOptions:{input:{world:'index.html',geography:'geo-r02b.html',population:'pop-01.html',populationAssets:'pop-02a.html',assetFidelity:'pop-02a-fidelity.html',environment:'env-p01.html',material:'mat-01.html'}}}});
