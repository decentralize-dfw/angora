"""Publish explicitly labelled model surface totals, never guessed room splits.

The source finish mesh connects several named rooms. Those components must not
be assigned to individual rooms automatically. Store only floor-level union
areas, with the split-level salon and openings retained.
"""
import json,gzip,hashlib
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
path=ROOT/'build/web/full/rooms.json';data=json.loads(path.read_text())
geometry=json.load(gzip.open(ROOT/'build/intermediate/review-geometry.json.gz','rt'))
areas=[]
for f,datum in enumerate(data['floor_datums_m']):
    polygons=[];sources=[]
    for o in geometry:
        if not o['name'].startswith('F'+str(f)+' ') or not o['props'].get('source_layer','').endswith('$ZEMİN KAPLAMA'):continue
        tri=np.array(o['vertices'])[o['triangles']]
        tri=tri[(np.ptp(tri[:,:,2],axis=1)<.0001)&(tri[:,:,2].mean(1)>datum-.401)&(tri[:,:,2].mean(1)<datum+.121)]
        polygons.extend(Polygon(t[:,:2]) for t in tri);sources.append(o['name'])
    surface=unary_union(polygons)
    assert surface.is_valid and 30<surface.area<180,(f,surface.area)
    areas.append({'floor_index':f,'area_m2':round(surface.area,3),
        'method':'horizontal_union_of_source_floor_finish_faces_including_split_levels',
        'method_label':'Modeldeki kaplama izdüşümü','source_objects':sources,
        'survey_verified':False,'legal_net_area':False,'includes_wall_footprints_or_unpartitioned_faces':'source-dependent',
        'source_architecture_sha256':data['source_architecture_sha256']})
data['floor_areas']=areas
garden=json.loads((ROOT/'build/garden-terraces-r26.json').read_text())
data['site_areas']=[{'name':p['name']+' · arazi yüzeyi','area_m2':p['terrain_surface_area_m2'],
    'estimated':True,'evidence':p['evidence'],'method':'retained_terrain_triangle_horizontal_coverage; excludes existing source holes',
    'survey_verified':False} for p in garden['pads']]
data['site_areas'].append({'name':'Havuz · tahmini su yüzeyi','area_m2':32,'estimated':True,
    'evidence':'8 x 4 m photo-based modelling assumption, not a measured dimension','survey_verified':False})
data['area_notes']={'rooms':'Individual source room partitions remain unverified; no automatic component-to-room area assignment.',
 'floors':'Source model finish projection, not net usable, registered or surveyed floor area.',
 'site':'Approximate terrain coverage within interpreted garden boundary; not parcel area.'}
path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
mp=path.parent/'manifest.json';manifest=json.loads(mp.read_text())
manifest['room_annotations']={'file':path.name,'bytes':path.stat().st_size,'sha256':sha(path)}
mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'build/area-info-qa.json').write_text(json.dumps({'floor_areas':areas,'site_areas':data['site_areas'],
    'individual_room_areas_published':0,'unverified_room_partitions_excluded':True},ensure_ascii=False,indent=2))
print('AREA_INFO',[(a['floor_index'],a['area_m2']) for a in areas],flush=True)
