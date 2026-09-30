import * as THREE from 'three';
import spec from './villa-lightmaps.json';
import {createTextureLoader} from './texture-loader.js';

// Pişmiş ışık (28.09.2026, docs/blender-ajan/TURLAR.md). Villanın duvar,
// döşeme, tavan, cephe ve bahçe yüzeyleri Blender Cycles'ta 20 haritaya
// pişirildi (4 atlas x gök / güneş 09-13-17 / gece). Burada:
//
//   gök     yukarı yarıküresi 1 olan gökten gelen ışık + sekmesi (pencereden
//           giren gün ışığı, köşe kararması, renk sekmesi). Hemisphere +
//           ortam haritasının DİFÜZ payının yerine geçer - onlar örtünmeyi
//           bilmez, her odayı dış cephe kadar aydınlatıyordu.
//   güneş   güneşin YALNIZ sekmesi (şiddet 1). Doğrudan güneşi canlı ışık ve
//           gölge haritası çizmeye devam eder. Saat iki pişmiş saat arasında
//           karışır (09-13-17; dışında en yakını).
//   gece    28 armatürün doğrudan + dolaylı ışığı (gerçek güçler). Canlı
//           spotların yerine geçer: pişen malzemede spot/point döngüsü yok.
//
// Haritalar doğrusal UASTC: x = v² · ölçek. Değerler normalize (beyaz, açık
// göğe bakan yüzey = 1); parlaklık aşağıdaki kazançlarla web ışığına oturur.
// Mobilya (INTERIOR) pişmedi, canlı ışıkla kalır.
//
// Geri dönüş: ?features=lightmapsV1:0 (modeller v4/v2'ye, ışık eski haline).
export const LIGHTMAP_MODELS = Object.freeze({
  architecture: {file: 'BUILDING-opt-v5.glb', bytes: spec.modeller['BUILDING-opt-v5.glb'].bytes},
  garden: {file: 'GARDEN-opt-v3.glb', bytes: spec.modeller['GARDEN-opt-v3.glb'].bytes},
});

const HOURS = [9, 13, 17];
// Kazançlar (Tur 6 çekimleriyle ayarlandı, 28.09):
//   sky      gök 1 = eski ortam ışığının açık yüzeydeki payı (hemisphere +
//            IBL difüz, öğlen ~0.6·albedo)
//   sun      pişmiş güneş şiddet 1 W/m², gök parlaklığı 1: gerçekte güneş
//            ışınımı gök parlaklığının ~20 katı -> sekme payı gökle aynı birimde
//   night    armatürlerin pişmiş watt'ı pozlamaya göre
//   interior iç atlaslarda (duvar, zemin) gök+güneş: iç mekân gerçekte dış
//            cepheden 20-50 kat karanlık; fotoğrafçının pozlamayı iç mekâna
//            açması gibi (göz uyumu) ~3 durak. Kırmızı parke sekmesi duvarı
//            çamur kahveye boyamasın diye renk %35 griye çekilir.
export const LIGHTMAP_GAINS = {sky: 0.62, sun: 12, night: 0.55, interior: 11, interiorDesat: 0.6,
  // 30.09 fotoğraf karşılaştırması (bodrum salonu, aynı kamera): duvar 5 kat karanlık ve kahveye
  // kaymıştı, tavan doğruydu -> duvar atlasına ayrı kazanç, sekme rengi %60 nötr.
  atlas: {duvar: 4, zemin: 1.8}};
const INTERIOR_ATLASES = new Set(['duvar', 'zemin']);

export function sunPair(hour) {
  if (hour <= HOURS[0]) return {a: '09', b: '09', t: 0};
  if (hour >= HOURS[2]) return {a: '17', b: '17', t: 0};
  const i = hour < HOURS[1] ? 0 : 1;
  const t = (hour - HOURS[i]) / (HOURS[i + 1] - HOURS[i]);
  return {a: String(HOURS[i]).padStart(2, '0'), b: String(HOURS[i + 1]).padStart(2, '0'), t};
}

