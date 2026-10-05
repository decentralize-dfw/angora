import { FLOWS } from '../casestudy2-data.js';
import { GRADING_METHOD } from '../casestudy2-grades.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const flows=Object.values(FLOWS).filter(f=>f.project==='active');
const stamp=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${(n%60).toFixed(2).padStart(5,'0')}`;
const number=n=>n===null?'N/A':n.toFixed(1);
const now=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',dateStyle:'short',timeStyle:'medium'}).format(new Date());
const refs=new Set(flows.flatMap(f=>f.scenes.flatMap(s=>s.review.references.map(r=>`${r.flow}:${r.key}`))));
const refName=r=>`${r.flow}/${FLOWS[r.flow].scenes.find(s=>s.key===r.key).id}`;
const qaPath=new URL('../docs/casestudy2-regrading-browser-checks-2026-10-05.json',import.meta.url);
const qa=existsSync(qaPath)?JSON.parse(readFileSync(qaPath,'utf8')):null;
let md=`# Angora web2 — bağımsız ara notlama, ikinci inceleme

Tarih/saat: **${now} Europe/Paris (UTC+02:00)**.

Durum: **Notlama tamamlandı. web3 ve web4 uygulanmadı.** Kaynak, kullanıcının Videos klasöründeki **2026-10-05 15-29-15.mp4** kaydıdır. Kayıtta web2 açılmıştır; bugünkü canlı sürümün veya fiziksel telefon performansının sertifikası değildir.

## Önceki notların düzeltmesi

İlk rapordaki sayılar geçiş türlerinin ortak şablonlarından geliyordu. Tek tek kesitlere özgü bağımsız notlar olarak sunulmaları doğru değildi. Bu notlar geri çekildi; tarihli eski rapor geçmiş kayıt olarak korundu. Yeni listede 109 kesitin her biri için dört gerekçe, iki kaynak karesi ve somut kabul koşulu yazıldı. Aynı kusur aynı notu alabilir; farklı puan dağılımı üretmek için rastgele ayrım yapılmadı.

Eski hesap üç boyutun ortalamasıydı. Yeni hesap dört boyutun en düşüğüdür. Eski ve yeni toplam arasındaki fark kalite değişimi veya puan düşürme miktarı olarak okunmamalıdır. Kayıt aynı kaldı; yöntem ve gerekçelendirme düzeltildi.

## Ölçek ve yöntem

- **Devamlılık:** mekânın, seçili katın, hareket yönünün ve geri dönüş durumunun korunması.
- **Hareket:** görüntü/yüzey/metin sırası, görünür kesme, çift görüntü ve hareket bağının anlaşılması.
- **Kadraj:** evin veya planın okunması; metin, fotoğraf ve viewport dengesi.
- **Okuma:** yazı kontrastı/boyutu, oda/pin/koni ilişkisi ve bilginin doğru zamanda gelmesi.
- **Geçiş notu = değerlendirilebilen en düşük boyut.** Sorunlu bir boyutun diğer yüksek notlarla gizlenmesini önleyen editoryal karar kuralıdır; istatistiksel ölçüm değildir.
- Yarım puanlar iki çıpa arasındaki ayrımdır; ölçülmüş FPS veya milisaniye hassasiyeti değildir.
- Kaydedilmeyen etkileşim **N/A**. Mobil kamera 3 kesitinde seçim zaten aktiftir; tıklama animasyonuna not verilmedi.
- 9 kabul koşulları gelecekteki uygulamanın hedefidir; kazanılmış not değildir.
- Bu dört sayı **görsel kurgu** puanıdır. İşlev onayı değildir; **Koru**, kontrolün doğru işlem yaptığını veya scroll/modal testlerinin geçtiğini söylemez.
- P0 işlev hatası ayrı **teslim engeli** olarak tutulur; görsel puanla ortalaması alınmaz. Kayıtta gösterilmeyen kontroller doğrulanmadı durumundadır.

| Çıpa | Anlam |
|---:|---|
`;
for(const [n,text] of Object.entries(GRADING_METHOD.anchors))md+=`| ${n} | ${text} |\n`;
md+=`
## Kaynak incelemesi ve sınırlar

Desktop **65 kesit**, kaynak **00:04.00–01:50.00**. Mobil **44 kesit**, kaynak **02:02.00–03:27.00**. Tekrar ziyaretler, ters hareketler ve okuma durakları ayrı tutuldu; 109 farklı animasyon iddiası yoktur.

Her kesit için kaynak videodan 12 zaman örnekli inceleme sayfası çıkarıldı. Genel inceleme panoları bunların dört karesini yan yana gösterir; film çıkışı, bahçe bilgi senkronu ve lightbox gibi sorunlu kesitler daha geniş kare dizileriyle kontrol edildi. Her kesitin bütün 60 fps kareleri veya fiziksel mouse/touch tepkisi ölçülmedi. Oynatıcı doğrulaması aşağıda ayrı belirtilir.

