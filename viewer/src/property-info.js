import {areaLabel} from './annotations.js';
import {t,roomName} from './i18n.js';
export function renderPropertyInfo(container,data,view) {
  container.replaceChildren();
  const floor=/^f[0-3]$/.test(view)?Number(view[1]):-1;
  const stats=document.createElement('div');stats.className='property-grid';container.append(stats);
  function stat(value,label){const box=document.createElement('div');box.className='property-stat';const v=document.createElement('strong'),t=document.createElement('span');v.textContent=value;t.textContent=label;box.append(v,t);stats.append(box);}
  if(floor>=0) {
    const area=data.floor_areas?.find(a=>a.floor_index===floor);
    stat(area?`${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`:'—',t('piCoverage'));
    stat(String(data.rooms.filter(r=>r.floor_index===floor).length),t('piRoomsOnPlan'));
    const list=document.createElement('ul');list.className='property-room-list';
    for(const room of data.rooms.filter(r=>r.floor_index===floor)){
      const li=document.createElement('li'),name=document.createElement('div'),area=document.createElement('span');name.textContent=roomName(room.name);area.textContent=areaLabel(room,data);li.append(name,area);list.append(li);
    }container.append(list);
  } else {
    stat('500 m²',t('piGross'));stat('400 m²',t('piNet'));stat('4',t('piFloors'));stat('5 + 4',t('piRooms'));
    if(data.site_areas){const list=document.createElement('ul');list.className='property-room-list';for(const area of data.site_areas){const li=document.createElement('li'),n=document.createElement('div'),v=document.createElement('span');n.textContent=roomName(area.name);v.textContent=`${area.estimated?'≈ ':''}${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`;li.append(n,v);list.append(li);}container.append(list);}
  }
  const note=document.createElement('p');note.className='small-note';note.textContent=floor>=0?t('piFloorNote'):t('piListingNote');container.append(note);
}
