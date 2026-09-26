// Galeri görsellerini WebP'ye çevirir ve ANLAMLI dosya adı verir.
//
//   node tools/seo/build-gallery-images.mjs
//
// İki ayrı kazanç:
//
// 1. AĞIRLIK. Kaynak 56 fotoğraf 1600x1200 JPEG, toplam ~36 MB. Galeri
//    sayfası hepsini basıyor; lazy yükleme ilk ekranı kurtarır ama sayfanın
//    toplam ağırlığı yine de arama tarafında Core Web Vitals olarak geri
//    döner. WebP aynı görüntüyü belirgin biçimde daha az baytla verir ve
//    srcset ile telefon küçük olanı indirir.
//
// 2. DOSYA ADI. `angora_01.jpg` görsel aramaya hiçbir şey söylemez. Google
//    Görseller dosya adını sıralama sinyali olarak kullanır; emlakta görsel
//    sekmesi ayrı bir giriş kapısıdır. Ad, fotoğrafın KENDİ oda etiketinden
//    türetiliyor (photo-points.js), uydurulmuyor:
//      "Bodrum · Salon" -> angora-evleri-villa-bodrum-salon-02.webp
//
// Kaynak JPEG'lere DOKUNULMAZ: 3B görüntüleyici onları kendi foto
// noktalarında kullanmaya devam ediyor. Bu dosyalar yalnız galeri
// sayfaları için üretilir.
import {mkdirSync, existsSync, statSync, readdirSync, unlinkSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from '../batch-delivery/node_modules/sharp/dist/index.cjs';
import {PHOTO_POINTS} from '../../viewer/src/photo-points.js';

const ROOT = new URL('../../', import.meta.url);
const OUT = new URL('assets/galeri/', ROOT);
const WIDTHS = [640, 1280];

// Türkçe karakterler dosya adında sorun çıkarır ve URL'de kodlanır; sadeleştir.
const slug = s => s.toLowerCase()
  .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
  .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const imageName = point =>
  `angora-evleri-villa-${slug(point.tr)}-${String(point.id).padStart(2, '0')}`;

mkdirSync(fileURLToPath(OUT), {recursive: true});
const photos = PHOTO_POINTS.filter(p => p.file);
const wanted = new Set();
let made = 0, skipped = 0, source = 0, produced = 0;

for (const point of photos) {
  const base = imageName(point);
  const input = fileURLToPath(new URL('photogallery/' + point.file, ROOT));
  source += statSync(input).size;
  for (const width of WIDTHS) {
    const name = `${base}-${width}.webp`;
    wanted.add(name);
    const file = fileURLToPath(new URL(name, OUT));
    if (existsSync(file)) {produced += statSync(file).size; skipped++; continue;}
    await sharp(input).resize({width, withoutEnlargement: true})
      .webp({quality: 82, effort: 5}).toFile(file);
    produced += statSync(file).size; made++;
  }
}
// Kaynak fotoğraf silinirse/ adı değişirse artık dosya kalmasın.
for (const name of readdirSync(fileURLToPath(OUT))) if (!wanted.has(name)) {unlinkSync(fileURLToPath(new URL(name, OUT))); console.log('artık dosya silindi:', name);}

const MB = b => (b / 1048576).toFixed(1);
console.log(`fotoğraf ${photos.length} · üretilen ${made} · atlanan ${skipped}`);
console.log(`kaynak JPEG ${MB(source)} MB -> WebP (iki genişlik toplam) ${MB(produced)} MB`);
console.log(`galeri sayfasının indireceği (1280 seti): ${MB(produced * (1280 ** 2) / (640 ** 2 + 1280 ** 2))} MB yaklaşık`);
