from pathlib import Path
import json,struct,shutil
D=Path(r'C:\Users\yigit\angora-git\teslim-tur10');web=D/'web';root=Path(__file__).parent
p=web/'web-kontrol.json';r=json.loads(p.read_text(encoding='utf-8'));r['validator']={};r['dosya_kurallari']=[]
for f in web.glob('*.glb'):
 b=f.read_bytes();j=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]]);v=json.loads((web/(f.name+'.validator.json')).read_text(encoding='utf-8'));r['validator'][f.name]={k:v['issues'][k] for k in ['numErrors','numWarnings','numInfos']}
 uv1=sum('TEXCOORD_1' in pr['attributes'] for m in j['meshes'] for pr in m['primitives']);errors=[]
 for mat in j['materials']:
  for role,tex,mime in [('albedo',mat.get('pbrMetallicRoughness',{}).get('baseColorTexture'),'image/jpeg'),('normal',mat.get('normalTexture'),'image/png'),('roughness_G_metal_B',mat.get('pbrMetallicRoughness',{}).get('metallicRoughnessTexture'),'image/png')]:
   if tex and j['images'][j['textures'][tex['index']]['source']]['mimeType']!=mime:errors.append([mat['name'],role])
 check={'dosya':f.name,'uv1_primitif_sayisi':uv1,'format_hatasi':errors,'isik_nesnesi_yok':'KHR_lights_punctual' not in j.get('extensionsUsed',[]),'kat_eksik':[n.get('name') for n in j['nodes'] if n.get('extras',{}).get('kat') not in ['bodrum','giris','kat1','cati']]};r['dosya_kurallari'].append(check)
 assert v['issues']['numErrors']==0 and uv1==0 and f.stat().st_size<100_000_000 and not errors and not check['kat_eksik'] and check['isik_nesnesi_yok'],check
assert r['geri_yukleme_gecerli']
assert all(x['dokunulmayan_gecerli'] for x in r['kaynak_kontrol'])
r['uv_yontemi']='Yalnız UV0. Foto-dokular için mevcut dominant eksen/metre UV korunur; lightmap denemelerinden veri alınmadı.'
r['bahce']='GARDEN-opt-v2 değiştirilmedi ve yeniden dışa aktarılmadı.'
p.write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8')
manifest=json.loads((web/'web-teslim.json').read_text(encoding='utf-8'))
table='\n'.join(f"| {x['dosya']} | {x['bayt']} | {x['ucgen_sayisi']} | {r['validator'][x['dosya']]['numErrors']} / {r['validator'][x['dosya']]['numWarnings']} |" for x in manifest)
maxdelta=max(x['fark_m'] for x in r['geri_yukleme_sinir_kontrol'])
text='''# Adım10 · Aşama1 geometrisi — UV1 olmadan web teslimi

Kaynak: `angora-tur10/adim10/sahne.blend`. Eski model korkulukları ve 16/21/02 düzeltmeleri dahildir. UV denemeleri, yüz çevirme denemeleri ve lightmap verileri kullanılmadı. GARDEN-opt-v2 aynı kaldı.

BUILDING alt ve üst birlikte yüklenir; mimari EKLER bunlara dahildir. INTERIOR eski mobilyaları korur. Ayrı EKLER yüklenmez.

| Dosya | Bayt | Üçgen | Validator hata / uyarı |
|---|---:|---:|---:|
'''+table+f'''

Her üç dosyada TEXCOORD_1 sayısı **0**. Yalnız malzeme UV0 vardır. Dokular 2048 px: albedo JPG, normal ve metallic-roughness PNG (G roughness, B metal). Geometri/doku sıkıştırması yok; ışık nesneleri dışa aktarılmadı. Kat ve kaynak kimlikleri extras alanlarındadır.

Boş sahneye geri yüklenen {len(r['geri_yukleme_sinir_kontrol'])} grubun en büyük sınır farkı **{maxdelta:.12f} m**; 1 mm kontrolü geçti. Dokunulmayan kaynak grupların kontrolü de geçti.

[SHA256, boyut ve malzemeler](web-teslim.json) · [Koordinat, UV ve validator kontrolleri](web-kontrol.json) · [Işıklar](isiklar-v2.json)

Altı görselde sol Aşama1 .blend, sağ bu GLB'lerin boş sahneye geri yüklenmiş halidir. Kamera, ışık ve pozlama aynıdır; JPEG/2048 örnekleme ve shader aktarımından doğan piksel farkları web-kontrol.json içinde kayıtlıdır.
'''
for n in [2,16,18,21,34,42]:text+=f'\n![Web doğrulama {n:02d}](web_dogrulama_{n:02d}.jpg)\n'
text+='\nUV ve pişirme bu teslimin parçası değildir. Claude’un build/bake altına koyacağı *-lm.glb dosyaları bekleniyor. Önceki sahnede kayıtlı 32 bordür, 47 tavan birleşimi ve 34 eşik ayrıntıları değişmedi.\n'
(web/'README.md').write_text(text,encoding='utf-8')
note='''\n## Adım10 · UV1 olmadan son geometri teslimi

YAPILDI: Aşama1 sahnesinden BUILDING-opt-v6-alt/ust ve INTERIOR-opt-v3 üretildi; özgün korkuluklar ve 16/21/02 düzeltmeleri korundu. GARDEN değişmedi.
YAPILDI: UV1 yok; UV denemeleri kullanılmadı. 2048 px dokular, kat etiketleri, isimler ve ışık JSON teslimi korundu. Validator ve 1 mm koordinat denetimi geçti.
YAPILDI: 02,16,18,21,34,42 .blend | GLB görselleri yenilendi.
KALDI: Claude lightmap UV dosyalarını hazırlayacak. Test/tam pişirme başlatılmadı; bu push sonrasında duruldu. Önceki 32 bordür, 47 tavan ve 34 eşik ayrıntıları bu aktarımda değiştirilmedi.
'''
q=D/'notlar.md';old=q.read_text(encoding='utf-8').split('\n## Adım10 Aşama3 · Pişirme önkoşulu')[0];q.write_text(old+note,encoding='utf-8')
q=D/'ilerleme/README.md';old=q.read_text(encoding='utf-8').split('\n## Adım10 · Aşama3 · UV önkoşulunda durdu')[0];old+='\n## Adım10 · UV1 olmadan web teslimi\n\nUV denemeleri iptal edildi; yukarıdaki UV sonuçları teslimde kullanılmadı. [Üç GLB, SHA256 ve doğrulama](../web/README.md).\n'
for n in [2,16,18,21,34,42]:old+=f'\n![Web doğrulama {n:02d}](../web/web_dogrulama_{n:02d}.jpg)\n'
q.write_text(old,encoding='utf-8')
# Remove only this task's uncommitted, superseded bake draft artifacts.
for name in ['02_pisir.py','03_web_isik.py','adim10-bake-guncelle.py','bake-durum.json','test-onkosul.log']:
 f=D/'adim10/asama3'/name
 if f.exists():f.unlink()
f=web/'lightmap-teslim.json'
if f.exists():f.unlink()
out=web/'uret-adim10';out.mkdir(exist_ok=True)
for f in root.glob('adim10-web-*.py'):shutil.copy2(f,out/f.name)
for name in ['adim10-web-hazir.log','adim10-web-export.log','adim10-web-render.log']:shutil.copy2(root/name,out/name)
print(json.dumps({'UV1':0,'bounds_max_m':maxdelta,'validator':r['validator'],'dosyalar':[x['dosya'] for x in manifest]},ensure_ascii=False))
