"""Read-only diagnostic for photo-review differences in the current model."""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
s=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get()
def bounds(o):
    p=[o.matrix_world@Vector(v) for v in o.bound_box]
    return [[min(v[i] for v in p) for i in range(3)],[max(v[i] for v in p) for i in range(3)]]
pool=[];doors=[]
for o in s.objects:
    if o.name.startswith('Pool') and o.type=='MESH':pool.append({'name':o.name,'bounds':bounds(o),'materials':[m.name for m in o.data.materials if m]})
    if o.type=='MESH' and 'door' in o.name.lower() and 'lift' not in o.name.lower():
        b=bounds(o)
        if b[0][1]<-3 and b[0][2]<5:doors.append({'name':o.name,'bounds':b,'materials':[m.name for m in o.data.materials if m]})
probes=[]
for x in [-6.0,-5.8,-5.4,-5.0,-4.78,3.78,4.1,4.5,4.9]:
    for y in [12.8,13.0,13.3,13.6,13.8,17.5,17.8,18.2,18.8]:
        hit,p,n,i,o,_=s.ray_cast(deps,Vector((x,y,.08)),Vector((0,0,-1)),distance=3)
        if not hit or p.z<-.10:probes.append({'xy':[x,y],'hit':o.name if hit else None,'z':p.z if hit else None})
m=bpy.data.materials.get('water') or next((m for m in bpy.data.materials if m.name.lower().endswith('water')),None)
water={}
if m:
    water['name']=m.name
    for n in m.node_tree.nodes:
        if n.type=='BSDF_PRINCIPLED':water['principled']={i.name:list(i.default_value) if hasattr(i.default_value,'__len__') else i.default_value for i in n.inputs if i.name in ['Base Color','Roughness','Transmission Weight','IOR','Alpha']}
        if n.type=='TEX_IMAGE' and n.image:water.setdefault('images',[]).append(n.image.name)
report={'pool':pool,'low_deck_probes':probes,'front_doors':doors,'water':water,'exposure':s.view_settings.exposure,'lights':[{'name':o.name,'type':o.data.type,'energy':o.data.energy} for o in s.objects if o.type=='LIGHT' and o.data.type=='SUN']}
(ROOT/'build/intermediate/review-gaps.json').write_text(json.dumps(report,indent=2))
print('REVIEW_GAPS',len(probes),len(doors),flush=True)
