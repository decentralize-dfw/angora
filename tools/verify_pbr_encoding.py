"""Check actual PNG bytes in the map package and every exported GLB."""
import hashlib, io, json, subprocess, zipfile
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
correction = json.loads((ROOT / 'assets/pbr/color-encoding-report.json').read_text())
expected = {row['material']: row for row in correction['changed']}
manifest = json.loads((ROOT / 'build/glb/scene-manifest.json').read_text())
checks = []


def check_pixel(raw, row, name):
    image = Image.open(io.BytesIO(raw)).convert('RGB')
    pixels = [image.getpixel((x, y)) for y in range(image.height) for x in range(image.width)]
    error = max(abs(a - b) for pixel in pixels for a, b in zip(pixel, row['expected_srgb_rgb8']))
    assert error <= 1, (name, row['material'], error)
    return error


for row in expected.values():
    check_pixel((ROOT / row['map']).read_bytes(), row, row['map'])
for asset in manifest['assets']:
    raw = (ROOT / 'build/glb' / asset['file']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == asset['sha256'], asset['file']
    json_size = int.from_bytes(raw[12:16], 'little')
    data = json.loads(raw[20:20 + json_size].decode().rstrip('\0 '))
    buffer = raw[28 + json_size:]
    rows = []
    for material in data.get('materials', []):
        name = material['name']
        if name not in expected:
            continue
        pbr = material['pbrMetallicRoughness']
        assert all(abs(v - 1) < 1e-6 for v in pbr.get('baseColorFactor', [1, 1, 1, 1])[:3]), name
        texture = data['textures'][pbr['baseColorTexture']['index']]
        image = data['images'][texture['source']]
        view = data['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        png = buffer[start:start + view['byteLength']]
        error = check_pixel(png, expected[name], asset['file'])
        rows.append({'material': name, 'maximum_byte_error': error})
    checks.append({'file': asset['file'], 'constant_materials_checked': rows})

# Compare against the published pre-correction map package. This confirms that
# the normal and material-response channels were not altered by a color fix.
old = subprocess.check_output(['git', 'show', '80e0f6972011601288c781c3843e562e1e53e3eb:assets/pbr/pbr-maps.zip'], cwd=ROOT)
unchanged = 0
with zipfile.ZipFile(io.BytesIO(old)) as archive:
    for name in archive.namelist():
        if name.endswith(('-normal.png', '-roughness.png', '-metallic.png', '-orm.png')):
            assert archive.read(name) == (ROOT / 'assets/pbr' / name).read_bytes(), name
            unchanged += 1
report = {'status': 'passed', 'constant_basecolor_maps_verified': len(expected),
          'unchanged_normal_and_response_maps': unchanged, 'assets': checks,
          'photo_color_calibration': False}
(ROOT / 'build/pbr-encoding-qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print('PBR_ENCODING_QA', len(expected), 'constant maps;', len(checks), 'GLBs;', unchanged, 'unchanged response maps')
