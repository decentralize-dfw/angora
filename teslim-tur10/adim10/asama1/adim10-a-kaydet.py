import bpy,json,sys,shutil
from pathlib import Path
W=Path(r'C:\Users\yigit\angora-tur10');R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');A=W/'adim10'
shutil.copy2(W/'ekler-calisma.blend',A/'ekler-once.blend');bpy.ops.wm.open_mainfile(filepath=str(W/'ekler-calisma.blend'));C=bpy.data.collections['EKLER'];removed=[]
for ob in list(C.objects):
 name=ob.name.lower();mats=' '.join(m.name for m in ob.data.materials) if ob.type=='MESH' else ''
 if any(x in name for x in ['korkuluk','kupeste','küpeşte','ferforje','galeri','dwg']) or 'A09_DWG' in mats or 'M2_Koyu_ceviz' in mats or name.startswith('a09_') and 'zemin_baglanti' in name:removed.append(ob.name);bpy.data.objects.remove(ob,do_unlink=True)
archive=bpy.data.collections.get('ARSIV_DWG')
if archive:
 for ob in list(archive.objects):bpy.data.objects.remove(ob,do_unlink=True)
 bpy.data.collections.remove(archive)
bpy.ops.wm.save_as_mainfile(filepath=str(W/'ekler-calisma.blend'));print('[A10] EKLER kalıcı kaldırıldı',len(removed),flush=True)
