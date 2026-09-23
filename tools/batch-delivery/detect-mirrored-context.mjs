// H8 teslimat paketi (DAİMİ EMİR A8) - TESPİT yarısı.
//
// Hangi context "addition" kopyaları AYNALI? add-context.mjs:82 negatif
// determinantta üçgen sarımını runtime kopyada ters çevirir; build.mjs
// çevirmez, o yüzden yayınlanan batched geometri bu kopyalarda ters
// sarımlıdır ve singleSided açılınca duvarları kaybolur (Task 1.4 kanıtı).
//
//   node tools/batch-delivery/detect-mirrored-context.mjs
//
// Çıktı: aynalı addition listesi (id, donör, 2x2 matris determinantı).
// Bu liste H8'in düzeltme reçetesinin girdisidir - insanın seçmesi
// gereken hiçbir şey yok, sayı kaçsa o kadar mesh düzeltilecek.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const spec = JSON.parse(await readFile(here + 'context-additions.json', 'utf8'));

const rows = spec.additions.map(addition => {
  const [[a, b], [c, d]] = addition.matrix_xz;
  const determinant = a * d - b * c;
  return {id: addition.id, number: addition.number, determinant, mirrored: determinant < 0};
});

for (const row of rows) {
  console.log(`${row.mirrored ? 'AYNALI ' : 'düz    '} ${row.id}  (no ${row.number})  det=${row.determinant.toFixed(6)}`);
}
const mirrored = rows.filter(row => row.mirrored);
console.log(`\n${mirrored.length}/${rows.length} addition aynalı: ${mirrored.map(r => r.id).join(', ') || 'yok'}`);
console.log('Düzeltme reçetesi: BLOCKED.md H8 (Draco decode -> index swap -> re-encode, sadece bu kopyaların primitive aralıklarında).');
