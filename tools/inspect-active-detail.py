"""Exact half-second frames around model and handoff transitions."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,shutil,math
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'build/casestudy2-active-analysis'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for device,start,end in [('desktop',44,68),('mobile',170,182),('desktop',8,15),('mobile',128,134)]:
 offset=4 if device=='desktop' else 122;times=[start+i*.5 for i in range(round((end-start)*2))];folder=OUT/f'{device}-{start}';folder.mkdir(exist_ok=True)
 frames=[round((t-offset)*60) for t in times];selection='+'.join(f'eq(n,{f})' for f in frames);w,h=(400,219) if device=='desktop' else (213,318)
 subprocess.run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-threads','2','-i',str(ROOT/f'assets/casestudy2/active/{device}.mp4'),'-vf',f"select='{selection}',scale={w}:{h}",'-fps_mode','vfr','-q:v','3',str(folder/'%03d.jpg')],check=True)
 for page in range(math.ceil(len(times)/24)):
  sheet=Image.new('RGB',(6*w,4*(h+25)),'#eee');draw=ImageDraw.Draw(sheet)
  for i,t in enumerate(times[page*24:(page+1)*24]):
   x=i%6*w;y=i//6*(h+25);sheet.paste(Image.open(folder/f'{page*24+i+1:03}.jpg'),(x,y+25));draw.text((x+5,y+3),f'SOURCE {t:.1f}s',font=font,fill='#222')
  sheet.save(OUT/f'{device}-{start}-detail-{page+1}.jpg',quality=93)
 print(device,start,'done',flush=True)
