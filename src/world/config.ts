export const WORLD = {
  seed: 26092026,
  halfWidth: 3000,
  halfLength: 4000,
  seaLevel: 0,
  tarnLevel: 360,
  tileSize: 500,
  tileNearSegments: 64,
  tileFarSegments: 16,
  nearRadius: 1000,
  farRadius: 1520,
  water: {
    tarn: { x: 1250, z: 2200, rx: 400, rz: 270 },
    river: [
      { x: 950, z: 2010, level: 360, width: 12 },
      { x: 780, z: 1700, level: 290, width: 12 },
      { x: 650, z: 1300, level: 210, width: 14 },
      { x: 650, z: 900, level: 165, width: 15 },
      { x: 610, z: 400, level: 115, width: 16 },
      { x: 500, z: -150, level: 80, width: 18 },
      { x: 450, z: -600, level: 55, width: 20 },
      { x: 500, z: -1050, level: 32, width: 30 },
      { x: 620, z: -1450, level: 22, width: 44 },
      { x: 700, z: -1850, level: 14, width: 34 },
      { x: 900, z: -2250, level: 8, width: 18 },
      { x: 1080, z: -2660, level: 3, width: 28 },
      { x: 1250, z: -3050, level: 0, width: 42 }
    ],
  },
  viewpoints: [
    { name: 'Home Cove', x: 1810, z: -3000 },
    { name: 'Birchwood Forest', x: -750, z: -650 },
    { name: 'Central Valley', x: 50, z: -310 },
    { name: 'Cairn Saddle', x: 100, z: 650 },
    { name: 'High Tarn', x: 820, z: 2180 },
    { name: 'Windward Coast', x: -2350, z: 180 },
    { name: 'South Shoulder', x: -1050, z: -2550 },
    { name: 'Hidden Fold', x: 1050, z: 150 },
    { name: 'Dune Fields', x: 2150, z: -1700 },
  ]
} as const;
export type WaterPoint = { x: number; z: number; level: number; width: number };
export const LAKES = [
 {...WORLD.water.tarn,level:WORLD.tarnLevel,name:'High Tarn'},
 {x:1350,z:150,rx:250,rz:180,level:105,name:'Hidden Fold'},
 {x:-1450,z:650,rx:180,rz:130,level:85,name:'Birchwood upper lake'},
 {x:-1000,z:-1050,rx:180,rz:140,level:55,name:'Birchwood lower lake'},
] as const;
export const WATERCOURSES:readonly (readonly WaterPoint[])[] = [WORLD.water.river,
 [{x:1110,z:90,level:105,width:8},{x:1000,z:-200,level:80,width:8},{x:750,z:-450,level:61,width:9},{x:450,z:-600,level:55,width:10}],
 [{x:-1610,z:600,level:85,width:6},{x:-1930,z:460,level:50,width:7},{x:-2500,z:400,level:0,width:12}],
 [{x:-1170,z:-1100,level:55,width:6},{x:-1740,z:-1400,level:30,width:8},{x:-2400,z:-1660,level:0,width:12}],
];
export const BRIDGE={x0:830,x1:970,z:-2250,halfWidth:3} as const;
