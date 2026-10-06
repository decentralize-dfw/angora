"""Private exact-frame contact sheets of the two published viewport crops."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, shutil, argparse, math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'build/casestudy2-active-analysis'
p=argparse.ArgumentParser();p.add_argument('device',choices=['desktop','mobile']);a=p.parse_args();d=a.device
offset=4 if d=='desktop' else 122
folder=OUT/d;folder.mkdir(parents=True,exist_ok=True)
scale='640:350' if d=='desktop' else '213:318'
subprocess.run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-threads','2','-i',str(ROOT/f'assets/casestudy2/active/{d}.mp4'),'-vf',f"select='not(mod(n,60))',scale={scale}",'-fps_mode','vfr','-q:v','3',str(folder/'%03d.jpg')],check=True)
files=sorted(folder.glob('*.jpg'));font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
cols=4 if d=='desktop' else 6;w=400 if d=='desktop' else 213;h=219 if d=='desktop' else 318;batchsize=cols*4
for page in range(math.ceil(len(files)/batchsize)):
 batch=files[page*batchsize:(page+1)*batchsize];sheet=Image.new('RGB',(cols*w,4*(h+25)),'#eee');draw=ImageDraw.Draw(sheet)
 for i,file in enumerate(batch):
  x=i%cols*w;y=i//cols*(h+25);sheet.paste(Image.open(file).resize((w,h)),(x,y+25));t=offset+page*batchsize+i;draw.text((x+6,y+3),f'SOURCE {t}s',font=font,fill='#222')
 sheet.save(OUT/f'{d}-sheet-{page+1}.jpg',quality=94)
print(d,len(files),'exact frames',flush=True)
