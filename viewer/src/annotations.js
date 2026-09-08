import * as THREE from 'three';

function floorText(text, width, accent = false) {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = accent ? '#142c3bef' : '#fffffff2';
  ctx.beginPath(); ctx.roundRect(8, 8, 1008, 176, 28); ctx.fill();
  ctx.font = `600 ${text.length > 22 ? 56 : 66}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = accent ? '#ffffff' : '#142c3b'; ctx.fillText(text, 512, 96, 970);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({map:texture, transparent:true,
    depthWrite:false, depthTest:false, toneMapped:false, side:THREE.DoubleSide});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 192 / 1024), material);
  mesh.rotation.x = -Math.PI / 2; mesh.renderOrder = 110;
  mesh.userData.aoExcluded = true;
  return mesh;
}

export function createAnnotations(data) {
  if (data.coordinate_system !== 'glTF_Y_up' || !data.rooms?.length) throw Error('Invalid room data');
  const group = new THREE.Group(); group.name = 'Floor plan annotations';
  group.userData.aoExcluded = true;
  const levels = Array.from({length:4}, () => ({names:new THREE.Group(), measures:new THREE.Group()}));
  for (const level of levels) group.add(level.names, level.measures);
  for (const room of data.rooms) {
    const text = floorText(room.name, Math.min(3.3, Math.max(1.45, room.name.length * .105)));
    text.name = room.id; text.position.fromArray(room.position);
    levels[room.floor_index].names.add(text);
  }
  const lineMaterial = new THREE.LineBasicMaterial({color:0x126080, depthTest:false,
    depthWrite:false, transparent:true, opacity:0.9, toneMapped:false});
  for (const measurement of data.dimensions) {
    if (!measurement.dimension_label_allowed) continue;
    const a = new THREE.Vector3().fromArray(measurement.a), b = new THREE.Vector3().fromArray(measurement.b);
    const direction = b.clone().sub(a).normalize(), cross = new THREE.Vector3(-direction.z, 0, direction.x);
    const points = [a, b];
    for (const end of [a, b]) points.push(end.clone().addScaledVector(cross, -.12), end.clone().addScaledVector(cross, .12));
    const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
    line.renderOrder = 105; line.userData.aoExcluded = true;
    const label = floorText(measurement.display, .85, true);
    label.position.copy(a).add(b).multiplyScalar(.5); label.position.y += .008;
    levels[measurement.floor_index].measures.add(line, label);
  }
  return {group, data,
    update(view, names, measures, transitioning = false, walking = false) {
      const floor = /^f[0-3]$/.test(view) ? Number(view[1]) : -1;
      group.visible = floor >= 0 && !transitioning && !walking;
      levels.forEach((level, index) => {
        level.names.visible = index === floor && names;
        level.measures.visible = index === floor && measures;
      });
    }
  };
}