// three'nin kendi lights_fragment_maps parçası: yalnız difüz satırları
// değişir, ortam yansıması (IBL speküler) aynen kalır.
const LIGHTMAP_FRAGMENT = THREE.ShaderChunk.lights_fragment_maps
  .replace('irradiance += lightMapIrradiance;', `vec3 lmSkyT = lightMapTexel.rgb;
		vec3 lmSunAT = texture2D( lmSunA, vLightMapUv ).rgb;
		vec3 lmSunBT = texture2D( lmSunB, vLightMapUv ).rgb;
		vec3 lmNightT = texture2D( lmNight, vLightMapUv ).rgb;
		vec3 lmSky = lmSkyT * lmSkyT * lmSkyScale;
		vec3 lmSun = mix( lmSunAT * lmSunAT * lmSunAScale, lmSunBT * lmSunBT * lmSunBScale, lmSunMix );
		float lmSkyL = dot( lmSky, vec3( 0.2126, 0.7152, 0.0722 ) ), lmSunL = dot( lmSun, vec3( 0.2126, 0.7152, 0.0722 ) );
		lmSky = mix( lmSky, vec3( lmSkyL ), lmDesat );
		vec3 lmBaked = mix( lmSun, vec3( lmSunL ), lmDesat ) + lmNightT * lmNightT * lmNightScale;
		irradiance = mix( irradiance, lmSky * PI, lmSkyStrength ) + lmBaked * PI * lmOn;`)
  .replace('iblIrradiance += getIBLIrradiance( geometryNormal );',
    'iblIrradiance += getIBLIrradiance( geometryNormal ) * ( 1.0 - lmSkyStrength );');
// three sürümü parçayı değiştirirse pişmiş ışık sessizce kapanır, sahne eski ışıkla açılır
const CHUNK_OK = LIGHTMAP_FRAGMENT.includes('lmBaked * PI') && LIGHTMAP_FRAGMENT.includes('( 1.0 - lmSkyStrength )');

