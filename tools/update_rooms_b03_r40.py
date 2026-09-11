#!/usr/bin/env python3
"""R40 - fold the B03 enclosure into rooms.json after tools/build_b03_enclosure_r40.mjs.

Reads the freshly re-derived build/web/full/room-spaces.json and rewrites, in
both delivery copies of rooms.json (build/web/full and viewer/public/models/full):
  - the three floor-0 space entries (the enclosure splits the open loft),
  - the six floor-0 rooms' space assignments, areas and shared-space notes,
  - the two f0-B10 dimensions, which the enclosure turns from model_measured
    approximations of the open loft into project dimensions verified against
    the new partition faces (DWG handles 2C056 and 2C11F, residual under
    0.0001 m by construction - the faces are authored on the registered
    witness lines and re-measured from the delivered Draco-decoded GLB),
and refreshes the room_annotations manifest entries plus SHA256SUMS.txt.
"""
import json, hashlib
from pathlib import Path

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
PUB = ROOT/'viewer/public/models/full'

spaces_doc = json.loads((FULL/'room-spaces.json').read_text())
f0_spaces = [s for s in spaces_doc['spaces'] if s['space_id'].startswith('f0')]
by_id = {s['space_id']: s for s in f0_spaces}
assert by_id['f0-S2']['members'] == ['f0-B10'] and by_id['f0-S3']['members'] == ['f0-B02']

REG = [9.638051, 73.363273]
WITNESS = {
    '2C056': [[-847.0051444060446, -6843.627318944888, -688.2333331628888],
              [-652.0051444060737, -6843.627318944895, -688.2333331628888]],
    '2C11F': [[-847.0051444060446, -6843.627318944888, -688.2333331628888],
              [-847.0051444060882, -7013.627318944888, -688.2333331628888]],
}
VERIFIED = {
    'assets': ['level-0.glb'],
    'nodes': ['R40 | B03 banyo bölme duvarları', 'F0 | KAT 0$DUVAR', 'F0 | KAT 0$DUVAR KAPLAMA'],
    'cut_heights_m': [0.3, 1.0, 1.8, 2.3],
}

def dim_x():
    return {
        'id': 'f0-B10-0', 'room_id': 'f0-B10', 'floor_index': 0, 'axis': 'x',
        'basis': 'dwg_verified', 'claim': 'project_dimension_verified', 'corroboration': 'anchor_line',
        'a': [1.168, 0.02197, -3.7], 'b': [3.118, 0.02197, -3.7], 'metres': 1.95, 'display': '1,95 m',
        'source_dimension_handle': '2C056', 'source_actual_measurement_cm': 195.0, 'source_dimension_text': '195',
        'source_witness_points': WITNESS['2C056'], 'registration': REG,
        'maximum_wall_endpoint_residual_m': 0.0001,
        'verification': 'r40_authored_partition_faces_on_registered_witness_lines',
        'verified_against': dict(VERIFIED, face_coordinates_m=[1.168, 3.118], measure_line={'axis': 'z', 'value': -3.7}),
        'model_clear_span_m': 1.919, 'model_clear_face_coordinates_m': [1.168, 3.087],
        'wall_finish_thickness_m': [0.0, 0.031],
        'provenance': ('Kaynak proje ölçüsü 1,95 m (DWG handle 2C056). R40 bölme duvarları bu ölçünün tescilli '
                       'tanık hatlarına (x 1,168 / 3,118) inşa edildi; teslim GLB yüzeylerinde sapma 0,1 mm altında. '
                       'Doğu duvar kaplamalı mevcut duvar olduğundan bitmiş net açıklık 1,92 m.'),
        'dimension_label_allowed': True,
    }

