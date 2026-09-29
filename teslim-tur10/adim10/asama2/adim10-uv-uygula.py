import bpy,json,numpy as np
from pathlib import Path
W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim10';U=A/'uv';data=json.loads((U/'girdi.json').read_text(encoding='utf-8'));report=json.loads((U/'uv-kontrol.json').read_text(encoding='utf-8'))
bpy.ops.wm.open_mainfile(filepath=str(A/'uv-hazir.blend'));scene=bpy.context.scene
for rec in data['mesh']:
 ob=bpy.data.objects[rec['ob']];me=ob.data;atlas=rec['atlas'];ob['lightmap_atlas']=atlas or ''
 if not atlas:continue
 d=np.load(U/(rec['data']+'.uv.npz'));uv=d['uv'][d['idx'].ravel()];assert len(uv)==len(me.loops),ob.name
 lm=me.uv_layers.new(name='Lightmap');lm.data.foreach_set('uv',uv.ravel());me.uv_layers.active_index=0;me.uv_layers[0].active_render=True;ob['lightmap']={'atlas':atlas,'texcoord':1};me.materials[0]['lightmap_atlas']=atlas
scene['uv_uretime_hazir']=not bool(report['kaldi']);bpy.ops.wm.save_as_mainfile(filepath=str(A/('lightmap-sahne-taslak.blend' if report['kaldi'] else 'lightmap-sahne.blend')))
cache={}
for rec in data['mesh']:
 if not rec['atlas']:continue
 ob=bpy.data.objects[rec['ob']];atlas=rec['atlas'];mat=ob.data.materials[0]
 if mat.name not in cache:
  m=bpy.data.materials.new('CHECK_'+mat.name);m.use_nodes=True;nt=m.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');em=nt.nodes.new('ShaderNodeEmission');ck=nt.nodes.new('ShaderNodeTexChecker');uv=nt.nodes.new('ShaderNodeUVMap');uv.uv_map='Lightmap';ck.inputs['Scale'].default_value=report['atlaslar'][atlas]['boyut']/max(report['atlaslar'][atlas]['texel_m_medyan'],1)*4;ck.inputs['Color1'].default_value=(.05,.16,.5,1);ck.inputs['Color2'].default_value=(.8,.85,.95,1);nt.links.new(uv.outputs['UV'],ck.inputs['Vector']);nt.links.new(ck.outputs['Color'],em.inputs['Color']);nt.links.new(em.outputs[0],out.inputs['Surface']);cache[mat.name]=m
 ob.data.materials[0]=cache[mat.name]
bpy.ops.wm.save_as_mainfile(filepath=str(A/'checker.blend'));print('[UV] UYGULANDI',len(cache),flush=True)

