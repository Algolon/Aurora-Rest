/** GLSL injected into MeshStandardMaterial. All material inputs are world-space (geographic object space of the
 * terrain tiles), so the result is independent of tile boundaries, vertex order and mesh resolution. */

export const DEBUG_VIEWS=['off','weights','dominant','slope','wetness','macro','exposure','blended','raw-weights','albedo','detail-normal','lattice'] as const;
export type DebugView=typeof DEBUG_VIEWS[number];

export const VERTEX_PARS=/* glsl */`
varying vec3 vGeo;
varying vec3 vGeoN;
varying vec3 vGX;
varying vec3 vGY;
varying vec3 vGZ;
varying float vViewDist;
`;
export const VERTEX_MAIN=/* glsl */`
vGeo=position;vGeoN=normal;
vGX=normalize(normalMatrix*vec3(1.,0.,0.));vGY=normalize(normalMatrix*vec3(0.,1.,0.));vGZ=normalize(normalMatrix*vec3(0.,0.,1.));
vViewDist=length(mvPosition.xyz);
`;

export const FRAGMENT_PARS=/* glsl */`
varying vec3 vGeo;
varying vec3 vGeoN;
varying vec3 vGX;
varying vec3 vGY;
varying vec3 vGZ;
varying float vViewDist;
uniform highp sampler2DArray uWeights;
uniform highp sampler2D uAttributes;
uniform highp sampler2DArray uAlbedo;
uniform highp sampler2DArray uSurface;
uniform vec4 uLattice;
uniform vec2 uMapSize;
uniform vec4 uMatScale[MAT_COUNT];
uniform vec4 uMatWet[MAT_COUNT];
uniform vec3 uMatMacroA[MAT_COUNT];
uniform vec3 uMatMacroB[MAT_COUNT];
uniform vec3 uMatExposure[MAT_COUNT];
uniform vec4 uMatPatch[MAT_COUNT];
uniform vec4 uMatMisc[MAT_COUNT]; // patch coverage, triplanar flag, streak strength, meso amount
uniform vec3 uMatMean[MAT_COUNT];
uniform vec3 uDebugColor[MAT_COUNT];
uniform vec2 uDetailFade;
uniform vec2 uFarBlend;
uniform vec2 uAntiTile;
uniform float uHeightBlend;
uniform float uNormalScale;
uniform float uTriplanarOn;
uniform int uDebug;
uniform int uForce;
float tmHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float tmNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(tmHash(i),tmHash(i+vec2(1,0)),f.x),mix(tmHash(i+vec2(0,1)),tmHash(i+vec2(1,1)),f.x),f.y);}
float tmFbm(vec2 p){return .6*tmNoise(p)+.3*tmNoise(p*2.13+17.)+.1*tmNoise(p*4.41+31.);}
#ifdef TM_BAKED_NOISE
// MAT-01P candidate: one filtered fetch from a tileable baked fBm instead of three value-noise octaves. p is in tmFbm
// lattice units; gradients are passed explicitly because callers run inside per-material (non-uniform) branches.
uniform highp sampler2D uNoise;
uniform float uNoisePeriod;
vec4 tmFbmB(vec2 p,vec2 dx,vec2 dy){return textureGrad(uNoise,p/uNoisePeriod,dx/uNoisePeriod,dy/uNoisePeriod);}
#endif
vec3 tmSlopeColor(float s){return s<.12?vec3(.569,.733,.565):s<.25?vec3(.851,.835,.490):s<.35?vec3(.906,.667,.376):s<.6?vec3(.792,.416,.325):vec3(.424,.212,.365);}
`;

