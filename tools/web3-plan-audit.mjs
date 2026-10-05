// Export authored mappings; this script does not inspect media or invent scores.
import { FLOWS } from '../casestudy2-data.js';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const target = new URL('../docs/web3-era-plan-2026-10-05.md', import.meta.url);
const base = {
 opening:[2], 'camera-arrival':[3], 'camera-perspective':[4], 'camera-garden':[5],
 'hero-exit':[6], 'residence-intro':[7], arrival:[8], 'rooms-entry':[9,10],
 'rooms-1-2':[10], 'rooms-2-3':[10], 'garden-entry':[11],
 'garden-pool-terrace':[12], 'garden-terrace-garden':[13], 'garden-exit':[14],
 'garden-garden-terrace-reverse':[13], 'garden-terrace-pool-reverse':[12], 'garden-rooms-reverse':[11],
 'inside-social':[15], 'inside-private':[16], 'kitchens-entry':[17], 'kitchen-return':[17,19],
 'kitchens-1-2':[18], 'kitchens-2-3':[19], 'iso-entry':[20],
 'iso-garden-entrance':[21], 'iso-entrance-first':[22], 'iso-first-attic':[23],
 'atlas-entry':[24], 'atlas-garden-entrance':[25], 'atlas-entrance-first':[26], 'atlas-first-attic':[27],
 'return-iso-1':[28,29,30,46], 'camera-point':[28],
 'details-entry':[31], 'details-stair':[32], neighbourhood:[33], 'map-entry':[34],
 'journal-entry':[35], 'journal-cards':[36], 'journal-second-image':[36], 'journal-culture':[37],
 'gallery-entry':[38], 'gallery-1-2':[39], 'gallery-2-3':[39], 'gallery-3-4':[39],
 'gallery-4-5':[39], 'gallery-5-6':[39], 'gallery-6-7':[39], 'gallery-7-8':[39],
 'gallery-lightbox-open':[41], 'gallery-lightbox-close':[41],
 'contact-entry':[42], 'contact-card':[42], 'footer-entry':[43], 'footer-orbit':[44],
 'footer-contact-reverse':[43,42], 'contact-gallery-reverse':[39], 'gallery-reverse':[39], 'footer-links':[45]
};
// Each reference has a content-specific selection decision, including exclusions.
const era = {
 identity:['Uyarla',[1],'Kimlik tamamlanmadan kamera hareketi başlamaz; loader görünümünü birebir taşımayız.'],
 'arch-intro':['Uyarla',[1],'İlk hazır görüntünün önündeki örtü açılır; ilk siyah frame bekleme alanı değildir.'],
 cookie:['Kapsam dışı',[],'Cookie kartı ev anlatısının geçişi değildir; varsa gerçek gereksinimi ayrı karşılanır.'],
 pins:['Uyarla',[28],'Nokta ile kendi bilgisi bağlı kalır; hover zorunlu değildir, büyük kart planı örtmez.'],
 'hero-dive':['Uyarla',[3,4,5],'Her kamera parçası tek mimari hedef ve bir bilgi durağı taşır.'],
 'arch-cover':['Uyarla',[11],'Yeni yüzey önceki sahnede görünür, sonra devralır; kavis yalnız bu anlamlı eşikte.'],
 reasons:['Uyarla',[7],'Az sayıda bilgi dengeli gruplar hâlinde; sayaç animasyonu Angora ölçülerine eklenmez.'],
 'reasons-carousel':['Uyarla',[7,12,13],'Mobil seçim açık durum değiştirir; alan bilgisi zorunlu carousel içine saklanmaz.'],
 'alpha-quote':['Kapsam dışı',[],'Fotoğraftan çıkarılmış güvenilir alpha katmanı yok; yapay siluet/çiçekle içeriği bozmamayı seçiyoruz.'],
 concept:['Uyarla',[8,16,33],'Fotoğraf ve kısa anlatının bağı alınır; öndeki dekoratif çiçekler kopyalanmaz.'],
 horizontal:['Uyarla',[39],'Desktop rayı son fotoğrafa kadar ilerler; mobil kayıt düşey olduğundan zorunlu wheel rayı mobilde kopyalanmaz.'],
 route:['Uyarla',[34],'Yön ve yer ilişkisi ev/sınır/ok ile gösterilir; flat haritaya sahte uçuş rotası eklenmez.'],
 aerial:['Uyarla',[3,4,5,33],'Geniş bağlamdan tek eve odak; yeni owner görselleri kullanılır, ERA aerial görseli Angora diye sunulmaz.'],
 'residence-type':['Uyarla',[7,20,24],'Kat adı, ölçü ve görsel tek bilgi grubunda. ERA içinde birebir iso→plan dönüşümü yok.'],
 'amenity-tabs':['Uyarla',[12,13,25,26,27,28],'Seçili durum, fotoğraf ve caption birlikte commit; ERA eğimli maskesi planda kullanılmaz.'],
 'interior-arch':['Uyarla',[14],'Bahçeden iç mekâna yeni paper yüzeyi; küçük mimari eşik, tekrar tekrar kavis yok.'],
 'interior-columns':['Uyarla',[8,10,15,16,33,35,36],'Fotoğraf-caption çifti ayrılmadan farklı hız/hiza; mobilde okunur tek akış.'],
 'interior-gallery':['Uyarla',[9,10,38,39],'Son resim yeni bölümü haber verir; bütün fotoğraflar tek büyük katalog gibi gösterilmez.'],
 'architecture-merge':['Kapsam dışı',[],'ERA aynı mimari görüntüyü birleştirir. Farklı Angora odalarını tek ev karesi gibi birleştirmek yanlış bilgi üretir. Eşleşen iki kaynak olmadan bu efekt eklenmez.'],
 'architecture-mobile':['Uyarla',[20,24],'Mobilde birleştirme yok; doğrudan tek, bütün mimari kadraj ve açık kat kimliği.'],
 'architecture-dive':['Uyarla',[6,20],'Ortak mimari odak ve ölçü ilkesi alınır; teknik modelde gereksiz içeri dalış veya zoom-extents sıçraması yok.'],
 'architecture-exit':['Uyarla',[6,24],'Pencere ile içerideki ev birlikte geri çekilir; bilgi oluşan alana gelir. Kat-plan bağlantısı bizim tasarım kararıdır.'],
 'closing-cta':['Uyarla',[11,42],'Bütün dış mekân fotoğrafı ve kısa büyük cümle; form cephenin üstünü kapatmaz.'],
 footer:['Uyarla',[43,45],'Daralan gerçek görüntü ve büyüyen eylem alanı aynı kompozisyonda; model ve CTA sığar.'],
 'footer-reverse':['Uyarla',[43,46],'Aynı yol geri okunur; viewing/galeri arasında ani atlama yok.'],
 'page-change':['Uyarla',[46],'Açık navigation hedefe gider; fotoğraf seçimi bu olay türüne dönüştürülmez.'],
 'plan-detail':['Uyarla',[25,26,27,28],'Plan, fotoğraf, ölçü ve kontrol aynı bağlamda; çoklu konut listesi Angora içeriğine taşınmaz.'],
 'detail-gallery':['Uyarla',[10,39],'Görsel kendi captionı ile ilerlerken bilgi sabit okunur; mobil planı dar fotoğraf kolonuna hapsetmez.'],
 lightbox:['Uyarla',[29,30,41],'Aynı kaynak fotoğraf contain açılır, kendi koleksiyonunda ilerler, aynı bağlama kapanır.'],
 similar:['Kapsam dışı',[],'Tek ev için benzer konut kataloğu yok; önerilen katlar farklı satılık evlermiş gibi sunulmaz.'],
 'return-list':['Uyarla',[30,46],'İşlemden kaynak bağlama dönme ilkesi; olmayan konut listesi eklenmez.']
};
const pad=n=>String(n).padStart(2,'0');
const ts=n=>`${pad(Math.floor(n/60))}:${(n%60).toFixed(2).padStart(5,'0')}`;
const safe=s=>String(s).replaceAll('|','/').replaceAll('\n',' ');
const score=n=>n===null?'N/A':n.toFixed(1);
const plan=ids=>ids.map(id=>`T${pad(id)}`).join(', ');
const label=(f,s)=>`${f.project==='era'?'ERA ':''}${f.device==='desktop'?'D':'M'}${pad(s.id)}`;
const link=(f,s)=>`[${label(f,s)}](../casestudy2.html#${f.id}-${s.id})`;
const mapScene=(f,s)=>{
 let at=s;
 const visited=new Set();
 while(!base[at.key]&&at.review?.repeatOf){
  assert(!visited.has(at.key),'Circular repeat mapping'); visited.add(at.key);
  at=f.scenes.find(other=>other.key===at.review.repeatOf); assert(at,'Unknown repeat');
 }
 const ids=base[at.key]; assert(ids,`Unmapped ${f.id}/${s.key}`);
 assert(ids.every(id=>id>=1&&id<=49),'Invalid plan id'); return ids;
};
const active=Object.values(FLOWS).filter(f=>f.project==='active');
const refs=Object.values(FLOWS).filter(f=>f.project==='era');
assert.equal(active.reduce((n,f)=>n+f.scenes.length,0),109);
assert.equal(refs.reduce((n,f)=>n+f.scenes.length,0),49);
const keeps=active.flatMap(f=>f.scenes.filter(s=>s.review.verdict==='Koru').map(s=>({f,s})));
assert.equal(keeps.length,17);
let md='\n### 11a. Mevcut 109 kesit → somut web3 maddesi\n\n';
md+='D/M, Angora kaynak kesit numarasıdır. Kadraj / okuma yalnız tasarım boyutlarıdır; işlev sütunu bunlardan bağımsızdır. Aynı geçişin tekrarlarını ayrıca tutuyoruz. Bu tablo yeni gözlem veya yeni not üretmez.\n';
for(const f of active){
 md+=`\n#### ${f.device==='desktop'?'Desktop / 65 kesit':'Mobil emülasyon / 44 kesit'}\n\n| Kesit | Kaynak saati | Mevcut sahne | Kadraj / okuma | Görsel karar | İşlev durumu | Plan |\n|---|---|---|---|---|---|---|\n`;
 for(const s of f.scenes){
  const r=s.review, ids=mapScene(f,s);
  md+=`| ${link(f,s)} | ${ts(s.sourceStart)}–${ts(s.sourceEnd)} | ${safe(s.title)} | ${score(r.scores[2])} / ${score(r.scores[3])} | ${r.verdict}; ${score(r.score)} | ${r.functional.status==='blocked'?'**P0 / teslim engeli**':'Onay yok / ayrıca test'} | ${plan(ids)} |\n`;
 }
}
md+='\n### 11b. “Koru” dediğimiz 17 kesitte ne korunuyor?\n\n';
md+='Bu kararların hiçbiri “kontroller, scroll kilidi, modal dönüşü, fiziksel telefon veya performans geçti” demek değildir. Aşağıdaki dar görsel yön korunur; T maddesinin kabul koşulları yine uygulanır.\n\n| Kesit | Kaynakta kadraj gerekçesi | Plan / korunacak görsel yön | İşlev onayı |\n|---|---|---|---|\n';
for(const {f,s} of keeps){
 assert.equal(s.review.functional.status,'unverified');
 md+=`| ${link(f,s)} · ${safe(s.title)} | ${safe(s.review.reasons[2])} | ${plan(mapScene(f,s))} · ${safe(s.review.action)} | **Yok** |\n`;
}
md+='\n### 11c. ERA kütüphanesinin 49 sahnesi için seçki kararı\n\n';
md+='Burada ERA D## ve ERA M## gerçek kütüphane klipleridir. Önceki tablolardaki E## kısa referansı ERA desktop numarasıdır. “Uyarla” birebir aynı geometriyi kopyalama iddiası değildir; hangi ilkenin hangi Angora içeriğine uyduğu yazılıdır. Kapsam dışı sahneler de incelenmiş ve gerekçeli olarak ayrılmıştır. Mobilde kaydedilmeyen preloader, pin, sayfa değişimi veya lightbox efekti varmış gibi sunulmaz.\n';
for(const f of refs){
 md+=`\n#### ERA / ${f.device==='desktop'?'Desktop / 29 sahne':'Mobil emülasyon / 20 sahne'}\n\n| Gerçek klip | Kaynak saati | Karar | Angora maddesi | Seçki gerekçesi |\n|---|---|---|---|---|\n`;
 for(const s of f.scenes){
  const selection=era[s.key]; assert(selection,`Unmapped ERA scene ${s.key}`);
  const [decision,ids,reason]=selection;
  md+=`| ${link(f,s)} · ${safe(s.title)} | ${ts(s.sourceStart)}–${ts(s.sourceEnd)} | ${decision} | ${ids.length?plan(ids):'—'} | ${safe(reason)} |\n`;
 }
}
md+='\nToplam: **109 Angora kesiti, 17 dar kapsamlı görsel “Koru” kararı, 49 ERA sahnesi**. T01, T29–30, T40, T47–49 gibi kayıtta tam gösterilmeyen işlemler kaynakta olmuş gibi puanlanmaz; uygulama sözleşmesi ve yeni test kapsamıdır. İzlenebilirlik eki `node tools/web3-plan-audit.mjs` ile aynı açık eşleştirmelerden üretilir.\n';
const start='<!-- TRACEABILITY_START -->',end='<!-- TRACEABILITY_END -->';
const source=readFileSync(target,'utf8');
assert.equal(source.split(start).length,2); assert.equal(source.split(end).length,2);
writeFileSync(target,source.slice(0,source.indexOf(start)+start.length)+md+'\n'+source.slice(source.indexOf(end)));
console.log('web3 plan traceability: 109 cuts, 17 Koru decisions, 49 ERA scenes. No score changes.');
