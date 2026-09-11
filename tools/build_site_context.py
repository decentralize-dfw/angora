#!/usr/bin/env python3
"""Regenerate build/web/site-context.json's provenance fields from the CAD
extraction plus the measured context.glb block AABBs.

The viewer reads only /buildings/<i>/position (the label anchor) and
/buildings/<i>/bounds (the region framing box). Everything else added here is
documentation: which blocks are photo-supported interpretation, which
footprints carry an inferred closing edge, and how well the instanced Villa 21
typology fits each CAD footprint. Positions are never touched - they already
sit 1.291 m above each block's modelled ridge.

The bounds come from a measurement pass over the delivered context.glb (all
nodes matching ^B<n>\\b except the foundation node, POSITION transformed by the
node TRS); the file with those AABBs is passed as argv[1]. Re-run the
measurement after any context.glb edit that moves a block, which none of the
R39 corrections does.
"""
import json, sys

ROOT = __file__.rsplit('/', 2)[0]
aabb = json.load(open(sys.argv[1]))
site = json.load(open(ROOT + '/build/web/site-context.json'))
cad = json.load(open(ROOT + '/build/cad/site-elevations.json'))
by_number = {b['number']: b for b in cad['buildings']}

BK_ANNOTATED = {4, 5, 6, 7, 8, 9, 10, 19, 20, 21, 22, 23, 24, 25, 33, 34, 35, 36}

for entry in site['buildings']:
    n = entry['number']
    c = by_number[n]
    entry['role'] = 'subject' if n == 21 else 'neighbour'
    entry['in_context_glb'] = str(n) in aabb
    if str(n) in aabb:
        entry['bounds'] = aabb[str(n)]
    m = c['typology_transform']['matrix_xy']
    det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
    entry['typology_mirrored'] = bool(det < 0) if n != 21 else False
    entry['footprint_area_m2'] = round(c['footprint_area_m2'], 3)
    entry['typology_fit'] = {
        'symmetric_difference_m2': round(c['typology_transform']['footprint_symmetric_difference_m2'], 3),
        'hausdorff_m': round(c['typology_transform']['footprint_hausdorff_m'], 3)}
    entry['base_elevation_source'] = 'CAD_BK_annotation' if n in BK_ANNOTATED else 'inferred_SBK_minus_3_1'
    if c.get('closing_edge_inferred'):
        entry['footprint_status'] = 'cad_registered_closing_edge_inferred'

site['note'] = (site.get('note') or '') + (
    ' Her çevre bloğu, Villa 21 tipolojisinin CAD tabanına yerleştirilmiş örneklenmiş bir kopyasıdır;'
    ' cepheler, çatı biçimi, çatı ve duvar rengi, kat sayısı ve mahya kotu 41 blok için de yorumdur.'
    ' 42 ve 44 numaralı girişlerin tipoloji uyumu zayıftır (simetrik fark 51,28 m² / Hausdorff 5,203 m'
    ' ve 92,93 m² / 8,457 m) - CAD çoklu çizgileri eksik olduğu için, binalar küçük olduğu için değil.')

json.dump(site, open(ROOT + '/build/web/site-context.json', 'w'), indent=1, ensure_ascii=False)
mirrored = sum(1 for b in site['buildings'] if b.get('typology_mirrored'))
closing = sum(1 for b in site['buildings'] if b['footprint_status'] == 'cad_registered_closing_edge_inferred')
print(f"written: {len(site['buildings'])} entries, {mirrored} mirrored, {closing} closing-edge-inferred,"
      f" {sum(1 for b in site['buildings'] if b['in_context_glb'])} in context.glb")
