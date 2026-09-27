import test from 'node:test';
import assert from 'node:assert/strict';
import {readShareState,shareSearch} from '../src/share-state.js';

// 27.09 (ürün sahibi): adreste saat/ışık/mevsim YAZILMAZ; en çok tek bir
// görünüm kelimesi, dile göre.
test('Adres yalnız görünüm kelimesi taşır, açılış görünümünde boş',()=>{
  assert.equal(shareSearch({view:'neighborhood',hour:17.5,season:'80',style:'sun'}),'');
  assert.equal(shareSearch({view:'building',hour:16,style:'sun'}),'?villa');
  assert.equal(shareSearch({view:'region'}),'?bolge');
  assert.equal(shareSearch({view:'f2'}),'?1-kat');
  assert.equal(shareSearch({view:'f0',lang:'en'}),'?lang=en&basement');
  assert.equal(shareSearch({view:'neighborhood',lang:'en'}),'?lang=en');
});

test('Her görünüm kelimesi aynı görünüme geri okunur; eski linkler hâlâ okunur',()=>{
  for(const lang of ['tr','en'])
    for(const view of ['region','neighborhood','building','f0','f1','f2','f3'])
      assert.equal(readShareState(shareSearch({view,lang})).view??'neighborhood',view);
  assert.deepEqual(readShareState('?view=f2&hour=17.5&season=80&light=sun'),{view:'f2',hour:17.5,season:'80',style:'sun'});
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
