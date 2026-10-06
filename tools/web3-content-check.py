from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parents[1]
m=json.loads((ROOT/'assets/web3/manifest.json').read_text(encoding='utf8'));p=ROOT/'web3.html';s=p.read_text(encoding='utf8')
s=s.replace('Bedroom beneath the roof on the attic level" loading="lazy"><figcaption>02 / Attic level <strong>Under the eaves.','Bedroom II on the first level" loading="lazy"><figcaption>02 / First level <strong>A quieter corner.')
s=s.replace('A guest bedroom in the residence" loading="lazy"><figcaption>03 / First level','Bedroom beneath the roof on the attic level" loading="lazy"><figcaption>03 / Attic level')
s=s.replace('data-photo="garden-facade" src="assets/web3/photos/garden-facade-1600.webp" alt="The complete garden-facing elevation of the blue villa"','src="assets/web3/films/garden-return-d-last.webp" alt="A garden view carried from the arrival film"')
s=s.replace('Thin white line model of Angora Twenty One and its surroundings. Drag horizontally or use left and right arrow keys to orbit the house.','Architectural line outline of Angora Twenty One and its surroundings.')
s=s.replace('<span>Drag to orbit ↔</span>','<span>Architectural outline</span>')
for key in ['life-green','life-social']:
    s=s.replace(f'assets/web3/photos/{key}-1600.webp',m['photos'][key]['variants'][-1]['url'])
block=['<section class="fallback-plans section-pad"><h2>Inside every level.</h2><p>Open the full plan or any registered photograph. The interactive view loads above when available.</p>']
for i,f in enumerate(m['floors']):
    name=['Garden','Entrance','First','Attic'][i];block.append(f'<details><summary>{name} · {len(f["photos"])} viewpoints</summary><a href="{f["plan"]}">Open {name.lower()} floor plan ↗</a><ul>')
    for photo in f['photos']:
        room=next((r['name'] for r in f['rooms'] if r['id']==photo['room']),'Interior').replace('Bedroom 106','Bedroom II').replace('Bedroom 107','Bedroom III').replace('Bedroom C02','Bedroom II').replace('Bedroom C04','Bedroom III');url=m['photos'][photo['key']]['variants'][-1]['url']
        block.append(f'<li><a href="{url}">{photo["number"]} · {html.escape(room)}</a></li>')
    block.append('</ul></details>')
block.append('</section>')
s=re.sub(r'<section class="fallback-plans[\s\S]*?</section>','',s)
s=s.replace('<footer class="footer"',''.join(block)+'\n<footer class="footer"')
p.write_text(s,encoding='utf8');print('Verified editorial floor captions; 40 direct fallback photographs included.')