- Mobil, Chrome emülasyonudur: 459 × 686 CSS px; yayımlanan crop 426 × 636. Gerçek telefon testi değildir.
- Desktop crop x0/y152, 2540 × 1388 → 1920 × 1050. Mobil crop x594/y254, 426 × 636.
- İlk siyah açılış örtüsü, tüm kamera seçimleri, menü açılışı, form gönderimi ve bütün mobil galeri fotoğrafları kayıtta yoktur.
- Bekleme süreleri kullanıcının duruşlarını içerir; animasyon süresi diye puanlanmadı.
- Analiz katmanları gözlenen okuma bölgeleridir; referansların izole DOM/compositor katmanları değildir.
- Aşağıdaki zamanlar orijinal video saatidir; oynatıcı ofseti çıkararak bu karelere gider.

## Düzeltilen teşhisler

1. Desktop galeri kartları bir kesit geç etiketlenmişti. Sınırlar 84.55 / 85.45 / 86.35 / 87.35 saniyeye düzeltildi. Lightbox açılışı 90.20, kapanışı 92.10 saniyeden başlar; hareket artık kesitin içinde.
2. Mobil mutfak→plan dönüşünde aynı mutfak fotoğrafı geri geliyor. Önceki “kesin kamera reset'i” teşhisi bu kesit için geri çekildi. Dar yerleşim ve başlığın üst arayüze yaklaşması değerlendirildi.
3. Angora Journal'ın iki fotoğrafı desktop ve mobilde mevcut. Eksik görsel teşhisi konmadı; farklı bağlamlar değerlendirildi.
4. Film çıkışında görüntü birlikte küçülmek yerine yukarı kırpılıyor. Mobil çıkışın yönü düşeydir; yan yana kareler yatay hareket kanıtı sayılmadı.
5. Attic modelinden Garden planına geçerken kat kimliği değişiyor. Referanslarda birebir kat→plan dönüşümü yok; öneri referans bilgi hiyerarşisinden çıkarılan tasarım kararıdır.
6. Tam siyah kare gözlenmeyen kesitlere “black flash” kusuru yazılmadı. Gece→gündüz devrindeki çift perspektif ve ışık farkı ayrıca puanlandı.

## Sonuç dağılımı

Bu özet notları hesaplar; notlar ayrı yazılmış gözlemlerden gelir. Mevcut duruma 9 kazanıldı denmiyor.

| Kayıt | Kesit | En düşük | En yüksek | <6 | 6–<8 | ≥8 | ≥9 |
|---|---:|---:|---:|---:|---:|---:|---:|
`;
for(const f of flows){const a=f.scenes.map(s=>s.review.score);md+=`| ${f.device==='desktop'?'Desktop':'Mobil emülasyon'} | ${a.length} | ${number(Math.min(...a))} | ${number(Math.max(...a))} | ${a.filter(n=>n<6).length} | ${a.filter(n=>n>=6&&n<8).length} | ${a.filter(n=>n>=8).length} | ${a.filter(n=>n>=9).length} |\n`;}
md+=`
## İşlev değerlendirmesine ek düzeltme

D28 (55.55–56.35) için 4.5, görsel devamlılık puanıdır. Kullanıcının bildirdiği **plan fotoğrafına basınca isometriğe atma**, sıradan easing kusuru değil, **P0 / teslim engeli**. D34'teki kat kaybı da ayrı P0'dır. Kayıt yanlış model/kat dönüşünü gösterir; tetikleyen input her kesitte görünmez. Canlı ek denemede aynı isometriğe atma yeniden üretilemedi; kamera seçiminde sayfa konumu değişti. Bunlar birbirinin yerine kanıt sayılmaz.

Diğer 107 kesitin işlev durumu **doğrulanmadı**. Görsel Koru/İncelt kararı hiçbirini işlevsel olarak geçirmiş değildir. [Detaylı web3 planı](web3-era-plan-2026-10-05.md), 109 kesiti, mevcut tasarım notlarını, 49 ERA referansını ve bağlam koruma testlerini ayrı gösterir. [Canlı ek deneme kaydı](web3-behavior-checks-2026-10-05.json) sınırlarıyla birlikte korunur.

## Uygulama sırası

1. P0 fotoğraf→isometri hatası, kat kimliği ve scroll kilidi: aynı kat/kamera/scroll konumunun korunması.
2. Film çıkışı: evin tamamını ortak odakta tutan pencere+görüntü küçülmesi ve sıralı bilgi.
3. Mobil plan: küçük pasif pin, aktif bakış konisi, okunur oda adı ve fotoğraf alanı.
4. Bahçe: başlık ve fotoğrafın aynı mekânı aynı anda göstermesi.
5. Viewing ve map: cepheyi kapatmayan bilgi; ev/boundary işaretlerinin dar ekran içinde kalması.
6. İyi fotoğraf akışlarını koruyarak caption/kontrast sorunlarını düzeltme.

