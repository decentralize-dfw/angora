"""Restore authored linear colors when constant maps were saved as sRGB bytes.

Only generated, uniform, four-pixel-wide base-color maps are affected. Baked
procedural maps, reference photographs, and non-color maps stay unchanged.
"""
import bpy, json, hashlib, sys, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def linear_to_srgb(value):
    value = max(0.0, min(1.0, value))
    return 12.92 * value if value <= .0031308 else 1.055 * value ** (1 / 2.4) - .055


def repair(write_maps=True):
    records = []
    for mat in bpy.data.materials:
        if mat.library or not mat.use_nodes or mat.get('pbr_photo_uv'):
            continue
        bs = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if bs is None or not bs.inputs['Base Color'].is_linked:
            continue
        node = bs.inputs['Base Color'].links[0].from_node
        if node.type != 'TEX_IMAGE' or tuple(node.image.size) != (4, 4):
            continue
        maps = json.loads(mat.get('pbr_maps_json', '{}'))
        if not maps.get('basecolor'):
            continue
        path = ROOT / maps['basecolor']
        color = tuple(bs.inputs['Base Color'].default_value)
        encoded = tuple(linear_to_srgb(v) for v in color[:3]) + (color[3],)
        if write_maps:
            temporary = bpy.data.images.new('TEMP correctly encoded constant', 4, 4, alpha=True, float_buffer=False)
            temporary.colorspace_settings.name = 'sRGB'
            temporary.pixels = list(encoded) * 16
            temporary.filepath_raw = str(path)
            temporary.file_format = 'PNG'
            temporary.save()
            bpy.data.images.remove(temporary)
        old_image = node.image
        image = bpy.data.images.load(str(path), check_existing=False)
        image.name = old_image.name + '-srgb-correct'
        image.pack()
        image.filepath = '//' + os.path.relpath(path, Path(bpy.data.filepath).parent)
        node.image = image
        if old_image.users == 0:
            bpy.data.images.remove(old_image)
        mat['constant_basecolor_encoding'] = 'linear authored values encoded to sRGB PNG'
        records.append({'material': mat.name, 'map': maps['basecolor'],
                        'authored_linear_rgba': color,
                        'expected_srgb_rgb8': [round(v * 255) for v in encoded[:3]],
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    return records


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    records = repair(write_maps='--reuse-maps' not in args)
    bpy.context.scene['pbr_color_encoding_revision'] = '14-linear-to-srgb-constant-maps'
    path = Path(bpy.data.filepath)
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True, relative_remap=False)
    if '--reuse-maps' not in args:
        report = {'revision': '14-linear-to-srgb-constant-maps',
                  'cause': 'Linear RGB values were written directly into byte sRGB base-color images.',
                  'changed': records, 'normal_roughness_metallic_changed': False,
                  'color_calibration_against_photos': False}
        (ROOT / 'assets/pbr/color-encoding-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print('PBR_COLOR_ENCODING_REPAIRED', len(records), str(path), flush=True)
