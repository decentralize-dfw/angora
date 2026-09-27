// Blender 3.6 için tek dosya: Draco YOK, KTX2 YOK, malzemeler içinde.
//
// Kaynak build/web/native-current/ - 12 parça .gpu.gltf. Web teslimatı iki
// şeyi Blender'ın okuyamayacağı hale getiriyor:
//   1. KHR_draco_mesh_compression - 3.6 açabilir ama istenmedi
//   2. KHR_texture_basisu (KTX2) - 3.6 BUNU OKUYAMAZ, dokular boş gelir
// Her dokunun zaten bir PNG `source` yedeği var; basisu uzantısını KAYIT
// ETMEYEREK gltf-transform'un PNG'yi tutmasını sağlıyoruz (basisu yalnız
// extensionsUsed'da, extensionsRequired'da DEĞİL - bu yüzden güvenli).
//
// İKİ MOD:
//   (varsayılan) --malzeme : GitHub'ın 100 MB dosya sınırının altında kalan,
//        indirilip doğrudan açılan sürüm. İki "balast" parça dışarıda:
//        villa-context-white (98,6 MB geometri, TEK malzeme - uzaktaki beyaz
//        kütleler) ve context-plants (49,5 MB, 2 malzeme - yaprak kartları).
//        Üçü de üzerinde malzeme yazılacak şeyler değil; geometrinin %72'si
//        bunlarda. AO haritaları JPEG'e iner (pişmiş gölge, yazarlık girdisi
//        değil); base/normal/ORM PNG kalır - kayıpsız.
//   --tam : 12 parçanın hepsi, bütün dokular PNG. ~259 MB, depoya sığmaz,
//        yerelde üretilir.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS, KHRDracoMeshCompression} from '@gltf-transform/extensions';
import {dedup, prune, unpartition, mergeDocuments} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = '/home/user/angora/build/web/native-current';
const full = process.argv.includes('--tam');
const group = process.argv.find(a => a.startsWith('--grup='))?.slice(7) ?? null;
const OUT = process.argv.find(a => a.endsWith('.glb'))
  ?? (group ? `/home/user/angora/build/blender/angora-${group}.glb`
     : full ? '/home/user/angora/build/blender/angora-blender36-tam.glb'
            : '/home/user/angora/build/blender/angora-blender36-malzeme.glb');

// Malzeme başına geometri maliyeti en kötü olan iki parça.
const BALLAST = new Set(['villa-context-white.gpu.gltf', 'context-plants.gpu.gltf']);

// Tek dosya 185 MB - GitHub'ın 100 MB sınırına sığmıyor ve bu ortamdan LFS
// kapalı (lfs.github.com 403). Kayıpsız sıkıştırma yetmiyor (weld yalnız
// 6,6 MB kazandırdı: veri Draco'dan geldiği için zaten sıkı). Nicemleme tek
// dosyayı kurtarırdı ama Blender 3.6'nın KHR_mesh_quantization desteğini bu
// ortamdan doğrulayamadım (docs.blender.org egress'te kapalı) - kullanıcının
// zamanını doğrulanmamış varsayıma yatırmıyoruz.
// Çözüm: anlamlı ÜÇ grup, her biri sınırın altında ve her biri Blender'da
// tek başına açılıyor. Aynı sahneye üst üste import edilebilirler; hepsi
// aynı dünya koordinatlarında durur, hizalama gerekmez.
const GROUPS = {
  kabuk:    ['architecture', 'garden', 'plot-grass', 'context-ground'],
  icmekan:  ['interior-common', 'interior-f0', 'interior-f1', 'interior-f2', 'interior-f3'],
  komsular: ['context-buildings'],
  // Çevre peyzajı: zemin (çim/asfalt/yollar + eklenen evlerin bahçe duvarı
  // ve giriş yolları) ve mahalle ağaçları. Komşu binalar ayrı (komsular).
  cevre:    ['context-ground', 'context-plants'],
};

const extensions = ALL_EXTENSIONS.filter(e => e.EXTENSION_NAME !== 'KHR_texture_basisu');
const io = new NodeIO().registerExtensions(extensions)
  .registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});

const groupArg = process.argv.find(a => a.startsWith('--grup='))?.slice(7) ?? null;
let parts = fs.readdirSync(SRC).filter(f => f.endsWith('.gltf')).sort();
if (groupArg) {
  const want = GROUPS[groupArg];
  if (!want) throw new Error('bilinmeyen grup: ' + groupArg + ' (' + Object.keys(GROUPS).join(', ') + ')');
  parts = parts.filter(f => want.includes(f.replace('.gpu.gltf', '')));
} else if (!full) parts = parts.filter(f => !BALLAST.has(f));
console.log(`${parts.length} parça okunuyor (${groupArg ? 'grup: ' + groupArg : full ? 'TAM' : 'MALZEME'})...`);

