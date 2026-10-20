/** Author-set WORLD-01 trail anchors. Grade and turn-radius refinement remains WORLD-02. */
export const ROUTES={
 'Forest → Saddle': [[1730,-2670],[1470,-2340],[1250,-2010],[930,-1620],[650,-1120],[390,-640],[300,-200],[180,260],[0,910]] as [number,number][],
 'Dune Coast': [[1730,-2670],[1320,-2840],[900,-3100],[180,-3200],[-540,-3000],[-1250,-2830],[-1650,-1900],[-2050,-1250],[-2350,-650]] as [number,number][],
 'Alpine Ascent': [[0,910],[100,1280],[310,1580],[450,1960],[400,2320],[710,2590]] as [number,number][],
 'Hidden Fold': [[390,-640],[-70,-150],[-620,130],[-1280,380],[-930,830],[0,910]] as [number,number][],
 'Windward Rim': [[-2440,-620],[-2490,180],[-2170,910],[-1690,1520],[-930,2010]] as [number,number][],
} as const;