8 altındaki her kesitin 9 kabul koşulu ayrıntılarda yazılıdır. Hedefe ulaşıldığı ancak yeni uygulamanın aynı cihaz ve ters yönde yeniden görülmesi sonrasında söylenebilir. web3 ERA, web4 Likova için ileriki iki ayrı uygulamadır; bu rapor bunları olmuş gibi göstermez.

## Referans kullanımı

92 gerçek ERA/Likova sahnesi kütüphanede erişilebilir. **${refs.size} farklı sahne** bağlamı açıklanan öneri olarak seçildi. Aynı cihaz kayıtları eşleştirildi; cookie, çoklu konut listesi veya ajans ekip bağlamları villaya zorlanmadı. Klipler bağımsız oynar; scroll hızları yapay olarak eşitlenmez.

## Doğrulama

- 18 veri testi: 201 sahnenin aralıkları, ofsetleri, medya/still dosyaları, cihaz eşleşmesi, 109 açık not girdisi, kaynak kare zamanları, tekrar bağları, export/player eşitliği ve P0/işlev onayının görsel puandan ayrı tutulması. Bunlar web2 kontrollerinin geçtiği anlamına gelmez.
- Önceki tur tarayıcı kontrolleri eski JSON'da korunur; yeni notların gerekçesi yerine geçmez.
`;
if(qa){md+=`- Bu tur [tarayıcı kontrol kaydı](casestudy2-regrading-browser-checks-2026-10-05.json): ${qa.checkedAt}.\n`;for(const note of qa.summary)md+=`- ${note}\n`;}else md+='- Bu tur tarayıcı doğrulaması henüz rapora kaydedilmedi.\n';
md+='\n## Kesit envanteri\n\nD/H/K/O = devamlılık / hareket / kadraj / okuma. Kaynak aralığı tümüyle animasyon süresi değildir.\n';
for(const f of flows){md+=`\n### ${f.device==='desktop'?'Desktop':'Mobil emülasyon'}\n\n| No | Kaynak | Kesit | D/H/K/O | Geçiş notu | Karar | Referanslar |\n|---:|---|---|---|---:|---|---|\n`;for(const s of f.scenes)md+=`| ${s.id} | ${stamp(s.sourceStart)}–${stamp(s.sourceEnd)} | ${s.title} | ${s.review.scores.map(number).join(' / ')} | ${number(s.review.score)} | ${s.review.verdict} | ${s.review.references.map(refName).join(', ')} |\n`;}
md+='\n## Her kesitin gerekçesi, kanıtı ve 9 kabul koşulu\n';
for(const f of flows){md+=`\n### ${f.device==='desktop'?'Desktop':'Mobil emülasyon'} / ayrıntılar\n`;for(const s of f.scenes){const r=s.review;md+=`\n#### ${f.device==='desktop'?'D':'M'}${String(s.id).padStart(2,'0')} · ${s.title}\n\n[Gerçek klibi aç](../casestudy2.html#${f.id}-${s.id}) · ${stamp(s.sourceStart)}–${stamp(s.sourceEnd)} · **${number(r.score)}/10** · ${r.verdict}.\n\n`;r.reasons.forEach((text,i)=>md+=`- **${GRADING_METHOD.criteria[i]} ${number(r.scores[i])}:** ${text}\n`);md+=`\nKaynak kareleri: ${r.evidence.map(e=>`**${stamp(e.sourceTime)}** — ${e.note}`).join('; ')}.\n\n**9 kabul koşulu:** ${r.acceptance}\n`;if(r.repeatOf)md+=`\nTekrar ziyaret: ${f.scenes.find(t=>t.key===r.repeatOf).title}. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.\n`;else if(r.kind!=='Geçiş')md+=`\nKesit türü: ${r.kind}.\n`;md+='\nReferans seçkisi:\n\n';for(const ref of r.references){const t=FLOWS[ref.flow].scenes.find(t=>t.key===ref.key);md+=`- [${refName(ref)} · ${t.title}](../casestudy2.html#${ref.flow}-${t.id}): ${ref.reason}${ref.focus?` Odak: ${stamp(ref.focus.sourceStart)}–${stamp(ref.focus.sourceEnd)}.`:''}\n`;}md+=`\n**Sınır:** ${r.avoid}\n`;}}
md+='\n## Tekrar üretim\n\n1. `node tools/casestudy2-manifest.mjs`\n2. `python tools/casestudy2-stills.py --project active`\n3. `python tools/casestudy2-grading-frames.py` ve `python tools/casestudy2-grading-boards.py` (yerel inceleme)\n4. `node --test tests/casestudy2-data.test.mjs`\n5. `node tools/casestudy2-regrading-audit.mjs`\n\nPuan kaynağı `casestudy2-grades.js`: her anahtar ayrı yazılıdır; ortak tariflerden sayısal not türetilmez. Rapor üreticisi yalnız envanter ve metin ihracıdır; yeni gözlem yapmaz.\n';
writeFileSync(new URL('../docs/casestudy2-regrading-2026-10-05.md',import.meta.url),md);
console.log('Individual review report written: 109 cuts.');
