"""Private contact sheets used to locate scenes in the supplied web2 recording."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path.home()/'Videos/2026-10-05 15-29-15.mp4'
OUT=ROOT/'build/casestudy2-active-analysis';OUT.mkdir(parents=True,exist_ok=True)
subprocess.run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-threads','2','-i',str(SOURCE),'-vf',"select='not(mod(n,240))',scale=640:400",'-fps_mode','vfr','-q:v','3',str(OUT/'broad-%03d.jpg')],check=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
files=sorted(OUT.glob('broad-*.jpg'))
for page in range((len(files)+19)//20):
 batch=files[page*20:(page+1)*20];sheet=Image.new('RGB',(1600,5*278),'#eee');draw=ImageDraw.Draw(sheet)
 for i,file in enumerate(batch):
  x=(i%4)*400;y=(i//4)*278;sheet.paste(Image.open(file).resize((400,250)),(x,y+28));t=(page*20+i)*4
  draw.text((x+8,y+4),f'{t//60:02d}:{t%60:02d} / {t}s',font=font,fill='#222')
 sheet.save(OUT/f'broad-sheet-{page+1}.jpg',quality=93)
print(len(files),'frames')
