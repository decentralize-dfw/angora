"""Recompute first-floor clearance from repaired surfaces and open doorways."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.runtime/finishing'
items=json.loads((OUT/'repaired.json').read_text(encoding='utf-8'))
for item in items:
 if item['part'] not in ['architecture','interior']:continue
 o=bpy.data.objects.get(item['name'])
 if not o:continue
 # Only single-primitive source objects are replaced in this collision copy.
 if len(o.data.materials)>1:continue
 a=item['attributes']['POSITION'];verts=[(a[i],-a[i+2],a[i+1]) for i in range(0,len(a),3)]
 if item['name']=='curtain_sheer':
  verts=[((-4.126+(x+4.126)*.28 if x<-2.5 else -.35+(x+.35)*.28),y,z) if 6.37<z<9.2 and 7.85<y<8.1 else (x,y,z) for x,y,z in verts]
 m=bpy.data.meshes.new(o.name+' collision review');m.from_pydata(verts,[],[item['indices'][i:i+3] for i in range(0,len(item['indices']),3)]);o.data=m;o.matrix_world.identity()
archcols={'building.001','kat_tavan_pimapen.glb.001','BUILDING- 3'}
arch=[];loose=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 cols={c.name for c in o.users_collection}
 if cols&archcols:arch.append(o)
 elif 'İNTERİOR.001' in cols:
  (arch if any(k in o.name.lower() for k in ['floor','tile','stair','wall ceramic']) else loose).append(o)
def tree(objects,support=False):
 vertices=[];faces=[]
 for o in objects:
  if not support and 'door dark walnut' in o.name:continue # openable leaves; jambs remain in wall skins
  n=len(vertices);world=[o.matrix_world@v.co for v in o.data.vertices];vertices.extend(world)
  for p in o.data.polygons:
   coords=[world[i] for i in p.vertices]
   # Clear the photographed balcony doorway, not adjacent window panes.
   if not support and 'glass' in o.name.lower() and all(-2.9<c.x<-1.4 and 7.75<c.y<8.15 and 6.35<c.z<9 for c in coords):continue
   faces.append(tuple(n+i for i in p.vertices))
 return BVHTree.FromPolygons(vertices,faces,all_triangles=False)
static=tree(arch);furniture=tree(loose);support=tree([o for o in arch if any(k in o.name.lower() for k in ['floor','tile','white_trim'])],True)
data=json.loads((ROOT/'build/web/native-current/native-navigation.json').read_text(encoding='utf-8'));g=data['grid'];radius=data['body_radius_m'];head=data['minimum_headroom_m'];eye=data['eye_height_m'];dirs=[Vector((math.cos(i*math.pi/4),math.sin(i*math.pi/4),0)) for i in range(8)]
def blocked(bvh,x,y,h,clearance=radius):
 if bvh.ray_cast(Vector((x,y,h+.08)),Vector((0,0,1)),head)[0] is not None:return True
 return any(bvh.ray_cast(Vector((x,y,h+dz)),d,clearance)[0] is not None for dz in [.25,.85,1.5] for d in dirs)
cells={};rows=[]
for row in range(g['height']):
 for col in range(g['width']):
  x=g['x']+(col+.5)*g['step'];z=g['z']+(row+.5)*g['step'];hit,normal,_,_=support.ray_cast(Vector((x,-z,6.62)),Vector((0,0,-1)),.85)
  if hit is None or abs(normal.z)<.65:continue
  flag=(1 if blocked(static,x,-z,hit.z) else 0)|(2 if blocked(furniture,x,-z,hit.z,.16) else 0);cells[col,row]=(round(hit.z*1000),flag)
 runs=[];col=0
 while col<g['width']:
  if (col,row) not in cells:col+=1;continue
  start=col;h,flag=cells[col,row];col+=1
  while col<g['width'] and cells.get((col,row))==(h,flag):col+=1
  runs.append([start,col-start,h,flag])
 rows.append(runs)
# Bridge only sub-grid threshold seams between supported cells at compatible
# elevations. The actual static/furniture BVHs still veto walls and railings.
thresholds=[]
for row in range(1,g['height']-1):
 for col in range(1,g['width']-1):
  if (col,row) in cells:continue
  for a,b in [((col-1,row),(col+1,row)),((col,row-1),(col,row+1))]:
   if a not in cells or b not in cells or abs(cells[a][0]-cells[b][0])>240:continue
   if cells[a][1]&1 or cells[b][1]&1:continue
   height=max(cells[a][0],cells[b][0]);x=g['x']+(col+.5)*g['step'];z=g['z']+(row+.5)*g['step']
   if blocked(static,x,-z,height/1000):continue
   thresholds.append((col,row,height,2 if blocked(furniture,x,-z,height/1000,.16) else 0));break
for col,row,height,flag in thresholds:cells[col,row]=(height,flag)
rows=[]
for row in range(g['height']):
 runs=[];col=0
 while col<g['width']:
  if (col,row) not in cells:col+=1;continue
  start=col;h,flag=cells[col,row];col+=1
  while col<g['width'] and cells.get((col,row))==(h,flag):col+=1
  runs.append([start,col-start,h,flag])
 rows.append(runs)
data['layers'][2].update(rows=rows,supported_cells=len(cells),walkable_furnished_cells=sum(v[1]==0 for v in cells.values()))
data['threshold_seams']=[{'floor':2,'cell':[c,r],'height_mm':h} for c,r,h,flag in thresholds]
rooms=json.loads((ROOT/'build/web/native-current/native-rooms.json').read_text(encoding='utf-8'))['rooms'];data['stations']=[s for s in data['stations'] if s['floor_index']!=2]
for room in rooms:
 if room['floor_index']!=2 or (room.get('label_only') and room['id'] not in ['f2-109','f2-110']):continue
 x,_,z=room['position'];candidates=[]
 for (c,r),(h,flag) in cells.items():
  if flag:continue
  px=g['x']+(c+.5)*g['step'];pz=g['z']+(r+.5)*g['step'];distance=math.hypot(px-x,pz-z)
  if distance<2:candidates.append((distance,px,h/1000+eye,pz))
 if not candidates:print('NO_STATION',room['id']);continue
 _,px,py,pz=min(candidates);data['stations'].append({'room_id':room['id'],'name':room['name'],'floor_index':2,'position':[px,py,pz],'view_yaw_rad':0,'view_pitch_rad':-.06})
(OUT/'native-navigation.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8');print('NAVIGATION',data['layers'][2]['walkable_furnished_cells'],[(s['room_id'],s['position']) for s in data['stations'] if s['floor_index']==2],flush=True)
for o in arch+loose:
 bvh=tree([o])
 for x,z in [(0.14,-4.94),(-.22,2.62),(-2.2,-8.0)]:
  if blocked(bvh,x,-z,6.371):print('BLOCKER',x,z,o.name,flush=True)
