from pathlib import Path
import json,re,runpy
W=Path(r"C:\Users\yigit\angora-tur10");A=W/'adim07'
obs=runpy.run_path(str(Path(__file__).with_name('tur10-adim07-gozlem.py')))['GOZLEM']
rows=json.loads(Path(r"C:\Users\yigit\angora-foto-eslesme-2\rapor.json").read_text(encoding='utf-8'))['kareler']
assert len(rows)==40 and set(obs)=={r['id'] for r in rows}
log=(W/'adim07-kontrol.log').read_text(encoding='utf-8',errors='replace');done=[int(n) for n in re.findall(r'\[kontrol\] render (\d+) pozlama',log)];assert set(done)==set(obs)
lines=['\n## Adım 07 · parke kapanış + merdiven + 40 fotoğraf kontrolü\n',
'Parke ilk 10 dakikalık düzeltme bölümü sonunda kilitlendi. Yeni kusur doğrulanmadıkça yeniden düzenlenmeyecek. Damar: Poly Haven European Walnut Veneer 05, 4K, CC0; renk: foto29/34 içindeki 44 örnekten filtre sonrası 21 sıcak örnek. 23 koyu/uygunsuz örnek çıkarıldı. 420 tahta, bağımsız sıra kaydırmaları; dikey sınırdan taşan tahtalar karşı kenarda devam ediyor.\n',
'### Çapraz çizgi teşhisi\n',
'Wireframe ve önceki ışın ölçümleri aynı wood_floor.001 kenarını gösterdi: Y=2.02709484 m, kenar Z=9.47023296 m; komşu ışın isabetleri Z≈9.46937 m. Mesh özel bölünmüş normaller içeriyordu. Atlas U sınırı değil. Teşhis: zemin mesh sınırındaki milimetre altı kot/normal süreksizliği; üst üste iki ayrı döşeme nesnesi kanıtlanmadı, rastgele alt yüz silinmedi. Render/doku yardımcısında yakın kotlar eşitlendi, yakın köşeler birleştirildi, normaller yeniden hesaplandı; parke normal haritası WORLD uzayına alındı. Kanıt: adim07/parke_wireframe.png ve wireframe-teshis.json.\n',
'### Merdiven ve kalan düzeltmeler\n',
'Adım05 yedeğindeki basamak/rıht meshleri temel alındı. Her yüzey kendi parçasının UV sınırları içinde, sarım eki olmadan kaplandı. Düz düşük kontrastlı damar; roughness 0.25. Adım05 yuvarlatılmış ve rıhttan taşan burun geometrisi korundu. Foto29 üst spotları %55 ölçeğe, emisyon 0.15 değerine indirildi. Taşan A06 eşik alt blokları kaldırıldı; kapak üstleri zemine sıfırlandı. Kartonpiyer yakın uçları kaynaklandı. Foto40 kamera ve kapı kanat açısı yeniden ayarlandı. Bunların görsel olarak kalan farkları aşağıda tamamlandı sayılmadan listelenmiştir.\n',
'### 40 fotoğraf: oda bazında öz denetim\n',
'40 render dosyası üretildi; bu, 40 kameranın doğru olduğu anlamına gelmez. Kapanan/siyah kadrajlar açıkça işaretlidir. Yeni odalardaki farklar Adım08 kapsamıdır; bu adımda düzeltilmedi. Mobilya üretimi bu adım kapsamında değildir.\n']
heads=['Malzeme tonu','Fazla/eksik nesne','Kalıntı/yerleşim','Geometri/oran']
for r in rows:
 lines.append(f"\n#### Foto {r['id']:02} — {r['yer']}\n")
 for h,v in zip(heads,obs[r['id']]):lines.append(f"- **{h}:** "+('' if v.startswith('DÜZELTİLDİ') else 'KALDI (Adım08): ')+v+'\n')
(W/'notlar.md').open('a',encoding='utf-8').write(''.join(lines))
(A/'40-foto-denetim.json').write_text(json.dumps([dict(foto=r['id'],oda=r['yer'],**dict(zip(heads,obs[r['id']]))) for r in rows],ensure_ascii=False,indent=1),encoding='utf-8')
print('[adim07] 40 render ve 40 oda denetimi doğrulandı')
