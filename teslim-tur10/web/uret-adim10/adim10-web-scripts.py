from pathlib import Path
p=Path(__file__).parent
base=(p/'tur10-adim09-web-uret.py').read_text(encoding='utf-8')
base=base.replace("C=W/'adim09/web-calisma'", "C=W/'adim10/web-calisma';C.mkdir(exist_ok=True)")
base=base.replace("W/'adim09/kontrol-sahne.blend'", "W/'adim10/sahne.blend'")
base=base.replace("src=json.loads((C/'kaynak-bounds.json')", "src=json.loads((W/'adim09/web-calisma/kaynak-bounds.json')")
start=base.index('def convert_image(');end=base.index('for mat in usedmats:')
base=base[:start]+'''def convert_image(image,kind,swap=False):
 key=(image.as_pointer(),kind,swap)
 if key in cache:return cache[key]
 tag=hashlib.sha256((image.name+'|'+image.filepath+'|'+kind+str(swap)).encode()).hexdigest()[:14]
 filename=tag+('.jpg' if kind=='albedo' else '.png')
 raw=C/'ham-dokular';raw.mkdir(exist_ok=True);path=raw/(filename+'.raw');source=Path(bpy.path.abspath(image.filepath))
 rec=dict(kaynak=image.name,dosya=filename,tur=kind,world_to_tangent=swap,ham=str(path))
 if image.packed_file:path.write_bytes(image.packed_file.data);rec['ham_tur']='resim'
 elif source.is_file():
  import shutil
  shutil.copyfile(source,path);rec['ham_tur']='resim'
 else:
  a=np.empty(image.size[0]*image.size[1]*4,np.float32);image.pixels.foreach_get(a);np.save(str(path),a.reshape(image.size[1],image.size[0],4));rec['ham_tur']='npy';rec['srgb']=image.colorspace_settings.name=='sRGB'
 q=image.copy();q['web_target']=str(TX/filename);cache[key]=q;report['doku_donusum'].append(rec);return q
''' +base[end:]
start=base.index("for group,filename in [('BUILDING'")
base=base[:start]+'''# UV1 and stale lightmap metadata are deliberately absent in this handoff.
for ob in scene.objects:
 if ob.type!='MESH':continue
 while len(ob.data.uv_layers)>1:ob.data.uv_layers.remove(ob.data.uv_layers[-1])
 for key in list(ob.keys()):
  if 'lightmap' in key.lower():del ob[key]
 if len(ob.data.uv_layers):ob.data.uv_layers[0].active_render=True
for mat in bpy.data.materials:
 for key in list(mat.keys()):
  if 'lightmap' in key.lower():del mat[key]
(C/'ham-dokular.json').write_text(json.dumps(report['doku_donusum'],ensure_ascii=False,indent=1),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(C/'web-hazir.blend'))
(D/'web-kontrol.json').write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8');print('[web] HAZIR UV1 YOK',flush=True)
'''
(p/'adim10-web-hazir.py').write_text(base,encoding='utf-8')
for old,new in [('doku-pil','doku-pil'),('son','son'),('cam','cam'),('render','render'),('gorsel','gorsel')]:
 s=(p/f'tur10-adim09-web-{old}.py').read_text(encoding='utf-8').replace('adim09/web-calisma','adim10/web-calisma').replace('adim09\\web-calisma','adim10\\web-calisma').replace('adim09/kontrol-sahne.blend','adim10/sahne.blend').replace('adim09/kontrol/render_','adim10/asama1/render_')
 s=s.replace('for f in [1,2,18,21,34]:','for f in [2,16,18,21,34,42]:').replace('for f in [1,2,18,21,34,40]:','for f in [2,16,18,21,34,42]:').replace('TAMAM 5','TAMAM 6')
 (p/f'adim10-web-{new}.py').write_text(s,encoding='utf-8')
