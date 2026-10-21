import type * as THREE from 'three';
export type RenderMode = 'auto'|'multidraw'|'instanced';
export type ActiveMode = 'multidraw'|'instanced';
export interface BatchCapabilities { webgl2:boolean; multiDraw:boolean; renderer:string; glVersion:string }
export function getBatchCapabilities(renderer:THREE.WebGLRenderer):BatchCapabilities {
 const gl=renderer.getContext();
 return {webgl2:typeof WebGL2RenderingContext!=='undefined' && gl instanceof WebGL2RenderingContext,
 multiDraw:!!gl.getExtension('WEBGL_multi_draw'),
 renderer:String(gl.getParameter(gl.RENDERER)),glVersion:String(gl.getParameter(gl.VERSION))};
}
export function resolveBatchMode(requested:RenderMode,cap:BatchCapabilities):ActiveMode {
 if(requested==='multidraw'&&!cap.multiDraw)throw new Error('WEBGL_multi_draw unavailable: forced multidraw cannot run');
 return requested==='instanced'?'instanced':cap.multiDraw?'multidraw':'instanced';
}
