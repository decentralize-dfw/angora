// Mobil bellek: GPU'ya yüklendikten sonra CPU'da tutulan vertex dizilerini
// serbest bırakır. Görüntüye HİÇ dokunmaz.
//
// Ölçüm (mobil taklit, ?stats=1): CPU'da tutulan geometri 207,6 MiB, JS heap
// 334,9 MiB, doku 53 MiB, 1 760 318 üçgen. iPhone Safari bu ağırlıkta sekmeyi
// öldürüyor - ürün sahibi crash bildirdi. Bu diziler yüklemeden SONRA render
// için gereksiz: three GPU tamponunu önbelleğe alır ve attribute.version
// değişmedikçe array'e bir daha bakmaz.
//
// TEHLİKE ve nasıl karşılandığı: henüz YÜKLENMEMİŞ bir dizi boşaltılırsa o
// mesh bir daha asla yüklenemez, yani kalıcı olarak görünmez olur. Mobilde
// viewCulling zorla açık ve uzak parçalar gizli - onların dizileri henüz
// yüklenmemiş olabilir. Bu yüzden hangi dizinin yüklendiği TAHMİN EDİLMEZ,
// ÖLÇÜLÜR: three her yüklemeden sonra attribute.onUploadCallback'i çağırır
// (BufferAttribute.onUpload). markUploads() o geri çağrıyı kurup yüklemeyi
// işaretler; release() yalnız işaretlenmiş dizileri boşaltır, işaretsizlere
// ise "yüklenince kendini boşalt" geri çağrısı bırakır.
//
// Raycast: bu kod çalıştığında arazi/toprak raycast'i (tek seferlik, yükleme
// adımı) çoktan bitmiş olur. Geriye yalnız WebXR ışınlama kalır ve o
// navigator.xr olmayan cihazda hiç kurulmaz (walk.js erken döner), bu yüzden
// çağıran taraf renderer.xr.enabled ise bu geçişi hiç çalıştırmaz.

const FLAG = '__angoraUploaded';

function attributesOf(geometry) {
  const list = [];
  for (const name of Object.keys(geometry.attributes)) {
    const attribute = geometry.attributes[name];
    // Interleaved tamponlar paylaşımlı: tek attribute'un boşaltması
    // komşusunu da kör eder, o yüzden hiç dokunulmaz.
    if (attribute && !attribute.isInterleavedBufferAttribute) list.push(attribute);
  }
  if (geometry.index && !geometry.index.isInterleavedBufferAttribute) list.push(geometry.index);
  return list;
}

// Yükleme işaretçisi. Parça sahneye eklendikten HEMEN SONRA çağrılır: hiçbir
// davranış değişmez, yalnız "bu dizi GPU'ya gitti" kaydı tutulur.
export function markUploads(models) {
  let marked = 0;
  for (const model of models.values()) model.traverse(object => {
    if (!object.isMesh || !object.geometry) return;
    for (const attribute of attributesOf(object.geometry)) {
      if (attribute.onUploadCallback?.[FLAG]) continue;         // zaten kurulu
      const callback = function () { this[FLAG] = true; };
      callback[FLAG] = true;
      attribute.onUpload(callback);
      marked++;
    }
  });
  return marked;
}

// Boşaltma geçişi. İşaretli (yüklenmiş) diziler hemen gider; işaretsizler
// yüklendikleri anda kendilerini bırakır.
export function releaseGeometryArrays(models, {skip = null} = {}) {
  let releasedBytes = 0, releasedAttributes = 0, deferred = 0, geometries = 0;
  const seen = new Set();
  for (const model of models.values()) model.traverse(object => {
    if (!object.isMesh || !object.geometry) return;
    const geometry = object.geometry;
    if (seen.has(geometry)) return;
    seen.add(geometry);
    if (skip?.(object, geometry)) return;
    // Sınır hacimleri diziler GİTMEDEN hesaplanmalı: three frustum culling
    // için boundingSphere'a bakar ve onu ancak diziden üretebilir.
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    let touched = false;
    for (const attribute of attributesOf(geometry)) {
      if (!attribute.array) continue;                            // zaten boş
      if (attribute[FLAG]) {
        releasedBytes += attribute.array.byteLength;
        attribute.array = null;
        releasedAttributes++; touched = true;
      } else {
        // Henüz yüklenmemiş: boşaltmak onu kalıcı görünmez yapardı.
        const callback = function () { this[FLAG] = true; this.array = null; };
        callback[FLAG] = true;
        attribute.onUpload(callback);
        deferred++;
      }
    }
    if (touched) geometries++;
  });
  return {releasedBytes, releasedMiB: +(releasedBytes / 1048576).toFixed(1),
    releasedAttributes, deferred, geometries};
}
