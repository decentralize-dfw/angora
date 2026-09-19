import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutDimensionLabels,rectanglesOverlap} from '../src/screen-layout.js';

test('Crowded phone annotations retain every room and both dimensions without collisions',()=>{
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
    const obstacles=[{left:0,right:width,top:0,bottom:80},{left:width/2-150,right:width/2+150,top:height-100,bottom:height}];
    const items=Array.from({length:27},(_,i)=>({x:width/2+(i%3)*3,y:height/2+Math.floor(i/3)*2,width:i<9?90:40,height:i<9?29:18,id:i}));
    const placed=layoutDimensionLabels(items,{width,height,obstacles});
    assert.equal(placed.length,items.length,`${width}x${height}`);
    for(let i=0;i<placed.length;i++){
      for(const obstacle of obstacles)assert.equal(rectanglesOverlap(placed[i].rect,obstacle,3),false);
      for(let j=i+1;j<placed.length;j++)assert.equal(rectanglesOverlap(placed[i].rect,placed[j].rect,3),false);
    }
    assert.deepEqual(layoutDimensionLabels(items,{width,height,obstacles}),placed,'stable camera gives stable placement');
  }
});
