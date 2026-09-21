import {areaLabel} from './annotations.js';
import {t,roomName,currentLang} from './i18n.js';
import {listing} from './listing.js';
// R47 | The property sheet carries the listing, and the open storey inside it.
//
// It used to be a stat block: four numbers and a room schedule. What a buyer
// asks first - what is it, where is it, what does it cost, what comes with it
// - was not on the page at all, and the description of each floor lived only
// in the sales listing on another site. So the sheet now opens with the
// identity, and when a storey is open its own paragraphs and spaces sit
// directly under it, with the rest of the listing below.
//
// Listing copy and model measurement never blur into one another: everything
// quoted from the listing sits under the listing's own headings, and every
// figure derived from the delivery keeps the provenance note that has always
// followed it. The garden and pool paragraphs are the listing's; the m² beside
// "Bahçe" is the model's, and says so.
export function renderPropertyInfo(container,data,view) {
  container.replaceChildren();
  const floor=/^f[0-3]$/.test(view)?Number(view[1]):-1;
  const copy=listing(currentLang());
  function stat(grid,value,label){
    const box=document.createElement('div');box.className='property-stat';
    const v=document.createElement('strong'),s=document.createElement('span');
    v.textContent=value;s.textContent=label;box.append(v,s);grid.append(box);
  }
  function grid(){const el=document.createElement('div');el.className='property-grid';container.append(el);return el;}
  function prose(title,paragraphs,className='property-prose'){
    const block=document.createElement('section');block.className=className;
    if(title){const h=document.createElement('h3');h.textContent=title;block.append(h);}
    for(const text of paragraphs){const p=document.createElement('p');p.textContent=text;block.append(p);}
    container.append(block);return block;
  }
  function note(key){const p=document.createElement('p');p.className='small-note';p.textContent=t(key);container.append(p);}

  // What the property is, on every view.
  const head=document.createElement('div');head.className='property-head';
  const kind=document.createElement('p');kind.className='property-kind';kind.textContent=copy.kind;
  const address=document.createElement('p');address.className='property-address';address.textContent=copy.address.join(' · ');
  const price=document.createElement('p');price.className='property-price';price.textContent=copy.price;
  head.append(kind,address,price);container.append(head);
  const listingStats=grid();
  stat(listingStats,'500 m²',t('piGross'));stat(listingStats,'400 m²',t('piNet'));
  stat(listingStats,'4',t('piFloors'));stat(listingStats,'5 + 4',t('piRooms'));
  const features=document.createElement('ul');features.className='property-features';
  for(const item of copy.features){const li=document.createElement('li');li.textContent=item;features.append(li);}
  prose(t('piFeatures'),[]).append(features);

  // The storey on screen, when there is one.
  if(floor>=0) {
    const storey=copy.floors[floor];
    if(storey)prose(storey.title,storey.body,'property-prose property-floor');
    const area=data.floor_areas?.find(a=>a.floor_index===floor);
    const floorStats=grid();
    stat(floorStats,area?`${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`:'—',t('piCoverage'));
    stat(floorStats,String(data.rooms.filter(r=>r.floor_index===floor).length),t('piRoomsOnPlan'));
    const list=document.createElement('ul');list.className='property-room-list';
    for(const room of data.rooms.filter(r=>r.floor_index===floor)){
      const li=document.createElement('li'),name=document.createElement('div'),value=document.createElement('span');
      name.textContent=roomName(room.name);value.textContent=areaLabel(room,data);li.append(name,value);list.append(li);
    }
    container.append(list);
    note('piFloorNote');
  }

  // The listing itself, below whatever storey is open.
  prose(copy.headline,copy.overview);
  if(data.site_areas){
    const list=document.createElement('ul');list.className='property-room-list';
    for(const area of data.site_areas){
      const li=document.createElement('li'),n=document.createElement('div'),v=document.createElement('span');
      n.textContent=roomName(area.name);
      v.textContent=`${area.estimated?'≈ ':''}${area.area_m2.toLocaleString('tr-TR',{maximumFractionDigits:1})} m²`;
      li.append(n,v);list.append(li);
    }
    container.append(list);
  }
  for(const section of copy.sections)prose(section.title,section.body);
  prose(t('piLocation'),[copy.location]);
  const deed=document.createElement('p');deed.className='property-deed';deed.textContent=copy.deed;container.append(deed);
  note('piListingNote');
}
