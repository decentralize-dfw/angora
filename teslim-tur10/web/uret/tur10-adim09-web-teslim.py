from pathlib import Path
import json,shutil,struct,hashlib,datetime
D=Path(r'C:\Users\yigit\angora-git\teslim-tur10');W=Path(r'C:\Users\yigit\angora-tur10');web=D/'web';root=Path(__file__).parent
p=web/'web-kontrol.json';r=json.loads(p.read_text(encoding='utf-8'));r['validator']={};r['dosya_kurallari']=[]
for f in web.glob('*.glb'):
 b=f.read_bytes();j=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]]);v=json.loads((web/(f.name+'.validator.json')).read_text(encoding='utf-8'));r['validator'][f.name]={k:v['issues'][k] for k in ['numErrors','numWarnings','numInfos']};errors=[]
 for mat in j['materials']:
  for role,tex,mime in [('albedo',mat.get('pbrMetallicRoughness',{}).get('baseColorTexture'),'image/jpeg'),('normal',mat.get('normalTexture'),'image/png'),('roughness_G_metal_B',mat.get('pbrMetallicRoughness',{}).get('metallicRoughnessTexture'),'image/png')]:
   if tex and j['images'][j['textures'][tex['index']]['source']]['mimeType']!=mime:errors.append([mat['name'],role])
 r['dosya_kurallari'].append({'dosya':f.name,'format_hatasi':errors,'isik_nesnesi_yok':'KHR_lights_punctual' not in j.get('extensionsUsed',[]),'draco_meshopt_ktx_yok':not any(x in j.get('extensionsUsed',[]) for x in ['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu']),'kat_eksik':[n.get('name') for n in j['nodes'] if n.get('extras',{}).get('kat') not in ['bodrum','giris','kat1','cati']]})
 assert v['issues']['numErrors']==0 and v['issues']['numWarnings']==0
 assert f.stat().st_size<100_000_000 and not errors
