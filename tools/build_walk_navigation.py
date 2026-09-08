"""A compact, source-derived walking surface with walls, furnishings and headroom.

Four overlapping height fields retain the actual stairs. The browser chooses
only neighboring surfaces within a 24 cm step, so a gallery never becomes a
walkable bridge. Collisions use a 19 cm body radius and 1.65 m head clearance.
"""
import json,gzip,hashlib
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
from shapely import contains_xy
ROOT=Path(__file__).resolve().parents[1]
objects=json.load(gzip.open(ROOT/'build/intermediate/review-geometry.json.gz','rt'))
inventory=json.loads((ROOT/'build/intermediate/review-inventory.json').read_text())
atlas=json.loads((ROOT/'build/web/full/sections.json').read_text())
rooms=json.loads((ROOT/'build/web/full/rooms.json').read_text())
datums=np.array(rooms['floor_datums_m']);step=.12
x0,z0=-6.6,-9.4;nx,nz=123,129
gx,gz=np.meshgrid(x0+(np.arange(nx)+.5)*step,z0+(np.arange(nz)+.5)*step)
xy=np.column_stack([gx.ravel(),-gz.ravel()]);heights=np.array([s['height'] for s in atlas['slices']])
walls=[]
for s in atlas['slices']:
    p=np.array(s['p']).reshape(-1,2)*[1,-1]
    walls.append(unary_union([Polygon(p[s['i'][i:i+3]]) for i in range(0,len(s['i']),3)]).buffer(.19))
def raster(tris,target,minimum=False):
    for tri in tris:
        low=tri[:,:2].min(0);high=tri[:,:2].max(0)
        mask=(xy[:,0]>=low[0]-.0001)&(xy[:,0]<=high[0]+.0001)&(xy[:,1]>=low[1]-.0001)&(xy[:,1]<=high[1]+.0001)
        ids=np.flatnonzero(mask)
        if not len(ids):continue
        a=tri[0,:2];u=tri[1,:2]-a;v=tri[2,:2]-a;q=xy[ids]-a
        det=u[0]*v[1]-u[1]*v[0]
        if abs(det)<1e-9:continue
        b=(q[:,0]*v[1]-q[:,1]*v[0])/det;c=(u[0]*q[:,1]-u[1]*q[:,0])/det
        valid=(b>=-.00001)&(c>=-.00001)&(b+c<=1.00001)
        ids=ids[valid];z=tri[0,2]+b[valid]*(tri[1,2]-tri[0,2])+c[valid]*(tri[2,2]-tri[0,2])
        if minimum:target[ids]=np.minimum(target[ids],z)
        else:target[ids]=np.maximum(target[ids],z)
def triangles(o):return np.array(o['vertices'])[o['triangles']]
layers=[];surfaces=[];masks=[]
for f,datum in enumerate(datums):
    support=np.full(len(xy),-np.inf);ceiling=np.full(len(xy),np.inf)
    for o in objects:
        layer=o['props'].get('source_layer','');of=o['props'].get('floor_index')
        if of is None and o['name'].startswith('F'):of=int(o['name'][1])
        if layer.endswith(('$ZEMİN','$ZEMİN KAPLAMA','$MERDİVEN')) and of==f:
            tris=triangles(o)
            # Horizontal finish/floor triangles only. Stair treads are retained
            # up to the next landing, while vertical risers have zero XY area.
            if not layer.endswith('$MERDİVEN'):tris=tris[tris[:,:,2].max(1)<datum+.13]
            raster(tris,support)
        if ('TAVAN' in layer and of==f) or (f==3 and layer in ['ÇATII','ÇATI ALIN']):
            tris=triangles(o);tris=tris[tris[:,:,2].max(1)>datum+.35]
            raster(tris,ceiling,True)
    supported=np.isfinite(support);mask=np.zeros(len(xy),dtype=np.uint8);mask[~supported]=1
    mask[supported&(ceiling-support<1.65)]=1
    for height in [.3,.95,1.62]:
        nearest=np.searchsorted(heights,np.where(supported,support+height,0)).clip(0,len(heights)-1)
        for index in np.unique(nearest[supported]):
            ids=np.flatnonzero(supported&(nearest==index));wall=walls[index]
            mask[ids[contains_xy(wall,xy[ids,0],xy[ids,1])]]|=1
    for o in inventory:
        if o['category']=='10_ARCHITECTURE' or o['props'].get('source_layer'):continue
        lo,hi=np.array(o['bounds']);size=hi-lo
        if hi[2]<datum+.15 or lo[2]>datum+3.3:continue
        if o['category']!='30_FURNITURE_PLACEHOLDERS' and any(s in o['name'].lower() for s in ['curtain','pendant','chandelier','ceiling','cord','diffuser']):continue
        inside=(xy[:,0]>lo[0]-.19)&(xy[:,0]<hi[0]+.19)&(xy[:,1]>lo[1]-.19)&(xy[:,1]<hi[1]+.19)
        inside&=supported&(support+.12<hi[2])&(support+1.65>lo[2])
        mask[inside]|=2 if o['category']=='30_FURNITURE_PLACEHOLDERS' else 1
    # Closed source door leaves are real obstacles; a room picker provides
    # direct access to rooms whose doors are closed in the reference model.
    for o in objects:
        if o['props'].get('source_layer') not in ['KAPI İÇ$KAPI','PENCERE_KAPI$CAM'] or not o['name'].startswith('F'+str(f)+' '):continue
        polys=[]
        for tri in triangles(o):
            poly=Polygon(tri[:,:2])
            polys.append(poly if poly.area>1e-8 else LineString(tri[:,:2]))
        mask[contains_xy(unary_union(polys).buffer(.19),xy[:,0],xy[:,1])]|=1
    grid=support.reshape(nz,nx);flags=mask.reshape(nz,nx);rows=[]
    for row in range(nz):
        runs=[];col=0
        while col<nx:
            if not np.isfinite(grid[row,col]):col+=1;continue
            start=col;h=round(grid[row,col]*1000);flag=int(flags[row,col]);col+=1
            while col<nx and np.isfinite(grid[row,col]) and round(grid[row,col]*1000)==h and int(flags[row,col])==flag:col+=1
            runs.append([start,col-start,h,flag])
        rows.append(runs)
    layers.append({'floor_index':f,'rows':rows,'supported_cells':int(supported.sum()),'walkable_furnished_cells':int(sum(supported&(mask==0)))})
    surfaces.append(support);masks.append(mask)
    print('WALK_LAYER',f,layers[-1]['supported_cells'],layers[-1]['walkable_furnished_cells'],flush=True)
