"""Refresh a linked scene after editing its material library, without repacking geometry."""
import bpy, json, hashlib, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from delivery_fingerprint import delivery_snapshot
ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
nodes = scene.world.node_tree.nodes
mapping = next(n for n in nodes if n.type == 'MAPPING')
coords = next(n for n in nodes if n.type == 'TEX_COORD')
scene.world.node_tree.links.new(coords.outputs['Generated'], mapping.inputs['Vector'])
environment = next(n for n in nodes if n.type == 'TEX_ENVIRONMENT')
background = nodes.get('Background')
scene.world.node_tree.links.new(mapping.outputs['Vector'], environment.inputs['Vector'])
scene.world.node_tree.links.new(environment.outputs['Color'], background.inputs['Color'])
background.inputs['Strength'].default_value = .55
scene.view_settings.exposure = .65
scene.world['environment_coordinates'] = 'existing HDRI orientation retained after lighting comparison'
scene['material_review_revision'] = '14-sRGB-constant-colors'
scene['monolithic_source_sha256'] = hashlib.sha256((ROOT / 'build/intermediate/angora21-monolithic.blend').read_bytes()).hexdigest()
for path in sorted((ROOT / 'tools').glob('*.py')):
    text = bpy.data.texts.get('pipeline/' + path.name) or bpy.data.texts.new('pipeline/' + path.name)
    text.clear(); text.write(path.read_text())
text = bpy.data.texts.get('PROJECT_README.md') or bpy.data.texts.new('PROJECT_README.md')
text.clear(); text.write((ROOT / 'README.md').read_text())
master = Path(bpy.data.filepath)
bpy.ops.wm.save_as_mainfile(filepath=str(master), compress=True, relative_remap=False)
path = ROOT / 'build/blender/layer-manifest.json'
manifest = json.loads(path.read_text())
manifest['master_sha256'] = hashlib.sha256(master.read_bytes()).hexdigest()
manifest['source_monolithic_sha256'] = scene['monolithic_source_sha256']
for row in manifest['files']:
    data = (ROOT / row['path']).read_bytes()
    row.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
manifest['maximum_library_bytes'] = max(row['bytes'] for row in manifest['files'])
manifest.update(review_revision='14-color-encoding-WC-placement', camera_only_revision=False)
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
snapshot = delivery_snapshot()
manifest['delivery_snapshot_sha256'] = snapshot['sha256']
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print('MATERIAL_DELIVERY_REFRESHED', snapshot['sha256'], flush=True)
