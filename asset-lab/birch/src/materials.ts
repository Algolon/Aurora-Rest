// ASSET-01B1: copied Feh Lu We woodMats() atlas + shader pipeline, default active production flags explicit.
// Global ShaderChunk monkey-patching replaced with material-local equivalent.
import * as THREE from 'three';
import {mulberry32,type Rng} from './rng.ts';
import {foliageAtlas,SPRAY_SAMPLE} from './foliage.ts';
const NATURE_STYLE = ['woodland-r02'][0];
const FULL_NATURE = Boolean(1);
const TREE_ART = ['trees-r03'][0];
const VEGETATION_DETAIL = Boolean(1);
const GARDEN_DETAIL = Boolean(0);
const ATLAS_COLS=4, LEAF_U=64, GUT=.07;
export const SURFACE_PROFILES = { timber: 1, plaster: 2, stone: 3, fabric: 4, paint: 5, ground: 6, foliage: 7, metal: 8, tree: 9 } as const;
export type SurfaceProfile = keyof typeof SURFACE_PROFILES;

/** Per profile: [low scale m, low amp, mid scale m, mid amp, hue amp, saturation]. */
export const SURFACE_PARAMS: Record<SurfaceProfile, [number, number, number, number, number, number]> = {
  timber: [3.2, 0.1, 0.55, 0.05, 0.05, 1.0],
  plaster: [2.6, 0.12, 0.9, 0.045, 0.05, 1.0],
  stone: [1.9, 0.1, 0.42, 0.07, 0.035, 0.97],
  fabric: [1.1, 0.07, 0.3, 0.035, 0.03, 1.0],
  paint: [2.4, 0.04, 0.0, 0.0, 0.02, 1.0],
  ground: [11.0, 0.2, 2.8, 0.09, 0.11, 0.72],
  foliage: [8.0, 0.15, 0.0, 0.0, 0.09, 0.84], // no mid lookup: canopy overdraw is the most expensive fill; the crowns break it up
  metal: [1.2, 0.03, 0.0, 0.0, 0.0, 1.0],
  tree: [7.0, 0.13, 0.0, 0.0, 0.08, 0.86],
};

const f = (n: number) => n.toFixed(4);
function profileGlsl() {
  return (Object.keys(SURFACE_PROFILES) as SurfaceProfile[]).map((k) => {
    const [ls, la, ms, ma, ha, sa] = SURFACE_PARAMS[k];
    return `#if FLW_SURFACE == ${SURFACE_PROFILES[k]}
  const vec4 FLW_A = vec4(${f(1 / ls)}, ${f(la)}, ${f(ms > 0 ? 1 / ms : 0)}, ${f(ma)});
  const vec2 FLW_B = vec2(${f(ha)}, ${f(sa)});
#endif`;
  }).join('\n');
}

const COMMON = /* glsl */ `
#ifdef FLW_SURFACE
varying vec3 vFlwP;
${profileGlsl()}
vec2 flwHash2(vec3 p) { p = fract(p * vec3(0.1031, 0.103, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.xx + p.yz) * p.zy); }
// value noise with two decorrelated channels for the price of one lookup set
vec2 flwNoise2(vec3 x) {
  vec3 i = floor(x), u = fract(x); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(mix(flwHash2(i), flwHash2(i + vec3(1, 0, 0)), u.x), mix(flwHash2(i + vec3(0, 1, 0)), flwHash2(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(flwHash2(i + vec3(0, 0, 1)), flwHash2(i + vec3(1, 0, 1)), u.x), mix(flwHash2(i + vec3(0, 1, 1)), flwHash2(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
vec3 flwSurface(vec3 base, vec3 p) {
  // broad value zone + a separate warm / cool drift (one lookup), a mid-scale breakup (a second, only where used)
  vec2 lo = flwNoise2(p * FLW_A.x) - 0.5;
  float v = 1.0 + lo.x * 2.0 * FLW_A.y;
  if (FLW_A.w > 0.0) v += (flwNoise2(p * FLW_A.z + 31.1).x - 0.5) * 2.0 * FLW_A.w;
  vec3 c = base * v * (vec3(1.0) + vec3(0.6, 0.12, -0.75) * (lo.y * 2.0 * FLW_B.x));
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(g), c, FLW_B.y);
}
#endif
`;

