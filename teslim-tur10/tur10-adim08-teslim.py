from pathlib import Path
import shutil,json,sys
R=Path(r"C:\Users\yigit\Downloads\angora-main (2)\angora-main");W=Path(r"C:\Users\yigit\angora-tur10");T=Path(r"C:\Users\yigit\angora-tur9");D=Path(r"C:\Users\yigit\angora-git\teslim-tur10")
for name in ['ekler-calisma.blend','kamera-duzeltme.json','silme-kutulari.json','notlar.md','dokular.json']:
 shutil.copy2(W/name,D/name)
shutil.copy2(R/'build/web/26092026/EKLER.glb',D/'EKLER.glb')
for name in ['moduller','modul-raporlari']:shutil.copytree(W/name,D/name,dirs_exist_ok=True)
for p in W.glob('adim08*.log'):shutil.copy2(p,D/p.name)
for rec in json.loads((T/'dokular.json').read_text(encoding='utf-8')):
 src=T/'malzeme-dokulari'/rec['klasor']
 if src.exists():shutil.copytree(src,D/'malzeme-dokulari'/rec['klasor'],dirs_exist_ok=True)
shutil.copytree(W/'adim08',D/'adim08',dirs_exist_ok=True,ignore=shutil.ignore_patterns('stok'))
for p in Path(__file__).parent.glob('tur10-adim08-*.py'):shutil.copy2(p,D/p.name)
for name in ['08_kontrol_render.py','09_yan_yana.py','foto_doku_uygula.py']:shutil.copy2(R/'tools/blender'/name,D/'kontrol-betikleri'/name)
manifest={p.parent.name:json.loads(p.read_text(encoding='utf-8-sig')) for p in (W/'adim08/stok').glob('*/kaynak.json')};(D/'adim08/stok-kaynaklar.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1),encoding='utf-8')
print('[A08 teslim]',len(manifest),'CC0 kaynak; model, dokular ve kontroller')
