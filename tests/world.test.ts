import {test} from 'node:test';import assert from 'node:assert/strict';
import {WORLD} from '../src/world/config.ts';
import {ROUTES} from '../src/world/routes.ts';
import {heightAt,coastField,riverAt,noise,regionAt,biomeAt} from '../src/world/geography.ts';
test('seeded noise is deterministic',()=>{assert.equal(noise(3.2,9.8),noise(3.2,9.8));assert.notEqual(noise(3.2,9.8),noise(3.21,9.8));});
test('ocean is below sea level at distant positions',()=>{for(const [x,z] of [[4300,0],[-4300,0],[0,5600],[0,-5600]])assert.ok(heightAt(x,z)<0);});
test('north mountain is above southern lowlands',()=>{assert.ok(heightAt(-650,2590)>heightAt(700,-2500)+150);});
test('macro world contains coast and inland',()=>{assert.ok(coastField(0,0)>0);assert.ok(coastField(3500,3500)<0);});
test('river authored levels strictly descend from alpine source to sea',()=>{const p=WORLD.water.river;for(let i=1;i<p.length;i++)assert.ok(p[i].level<p[i-1].level);assert.equal(p.at(-1)?.level,0);});
test('river nearest segment distance zero at interior controls',()=>{for(const p of WORLD.water.river)assert.ok(riverAt(p.x,p.z).distance<.0001);});
test('landmark elevations and classifications are finite',()=>{for(const p of WORLD.viewpoints){assert.ok(Number.isFinite(heightAt(p.x,p.z)),p.name);assert.ok(regionAt(p.x,p.z).length>0);assert.ok(biomeAt(p.x,p.z).length>0);}});
test('macro terrain range is finite over a coarse sampling grid',()=>{let min=Infinity,max=-Infinity;for(let x=-3500;x<=3500;x+=250)for(let z=-4500;z<=4500;z+=250){const y=heightAt(x,z);assert.ok(Number.isFinite(y));min=Math.min(min,y);max=Math.max(max,y);}assert.ok(max>450,`maximum ${max}`);assert.ok(min<0);});

test('ocean surrounds all four boundaries of the world mesh',()=>{
  for(let t=-4000;t<=4000;t+=100)for(const [x,z] of [[-WORLD.halfWidth,t],[WORLD.halfWidth,t],[t/4000*WORLD.halfWidth,-WORLD.halfLength],[t/4000*WORLD.halfWidth,WORLD.halfLength]])assert.ok(coastField(x,z)<0,`${x},${z}: ${coastField(x,z)}`);
});
test('walk trail macro anchors lie on dry land',()=>{
  for(const [route,points] of Object.entries(ROUTES))for(const [x,z] of points)assert.ok(heightAt(x,z)>0,`${route} ${x},${z}: ${heightAt(x,z)}`);
});
test('river bed is below surface water inland',()=>{
  for(const p of WORLD.water.river.slice(0,-2))assert.ok(heightAt(p.x,p.z)<=p.level-.1,`River at ${p.x},${p.z}: ${heightAt(p.x,p.z)} > ${p.level}`);
});

test('hiking route segments remain on land at 20 m intervals',()=>{
 for(const [route,pts] of Object.entries(ROUTES))for(let i=0;i<pts.length-1;i++){
  const [ax,az]=pts[i], [bx,bz]=pts[i+1];const n=Math.ceil(Math.hypot(bx-ax,bz-az)/20);
  for(let j=0;j<=n;j++){const t=j/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;assert.ok(heightAt(x,z)>0,`${route}: segment ${i}, t=${t.toFixed(2)} at ${x.toFixed(0)},${z.toFixed(0)}`);}
 }
});
