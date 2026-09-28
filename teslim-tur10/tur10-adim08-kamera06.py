from pathlib import Path
import sys,json,re
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9')
script=R/'tools/blender/08_kontrol_render.py'
sys.argv=['blender','--',str(R),str(W/'adim08'),'18','--ekler',str(R/'build/web/26092026/EKLER.glb'),'--kamera',str(W/'kamera-duzeltme.json'),'--sil',str(W/'silme-kutulari.json'),'--dokular',str(T/'dokular.json'),'--ornek','64']
ns={'__file__':str(script),'__name__':'__main__'}
exec(compile(script.read_text(encoding='utf-8').split('for f in FOTOS:')[0],str(script),'exec'),ns)
globals().update(ns)

configs=[(.151,3.640,0),(.45,4.30,30),(.65,4.60,35),(.3,4.70,28),(.681,5.234,35)]
for i,(x,y,extra) in enumerate(configs):
 c=CAMS[6];yaw=math.atan2(float(c['bakis_y']),float(c['bakis_x']))+math.radians(extra);cam.location=(x,y,11.021);cam.rotation_euler=Euler((math.pi/2+math.radians(-2),0,yaw-math.pi/2),'XYZ');cam_data.angle=math.radians(80);scene.render.resolution_x=640;scene.render.resolution_y=480;scene.render.resolution_percentage=100;scene.view_settings.exposure=3.5;cy.samples=16;scene.render.filepath=str(W/'adim08'/f'kamera06_{i}.png');bpy.ops.render.render(write_still=True)
print('[kamera06] 5 aday tamam')
