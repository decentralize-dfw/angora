import json,struct,io,re,hashlib,numpy as np
from pathlib import Path
from PIL import Image
D=Path(r'C:\Users\yigit\angora-git\teslim-tur10\web');C=Path(r'C:\Users\yigit\angora-tur10\adim09\web-calisma');R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main')
def read(p):
 b=p.read_bytes();n,t=struct.unpack_from('<II',b,12);j=json.loads(b[20:20+n]);return j,b[28+n:]
names=json.loads((C/'malzeme-adlari.json').read_text(encoding='utf-8'));original=set()
for p in [R/'build/bake/BUILDING-opt-v4-lm.glb',R/'build/bake/INTERIOR-opt-v2.decoded.glb']:
 j,_=read(p);original.update(m.get('name','') for m in j.get('materials',[]))
manifest=[]
for p in D.glob('*.glb'):
 j,bin=read(p);bin=bytearray(bin)
 def accessor(index):
  a=j['accessors'][index];v=j['bufferViews'][a['bufferView']];width={'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
  return np.ndarray((a['count'],width),dtype='<f4',buffer=bin,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*4),4))
 fixed=0;done=set()
 for mesh in j['meshes']:
  for pr in mesh['primitives']:
   attrs=pr['attributes'];idx=attrs.get('TANGENT')
   if idx is None or idx in done:continue
   done.add(idx);t=accessor(idx);xyz=t[:,:3];norm=np.linalg.norm(xyz,axis=1);bad=norm<1e-8;fixed+=int(bad.sum())
   if bad.any():
    n=accessor(attrs['NORMAL'])[bad];axis=np.zeros_like(n);axis[np.arange(len(n)),np.argmin(np.abs(n),axis=1)]=1;xyz[bad]=np.cross(axis,n);norm=np.linalg.norm(xyz,axis=1)
   xyz[:]=xyz/np.maximum(norm[:,None],1e-10);t[:,3]=np.where(t[:,3]<0,-1,1)
 image_views={im['bufferView'] for im in j.get('images',[])};rebuilt=bytearray()
 for i,v in enumerate(j['bufferViews']):
  chunk=bytes(bin[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
  if i in image_views:
   imrec=next(im for im in j['images'] if im['bufferView']==i);im=Image.open(io.BytesIO(chunk)).convert('RGB');im.info.clear();out=io.BytesIO();fmt='JPEG' if imrec['mimeType']=='image/jpeg' else 'PNG';im.save(out,format=fmt,quality=95);chunk=out.getvalue()
  rebuilt+=b'\0'*((-len(rebuilt))%4);v['byteOffset']=len(rebuilt);v['byteLength']=len(chunk);rebuilt+=chunk
 bin=bytes(rebuilt);j['buffers'][0]['byteLength']=len(bin)
 for m in j.get('materials',[]):
  old=m.get('name','');new=names.get(old,old);base=re.sub(r'\.\d{3}$','',new)
  if new not in original and base in original:new=base
  if new not in original and not new.startswith('EK_'):new='EK_'+new
  m['name']=new;m.setdefault('extras',{})['uygulama_malzeme_adi']=old
 for n in j.get('nodes',[]):
  if 'mesh' in n:
   j['meshes'][n['mesh']]['name']=n.get('extras',{}).get('mesh_adi_orijinal',j['meshes'][n['mesh']].get('name',''))
 raw=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);bin+=b'\0'*((-len(bin))%4)
 p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(raw)+len(bin))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(bin),0x004e4942)+bin)
 imgs=[]
 for im in j.get('images',[]):
  v=j['bufferViews'][im['bufferView']];data=bin[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];pic=Image.open(io.BytesIO(data));imgs.append(dict(ad=im.get('name'),mime=im['mimeType'],boyut=list(pic.size),mod=pic.mode))
 tris=sum(j['accessors'][pr['indices']]['count']//3 for m in j['meshes'] for pr in m['primitives'] if pr.get('mode',4)==4)
 manifest.append(dict(dosya=p.name,bayt=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),ucgen_sayisi=tris,malzeme_listesi=[m['name'] for m in j['materials']],dokular=imgs,duzeltilen_sifir_teget=fixed,kat_eksik=[n.get('name') for n in j['nodes'] if 'kat' not in n.get('extras',{})],isik_uzantisi='KHR_lights_punctual' in j.get('extensionsUsed',[])))
 print(p.name,'bytes',p.stat().st_size,'tris',tris,'textures',len(imgs),'dimensions',sorted(set(tuple(x['boyut']) for x in imgs)),flush=True)
(D/'web-teslim.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1),encoding='utf-8')
