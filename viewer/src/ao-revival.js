// Task 3.4d - this is delivery, not baking. The source pipeline already
// shipped UASTC+ZSTD KTX2 occlusion bakes next to the native set
// (build/web/native-current/ktx2/): 4096² for the clay roof and the
// neighbour walls, 2048² for the plaster/stone/wood heroes - four times the
// texel of the 1024 WebP the batched GLBs carry. Every AO-carrying batched
// material is a single-member batch, so the source bake maps one-to-one and
// the swap is a runtime rebind on the material's EXISTING aoMap slot: same
// UV channel, same strength, no GLB surgery, and the bytes ride the idle
// path like the 1.3 detail maps - first-interactive stays untouched and a
// phone never fetches them.

// batch member name -> the delivered KTX2 bake (content-hashed filenames).
export const BAKED_AO_TABLE = Object.freeze({
  'Clay tile': '03c254ed6af70a7f65c19d30.ktx2',
  'INTERIOR': '20b26b439b0f603e3626ed16.ktx2',
  'stone_tile': '89227eaec9d241020863e8aa.ktx2',
  'STRUCCO': '3df0d99498d54ec3fe8d7eea.ktx2',
  'WOOD-FL': '6e8b7b328684c7430c4ea0fb.ktx2',
  'Retaining wall rough limestone.001': '25186aef493da7bb8021d623.ktx2',
  'neighbor_wall': '8d2f854d0290ee0f57b3c6ee.ktx2',
});

// Collect the swaps first, then fetch: the caller sees one promise per file
// and a material is never half-bound.
export function bakedOcclusionTargets(models) {
  const targets = [];
  const seen = new Set();
  for (const model of models.values()) {
    model.traverse(object => {
      if (!object.isMesh) return;
      const material = Array.isArray(object.material) ? null : object.material;
      const batch = material?.userData.angoraBatch;
      if (!batch || batch.materials.length !== 1 || seen.has(material)) return;
      const file = BAKED_AO_TABLE[batch.materials[0]];
      if (!file || !material.aoMap) return;
      seen.add(material);
      targets.push({material, file, name: batch.materials[0]});
    });
  }
  return targets;
}

export async function reviveBakedOcclusion(models, {loader, root}) {
  if (!loader) return 0;   // no ASTC/BC7 path on this device - keep the WebP
  const targets = bakedOcclusionTargets(models);
  const files = [...new Set(targets.map(t => t.file))];
  const textures = new Map(await Promise.all(files.map(async file =>
    [file, await loader.loadAsync(new URL('ktx2/' + file, root).href)])));
  let applied = 0;
  for (const {material, file} of targets) {
    const texture = textures.get(file);
    if (!texture) continue;
    // The bake was authored on the same UV set the batch stored for its WebP
    // occlusion; carry the channel over and let three keep the strength.
    texture.channel = material.aoMap.channel;
    material.aoMap.dispose();
    material.aoMap = texture;
    applied++;
  }
  return applied;
}