const WORLDPOS = /* glsl */ `
#ifdef FLW_SURFACE
  vec4 flwW = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    flwW = batchingMatrix * flwW;
  #endif
  #ifdef USE_INSTANCING
    flwW = instanceMatrix * flwW;
  #endif
  vFlwP = (modelMatrix * flwW).xyz;
#endif
`;

const COLOR = /* glsl */ `
#ifdef FLW_SURFACE
  diffuseColor.rgb = flwSurface(diffuseColor.rgb, vFlwP);
#endif
`;

function auroraTreeSurface<T extends THREE.MeshLambertMaterial>(material:T):T {
 const originalCompile=material.onBeforeCompile.bind(material);
 const originalCache=material.customProgramCacheKey.bind(material);
 material.defines={...material.defines,FLW_SURFACE:9};
 material.onBeforeCompile=(shader,renderer)=>{
  originalCompile(shader,renderer);
  shader.vertexShader='varying vec3 vFlwP;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n'+WORLDPOS);
  shader.fragmentShader=COMMON+'\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+COLOR);
 };
 material.customProgramCacheKey=()=>originalCache()+'|aurora-birch-surface-r01';
 material.userData.surface='tree';
 return material;
}
}

// ------------------------------------------------------------------------------------------------ materials
function canvasTex(w: number, h: number, draw: (x: CanvasRenderingContext2D, r: Rng) => void, seed: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, mulberry32(seed));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
const grey = (v: number, a = 1) => `rgba(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)},${a})`;
export interface WoodMats { tree: THREE.MeshLambertMaterial; rock: THREE.MeshLambertMaterial; flat: THREE.MeshLambertMaterial }
let wm: WoodMats | null = null;
const C_PX = 128;
/**
 * tree: the tree atlas (3 barks + leaf dabs, see BARK / LEAF_U) — trunks and crowns of every species in one
 * material; rock gets faint strata; flat (vertex colour only) for plants, turf and litter.
 */