export function createVillaLightmaps({renderer, root, spec: deliverySpec = spec}) {
  const loader = CHUNK_OK ? createTextureLoader(renderer, 2) : null;
  if (!CHUNK_OK) console.warn('Pişmiş ışık: three lights_fragment_maps parçası beklenen biçimde değil, kapalı');
  const placeholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  placeholder.needsUpdate = true;
  const shared = {
    lmSkyStrength: {value: 0},     // 0 = eski ortam ışığı, 1 = pişmiş gök
    lmOn: {value: 0},              // güneş sekmesi + gece (dokular gelene kadar 0)
    lmSunMix: {value: 0},
  };
  const atlases = new Map();
  for (const [name, entry] of Object.entries(deliverySpec.atlaslar)) {
    atlases.set(name, {entry, textures: {}, byChannel: new Map(), uniforms: {
      lmSunA: {value: placeholder}, lmSunB: {value: placeholder}, lmNight: {value: placeholder},
      lmSkyScale: {value: new THREE.Color(0, 0, 0)}, lmSunAScale: {value: new THREE.Color(0, 0, 0)},
      lmSunBScale: {value: new THREE.Color(0, 0, 0)}, lmNightScale: {value: new THREE.Color(0, 0, 0)},
      lmDesat: {value: INTERIOR_ATLASES.has(name) ? LIGHTMAP_GAINS.interiorDesat : 0},
    }, materials: new Set(), interior: INTERIOR_ATLASES.has(name)});
  }
  const state = {hour: 13, daylight: 1, sun: new THREE.Color(1, 1, 1), sunIntensity: 3, sky: new THREE.Color(1, 1, 1),
    night: 0, skyStrength: 1};
  let loaded = false, applied = 0;

  function skyFor(atlas, channel) {
    const key = channel;
    if (!atlas.byChannel.has(key)) {
      const base = atlas.textures.gok;
      const texture = base ? base.clone() : placeholder.clone();
      texture.channel = channel;
      atlas.byChannel.set(key, texture);
    }
    return atlas.byChannel.get(key);
  }

  function update() {
    const pair = sunPair(state.hour);
    shared.lmSunMix.value = pair.t;
    shared.lmSkyStrength.value = loaded ? state.skyStrength : 0;
    shared.lmOn.value = loaded ? 1 : 0;
    for (const [name, atlas] of atlases) {
      const maps = atlas.entry.haritalar, u = atlas.uniforms;
      if (loaded) {
        u.lmSunA.value = atlas.textures['gunes_' + pair.a];
        u.lmSunB.value = atlas.textures['gunes_' + pair.b];
        u.lmNight.value = atlas.textures.gece;
      }
      const adapt = (atlas.interior ? LIGHTMAP_GAINS.interior : 1) * (LIGHTMAP_GAINS.atlas[name] ?? 1);
      u.lmSkyScale.value.copy(state.sky).multiplyScalar(maps.gok.olcek * LIGHTMAP_GAINS.sky * state.daylight * adapt);
      // canlı güneş şiddeti ~3 öğlen: sekme payı onunla ölçeklenir
      const sun = LIGHTMAP_GAINS.sky * LIGHTMAP_GAINS.sun * (state.sunIntensity / 3) * adapt;
      u.lmSunAScale.value.copy(state.sun).multiplyScalar(maps['gunes_' + pair.a].olcek * sun);
      u.lmSunBScale.value.copy(state.sun).multiplyScalar(maps['gunes_' + pair.b].olcek * sun);
      u.lmNightScale.value.setRGB(1, 1, 1).multiplyScalar(maps.gece.olcek * LIGHTMAP_GAINS.night * state.night);
    }
  }

  const ready = loader ? (async () => {
    const jobs = [];
    for (const [name, atlas] of atlases)
      for (const [key, map] of Object.entries(atlas.entry.haritalar))
        jobs.push(loader.loadAsync(new URL(map.dosya, root).href).then(texture => {
          texture.colorSpace = THREE.NoColorSpace;
          texture.flipY = false;
          texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          atlas.textures[key] = texture;
        }));
    await Promise.all(jobs);
    loader.dispose();
    // gök haritasının kanal kopyaları: yer tutucudan gerçeğe
    for (const atlas of atlases.values()) {
      for (const [channel, old] of atlas.byChannel) {
        const texture = atlas.textures.gok.clone(); texture.channel = channel;
        atlas.byChannel.set(channel, texture);
        for (const material of atlas.materials) if (material.userData.villaLightmap.channel === channel) material.lightMap = texture;
        old.dispose();
      }
    }
    loaded = true; update();
    const bytes = Object.values(deliverySpec.atlaslar).reduce((a, e) => a + Object.values(e.haritalar).reduce((b, m) => b + m.bytes, 0), 0);
    console.info(`Pişmiş ışık: ${jobs.length} harita (${(bytes / 1e6).toFixed(1)} MB), ${applied} malzeme`);
    return true;
  })().catch(error => { console.warn('Pişmiş ışık yüklenemedi, canlı ışıkla devam:', error); loader?.dispose(); return false; })
    : Promise.resolve(false);

  return {
    ready,
    get active() { return Boolean(loader); },
    // Yüklenen bir mesh'e: extras.lightmap (atlas + UV kanalı) taşıyorsa
    apply(mesh) {
      const info = mesh.userData?.lightmap;
      if (!loader || !info || !atlases.has(info.atlas)) return false;
      const atlas = atlases.get(info.atlas), channel = Number(info.texcoord);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (!material?.isMeshStandardMaterial || material.userData.villaLightmap) continue;
        material.userData.villaLightmap = {atlas: info.atlas, channel};
        material.lightMap = skyFor(atlas, channel);
        material.lightMapIntensity = 1;
        atlas.materials.add(material);
        const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey();
        material.onBeforeCompile = (shader, r) => {
          previous.call(material, shader, r);
          Object.assign(shader.uniforms, shared, atlas.uniforms);
          shader.fragmentShader = shader.fragmentShader
            .replace('#include <lightmap_pars_fragment>', `#include <lightmap_pars_fragment>
uniform sampler2D lmSunA, lmSunB, lmNight;
uniform vec3 lmSkyScale, lmSunAScale, lmSunBScale, lmNightScale;
uniform float lmSkyStrength, lmOn, lmSunMix, lmDesat;`)
            .replace('#include <lights_fragment_maps>', LIGHTMAP_FRAGMENT)
            // armatürlerin ışığı gece haritasında: canlı spot/point bu yüzeye bir daha düşmesin
            .replaceAll('NUM_SPOT_LIGHTS', '0').replaceAll('NUM_POINT_LIGHTS', '0');
        };
        material.customProgramCacheKey = () => previousKey + '|villa-lightmap';
        material.needsUpdate = true;
        applied++;
      }
      return true;
    },
    // lighting.setTime'dan: saat, gün ışığı, güneş, gök rengi, lambalar
    setLight({hour, daylight, sunColor, sunIntensity, skyColor, night}) {
      state.hour = hour; state.daylight = daylight; state.sunIntensity = sunIntensity; state.night = night;
      state.sun.copy(sunColor); state.sky.copy(skyColor);
      update();
    },
    // Kat kesitinde odanın tavanı açık: pişmiş gök (tavanlı) orada fazla
    // karanlık kalır; kesit görünümünde eski açık ortamla karışır.
    setSkyStrength(value) { state.skyStrength = value; update(); },
    snapshot() { return {loaded, applied, skyStrength: shared.lmSkyStrength.value, hour: state.hour}; },
  };
}
