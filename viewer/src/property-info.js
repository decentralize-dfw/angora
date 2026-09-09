import {areaLabel} from './annotations.js';
export function renderPropertyInfo(container,data,view) {
  container.replaceChildren();
  const floor=/^f[0-3]$/.test(view)?Number(view[1]):-1;
  const stats=document.createElement('div');stats.className='property-grid';container.append(stats);
  function stat(value,label){const box=document.createElement('div');box.className='property-stat';const v=document.createElement('strong'),t=document.createElement('span');v.textContent=value;t.textContent=label;box.append(v,t);stats.append(box);}
  if(floor>=0) {
    const area=data.floor_areas?.find(a=>a.floor_index===floor);
    stat(area?`${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`:'—','Kaplama izdüşümü · model hesabı');
    stat(String(data.rooms.filter(r=>r.floor_index===floor).length),'Plan üzerinde alan');
    const list=document.createElement('ul');list.className='property-room-list';
    for(const room of data.rooms.filter(r=>r.floor_index===floor)){
      const li=document.createElement('li'),name=document.createElement('div'),area=document.createElement('span');name.textContent=room.name;area.textContent=areaLabel(room);li.append(name,area);list.append(li);
    }container.append(list);
  } else {
    stat('500 m²','Brüt alan · RE/MAX ilanı');stat('400 m²','Net alan · RE/MAX ilanı');stat('4','Kat');stat('5 + 4','Oda · RE/MAX ilanı');
    if(data.site_areas){const list=document.createElement('ul');list.className='property-room-list';for(const area of data.site_areas){const li=document.createElement('li'),n=document.createElement('div'),v=document.createElement('span');n.textContent=area.name;v.textContent=`${area.estimated?'≈ ':''}${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`;li.append(n,v);list.append(li);}container.append(list);}
  }
  const note=document.createElement('p');note.className='small-note';note.textContent=floor>=0?'Kat değeri, kaynak modeldeki kaplama yüzeylerinin yatay izdüşümüdür; kot farkları dahil, çakışan yüzeyler tek sayılır. Kullanılabilir net alan veya tapu alanı değildir. Oda sınırları ayrı doğrulanmadan oda m² değeri gösterilmez.':'İlan alanları RE/MAX P56131836 kaynağındandır. ≈, yorumlanmış bahçe sınırları içindeki model arazi yüzeyini veya fotoğrafa dayalı havuz tahminini belirtir; yerinde ölçüm ve parsel alanı değildir.';container.append(note);
}
