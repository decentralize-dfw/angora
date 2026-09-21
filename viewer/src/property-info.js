import {areaLabel} from './annotations.js';
import {t,roomName,currentLang} from './i18n.js';
import {listing} from './listing.js';
// R47 | Three sheets, three subjects, no sheet answering another's question.
//
// The property sheet is the listing: what it is, where it is, what it costs,
// what comes with it. The storey sheet is the open floor and only exists
// while a floor is open: that floor's paragraphs, its measured coverage and
// its schedule of spaces. The settlement belongs to the area map and is
// rendered there. Nothing is repeated between them.
//
// Listing copy and model measurement never blur into one another: everything
// quoted from the listing sits under the listing's own headings, and every
// figure derived from the delivery keeps the provenance note that has always
// followed it. The garden and pool paragraphs are the listing's; the m² beside
// "Bahçe" is the model's, and says so.
function stat(grid,value,label){
  const box=document.createElement('div');box.className='property-stat';
  const v=document.createElement('strong'),s=document.createElement('span');
  v.textContent=value;s.textContent=label;box.append(v,s);grid.append(box);
}
function grid(container){const el=document.createElement('div');el.className='property-grid';container.append(el);return el;}
function prose(container,title,paragraphs,className='property-prose'){
  const block=document.createElement('section');block.className=className;
  if(title){const h=document.createElement('h3');h.textContent=title;block.append(h);}
  for(const text of paragraphs){const p=document.createElement('p');p.textContent=text;block.append(p);}
  container.append(block);return block;
}
function note(container,key){const p=document.createElement('p');p.className='small-note';p.textContent=t(key);container.append(p);}
function areaList(container,rows){
  const list=document.createElement('ul');list.className='property-room-list';
  for(const [name,value] of rows){
    const li=document.createElement('li'),n=document.createElement('div'),v=document.createElement('span');
    n.textContent=name;v.textContent=value;li.append(n,v);list.append(li);
  }
  container.append(list);return list;
}

export function renderPropertyInfo(container,data) {
  container.replaceChildren();
  const copy=listing(currentLang());
  const head=document.createElement('div');head.className='property-head';
  const kind=document.createElement('p');kind.className='property-kind';kind.textContent=copy.kind;
  const address=document.createElement('p');address.className='property-address';address.textContent=copy.address.join(' · ');
  const price=document.createElement('p');price.className='property-price';price.textContent=copy.price;
  head.append(kind,address,price);container.append(head);
  const stats=grid(container);
  stat(stats,'500 m²',t('piGross'));stat(stats,'400 m²',t('piNet'));
  stat(stats,'4',t('piFloors'));stat(stats,'5 + 4',t('piRooms'));
  const features=document.createElement('ul');features.className='property-features';
  for(const item of copy.features){const li=document.createElement('li');li.textContent=item;features.append(li);}
  prose(container,t('piFeatures'),[]).append(features);
  prose(container,copy.headline,copy.overview);
  if(data?.site_areas)areaList(container,data.site_areas.map(area=>[roomName(area.name),
    `${area.estimated?'≈ ':''}${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`]));
  for(const section of copy.sections)prose(container,section.title,section.body);
  const deed=document.createElement('p');deed.className='property-deed';deed.textContent=copy.deed;container.append(deed);
  note(container,'piListingNote');
}

// The open storey, and nothing else. Called with a view id; anything that is
// not a floor leaves the sheet empty, and main.js keeps the button hidden.
export function renderFloorInfo(container,data,view) {
  container.replaceChildren();
  const floor=/^f[0-3]$/.test(view)?Number(view[1]):-1;
  if(floor<0||!data)return null;
  const copy=listing(currentLang()),storey=copy.floors[floor];
  if(storey)prose(container,storey.title,storey.body,'property-prose property-floor');
  const area=data.floor_areas?.find(entry=>entry.floor_index===floor);
  const stats=grid(container);
  stat(stats,area?`${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`:'—',t('piCoverage'));
  stat(stats,String(data.rooms.filter(room=>room.floor_index===floor).length),t('piRoomsOnPlan'));
  areaList(container,data.rooms.filter(room=>room.floor_index===floor)
    .map(room=>[roomName(room.name),areaLabel(room,data)]));
  note(container,'piFloorNote');
  return storey?.title??null;
}
