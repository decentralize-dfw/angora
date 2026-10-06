"""Exact-frame private evidence; select by frame number rather than fps bin centres."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, shutil, math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'build/casestudy2-active-analysis';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=Path.home()/'Videos/2026-10-05 15-29-15.mp4'
times=[3,3.5,4,4.5,5,5.5,6,110,110.5,111,121.5,122,122.5,123,207,207.5,208]
frames=[round(t*60) for t in times]
selection='+'.join(f'eq(n,{n})' for n in frames)
subprocess.run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-threads','2','-i',str(SOURCE),'-vf',f"select='{selection}',scale=640:400",'-fps_mode','vfr','-q:v','3',str(OUT/'edge-%03d.jpg')],check=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
sheet=Image.new('RGB',(1600,math.ceil(len(times)/4)*278),'#eee');draw=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
 x=(i%4)*400;y=(i//4)*278;sheet.paste(Image.open(OUT/f'edge-{i+1:03}.jpg').resize((400,250)),(x,y+28));draw.text((x+8,y+4),f'SOURCE {t:.2f}s',font=font,fill='#222')
sheet.save(OUT/'boundary-sheet.jpg',quality=94)
print(OUT/'boundary-sheet.jpg')
