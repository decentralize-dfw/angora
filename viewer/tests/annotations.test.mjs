import test from 'node:test';
import assert from 'node:assert/strict';
import {labelFontSize, spanLabel, areaLabel} from '../src/annotations.js';

// DAİMİ EMİR A6: the regression list's "Ölçüler" IS a product feature -
// the dimensions overlay in annotations.js, toggled by the settings switch
// and persisted in the share link (settings.dimensions). frame-measurement.js
// is an FPS collector, not this. These tests pin the measured-label rules.

test('spanLabel formats metres in the property\'s own locale', () => {
  assert.equal(spanLabel(3.456), '3,5 m');
  assert.equal(spanLabel(12), '12,0 m');
});

test('areaLabel prefers a real area and falls back ONLY to dwg-verified spans', () => {
  assert.equal(areaLabel({id: 'x', area_m2: 24.5}, null), '24,50 m²');
  const data = {dimensions: [
    {id: 'd1', basis: 'model_measured', dimension_label_allowed: true, metres: 4.2},
    {id: 'd2', basis: 'dwg_verified', dimension_label_allowed: false, metres: 5.1},
    {id: 'd3', basis: 'dwg_verified', dimension_label_allowed: true, metres: 6.3},
  ]};
  // model-measured and label-suppressed rows are provenance, never a tag
  assert.equal(areaLabel({id: 'y', dimensions: ['d1', 'd2', 'd3']}, data), '6,3 m');
  assert.equal(areaLabel({id: 'z', dimensions: ['d1', 'd2']}, data), '');
});

test('labelFontSize stays bounded across zoom scales', () => {
  const sizes = [4, 20, 200, 2000].map(labelFontSize);
  for (const size of sizes) assert.ok(Number.isFinite(size) && size > 0, String(size));
});
