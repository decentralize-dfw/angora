"""Reuse reviewed cap geometry only after proving that all wall triangles match.

Use after an edit to nonstructural fixtures. Re-export the current wall triangles
first; pass a saved pre-edit wall-triangles.json as the sole argument. If any
wall changes this tool stops and build_section_atlas.py must be used instead.
"""
import json,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
old=json.loads(Path(sys.argv[1]).read_text())
new=json.loads((ROOT/'build/intermediate/wall-triangles.json').read_text())
path=ROOT/'build/web/full/sections.json';raw=path.read_bytes();atlas=json.loads(raw)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert atlas['source_architecture_sha256']==old['library_hashes']['10-architecture.blend']
assert atlas['source_fittings_sha256']==old['library_hashes']['20-fixed-fittings.blend']
assert sorted(old['objects'])==sorted(new['objects'])
def fingerprint(data):
    # Compare actual triangle coordinates, independent of mesh enumeration.
    triangles=sorted(tuple(sorted(tuple(round(v,7) for v in p) for p in t)) for t in data['triangles'])
    return hashlib.sha256(json.dumps(triangles,separators=(',',':')).encode()).hexdigest()
before=fingerprint(old);after=fingerprint(new)
assert before==after,'Wall geometry changed; rebuild the section atlas'
for name in ['10-architecture.blend','20-fixed-fittings.blend']:
    assert new['library_hashes'][name]==sha(ROOT/'build/blender/layers'/name),'Wall cache is stale'
atlas['source_architecture_sha256']=new['library_hashes']['10-architecture.blend']
atlas['source_fittings_sha256']=new['library_hashes']['20-fixed-fittings.blend']
proof={'method':'all_world_space_wall_triangles_equal_at_0.1_micrometre_precision',
       'wall_objects':len(new['objects']),'wall_triangles':len(new['triangles']),
       'wall_geometry_sha256':after,'prior_section_file_sha256':hashlib.sha256(raw).hexdigest()}
atlas['reuse_verification']=proof;path.write_text(json.dumps(atlas,separators=(',',':')))
record={'file':path.name,'bytes':path.stat().st_size,'sha256':sha(path)}
mp=path.parent/'manifest.json';manifest=json.loads(mp.read_text())
manifest.update(section_caps='prepared_geometric_wall_contours',section_atlas=record)
mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
qp=ROOT/'build/wall-section-qa.json';qa=json.loads(qp.read_text());qa.update(file=record,
 source_architecture_sha256=atlas['source_architecture_sha256'],source_fittings_sha256=atlas['source_fittings_sha256'],reuse_verification=proof)
qp.write_text(json.dumps(qa,indent=2));print('UNCHANGED_WALL_GEOMETRY',json.dumps(proof),flush=True)
