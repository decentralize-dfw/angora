"""Run in Blender UI roompass namespace; full coherent review delivery."""
exec(compile((ROOT/'tools/native_web_delivery.py').read_text(encoding='utf-8'),'native_web_delivery','exec'))
WOUT=ROOT/'build/web/review-2026-09-13'
WOUT.mkdir(parents=True,exist_ok=True)
# Bake the existing saturation mask into exportable RGBA pixels.
mat=bpy.data.materials['Pool | Photo-derived navy dolphin ceramic']
nt=mat.node_tree
tex=next(n for n in nt.nodes if n.type=='TEX_IMAGE')
if not tex.image.name.startswith('Pool dolphin baked RGBA'):
    src=tex.image;pixels=np.array(src.pixels[:],dtype=np.float32).reshape(-1,4)
    high=pixels[:,:3].max(1);low=pixels[:,:3].min(1)
    pixels[:,3]=((high-low)/np.maximum(high,1e-8)>.58).astype(np.float32)
    baked=bpy.data.images.new('Pool dolphin baked RGBA',width=src.size[0],height=src.size[1],alpha=True)
    baked.pixels.foreach_set(pixels.ravel());baked.filepath_raw=str(ROOT/'assets/review-textures/pool-dolphin-web.png');baked.file_format='PNG';baked.save();baked.pack()
    tex.image=baked
nt.links.new(tex.outputs['Alpha'],nt.nodes['Principled BSDF'].inputs['Alpha'])
bpy.ops.wm.save_mainfile()
for name in ['level-0','level-1','level-2','level-3','envelope','garden','context']:
    export_native_layer(name)
native_room_camera_stations()
prepare_native_navigation()
for floor in range(4):native_navigation_layer(floor)
export_native_cap_triangles()
(WOUT/'export-complete.txt').write_text(hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest())
print('REVIEW WEB EXPORT COMPLETE')