r['uv_yontemi']='Foto-doku malzemelerinde dominant dünya normal ekseni; metre bazlı gerçek UV, doku_olcusu_xy_m ve ahsap_uzun_kenar yönü korunur. Önceden UV açılmış özgün malzemelerde mevcut UV korunur.'
r['kat_yontemi']='Özgün çok katlı meshler 3.0986 / 6.3704 / 9.4695 m düzlemlerinde UV ve normal interpolasyonu ile ayrıldı. Katlar arasında uzanan tek mimari EK_ parçalarında merkez yüksekliği kat etiketi olarak kullanılır.'
r['ad_yontemi']='Özgün mesh ve malzeme adları GLB adlarında; kat parçaları EK_ önekli, kaynak_nesne / kaynak_grup extras alanlarında özgün nesne kimliği. Aynı ada sahip malzeme varyantları glTF indeksleriyle ayrı kalır.'
r['son_gorsel_denetim']='01,02,18,21,34: yan yana göz kontrolünde belirgin geometri veya malzeme kaybı görülmedi. 40 cam alfa aktarımı ayrıca kontrol edildi.'
p.write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8')
table='\n'.join('| '+x['dosya']+' | '+f"{x['bayt']:,}"+' | '+f"{x['ucgen_sayisi']:,}"+' | 0 / 0 |' for x in json.loads((web/'web-teslim.json').read_text(encoding='utf-8')))
text='''# Adım 09 B · Web teslimi

BUILDING tek dosyada 100 MB sınırını aştığı için ikiye ayrıldı. İki parçayı birlikte, aynı kök dönüşümüyle yükleyin; INTERIOR üçüncü dosyadır. Eski EKLER ayrıca yüklenmez: mimari ekler BUILDING parçalarının içindedir. Eski mobilyalar INTERIOR içinde korunur.

| Dosya | Bayt | Üçgen | Validator hata / uyarı |
|---|---:|---:|---:|
'''+table+'''

Tüm gömülü dokular 2048×2048: albedo JPG/sRGB, normal PNG/Non-Color; metallic-roughness PNG'de roughness G, metal B. Draco/Meshopt/KTX sıkıştırması yok. Işık nesneleri GLB'ye alınmadı; etkili kontrol ışıkları `isiklar-v2.json` içinde, glTF Y-up metre konumuyla verilir. Güneş/gök kaydı da bulunur. Site, ışık kurulumunu bu JSON'dan yapmalıdır.

Kaynak 46 mesh grubundan geometriye dokunulmayan 31 grubun kaynak sınır kutuları 1 mm koşulunu sağlar. Üç GLB'nin boş sahneye geri yüklenmesinde 1771 grubun en büyük sınır farkı 0.000000476837 m. Katlara bölünen parçalar özgün kaynak kimliğini extras içinde taşır; her nesnede kat etiketi vardır. Katlar arasında uzanan yeni mimari parçaların katı merkez yüksekliğidir.

Foto 01,02,18,21,34 karşılaştırmaları aynı kamera, ışık ve pozlamayla üretildi. Doku 2048 yeniden örneklemesi, JPEG ve gürültü temizleme nedeniyle piksel düzeyinde eşit değiller; sayısal farklar `web-kontrol.json` içinde. Foto40 desenli cam için JPEG RGB korunurken değişken alfa 128×256 yüzey ağına COLOR_0 olarak aktarıldı; ek karşılaştırma da eklendi.

SHA256, bayt, üçgen ve malzeme listeleri: [web-teslim.json](web-teslim.json). Denetimler: [web-kontrol.json](web-kontrol.json). Işıklar: [isiklar-v2.json](isiklar-v2.json).

'''
for n in [1,2,18,21,34,40]:text+=f'\n![Web doğrulama {n:02d}](web_dogrulama_{n:02d}.jpg)\n'
text+='''
## Kalanlar

DWG panelinin göreli çizgileri korunur; 1.00×0.80 m nominal detay ölçeği saha/ölçü çizgisiyle ayrıca doğrulanmadı. Foto32 bordür motifi birebir değil; foto47 sol üst tavan birleşiminde ince açıklık ve foto34 kapı altı ışık çizgileri kontrol .blend'inde de mevcut. Bu kusurlar GLB aktarımından kaynaklanmıyor; A notlarında kayıtlı.

Bu klasör siteye entegrasyon teslimidir; canlı sitenin dosya bağlantıları değiştirilmedi.
'''
(web/'README.md').write_text(text,encoding='utf-8')
note='''\n## Adım 09 B — Web teslimi\n\nYAPILDI: BUILDING-opt-v6-alt.glb + BUILDING-opt-v6-ust.glb ve INTERIOR-opt-v3.glb. BUILDING 100MB üzeri olduğundan iki parçaya ayrıldı; ayrı commitlerle gönderilir. Yeni mimari EKLER birleştirildi, silme kutuları uygulandı, eski mobilyalar korunur.\nYAPILDI: 2048px JPG/PNG dokular, gerçek metre bazlı UV, normal/roughness renk uzayı, G roughness/B metal paketleme, kat extras, özgün kaynak adları, ışıkların ayrı JSON teslimi.\nYAPILDI: üç dosyanın gltf-validator sonucu 0 hata / 0 uyarı. 31 dokunulmayan kaynak grup sınır kontrolü ve 1771 geri-yüklenen grup 1mm sınır kontrolü geçti.\nYAPILDI: 01,02,18,21,34 .blend|GLB kontrolü; ortalama mutlak RGB farkı 255 üzerinden yaklaşık0.81–1.71. Foto40 alfa aktarımı ayrıca kontrol edildi.\nYAPILDI: ilk doku dönüşümündeki siyah görüntü sorunu kaynak ham veriyi Pillow ile okuyarak giderildi; hatalı dosyalar teslim edilmedi. Sıfır UV teğetleri normale dik birim teğete düzeltildi.\nKALDI: A bölümündeki nominal DWG ölçeği doğrulaması, 32 bordür motifi, 47 tavan birleşimi, 34 kapı altı çizgileri. GLB bunları kaynak .blend ile aynı taşır.\nAyrıntı ve görseller: [web/README.md](web/README.md).\n'''
for f in [D/'notlar.md',W/'notlar.md']:
 old=f.read_text(encoding='utf-8').split('\n## Adım 09 B —')[0];f.write_text(old+note,encoding='utf-8')
q=D/'ilerleme/README.md';old=q.read_text(encoding='utf-8').split('\n## 11 · Adım 09 B')[0];old+='\n## 11 · Adım 09 B · Web teslimi\n\n[Dosyalar, SHA256 ve doğrulama raporları](../web/README.md)\n\nÜç GLB: **0 hata / 0 uyarı**. 1mm koordinat kontrolü geçti. BUILDING alt/üst olarak iki parçadır.\n'
for n in [1,2,18,21,34]:old+=f'\n![.blend ve GLB {n:02d}](../web/web_dogrulama_{n:02d}.jpg)\n'
old+='\nKALDI: nominal DWG panel ölçüsünün ayrıca doğrulanması; 32 bordür motifi; 47 tavan birleşimi ve 34 kapı altı ışık çizgileri.\n';q.write_text(old,encoding='utf-8')
out=web/'uret';out.mkdir(exist_ok=True)
for f in root.glob('tur10-adim09-web-*.py'):shutil.copy2(f,out/f.name)
shutil.copy2(root/'tur10-adim09-validator.cjs',out/'tur10-adim09-validator.cjs')
for name in ['adim09-web-render.log','adim09-web-render40.log','adim09-web-bol.log']:shutil.copy2(W/name,web/name)
print('[web] TESLIM RAPORU',datetime.datetime.now().isoformat())