stations=[]
for room in rooms['rooms']:
    f=room['floor_index'];x,y,z=room['position'];distance=np.linalg.norm(xy-[x,-z],axis=1)
    valid=(masks[f]==0)&np.isfinite(surfaces[f])&(abs(surfaces[f]-(y-.026))<.15)
    ids=np.flatnonzero(valid)
    assert len(ids),(room['id'],'no reachable room surface')
    index=ids[np.argmin(distance[ids])]
    assert distance[index]<1.9,(room['id'],'no nearby safe station',distance[index])
    # Face into the longest clear part of the room on entry. This is a camera
    # choice, not a measured architectural direction. Photo-reviewed rooms
    # have a useful explicit focal point instead.
    origin=xy[index];best_yaw=0.;best_clear=-1.
    for yaw in np.linspace(-np.pi,np.pi,48,endpoint=False):
        direction=np.array([-np.sin(yaw),np.cos(yaw)]);clear=0.
        for distance_m in np.arange(.12,4.01,.12):
            probe=origin+direction*distance_m
            col=int(np.floor((probe[0]-x0)/step));row=int(np.floor((-probe[1]-z0)/step))
            if not (0<=col<nx and 0<=row<nz):break
            target=row*nx+col
            if masks[f][target] or not np.isfinite(surfaces[f][target]) or abs(surfaces[f][target]-surfaces[f][index])>.24:break
            clear=distance_m
        if clear>best_clear:best_clear=clear;best_yaw=yaw
    targets={'f2-105':(-4.1,3.05),'f3-C05':(-3.85,3.025),'f2-102':(-3.35,6.35),'f3-C02':(-2.7,6.5)}
    if room['id'] in targets:
        delta=np.array(targets[room['id']])-origin
        best_yaw=float(np.arctan2(-delta[0],delta[1]))
    stations.append({'room_id':room['id'],'name':room['name'],'floor_index':f,
       'view_yaw_rad':round(float(best_yaw),4),'view_pitch_rad':-.06,
       'position':[round(xy[index,0],4),round(surfaces[f][index]+1.62,4),round(-xy[index,1],4)],
       'anchor_distance_m':round(float(distance[index]),3)})
data={'version':1,'coordinate_system':'glTF_Y_up','grid':{'x':x0,'z':z0,'step':step,'width':nx,'height':nz},
      'body_radius_m':.19,'eye_height_m':1.62,'minimum_headroom_m':1.65,'maximum_step_m':.24,
      'mask_bits':{'static_obstacle':1,'furniture':2},'layers':layers,'stations':stations,
      'source_architecture_sha256':atlas['source_architecture_sha256'],
      'source_furniture_sha256':hashlib.sha256((ROOT/'build/blender/layers/30-furniture-placeholders.blend').read_bytes()).hexdigest()}
data['lights']=json.loads((ROOT/'build/intermediate/review-lights.json').read_text())
path=ROOT/'build/web/full/navigation.json';path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
mp=path.parent/'manifest.json';manifest=json.loads(mp.read_text());manifest['navigation']={'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()};mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('WALK_NAVIGATION',path.stat().st_size,len(stations),flush=True)
