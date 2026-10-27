import {suppressOnly} from './suppress.ts';
import {CanonicalEnvironment} from '../pop-01/geography.ts';
import {HeightGrid} from '../geo-r02b/terrain.ts';
import {PopulationGenerator} from '../pop-01/generator.ts';
const binary=async(p:string)=>{const r=await fetch(p);if(!r.ok)throw Error('Worker data '+p);return new Float32Array(await r.arrayBuffer());};
try{
 const data=await(await fetch('/geo-r02b/features.json')).json();const [h,w]=await Promise.all([binary('/geo-r02b/terrain.f32'),binary('/geo-r02b/water-mesh.f32')]);const geo=new CanonicalEnvironment(data,new HeightGrid(h,1501,2001),w);
 self.onmessage=e=>{const {id,epoch,chunk,config}=e.data;try{const p=new PopulationGenerator(geo,{...config,compositionMasks:[]}).generate(chunk);const filtered=suppressOnly(p,config.compositionMasks??[]);self.postMessage({kind:'chunk',id,epoch,p:filtered});}catch(error){self.postMessage({kind:'error',id,epoch,message:String(error)});}};
 self.postMessage({kind:'ready'});
}catch(e){self.postMessage({kind:'error',message:String(e)});}
