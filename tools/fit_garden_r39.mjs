// Garden corrections against the measured plot: the pool terrace paving
// stops on the boundary wall's inner face instead of running 0.30 m past it,
// the east retaining wall's open north corner closes onto the diagonal wall's
// start plane, the four coping lengths drop flush with the deck (photo
// evidence: deck, drain and coping read coplanar in the owner photographs),
// the mis-grounded spruce and broadleaf drop onto the garden ground, and the
// spruce crown by the facade pulls in 21% about its trunk so it stops passing
// through the villa wall (audit incident; the residual overlap with the
// retaining wall stays inside the vegetation-vs-siteworks rule).
// Usage: node fit_garden_r39.mjs <garden-in.glb> <context.glb> <out.glb>
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const [input, contextPath, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

// anchor: the boundary wall the terrace must stop on lives in context.glb
{
  const context = await io.read(contextPath);
  const wall = context.getRoot().listNodes().find(n => n.getName() === 'R33 | Registered surrounding retaining wall 6');
  if (!wall) throw Error('boundary wall missing from context.glb');
  let inner = -1e9;
  for (const primitive of wall.getMesh().listPrimitives()) inner = Math.max(inner, primitive.getAttribute('POSITION').getMax([])[2]);
  if (Math.abs(inner - -18.6274) > 0.005) throw Error('boundary wall inner face moved: ' + inner);
  console.log('anchor ok: boundary wall inner face', inner.toFixed(4));
}

const document = await io.read(input);
const root = document.getRoot();
const byName = new Map(root.listNodes().map(node => [node.getName(), node]));
const editPositions = (node, predicate, edit) => {
  let touched = 0;
  for (const primitive of node.getMesh().listPrimitives()) {
    const position = primitive.getAttribute('POSITION');
    const array = position.getArray().slice();
    for (let i = 0; i < array.length; i += 3) {
      const vertex = [array[i], array[i + 1], array[i + 2]];
      if (!predicate(vertex)) continue;
      const next = edit(vertex);
      array[i] = next[0]; array[i + 1] = next[1]; array[i + 2] = next[2];
      touched++;
    }
    position.setArray(array);
  }
  return touched;
};

// ---- terrace apron onto the boundary wall face ----
const terrace = byName.get('R33 | Continuous pool terrace');
const edge = editPositions(terrace,
  v => Math.abs(v[2] - -18.9250) < 0.002 && v[0] > -6.01 && v[0] < 5.01 && v[1] > -0.32 && v[1] < 0.03,
  v => [v[0], v[1], -18.6274]);
console.log('terrace rear-edge vertices moved:', edge);
// 8 corner positions in the source; the decoded mesh splits seams, so up to
// 16 stored vertices can share those positions
if (edge < 8 || edge > 16) throw Error('rear-edge selection drifted: ' + edge);

// ---- close the east retaining wall's north corner ----
const plane = x => -(5.4407 - 0.98666 * (x - 10.5775));
const eastWall = byName.get('East elevated neighbor retaining wall');
const eastCap = byName.get('East elevated neighbor retaining wall cap');
const wallMoved = editPositions(eastWall, v => Math.abs(v[2] - -5.3000) < 0.002, v => [v[0], v[1], plane(v[0])]);
const capMoved = editPositions(eastCap, v => Math.abs(v[2] - -5.3085) < 0.002, v => [v[0], v[1], plane(v[0])]);
console.log('east wall corner vertices:', wallMoved, '+ cap', capMoved);
if (wallMoved < 4 || capMoved < 2) throw Error('east wall corner selection drifted');

// ---- coping flush with the deck (photo-supported) ----
for (const suffix of ['', '.001', '.002', '.003']) {
  const node = byName.get('Pool coping' + suffix);
  const t = node.getTranslation(); t[1] = -0.0247; node.setTranslation(t);
}
console.log('coping set flush: 4 nodes at y -0.0247');

// ---- the mis-grounded spruce and broadleaf ----
{
  const trunk = byName.get('Spruce trunk.003');
  if (!trunk) throw Error('Spruce trunk.003 missing');
  trunk.setTranslation([9.4, 2.7144, -7.0]);
  for (const crown of ['Spruce branches.003', 'Spruce foliage interior.003', 'Spruce needle sprays.003'])
    byName.get(crown).setTranslation([0, -0.4216, 0]);
  console.log('Spruce .003 grounded (base = ground - 0.147)');
}
{
  const parts = root.listNodes().filter(n => {
    const name = n.getName() || '';
    if (name === 'Tree trunk.021' || name === 'Individual folded leaves.021') return true;
    const branch = name.match(/^Tree (?:main )?branch\.(\d+)$/);
    return branch && Number(branch[1]) >= 231 && Number(branch[1]) <= 241;
  });
  if (parts.length !== 24) throw Error('Tree .021 cluster is ' + parts.length + ' nodes, expected 24');
  for (const node of parts) {const t = node.getTranslation(); t[1] -= 0.406; node.setTranslation(t);}
  console.log('Tree .021 grounded: 24 nodes down 0.406');
}

// ---- audit: the facade spruce crown pulls in about its trunk ----
for (const name of ['Spruce branches', 'Spruce needle sprays', 'Spruce foliage interior']) {
  const node = byName.get(name);
  if (!node) throw Error(name + ' missing');
  const t = node.getTranslation(), s = node.getScale();
  node.setScale([s[0] * 0.79, s[1], s[2] * 0.79]);
  node.setTranslation([t[0] - 1.6275, t[1], t[2] + 0.42]);
}
console.log('facade spruce crown scaled 0.79 about its trunk');

for (const extension of root.listExtensionsUsed()) if (extension.extensionName === 'KHR_draco_mesh_compression') extension.dispose();
await io.write(output, document);
console.log('written', output);
