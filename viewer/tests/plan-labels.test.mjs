import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutPlanLabels,dimensionAngle} from '../src/screen-layout.js';

// 02.10 ürün sahibi: her ölçü yazılı, barın üstünde; yatay düz, dikeyin üstü solda; ad ölçüye binmez, odasında kalır.
test('ölçü açısı: yatay 0, dikey -90 (üstü sola), ters yönler aynı', () => {
  assert.equal(dimensionAngle([0,0,100,0]),0);
  assert.equal(dimensionAngle([100,0,0,0]),0);
  assert.equal(dimensionAngle([0,0,0,100]),-90);
  assert.equal(dimensionAngle([0,100,0,0]),-90);
  assert.equal(Math.round(dimensionAngle([0,0,100,100])),45);
});

test('bütün ölçüler yerleşir (gizlenmez), çakışan ölçü kendi çizgisinde kayar', () => {
  const dims=[{seg:[100,200,300,200],width:40,height:14},{seg:[100,200,300,200],width:40,height:14},{seg:[200,100,200,300],width:40,height:14}];
  const {dims:out}=layoutPlanLabels([],dims,{width:800,height:600});
  assert.equal(out.length,3);
  for(const d of out){const [x1,y1,x2,y2]=d.seg;const cross=(d.x-x1)*(y2-y1)-(d.y-y1)*(x2-x1);assert.ok(Math.abs(cross)<1e-6);}
  assert.equal(out[2].angle,-90);
});

test('oda adı ölçü yazısına ve çizgisine değmez, odasının içinde kalır', () => {
  const room=[[100,100],[400,100],[400,400],[100,400]];
  const dims=[{seg:[100,250,400,250],width:40,height:14}];
  const {names}=layoutPlanLabels([{x:250,y:250,width:80,height:20,room}],dims,{width:800,height:600});
  const n=names[0];
  assert.ok(n.rect.left>=100&&n.rect.right<=400&&n.rect.top>=100&&n.rect.bottom<=400);
  assert.ok(n.rect.bottom<249||n.rect.top>251);
});

test('çok küçük odada ad ölçü yazısının altında kalmaz, gerekirse odanın hemen dışına taşar', () => {
  // telefonda WC: oda 30x40 px, içinden geçen dikey ölçünün yazısı odayı kaplıyor
  const room=[[300,300],[330,300],[330,340],[300,340]];
  const dims=[{seg:[315,300,315,340],width:40,height:14}];
  const {names,dims:out}=layoutPlanLabels([{x:315,y:320,width:44,height:22,room}],dims,{width:800,height:600});
  const r=names[0].rect,p=out[0].poly;
  const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);
  const overlap=r.left<Math.max(...xs)&&r.right>Math.min(...xs)&&r.top<Math.max(...ys)&&r.bottom>Math.min(...ys);
  assert.ok(!overlap);
});
