import bpy,json,shutil,numpy as np
from pathlib import Path
W=Path(r'C:\Users\yigit\angora-tur10');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10/web');C=W/'adim09/web-calisma';O=C/'ham-dokular';O.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(W/'adim09/kontrol-sahne.blend'))
records=json.loads((D/'web-kontrol.json').read_text(encoding='utf-8'))['doku_donusum']
for n,rec in enumerate(records):
 im=bpy.data.images[rec['kaynak']];path=O/(rec['dosya']+'.raw');source=Path(bpy.path.abspath(im.filepath))
 if im.packed_file:path.write_bytes(im.packed_file.data);rec['ham_tur']='resim'
 elif source.is_file():shutil.copyfile(source,path);rec['ham_tur']='resim'
 else:
  a=np.empty(im.size[0]*im.size[1]*4,np.float32);im.pixels.foreach_get(a);np.save(str(path),a.reshape(im.size[1],im.size[0],4));rec['ham_tur']='npy';rec['srgb']=im.colorspace_settings.name=='sRGB'
 rec['ham']=str(path)
(C/'ham-dokular.json').write_text(json.dumps(records,ensure_ascii=False,indent=1),encoding='utf-8');print('[web] HAM DOKULAR',len(records),flush=True)
