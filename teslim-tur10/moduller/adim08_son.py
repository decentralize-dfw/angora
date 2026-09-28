import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
import bpy
o.basla('A08_Final_')
old=bpy.data.objects.get('A08_F47_sag_duvar_kapatma')
if old:bpy.data.objects.remove(old,do_unlink=True)
white=o.malzeme('M2_Beyaz_merdiven_alti',(.81,.79,.73),.8)
# Foto47 camera points +X; image-right is -Y. The gap is between flight inner edges 1.9274/2.1271.
o.kutu('A08_Final_F47_ic_duvar',(2.53,2.02725,1.55),(3.32,.200,3.10),white,.001)
o.bitir('A08_Final',{'foto47':'Kameranın sağ tarafı -Y; iki kol arasındaki .20m boşluk kapatıldı, dış taraftaki yanlış duvar kaldırıldı'})
