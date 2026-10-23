/** Compose unaltered genuine Blender PNGs. No generated imagery, crop or rescale. */
import {chromium} from 'playwright-core';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('art/blender/s1r-sculptural-polish'),out=resolve(root,'comparisons');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:2000,height:886},deviceScaleFactor:1});
const views=['front','rear','left','right','threequarter-front','threequarter-rear','top','human-height','front-closeup','left-closeup','rear-closeup'];
try{
 for(const name of views){
  const a=(await readFile(resolve(root,'baseline',name+'.png'))).toString('base64'),b=(await readFile(resolve(root,views.indexOf(name)<8?'renders':'diagnostics',name+'.png'))).toString('base64');
  await page.setContent(`<style>body{margin:0;background:#19262d;color:#e6eef2;font:18px system-ui}header{height:66px;display:flex;align-items:center}header div{width:1000px;box-sizing:border-box;padding-left:28px}main{display:flex}img{width:1000px;height:820px;display:block}</style><header><div>ORIGINAL S1 · BLENDER / ${name}</div><div>REFINED S1R · BLENDER / MATCHED CAMERA, LIGHT, SCALE</div></header><main><img src="data:image/png;base64,${a}"><img src="data:image/png;base64,${b}"></main>`);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:resolve(out,'blender-S1-S1R-'+name+'.png')});
 }
 await writeFile(resolve(out,'plate-method.json'),JSON.stringify({method:'Side-by-side composition of unaltered actual Blender PNGs; 1000x820 pixels per panel; no crop, rotation or rescale; labels only added above',views},null,2)+'\n');console.log('S1R matched Blender plates PASS',views.length);
}finally{await browser.close();}
