import{spawn}from'node:child_process';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4211','--strictPort']);await new Promise(r=>server.stdout.on('data',b=>{if(b.toString().includes('Local:'))r();}));
import{chromium}from'playwright';import{writeFile}from'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROME_LIB}});
const p=await browser.newPage({viewport:{width:1600,height:1100}});p.on('pageerror',e=>console.log('ERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log(m.text());});
await p.goto('http://127.0.0.1:4211/env-p01.html');await p.waitForFunction(()=>window.__pop02?.snapshot().ready||window.__pop02Failure,{},{timeout:240000});
await p.evaluate(()=>window.__pop02.pause(true));console.log(JSON.stringify(await p.evaluate(()=>window.__pop02?.snapshot()),null,2));await p.screenshot({path:'docs/env-p01/smoke.png',timeout:240000});await browser.close();server.kill();
