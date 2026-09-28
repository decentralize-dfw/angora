from pathlib import Path
import ezdxf
A=Path(r'C:\Users\yigit\angora-tur10\adim09/cad');src=ezdxf.readfile(A/'ANGORA-.dxf');d=ezdxf.new('R2018');d.units=6;d.layers.new('2D$FER');m=d.modelspace()
for e in src.blocks['KORKULUK 1']:m.add_entity(e.copy())
d.saveas(A/'KORKULUK-1-orijinal-panel.dxf');print('507 kaynak entity ayrı R2018 panel DXF olarak saklandı; orijinal koordinatlar değişmedi')
