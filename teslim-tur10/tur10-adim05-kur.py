from pathlib import Path
import json,shutil
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10')
p=R/'tools/blender/08_kontrol_render.py';s=p.read_text(encoding='utf-8')
needle="            c = mw @ face.calc_center_median()"
extra="""            if b.get('max_face_span'):
                coords = [mw @ v.co for v in face.verts]
                if any(max(v[i] for v in coords)-min(v[i] for v in coords)>b['max_face_span'][i] for i in range(3)): return False
            if b.get('normal_axes'):
                n = mw.to_3x3() @ face.normal
                if max(range(3),key=lambda i:abs(n[i])) not in b['normal_axes']: return False
"""
if "b.get('max_face_span')" not in s:s=s.replace(needle,extra+needle)
s=s.replace("    if rec['ad'].startswith(('Interior fill', 'Sun'))", "    if rec['ad'].startswith('Photographed ceiling downlight'): continue\n    if rec['ad'].startswith(('Interior fill', 'Sun'))")
p.write_text(s,encoding='utf-8')
for q in [W/'moduller/foto_doku_uygula.py',R/'tools/blender/foto_doku_uygula.py']:shutil.copy2(Path(__file__).parent/'moduller/foto_doku_uygula.py',q)
p=W/'kamera-duzeltme.json';d=json.loads(p.read_text(encoding='utf-8'));d['40']={'dx':-.64,'dy':-.854,'dz':0,'yaw':16.7,'pitch':-4,'hfov':77};p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
