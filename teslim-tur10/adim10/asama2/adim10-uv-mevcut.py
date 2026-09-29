import bpy,json,numpy as np
from pathlib import Path
A=Path(r'C:\Users\yigit\angora-tur10\adim10');U=A/'uv';data=json.loads((U/'girdi.json').read_text(encoding='utf-8'));bpy.ops.wm.open_mainfile(filepath=str(A/'uv-hazir.blend'))
for r in data['mesh']:
 if not r['atlas']:continue
 me=bpy.data.objects[r['ob']].data;p=np.array([v.co[:] for v in me.vertices],np.float32);ids=np.array([l.vertex_index for l in me.loops]);uv=np.array([d.uv[:] for d in me.uv_layers[0].data],np.float32);combined=np.c_[np.round(p[ids],5),uv];unique,remap=np.unique(combined,axis=0,return_inverse=True);np.savez(U/r['data'],pos=unique[:,:3],uv0=unique[:,3:],idx=remap.reshape(-1,3).astype(np.uint32))
print('[UV] metre UV chart girdisi',flush=True)
