"""CAD surface sections for checking room ownership and furnishing clearances."""
import gzip,json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

ROOT=Path(__file__).resolve().parents[1]
data=json.load(gzip.open(ROOT/'build/cad/surfaces.json.gz','rt'))
fig,axes=plt.subplots(2,2,figsize=(12,12),constrained_layout=True)
for idx,(ax,base) in enumerate(zip(axes.flat,data['floor_z'])):
    groups={'wall':[],'window':[],'door':[]}
    level=base+1.15
    for layer in data['layers']:
        name=layer['source_layer']
        group='window' if name.endswith('$CAM') else ('wall' if '$DUVAR' in name else ('door' if 'KAPI' in name and '$SHUTTER' not in name else None))
        if group is None:continue
        vv=np.asarray(layer['vertices'])
        for face in layer['faces']:
            pp=vv[face];zz=pp[:,2]
            if not min(zz)<level<max(zz):continue
            hits=[]
            for a,b in zip(pp,np.roll(pp,-1,axis=0)):
                if (a[2]-level)*(b[2]-level)<0:
                    t=(level-a[2])/(b[2]-a[2]);hits.append((a+(b-a)*t)[:2])
            if len(hits)==2:groups[group].append(hits)
    for group,color,width in [('wall','#24292F',1.2),('door','#915A30',.75),('window','#178CA1',1.0)]:
        ax.add_collection(LineCollection(groups[group],colors=color,linewidths=width))
    ax.set(xlim=(-6.5,8.0),ylim=(-6,9.2),aspect='equal',title=f'F{idx} — z = {level:.2f} m',xlabel='X (m)',ylabel='Y (m)')
    ax.set_xticks(range(-6,9));ax.set_yticks(range(-6,10));ax.grid(alpha=.2)
fig.savefig(ROOT/'build/reference/cad-floor-sections.png',dpi=150)