export function woodMats(): WoodMats {
  if (wm) return wm;
  // tree atlas: four 128 px columns. u is clamped (each bark column is one trip round the trunk), v repeats along it
  const atlas = canvasTex(C_PX * ATLAS_COLS, 256, (x, r) => {
    // 0: fissured (oak, pine) — wavy furrows along the trunk
    x.fillStyle = grey(0.86); x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 26; i++) {
      const cx = r() * 128, w = 2 + r() * 4;
      x.strokeStyle = grey(0.6 + r() * 0.12, 0.8); x.lineWidth = w; x.beginPath();
      for (let y = -10; y <= 266; y += 16) { const xx = cx + Math.sin(y * 0.05 + i) * 3; if (y < 0) x.moveTo(xx, y); else x.lineTo(xx, y); }
      x.stroke();
    }
    for (let i = 0; i < 120; i++) { x.fillStyle = grey(0.92 + r() * 0.08, 0.35); x.fillRect(r() * 128, r() * 256, 6 + r() * 10, 2 + r() * 3); }
    if (FULL_NATURE) {
      // Fewer broad authored fissures and occasional knots read at walking distance, unlike tiny noise.
      for(let i=0;i<9;i++){
        const cx=7+i*14;x.strokeStyle=grey(.43,.65);x.lineWidth=1.8;x.beginPath();
        for(let y=-5;y<262;y+=18){const xx=cx+Math.sin(y*.028+i)*3.5;if(y<0)x.moveTo(xx,y);else x.lineTo(xx,y);}x.stroke();
      }
      for(const [px,py]of [[33,70],[94,192]]){x.strokeStyle=grey(.53,.7);x.lineWidth=2;x.beginPath();x.ellipse(px,py,5,13,.12,0,Math.PI*2);x.stroke();}
    }
    // 1: smooth (beech, hazel) — soft mottling and faint horizontal lenticels
    x.fillStyle = grey(0.9); x.fillRect(128, 0, 128, 256);
    for (let i = 0; i < 70; i++) { x.fillStyle = grey(0.8 + r() * 0.16, 0.35); x.beginPath(); x.ellipse(128 + r() * 128, r() * 256, 6 + r() * 14, 4 + r() * 10, 0, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 60; i++) { x.fillStyle = grey(0.72, 0.45); x.fillRect(128 + r() * 120, r() * 256, 3 + r() * 6, 1); }
    // 2: birch — white with black horizontal dashes and dark patches
    x.fillStyle = grey(0.96); x.fillRect(256, 0, 128, 256);
    for (let i = 0; i < 90; i++) { x.fillStyle = grey(0.12 + r() * 0.2, 0.85); x.fillRect(256 + r() * 120, r() * 256, 4 + r() * 16, 1 + r() * 2.5); }
    for (let i = 0; i < 10; i++) { x.fillStyle = grey(0.2 + r() * 0.15, 0.7); x.beginPath(); x.ellipse(256 + r() * 128, r() * 256, 6 + r() * 10, 3 + r() * 5, 0, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = grey(0.85 + r() * 0.1, 0.5); x.fillRect(256 + r() * 128, r() * 256, 10 + r() * 20, 2); }
    // 3: leaf dabs, tileable in the 128 × 256 column (drawn with wrap-around copies; clipped to the column)
    x.save(); x.beginPath(); x.rect(384, 0, 128, 256); x.clip();
    x.fillStyle = grey(0.86); x.fillRect(384, 0, 128, 256);
    for (let i = 0; i < 520; i++) {
      const px = r() * 128, py = r() * 256, s = 3 + r() * 5;
      x.fillStyle = grey(0.74 + r() * 0.3, 0.75);
      for (const ox of [-128, 0, 128]) for (const oy of [-256, 0, 256]) { x.beginPath(); x.ellipse(384 + px + ox, py + oy, s, s * 0.55, r() * Math.PI, 0, Math.PI * 2); x.fill(); }
    }
    x.restore();
  }, 81);
  atlas.wrapS = THREE.ClampToEdgeWrapping;
  const strata = canvasTex(128, 128, (x, r) => {
    x.fillStyle = grey(0.9); x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 14; i++) { x.fillStyle = grey(0.82 + r() * 0.14, 0.6); x.fillRect(0, r() * 128, 128, 2 + r() * 6); }
    for (let i = 0; i < 60; i++) { x.fillStyle = grey(0.7 + r() * 0.3, 0.3); x.fillRect(r() * 128, r() * 128, 2 + r() * 5, 2 + r() * 5); }
  }, 83);
  const lam = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  const tree = lam({ map: atlas });
  const sprays = NATURE_STYLE !== 'baseline' ? foliageAtlas() : null;
  const oakBark = TREE_ART !== 'recovered' || VEGETATION_DETAIL ? canvasTex(256, 512, (x, r) => {
    // Long, softly bevelled furrows follow the trunk, with a few interrupted bark seams.
    x.fillStyle = grey(.82); x.fillRect(0, 0, 256, 512);
    for (let col = 0; col < 8; col++) {
      const cx = col * 32 + r() * 5, phase = r() * 6.28, width = 3 + r() * 3;
      // Exact periods join the grooves across the repeated tile in both directions.
      const line = (y: number) => cx + Math.sin(y * Math.PI * 2 / 512 + phase) * 7 + Math.sin(y * Math.PI * 4 / 512 + phase) * 2;
      for (const wrap of [-256, 0, 256]) {
      x.save(); x.translate(wrap, 0);
      x.fillStyle = grey(.60 + r() * .07); x.beginPath();
      for (let y = -16; y <= 528; y += 16) { if (y === -16) x.moveTo(line(y), y); else x.lineTo(line(y), y); }
      for (let y = 528; y >= -16; y -= 16) x.lineTo(line(y) + width, y);
      x.closePath(); x.fill();
      x.fillStyle = grey(.94, .65); x.beginPath();
      for (let y = -16; y <= 528; y += 16) { if (y === -16) x.moveTo(line(y) + width + 1, y); else x.lineTo(line(y) + width + 1, y); }
      for (let y = 528; y >= -16; y -= 16) x.lineTo(line(y) + width + 6, y);
      x.closePath(); x.fill();
      for (let i = 0; i < 2; i++) {
        const y = 80 + i * 240 + r() * 55;
        x.strokeStyle = grey(.67, .65); x.lineWidth = 1.5; x.beginPath(); x.moveTo(line(y), y); x.quadraticCurveTo(line(y) + 12, y - 9, line(y) + 22, y - 35); x.stroke();
      }
      x.restore();
      }
    }
    for (const [cx, cy] of [[56, 160], [184, 395]]) {
      x.strokeStyle = grey(.62); x.lineWidth = 3; x.beginPath(); x.ellipse(cx,cy,9,22,.2,0,Math.PI*2); x.stroke();
      x.fillStyle = grey(.52); x.beginPath(); x.ellipse(cx,cy,3,10,.2,0,Math.PI*2); x.fill();
    }
  }, 23017) : null;
  const pineBark = TREE_ART === 'trees-r03' ? canvasTex(256, 512, (x, r) => {
    // Soft elongated scales, with staggered independent heights rather than a regular brick grid.
    x.fillStyle = grey(.73); x.fillRect(0, 0, 256, 512);
    for (let col = 0; col < 6; col++) {
      const count = 2 + Math.floor(r() * 2), step = 512 / count, phase = r() * 512;
      for (let row = 0; row < count; row++) {
        const cx = col * (256 / 6) + r() * 8, cy = row * step + phase;
        const w = 34 + r() * 8, h = step - 4, bow = (r() - .5) * 12, val = .79 + r() * .08;
        for (const dx of [-256,0,256]) for (const dy of [-1024,-512,0,512]) {
          x.save(); x.translate(cx + dx, cy + dy);
          x.fillStyle = grey(val); x.beginPath(); x.moveTo(3, 0); x.quadraticCurveTo(w*.5,-5,w-4,2);
          x.bezierCurveTo(w + bow, h*.30, w-2+bow, h*.72, w-4, h);
          x.quadraticCurveTo(w*.5,h+5,4,h-1); x.bezierCurveTo(-3+bow,h*.72,bow,h*.3,3,0); x.closePath(); x.fill();
          x.strokeStyle = grey(.93, .35); x.lineWidth = 3; x.beginPath(); x.moveTo(5, 8); x.bezierCurveTo(1+bow,h*.3,1+bow,h*.7,7,h-8); x.stroke();
          x.restore();
        }
      }
    }
  }, 23019) : null;
  // foliage UVs (u ≥ LEAF_U) repeat inside the leaf column; gradients from the unwrapped UV keep mip selection
  // continuous across the wrap (no seams); bark UVs are sampled as usual
  tree.onBeforeCompile = (sh) => {
    if (sprays) { sh.uniforms.flwSprays = { value: sprays }; sh.fragmentShader = 'uniform sampler2D flwSprays;\n' + sh.fragmentShader; }
    if (oakBark) { sh.uniforms.flwOakBark = { value: oakBark }; sh.fragmentShader = 'uniform sampler2D flwOakBark;\n' + sh.fragmentShader; }
    if (pineBark) { sh.uniforms.flwPineBark = { value: pineBark }; sh.fragmentShader = 'uniform sampler2D flwPineBark;\n' + sh.fragmentShader; }
    if (TREE_ART === 'trees-r03' || VEGETATION_DETAIL) {
      // Model-local metres remain consistent on the main stem, forks and both batch paths.
      // This also gives intersecting fork surfaces the same pigment at their meeting point.
      sh.vertexShader = 'varying vec3 flwBarkPosition;\n' + sh.vertexShader;
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nflwBarkPosition = position;');
      sh.fragmentShader = `varying vec3 flwBarkPosition;
vec2 flwBeechFlow(vec2 uv) {
  return vec2(((uv.x - 24.0) * 4.0 - 1.0 - ${GUT}) / ${1 - 2 * GUT} * 6.28318530718, uv.y);
}
vec2 flwTimberFlow(vec2 uv) {
  return vec2(((uv.x - 28.0) * 4.0 - ${GUT}) / ${1 - 2 * GUT} * 6.28318530718, uv.y);
}
float flwBeechGroove(vec2 flow) {
  return pow(.5 + .5 * sin(flow.x * 6.0 + sin(flow.y * 1.4) * .9), 5.0);
}
float flwBeechRelief(vec2 flow) {
  return -.022 * flwBeechGroove(flow) + .005 * sin(flow.x * 13.0 + sin(flow.y * 4.0)) * sin(flow.y * 7.0);
}
` + sh.fragmentShader;
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
if ((vMapUv.x > 23.0 && vMapUv.x < 25.0) ${VEGETATION_DETAIL ? '|| (vMapUv.x > 27.0 && vMapUv.x < 29.0)' : ''}) {
  bool timber = vMapUv.x > 27.0;
  vec2 flow = timber ? flwTimberFlow(vMapUv) : flwBeechFlow(vMapUv);
  float height = flwBeechRelief(flow) * (timber ? .72 : 1.0) * (1.0 - smoothstep(24.0, 48.0, length(vViewPosition)));
  vec2 slope = vec2(dFdx(height), dFdy(height));
  float footprint = length(vec2(dFdx(flow.x * 6.0), dFdy(flow.x * 6.0)));
  float resolved = 1.0 - smoothstep(.7, 2.5, footprint);
  vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
  vec3 rx = cross(sy, normal), ry = cross(normal, sx);
  float det = dot(sx, rx);
  if (abs(det) > 1e-10) normal = normalize(abs(det) * normal - sign(det) * resolved * (slope.x * rx + slope.y * ry));
}`);
    }
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
  vec2 tUv = vMapUv;
  vec4 sampledDiffuseColor;
  ${GARDEN_DETAIL ? 'if (tUv.x > 29.0 && tUv.x < 31.0) { sampledDiffuseColor = vec4(1.0); } else' : ''}
  ${VEGETATION_DETAIL ? `if (tUv.x > 27.0 && tUv.x < 29.0) {
    sampledDiffuseColor = texture2D(flwOakBark, vec2(((tUv.x - 28.0) * 4.0 - ${GUT}) / ${1 - 2 * GUT}, tUv.y * .65));
    vec2 flow = flwTimberFlow(tUv);
    float footprint = length(vec2(dFdx(flow.x * 6.0), dFdy(flow.x * 6.0)));
    float groove = mix(flwBeechGroove(flow), .20, smoothstep(.7, 2.5, footprint));
    sampledDiffuseColor.rgb *= 1.0 - groove * .14;
  } else` : ''}
  ${TREE_ART === 'trees-r03' ? `if (tUv.x > 23.0 && tUv.x < 25.0) {
    vec3 p = flwBarkPosition;
    float cloud = sin(p.x * 2.4 + sin(p.y * .65)) * sin(p.z * 2.7 - p.y * .33);
    float grain = sin(p.x * 6.2 + p.z * 4.7 + sin(p.y * 1.4));
    float fold = pow(max(0.0, sin(p.x * 10.0 + p.z * 8.0 + sin(p.y * 1.1) * .8)), 10.0);
    vec2 flow = flwBeechFlow(tUv);
    float footprint = length(vec2(dFdx(flow.x * 6.0), dFdy(flow.x * 6.0)));
    float groove = mix(flwBeechGroove(flow), .20, smoothstep(.7, 2.5, footprint));
    float tone = .90 + .055 * cloud + .025 * grain - .035 * fold - .19 * groove * (1.0 - smoothstep(24.0, 48.0, length(vViewPosition)));
    sampledDiffuseColor = vec4(tone * .99, tone, tone * 1.015, 1.0);
  } else` : ''}
  ${oakBark ? `if (tUv.x > 15.0 && tUv.x < 17.0) { sampledDiffuseColor = texture2D(flwOakBark, vec2(((tUv.x - 16.0) * 4.0 - ${GUT}) / ${1 - 2 * GUT}, tUv.y * .65)); } else` : ''}
  ${pineBark ? `if (tUv.x > 19.0 && tUv.x < 21.0) { sampledDiffuseColor = texture2D(flwPineBark, vec2(((tUv.x - 20.0) * 4.0 - ${GUT}) / ${1 - 2 * GUT}, tUv.y * .45)); } else` : ''}
  ${sprays ? `if (tUv.x > 127.0) { ${SPRAY_SAMPLE} sampledDiffuseColor = texture2D(flwSprays, flwAtlasUv); if (sampledDiffuseColor.a < 0.4) discard; } else` : ''}
  if (tUv.x > ${(LEAF_U / 2).toFixed(1)}) {
    vec2 lUv = vec2(fract(tUv.x), tUv.y * 0.5);
    vec2 aUv = vec2((3.0 + ${GUT.toFixed(2)} + lUv.x * ${(1 - 2 * GUT).toFixed(2)}) * 0.25, lUv.y);
    vec2 k = vec2(${((1 - 2 * GUT) / ATLAS_COLS).toFixed(4)}, 0.5);
    sampledDiffuseColor = textureGrad(map, aUv, dFdx(tUv) * k, dFdy(tUv) * k);
  } else {
    sampledDiffuseColor = texture2D(map, tUv);
  }
  diffuseColor *= sampledDiffuseColor;
#endif`);
  };
  tree.customProgramCacheKey = () => GARDEN_DETAIL ? 'woodkit-garden-leaves-r08' : VEGETATION_DETAIL ? 'woodkit-shrubs-timber-relief-r04' : pineBark ? 'woodkit-tree-atlas-families-beech-relief-r03' : oakBark ? 'woodkit-tree-atlas-oak-r03' : sprays ? 'woodkit-tree-atlas-sprays-r02' : 'woodkit-tree-atlas';
  if (sprays) {
    const depth = new THREE.MeshDepthMaterial({ map: atlas, depthPacking: THREE.RGBADepthPacking });
    depth.onBeforeCompile = sh => {
      sh.uniforms.flwSprays = { value: sprays };
      sh.fragmentShader = 'uniform sampler2D flwSprays;\n' + sh.fragmentShader;
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `if (vMapUv.x > 127.0) { vec2 tUv = vMapUv; ${SPRAY_SAMPLE} if (texture2D(flwSprays, flwAtlasUv).a < 0.4) discard; }`);
    };
    depth.customProgramCacheKey = () => 'woodkit-sprays-shadow-r02';
    tree.userData.vegetationDepth = depth;
  }
  tree.userData.auroraOwnedTextures=[atlas,sprays,oakBark,pineBark,strata].filter(Boolean);
  wm = { tree: auroraTreeSurface(tree), rock: lam({ map: strata }), flat: lam({}) }; // DEV-04C authored surfaces
  return wm;
}

export function disposeBirchMaterials():void {
 if(!wm)return;
 const owned=wm.tree.userData.auroraOwnedTextures as (THREE.Texture|undefined)[];
 for(const t of owned??[])t?.dispose();
 (wm.tree.userData.vegetationDepth as THREE.Material|undefined)?.dispose();
 wm.tree.dispose();wm.rock.dispose();wm.flat.dispose();
 wm=null;
}