/** Replaces <map_fragment>: computes albedo, roughness and the world-space detail normal. */
export const FRAGMENT_MATERIAL=/* glsl */`
vec3 tmGeoN=normalize(vGeoN);
vec2 tmXZ=vGeo.xz;
vec2 tmMapUV=vec2((tmXZ.x-uLattice.x)/uLattice.z+.5,(uLattice.y-tmXZ.y)/uLattice.z+.5)/uMapSize;
float tmW[MAT_COUNT];
for(int l=0;l<MAT_LAYERS;l++){vec4 q=texture(uWeights,vec3(tmMapUV,float(l)));
 for(int c=0;c<4;c++){int m=l*4+c;if(m<MAT_COUNT)tmW[m]=q[c];}}
vec4 tmAttr=texture(uAttributes,tmMapUV);
float tmWet=tmAttr.r,tmMacro=tmAttr.g,tmExpo=tmAttr.b;
if(uForce>=0){for(int m=0;m<MAT_COUNT;m++)tmW[m]=m==uForce?1.:0.;}
float tmSum=0.;for(int m=0;m<MAT_COUNT;m++)tmSum+=tmW[m];
for(int m=0;m<MAT_COUNT;m++)tmW[m]/=max(tmSum,1e-4);
float tmNear=1.-smoothstep(uDetailFade.x,uDetailFade.y,vViewDist);
float tmFar=smoothstep(uFarBlend.x,uFarBlend.y,vViewDist);
vec3 tmTri=pow(abs(tmGeoN),vec3(4.));tmTri/=dot(tmTri,vec3(1.));
bool tmSteep=uTriplanarOn>.5&&tmTri.y<.94;
vec3 tmDx=dFdx(vGeo),tmDy=dFdy(vGeo);
vec4 tmAlb[MAT_COUNT];vec4 tmSrf[MAT_COUNT];vec3 tmPert[MAT_COUNT];float tmScore[MAT_COUNT];
float tmBest=-10.;
for(int m=0;m<MAT_COUNT;m++){
 tmScore[m]=-10.;tmAlb[m]=vec4(0.);tmSrf[m]=vec4(.5,.5,1.,1.);tmPert[m]=vec3(0.);
 if(tmW[m]<.003)continue;
 float s=uMatScale[m].x,layer=float(m);
 vec4 a=textureGrad(uAlbedo,vec3(tmXZ*s,layer),tmDx.xz*s,tmDy.xz*s);
 vec4 sf=textureGrad(uSurface,vec3(tmXZ*s,layer),tmDx.xz*s,tmDy.xz*s);
#ifdef TM_ANTITILE
 if(vViewDist<uAntiTile.x){
  // Anti-tiling: a second sample, rotated and rescaled per material, revealed by a world-space mask with a
  // height-aware edge. The tile grid stops lining up without blurring the texture.
  float ang=1.1+float(m)*.9,co=cos(ang),si=sin(ang);mat2 R=mat2(co,-si,si,co)*.81;
  vec2 o2=vec2(float(m)*.37+.21,float(m)*-.53+.67);
  vec4 a2=textureGrad(uAlbedo,vec3(R*(tmXZ*s)+o2,layer),R*(tmDx.xz*s),R*(tmDy.xz*s));
  vec4 s2=textureGrad(uSurface,vec3(R*(tmXZ*s)+o2,layer),R*(tmDx.xz*s),R*(tmDy.xz*s));
#ifdef TM_BAKED_NOISE
  float k=smoothstep(-.08,.08,tmFbmB(tmXZ*uAntiTile.y+vec2(float(m)*5.1,1.7),tmDx.xz*uAntiTile.y,tmDy.xz*uAntiTile.y).r-.5+(a2.a-a.a)*.35)*(1.-smoothstep(uAntiTile.x*.7,uAntiTile.x,vViewDist));
#else
  float k=smoothstep(-.08,.08,tmFbm(tmXZ*uAntiTile.y+vec2(float(m)*5.1,1.7))-.5+(a2.a-a.a)*.35)*(1.-smoothstep(uAntiTile.x*.7,uAntiTile.x,vViewDist));
#endif
  // Rotate the second sample's tangent normal back into the world frame.
  vec2 n2=s2.rg*2.-1.;n2=vec2(co*n2.x-si*n2.y,si*n2.x+co*n2.y);s2.rg=n2*.5+.5;
  a=mix(a,a2,k);sf=mix(sf,s2,k);
 }
#endif
 vec2 tn=sf.rg*2.-1.;
 vec3 pert=vec3(tn.x,0.,tn.y);
 if(tmSteep&&uMatMisc[m].y>.5){
  // Selective triplanar: only the materials that request it, only where the surface is steep.
  vec4 ax=textureGrad(uAlbedo,vec3(vGeo.zy*s,layer),tmDx.zy*s,tmDy.zy*s),sx=textureGrad(uSurface,vec3(vGeo.zy*s,layer),tmDx.zy*s,tmDy.zy*s);
  vec4 az=textureGrad(uAlbedo,vec3(vGeo.xy*s,layer),tmDx.xy*s,tmDy.xy*s),sz=textureGrad(uSurface,vec3(vGeo.xy*s,layer),tmDx.xy*s,tmDy.xy*s);
  vec2 tx=sx.rg*2.-1.,tz=sz.rg*2.-1.;
  a=ax*tmTri.x+a*tmTri.y+az*tmTri.z;sf=sx*tmTri.x+sf*tmTri.y+sz*tmTri.z;
  pert=vec3(0.,tx.y,tx.x)*tmTri.x+pert*tmTri.y+vec3(tz.x,tz.y,0.)*tmTri.z;
 }
#ifdef TM_MESO
 // Meso tone (≈ 3–20 m): procedural world-space noise, so it can never repeat with the detail tile.
#ifdef TM_BAKED_NOISE
 float ms=uMatScale[m].y;float mn=tmFbmB(tmXZ*ms+vec2(float(m)*37.1,-11.7),tmDx.xz*ms,tmDy.xz*ms).g-.5;
#else
 float ms=uMatScale[m].y;float mn=tmFbm(tmXZ*ms+vec2(float(m)*37.1,-11.7))-.5;
#endif
 a.rgb*=1.+mn*uMatMisc[m].w*vec3(1.,.86,.72);
#endif
 tmAlb[m]=a;tmSrf[m]=sf;tmPert[m]=pert;
 float edge=4.*tmW[m]*(1.-tmW[m]);
#ifdef TM_BAKED_NOISE
 tmScore[m]=tmW[m]+((a.a-.5)*uMatScale[m].w*min(1.,tmW[m]*4.)+(tmFbmB(tmXZ*.31+vec2(float(m)*7.3,2.9),tmDx.xz*.31,tmDy.xz*.31).b-.5)*.5*edge)*uHeightBlend;
#else
 tmScore[m]=tmW[m]+((a.a-.5)*uMatScale[m].w*min(1.,tmW[m]*4.)+(tmFbm(tmXZ*.31+vec2(float(m)*7.3,2.9))-.5)*.5*edge)*uHeightBlend;
#endif
 tmBest=max(tmBest,tmScore[m]);
}
float tmB[MAT_COUNT];float tmTot=0.;
for(int m=0;m<MAT_COUNT;m++){
 float hb=tmScore[m]<-5.?0.:max(tmScore[m]-(tmBest-.14),0.);
 tmB[m]=mix(tmW[m],hb,uHeightBlend>0.?1.:0.);tmTot+=tmB[m];}
for(int m=0;m<MAT_COUNT;m++)tmB[m]/=max(tmTot,1e-4);
vec3 tmCol=vec3(0.);float tmRough=0.;vec3 tmPertSum=vec3(0.);
for(int m=0;m<MAT_COUNT;m++){
 if(tmB[m]<=0.)continue;
 vec3 tint=mix(uMatMacroA[m],uMatMacroB[m],smoothstep(.22,.78,tmMacro))*mix(vec3(1.),uMatExposure[m],tmExpo);
 vec3 c=tmAlb[m].rgb*mix(1.,tmSrf[m].b,.6*(1.-tmFar));
 // Meso patches (1–8 m): irregular, height-aware, art-directed tint per material.
#ifdef TM_BAKED_NOISE
 float pw=uMatPatch[m].w;
 float pn=.62*tmFbmB(tmXZ*pw+vec2(float(m)*13.7,float(m)*5.3),tmDx.xz*pw,tmDy.xz*pw).a+.38*tmFbmB(tmXZ*pw*.23+vec2(float(m)*3.1,9.2),tmDx.xz*pw*.23,tmDy.xz*pw*.23).r;
#else
 float pn=.62*tmFbm(tmXZ*uMatPatch[m].w+vec2(float(m)*13.7,float(m)*5.3))+.38*tmFbm(tmXZ*uMatPatch[m].w*.23+vec2(float(m)*3.1,9.2));
#endif
 float cov=uMatMisc[m].x;
 float pm=smoothstep(1.-cov-.07,1.-cov+.07,pn+(tmAlb[m].a-.5)*.22);
 c*=mix(vec3(1.),uMatPatch[m].rgb,pm);
 if(uMatMisc[m].z>0.){
  // Weathering streaks: noise stretched downslope (contour × height), only on steep faces.
  vec2 g=tmGeoN.xz;float gl=length(g);
  if(gl>.35){vec2 tc=vec2(-g.y,g.x)/gl;float st=tmFbm(vec2(dot(tmXZ,tc)*.33,vGeo.y*.045));
   c*=1.-uMatMisc[m].z*smoothstep(.35,.75,gl)*smoothstep(.45,.8,st);}
 }
 vec3 farC=uMatMean[m]*mix(vec3(1.),uMatPatch[m].rgb,cov*.85);
 c=mix(c,farC,tmFar)*tint;
 c*=mix(vec3(1.),uMatWet[m].rgb,tmWet);
 tmCol+=c*tmB[m];
 tmRough+=mix(tmSrf[m].a,uMatWet[m].a,tmWet)*tmB[m];
 tmPertSum+=tmPert[m]*uMatScale[m].z*tmB[m];
}
tmPertSum*=tmNear*uNormalScale;
vec3 tmWorldN=normalize(tmGeoN+tmPertSum);
diffuseColor.rgb=tmCol;
vec3 tmDebug=vec3(-1.);
if(uDebug==1){tmDebug=vec3(0.);for(int m=0;m<MAT_COUNT;m++)tmDebug+=uDebugColor[m]*tmW[m];}
else if(uDebug==2){int best=0;for(int m=1;m<MAT_COUNT;m++)if(tmW[m]>tmW[best])best=m;tmDebug=uDebugColor[best];}
else if(uDebug==3)tmDebug=tmSlopeColor(tmAttr.a*1.5);
else if(uDebug==4)tmDebug=mix(vec3(1.,.97,.9),vec3(.12,.36,.78),tmWet);
else if(uDebug==5)tmDebug=vec3(tmMacro);
else if(uDebug==6)tmDebug=mix(vec3(.15,.3,.75),vec3(.95,.75,.2),tmExpo);
else if(uDebug==7){tmDebug=vec3(0.);for(int m=0;m<MAT_COUNT;m++)tmDebug+=uDebugColor[m]*tmB[m];}
else if(uDebug==8)tmDebug=vec3(tmW[0],tmW[1],tmW[2]);
else if(uDebug==11){vec2 g=fract((vec2(tmXZ.x-uLattice.x,uLattice.y-tmXZ.y))/uLattice.z);float e=step(.94,max(g.x,g.y));tmDebug=mix(vec3(.85),vec3(.2),e);}
`;

export const FRAGMENT_ROUGHNESS=/* glsl */`float roughnessFactor=clamp(tmRough,.04,1.);`;
export const FRAGMENT_NORMAL=/* glsl */`normal=normalize(vGX*tmWorldN.x+vGY*tmWorldN.y+vGZ*tmWorldN.z);`;
/** Debug overrides are written after tone mapping/colour-space conversion, so they are exact, unlit and comparable by pixel. */
export const FRAGMENT_DEBUG=/* glsl */`
if(uDebug==9)gl_FragColor=vec4(pow(tmCol,vec3(1./2.2)),1.);
else if(uDebug==10)gl_FragColor=vec4(tmWorldN*.5+.5,1.);
else if(tmDebug.x>=0.)gl_FragColor=vec4(tmDebug,1.);
`;
