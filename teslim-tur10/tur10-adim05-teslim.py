from pathlib import Path
import json,shutil,struct,io,hashlib
from PIL import Image
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10')
b=(R/'build/web/26092026/EKLER.glb').read_bytes();ln=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+ln]);binary=b[28+ln:]
names=[n.get('name','') for n in g['nodes']];bad=[n for n in names if n.startswith(('107_','ARSIV')) or 'yatak' in n.lower()];assert not bad
textures=[]
for img in g.get('images',[]):
 if 'bufferView' not in img:continue
 v=g['bufferViews'][img['bufferView']];im=Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]))
 textures.append({'ad':img.get('name'),'boyut':list(im.size)});assert max(im.size)<=4096
spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));by={r['no']:r for r in spec}
preserved=json.loads((W/'adim04-korunan-yuzeyler.json').read_text(encoding='utf-8'))
for no,h in preserved.items():assert hashlib.sha256((T/'malzeme-dokulari'/by[int(no)]['klasor']/'albedo.jpg').read_bytes()).hexdigest()==h
(W/'adim05-dogrulama.json').write_text(json.dumps({'dugum':len(names),'arsiv_yatak':bad,'dokular':textures,'duvar_tavan_karo_hash_degismedi':True},ensure_ascii=False,indent=1),encoding='utf-8')
for name in ['ekler-calisma.blend','kamera-duzeltme.json','silme-kutulari.json','notlar.md','dokular.json','adim05-kontrol.log','adim05-dogrulama.json']:
 shutil.copy2(W/name,D/name)
shutil.copy2(R/'build/web/26092026/EKLER.glb',W/'EKLER.glb');shutil.copy2(W/'EKLER.glb',D/'EKLER.glb')
for folder,pattern in [('moduller','*.py'),('modul-raporlari','*.json'),('kontrol','render_*.png'),('kontrol','yan_yana_*.jpg')]:
 (D/folder).mkdir(exist_ok=True)
 for p in (W/folder).glob(pattern):
  if p.name=='B_foto_doku.json':continue
  shutil.copy2(p,D/folder/p.name)
for rec in spec:
 out=D/'malzeme-dokulari'/rec['klasor'];out.mkdir(parents=True,exist_ok=True)
 for name in ['albedo.jpg','normal.jpg','roughness.jpg','albedo.png','normal.png','roughness.png']:
  p=T/'malzeme-dokulari'/rec['klasor']/name
  if p.exists():shutil.copy2(p,out/name)
for name in ['08_kontrol_render.py','09_yan_yana.py','foto_doku_uygula.py']:shutil.copy2(R/'tools/blender'/name,D/'kontrol-betikleri'/name)
shutil.copytree(W/'adim05',D/'adim05',dirs_exist_ok=True)
for p in Path(__file__).parent.glob('tur10-adim05-*.py'):shutil.copy2(p,D/p.name)
print('[adim05-dogrulama]',len(names),'dugum;',len(textures),'doku; ARSIV/yatak=0')
