import test from 'node:test';
import assert from 'node:assert/strict';
import {readShareState,shareSearch} from '../src/share-state.js';

test('A shared link carries only what differs from the opening view',()=>{
  assert.equal(shareSearch({view:'neighborhood',hour:12.5,season:'172',style:'soft'}),'');
  assert.equal(shareSearch({view:'f2',hour:12.5,season:'172',style:'soft'}),'?view=f2');
  assert.equal(shareSearch({view:'f2',hour:17.5,season:'80',style:'sun'}),'?view=f2&hour=17.5&season=80&light=sun');
  // Whole hours and five-minute steps both stay short and readable.
  assert.equal(shareSearch({view:'building',hour:9,season:'172',style:'soft'}),'?view=building&hour=9');
  assert.equal(shareSearch({view:'neighborhood',hour:12+7/12,season:'172',style:'soft'}),'?hour=12.58');
});

test('Every value a link can carry round-trips to the same control state',()=>{
  for(const view of ['region','neighborhood','building','f0','f1','f2','f3'])
    for(const season of ['172','80','355'])
      for(const style of ['soft','sun'])
        for(const hour of [6,9,12.5,12+7/12,17.5,21]){
          const state={view,hour,season,style};
          const back=readShareState(shareSearch(state));
          // Anything left out of the link is the opening value, so the reader
          // reports nothing for it and the control keeps its own default.
          assert.equal(back.view??'neighborhood',view);
          assert.equal(back.season??'172',season);
          assert.equal(back.style??'soft',style);
          assert.ok(Math.abs((back.hour??12.5)-hour)<1/24,`${hour} -> ${back.hour}`);
        }
});

test('A hand-edited link cannot push the viewer outside its own controls',()=>{
  // Unknown floors, out-of-range hours, seasons the picker does not offer and
  // junk are all dropped rather than applied.
  for(const search of ['?view=f9','?view=basement','?view=<script>','?view=',
    '?hour=3','?hour=23','?hour=NaN','?hour=abc','?hour=1e9','?hour=',
    '?season=1','?season=999','?light=neon','?light=','?nonsense=1',''])
    assert.deepEqual(readShareState(search),{},search);
  // A valid value still survives alongside a rejected one.
  assert.deepEqual(readShareState('?view=f3&hour=99'),{view:'f3'});
  assert.deepEqual(readShareState('?view=nowhere&season=355'),{season:'355'});
});
