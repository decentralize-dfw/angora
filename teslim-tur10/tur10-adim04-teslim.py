from pathlib import Path
import json,shutil,struct,hashlib,io
from PIL import Image
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10')
b=(R/'build/web/26092026/EKLER.glb').read_bytes();ln=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+ln]);binary=b[28+ln:]
names=[n.get('name','') for n in g['nodes']];bad=[n for n in names if n.startswith(('107_','ARSIV')) or 'yatak' in n.lower()];assert not bad
textures=[]
for img in g.get('images',[]):
 if 'bufferView' not in img:continue
 v=g['bufferViews'][img['bufferView']];im=Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]))
 textures.append({'ad':img.get('name'),'boyut':list(im.size)})
 assert max(im.size)<=1024,(img.get('name'),im.size)
spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));by={r['no']:r for r in spec}
preserved=json.loads((W/'adim04-korunan-yuzeyler.json').read_text(encoding='utf-8'))
for no,h in preserved.items():assert hashlib.sha256((T/'malzeme-dokulari'/by[int(no)]['klasor']/'albedo.jpg').read_bytes()).hexdigest()==h
report={'dugum':len(names),'arsiv_yatak_dugum':bad,'dokular':textures,'duvar_tavan_karo_hash_degismedi':True,'ornek':64,'render_en_px':1200,'model_raporu':json.loads((W/'modul-raporlari/A04.json').read_text(encoding='utf-8'))}
(W/'adim04-dogrulama.json').write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8')
for r in spec:
 for key in ['secim_nedeni','secilen_doku','karsilastirilan_adaylar','b1_noktalari']:r.pop(key,None)
 r['albedo_haklari']='Kullanıcının sağladığı fotoğraftan türetilmiş veya kullanıcı tarifindeki düz boya; stok lisansı yalnız normal/roughness için geçerlidir.'
(W/'dokular.json').write_text(json.dumps(spec,ensure_ascii=False,indent=1),encoding='utf-8')
for name in ['ekler-calisma.blend','kamera-duzeltme.json','silme-kutulari.json','notlar.md','dokular.json','adim04-kontrol.log','adim04-dogrulama.json','adim04-korunan-yuzeyler.json']:
 shutil.copy2(W/name,D/name)
shutil.copy2(R/'build/web/26092026/EKLER.glb',W/'EKLER.glb');shutil.copy2(W/'EKLER.glb',D/'EKLER.glb')
for folder,pattern in [('moduller','*.py'),('modul-raporlari','*.json'),('kontrol','render_*.png'),('kontrol','yan_yana_*.jpg'),('doku-inceleme','adim04_*.jpg')]:
 (D/folder).mkdir(exist_ok=True)
 for p in (W/folder).glob(pattern):
  if p.name=='B_foto_doku.json':continue
  shutil.copy2(p,D/folder/p.name)
for r in spec:
 out=D/'malzeme-dokulari'/r['klasor'];out.mkdir(parents=True,exist_ok=True)
 for name in ['albedo.jpg','normal.jpg','roughness.jpg']:
  p=T/'malzeme-dokulari'/r['klasor']/name
  if p.exists():shutil.copy2(p,out/name)
for name in ['08_kontrol_render.py','09_yan_yana.py','foto_doku_uygula.py']:shutil.copy2(R/'tools/blender'/name,D/'kontrol-betikleri'/name)
for name in ['tur10-adim04-albedo.py','tur10-adim04-teslim.py','adim04-dolap.log']:shutil.copy2(Path(__file__).parent/name,D/name)
print('[adim04-dogrulama]',len(names),'düğüm;',len(textures),'gömülü doku; ARSIV/yatak=0; duvar/tavan/karo hash aynı')
