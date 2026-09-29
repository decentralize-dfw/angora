from pathlib import Path
import shutil,json,datetime
W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim10';U=A/'uv';D=Path(r'C:\Users\yigit\angora-git\teslim-tur10');O=D/'adim10/asama2';O.mkdir(parents=True,exist_ok=True)
r=json.loads((U/'uv-kontrol.json').read_text(encoding='utf-8'));r['son_zaman']=datetime.datetime.now().isoformat();r['asama_siniri_dk']=25;r['uretime_hazir']=bool(len(r['atlaslar'])==4 and not r['kaldi']);(U/'uv-kontrol.json').write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8')
for p in U.glob('uv_*.png'):shutil.copy2(p,O/p.name)
shutil.copy2(U/'uv-kontrol.json',O/'uv-kontrol.json');shutil.copy2(U/'uv-kontrol.json',D/'web/uv-kontrol.json');shutil.copy2(U/'girdi.json',O/'malzeme-atlas-girdi.json')
for p in (A/'checker').glob('*.png') if (A/'checker').exists() else []:shutil.copy2(p,O/('checker_'+p.name))
for p in Path(__file__).parent.glob('adim10-*uv*.py'):shutil.copy2(p,O/p.name)
shutil.copy2(Path(__file__).parent/'adim10-xatlas.py',O/'adim10-xatlas.py')
for p in W.glob('adim10-*atlas.log'):shutil.copy2(p,O/p.name)
shutil.copy2(W/'adim10-uv-hazir.log',O/'adim10-uv-hazir.log')
notes='\n## Adım10 Aşama2 · Lightmap UV\n\nMalzeme ataması ve 0.60m / 1m beş ışın ters yüz denetimi tamamlandı. Çevrilen yüz: '+str(r['ters_yuz_sayisi'])+'. Bahçe/istinat duvarı dahil; ağaç yaprakları ve korkuluk/armatür/cam/metal hariç.\n\n'
for name,v in r['atlaslar'].items():notes+=name+': '+json.dumps({k:v[k] for k in v if k!='meshler'},ensure_ascii=False)+'\n\n'
notes+='KALDI: '+'; '.join(r['kaldi'])+'\n\nÜretime hazır: '+str(r['uretime_hazir'])+'. [UV kontrolü](adim10/asama2/uv-kontrol.json).\n'
p=D/'notlar.md';p.write_text(p.read_text(encoding='utf-8')+notes,encoding='utf-8');p=D/'ilerleme/README.md';s=p.read_text(encoding='utf-8')+'\n## Adım10 · Aşama2 · UV denetimi\n\n[uv-kontrol.json](../adim10/asama2/uv-kontrol.json)\n\nKALDI: '+'; '.join(r['kaldi'])+'\n'
for name in r['atlaslar']:
 if (O/f'uv_{name}.png').exists():s+=f'\n![UV {name}](../adim10/asama2/uv_{name}.png)\n'
for f in [18,34]:
 if (O/f'checker_render_{f:02d}.png').exists():s+=f'\n![Checker {f}](../adim10/asama2/checker_render_{f:02d}.png)\n'
p.write_text(s,encoding='utf-8');print('[UV] TESLIM',r['uretime_hazir'],r['kaldi'])