def dim_z():
    return {
        'id': 'f0-B10-1', 'room_id': 'f0-B10', 'floor_index': 0, 'axis': 'z',
        'basis': 'dwg_verified', 'claim': 'project_dimension_verified', 'corroboration': 'anchor_line',
        'a': [2.0, 0.02197, -4.927], 'b': [2.0, 0.02197, -3.227], 'metres': 1.7, 'display': '1,70 m',
        'source_dimension_handle': '2C11F', 'source_actual_measurement_cm': 170.0, 'source_dimension_text': '170',
        'source_witness_points': WITNESS['2C11F'], 'registration': REG,
        'maximum_wall_endpoint_residual_m': 0.0001,
        'verification': 'r40_authored_partition_faces_on_registered_witness_lines',
        'verified_against': dict(VERIFIED, face_coordinates_m=[-4.927, -3.227], measure_line={'axis': 'x', 'value': 2.0}),
        'model_clear_span_m': 1.7, 'model_clear_face_coordinates_m': [-4.927, -3.227],
        'wall_finish_thickness_m': [0.0, 0.0],
        'provenance': ('Kaynak proje ölçüsü 1,70 m (DWG handle 2C11F). R40 bölme duvarları bu ölçünün tescilli '
                       'tanık hatlarına (z -4,927 / -3,227) inşa edildi; teslim GLB yüzeylerinde sapma 0,1 mm '
                       'altında. Bölme yüzeyleri kaplamasız olduğundan bitmiş açıklık proje ölçüsüne eşittir.'),
        'dimension_label_allowed': True,
    }

CODE_NOTE = ('Kaynak plan bu odayı BANYO B03 olarak etiketler; B10 bir komşu blok kodudur. Oda kimliği (id) '
             'düzeltmeden önceki yayınlardan geldiği için f0-B10 olarak kalır. R40: oda, kaynak ölçü zincirinin '
             '(2C056/2C11F, iç 1,95 × 1,70 m) tanık hatlarına inşa edilen bölme duvarları ve plandaki kuzeybatı '
             '0,80 m kapı boşluğu ile kapatıldı; plandaki duş teknesi ve klozet modellenmedi (kaynakta iç '
             'fotoğrafı yok), mal sahibi çizelgesindeki 1,73 m² ile ölçü zinciri alanı arasındaki fark kayıtlıdır.')

for base in (FULL, PUB):
    path = base/'rooms.json'
    data = json.loads(path.read_text())
    data['spaces'] = f0_spaces + [s for s in data['spaces'] if not s['space_id'].startswith('f0')]
    shared = {'space_id': 'f0-S1', 'members': by_id['f0-S1']['members'],
              'space_area_m2': by_id['f0-S1']['area_m2'],
              'reason': 'R40 duvar katılarında bu etiketler arasında bölme yok; alan paylaşılan hacmindir'}
    for room in data['rooms']:
        if room['id'] == 'f0-B10':
            room['space_id'] = 'f0-S2'
            room.pop('shared_space_note', None)
            room['area_m2'] = by_id['f0-S2']['area_m2']
            room['area_to_substrate_m2'] = by_id['f0-S2']['area_to_substrate_m2']
            room['area_method_label'] = 'r39_solid_inner_faces_sliced_at_datum_plus_1.0m; finished face / substrate face'
            room['photo_evidence'] = 'none'
            room['code_note'] = CODE_NOTE
        elif room['id'] == 'f0-B02':
            room['space_id'] = 'f0-S3'
        elif room['id'].startswith('f0'):
            room['space_id'] = 'f0-S1'
            room['shared_space_note'] = dict(shared)
    data['area_notes']['rooms'] = ('20 kapali hacim R40 katilarindan turetildi; 16 oda kendi poligonunu ve m2 '
                                   'degerini tasir, 11 etiket 4 paylasilan hacimde kalir cunku teslim katilarinda '
                                   'aralarinda bolme yok.')
    data['dimensions'] = [d for d in data['dimensions']
                          if not (isinstance(d, dict) and d.get('id') in ('f0-B10-0', 'f0-B10-1'))]
    insert_at = next(i for i, d in enumerate(data['dimensions'])
                     if isinstance(d, dict) and d.get('room_id') == 'f0-B02')
    data['dimensions'][insert_at:insert_at] = [dim_x(), dim_z()]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    manifest_path = base/'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if 'room_annotations' in manifest:
        manifest['room_annotations']['bytes'] = path.stat().st_size
        manifest['room_annotations']['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(path, 'updated')

sums_path = ROOT/'SHA256SUMS.txt'
lines = []
for line in sums_path.read_text().splitlines():
    digest, name = line.split(maxsplit=1)
    target = ROOT/name
    lines.append(f'{hashlib.sha256(target.read_bytes()).hexdigest()}  {name}')
sums_path.write_text('\n'.join(lines) + '\n')
print('SHA256SUMS.txt refreshed')
