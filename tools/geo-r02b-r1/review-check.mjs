import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME||`${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`});
const page=await browser.newPage({viewport:{width:1500,height:1100}}),missing=[];page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))missing.push({url:r.url(),status:r.status()});});
try{
 const base=process.env.REVIEW_URL||'http://127.0.0.1:4197/docs/geo-r02b-r1/';
 await page.goto(base+'review.html',{waitUntil:'networkidle'});await page.evaluate(()=>{for(const img of document.images)img.loading='eager';});await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:60000});
 const images=await page.locator('img').count();assert.equal(images,26);assert.deepEqual(missing,[]);await page.screenshot({path:'docs/geo-r02b-r1/review-layout.png'});
 await page.setViewportSize({width:1200,height:1400});for(const name of ['route-profiles','depression-sections']){await page.goto(base+name+'.svg',{waitUntil:'networkidle'});await page.locator('svg').screenshot({path:`docs/geo-r02b-r1/${name}.png`});}
 await writeFile('docs/geo-r02b-r1/review-qa.json',JSON.stringify({allImagesLoaded:images,missing,scientificFigures:'SVG measurement plots independently rendered for layout QA; not Three.js terrain captures',browser:browser.version()},null,2)+'\n');console.log('Review loads all 26 images; scientific figures rendered.');
}finally{await browser.close();}