// SİTEDEKİ EKLENEN EVLER: web teslimatı (build.mjs) context-buildings'e
// OSM'den yerleştirilen evleri, context-ground'a da onların bahçe duvarı ve
// yol bağlantısını ekliyor. native-current bu eklemeleri TAŞIMIYOR - bu
// yüzden eski komsular.glb'de o evler yoktu. Aynı adım, aynı kayıtlı
// yerleşimle (batched/context-placement.json) burada da uygulanır.
const {addContextBuildings, addContextGardens, groundSampler} = await import('./add-context.mjs');
const placement = JSON.parse(fs.readFileSync('/home/user/angora/build/web/batched/context-placement.json', 'utf8'));
const plan = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'context-additions.json'), 'utf8'));
for (const item of plan.additions) {const saved = placement.additions?.find(a => a.id === item.id); if (saved) Object.assign(item, saved);}
let terrain = null, donor = null;
async function withAdditions(part, next) {
  if (part === 'context-buildings.gpu.gltf') {
    terrain ??= groundSampler(await io.read(path.join(SRC, 'context-ground.gpu.gltf')));
    donor ??= await io.read('/home/user/angora/build/web/full/context.glb');
    const r = addContextBuildings(next, plan, donor, terrain);
    // Bağışçının adıyla eşleşmeyen bir malzeme kalırsa beyaz söve malzemesine düşer.
    const trim = next.getRoot().listMaterials().find(m => /white_trim|WHT/i.test(m.getName()));
    for (const mesh of next.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) if (!p.getMaterial() && trim) p.setMaterial(trim);
    console.log(`  + ${r.buildings} eklenen ev (${r.donorObjects} bağışçı nesne)`);
  }
  if (part === 'context-ground.gpu.gltf') {
    terrain ??= groundSampler(await io.read(path.join(SRC, 'context-ground.gpu.gltf')));
    const r = addContextGardens(next, plan, terrain);
    console.log(`  + ${r.gardens} bahçe duvarı / giriş yolu`);
  }
  return next;
}

let doc = null;
for (const part of parts) {
  const next = await withAdditions(part, await io.read(path.join(SRC, part)));
  if (!doc) doc = next; else mergeDocuments(doc, next);
  console.log('  ' + part);
}

const root = doc.getRoot();
const scenes = root.listScenes();
const main = scenes[0];
main.setName('Angora21');
for (const scene of scenes.slice(1)) {
  for (const node of scene.listChildren()) main.addChild(node);
  scene.dispose();
}
root.setDefaultScene(main);

// Geometri çözüldü - uzantı düşsün ki yazarken yeniden kodlanmasın.
for (const ext of root.listExtensionsUsed()) {
  if (ext.extensionName === KHRDracoMeshCompression.EXTENSION_NAME) ext.dispose();
}

// VRM eklentisinin materyal extras'ına bıraktığı artık.
let stripped = 0;
for (const material of root.listMaterials()) {
  const extras = material.getExtras();
  if (extras?.vrm_addon_extension) {
    const {vrm_addon_extension, ...rest} = extras;
    material.setExtras(rest); stripped++;
  }
}

await doc.transform(dedup(), prune(), unpartition());

// MALZEME modu: yalnız AO haritaları JPEG'e. AO pişmiş gölgedir - kullanıcı
// onu yazmaz, JPEG kusuru görünmez. base/normal/ORM PNG kalır: renk, relief
// ve roughness kayıpsız olmalı, çünkü asıl çalışılacak kanallar onlar.
let aoBefore = 0, aoAfter = 0, aoCount = 0;
if (!full) {   // grup modu da dahil - AO her zaman JPEG
  const aoTextures = new Set();
  for (const m of root.listMaterials()) {
    const t = m.getOcclusionTexture();
    // Yalnız SADECE AO olarak kullanılanlar; bir doku hem base hem AO ise dokunma.
    if (t) aoTextures.add(t);
  }
  for (const m of root.listMaterials()) {
    for (const t of [m.getBaseColorTexture(), m.getNormalTexture(), m.getMetallicRoughnessTexture(), m.getEmissiveTexture()]) {
      if (t) aoTextures.delete(t);
    }
  }
  for (const t of aoTextures) {
    const image = t.getImage(); if (!image) continue;
    aoBefore += image.byteLength;
    const jpeg = await sharp(Buffer.from(image)).resize(1024, 1024, {fit: 'inside', withoutEnlargement: true})
      .jpeg({quality: 85}).toBuffer();
    t.setImage(new Uint8Array(jpeg)).setMimeType('image/jpeg');
    aoAfter += jpeg.byteLength; aoCount++;
  }
}

fs.mkdirSync(path.dirname(OUT), {recursive: true});
await io.write(OUT, doc);

const r = doc.getRoot();
const bytes = fs.statSync(OUT).size;
const MB = b => (b / 1048576).toFixed(1) + ' MB';
let tris = 0;
for (const m of r.listMeshes()) for (const p of m.listPrimitives()) {
  const i = p.getIndices(), pos = p.getAttribute('POSITION');
  tris += (i ? i.getCount() : (pos ? pos.getCount() : 0)) / 3;
}
console.log('\n--- ÇIKTI ---');
console.log('dosya      :', OUT, MB(bytes));
console.log('malzeme    :', r.listMaterials().length, '(benzersiz ad:', new Set(r.listMaterials().map(m => m.getName())).size + ')');
console.log('mesh       :', r.listMeshes().length, ' üçgen:', Math.round(tris).toLocaleString());
console.log('doku       :', r.listTextures().length);
if (aoCount) console.log('AO -> JPEG :', aoCount, 'doku,', MB(aoBefore), '->', MB(aoAfter));
console.log('VRM extras :', stripped, 'malzemeden silindi');
console.log('uzantılar  :', r.listExtensionsUsed().map(e => e.extensionName).join(', ') || '(yok)');
