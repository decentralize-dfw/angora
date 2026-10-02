import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutDimensionsAtMidpoint,rectanglesOverlap} from '../src/screen-layout.js';

// Ürün sahibi: "ölçü, o çizginin ortasında sabit bir yerde olmalıdır ve oda
// isimleriyle hiçbir zaman çakışmamalıdır."
const name=(x,y)=>({x,y,width:80,height:22,entry:{kind:'name'}});
const dim=(x,y)=>({x,y,width:44,height:16,entry:{kind:'dimension'}});

// 02.10 ürün sahibi: "ODA İSİMLERİ ... ODANIN SINIRLARI İÇİNDE ... ORTA ALAN CİVARLARINDA ... HEPSİNDE GÖZÜKMEK
// ZORUNDADIR": ad önce yerleşir ve hiç gizlenmez; ölçü kendi çizgisi üstünde kayar, yer yoksa ölçü gizlenir.
// 02.10 ürün sahibi: "ODA İSİMLERİ ... HEPSİNDE GÖZÜKMEK ZORUNDADIR" ve "bunlar sabit olmalı ölçüler ve oda isimleri
// ... döndürdükçe dans ediyormuş gibi": ad yerinde ve hep görünür, ölçü çizgi ortasında; yer yoksa ölçü gizlenir.
test('ad ve ölçü yerinden kaymaz; adla çakışan ölçü gizlenir', () => {
  const items=[name(200,200),{...dim(200,205),seg:[100,205,300,205]},dim(400,300)];
  const placed=layoutDimensionsAtMidpoint(items,{width:800,height:600,fixedFrom:1});
  assert.deepEqual(placed.map(p=>[p.entry.kind,p.x,p.y]),[['name',200,200],['dimension',400,300]]);
});

test('ölçü gösterme kararı kamera dönüşüyle değişmez', () => {
  // aynı iki etiket, merkezleri aynı uzaklıkta, farklı açılarda: karar aynı
  for(let deg=0;deg<360;deg+=15){
    const t=deg*Math.PI/180,x=300+70*Math.cos(t),y=300+70*Math.sin(t);
    const placed=layoutDimensionsAtMidpoint([name(300,300),dim(x,y)],{width:800,height:600,fixedFrom:1});
    assert.equal(placed.length,2,`açı ${deg}`);
    const near=layoutDimensionsAtMidpoint([name(300,300),dim(300+50*Math.cos(t),300+50*Math.sin(t))],{width:800,height:600,fixedFrom:1});
    assert.equal(near.length,1,`açı ${deg}`);
  }
});

test('çakışan ölçü taşınmaz, gizlenir; yerleşim kameraya göre kararlı', () => {
  const items=[dim(300,300),dim(310,302)];
  const placed=layoutDimensionsAtMidpoint(items,{width:800,height:600,fixedFrom:0});
  assert.equal(placed.length,1);assert.deepEqual([placed[0].x,placed[0].y],[300,300]);
  assert.deepEqual(layoutDimensionsAtMidpoint(items,{width:800,height:600,fixedFrom:0}),placed);
});

test('02.10: ad hiçbir zaman gizlenmez; kayamayan ölçü gizlenir', () => {
  const room=(x,y)=>x>100&&x<300&&y>100&&y<300;
  for(const fits of [room,()=>false]){
    const placed=layoutDimensionsAtMidpoint([{...name(200,200),fits},dim(200,200)],{width:800,height:600,fixedFrom:1});
    const n=placed.filter(p=>p.entry.kind==='name');assert.equal(n.length,1);
    assert.deepEqual([n[0].x,n[0].y],[200,200]);
    for(const a of placed)for(const b of placed)if(a!==b)assert.equal(rectanglesOverlap(a.rect,b.rect,0),false);
  }
});
