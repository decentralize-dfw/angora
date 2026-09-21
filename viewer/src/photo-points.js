// R47 | Where each listing photograph was taken.
//
// The owner's own key drawing - photogallery/FOTOLAR-KONUM.jpg - marks every
// numbered photograph on the four storey plans with a dot (the camera) and an
// arrow (where it looks). Those plans are screenshots of this very viewer, so
// each one registers back onto the model exactly: a uniform scale and an
// offset, solved per storey from the room labels the plan already carries.
// Residuals came out at 0.02-0.13 m, and every interior point landed inside
// the navigation mask of its own floor, so nothing here is an eyeballed guess
// about which room a photograph belongs to.
//
// Photographs 20 and 24-27 carry no mark on the drawing - 20 repeats 4's
// frame, 24-27 are the drone and garden frames - so those five are placed
// from the photographs themselves and are the only approximate entries.
// 24, 26 and 27 were flown a long way back from the house; pinned at that
// real standoff they sit well outside the storey's own frame and cannot be
// reached at all. They are pinned instead over the pool terrace they look
// across, on their true bearing and with their true direction, at a stated
// cost: the distance to the house is compressed, the viewpoint is not
// invented. Numbers follow the drawing; 28 has no file and no pin.
//
// position: metres, glTF Y-up, the model's own coordinates. y is eye height
// over the storey datum (drone frames carry their own height); floorY is that
// storey's own datum, which is where the mark's leader line lands.
// dx/dz: the unit look direction on the ground plane.
export const PHOTO_POINTS = [
  {id:1,file:'angora_01.jpg',floor:0,outdoor:false,x:-1.584,floorY:0,y:1.55,z:-4.881,dx:-0.682,dz:0.731,tr:'Bodrum · Mutfak',en:'Basement · Kitchen'},
  {id:2,file:'angora_02.jpg',floor:0,outdoor:false,x:-3.698,floorY:0,y:1.55,z:-7.64,dx:0.937,dz:0.35,tr:'Bodrum · Salon',en:'Basement · Living room'},
  {id:3,file:'angora_03.jpg',floor:0,outdoor:false,x:-4.237,floorY:0,y:1.55,z:-4.253,dx:0.783,dz:-0.622,tr:'Bodrum · Salon',en:'Basement · Living room'},
  {id:4,file:'angora_04.jpg',floor:1,outdoor:false,x:-4.254,floorY:3.0996,y:4.65,z:-7.295,dx:0.641,dz:0.768,tr:'Giriş katı · Salon',en:'Ground floor · Living room'},
  {id:5,file:'angora_05.jpg',floor:0,outdoor:false,x:2.849,floorY:0,y:1.55,z:-4.525,dx:-0.927,dz:-0.374,tr:'Bodrum · Salon',en:'Basement · Living room'},
  {id:6,file:'angora_06.jpg',floor:3,outdoor:false,x:0.151,floorY:9.4705,y:11.021,z:-3.64,dx:0.549,dz:-0.836,tr:'Çatı katı · Mini mutfak',en:'Attic floor · Kitchenette'},
  {id:7,file:'angora_07.jpg',floor:3,outdoor:false,x:-0.182,floorY:9.4705,y:11.021,z:-4.615,dx:-0.756,dz:-0.655,tr:'Çatı katı · Yatak odası',en:'Attic floor · Bedroom'},
  {id:8,file:'angora_08.jpg',floor:3,outdoor:false,x:0.105,floorY:9.4705,y:11.021,z:-0.024,dx:-0.435,dz:0.901,tr:'Çatı katı · Yatak odası',en:'Attic floor · Bedroom'},
  {id:9,file:'angora_09.jpg',floor:3,outdoor:false,x:-4.899,floorY:9.4705,y:11.021,z:-2.015,dx:1.0,dz:0.0,tr:'Çatı katı · Oturma alanı',en:'Attic floor · Sitting area'},
  {id:10,file:'angora_10.jpg',floor:3,outdoor:false,x:0.242,floorY:9.4705,y:11.021,z:-0.995,dx:-0.956,dz:-0.295,tr:'Çatı katı · Oturma alanı',en:'Attic floor · Sitting area'},
  {id:11,file:'angora_11.jpg',floor:2,outdoor:false,x:1.713,floorY:6.3714,y:7.921,z:0.671,dx:0.868,dz:0.497,tr:'1. kat · Ortak banyo',en:'First floor · Family bathroom'},
  {id:12,file:'angora_12.jpg',floor:2,outdoor:false,x:-5.765,floorY:6.3714,y:7.921,z:-3.006,dx:0.907,dz:0.421,tr:'1. kat · Oturma alanı',en:'First floor · Sitting area'},
  {id:13,file:'angora_13.jpg',floor:2,outdoor:false,x:0.744,floorY:6.3714,y:7.921,z:1.453,dx:-0.508,dz:0.861,tr:'1. kat · Yatak odası',en:'First floor · Bedroom'},
  {id:14,file:'angora_14.jpg',floor:3,outdoor:false,x:-2.66,floorY:9.4705,y:11.021,z:3.241,dx:0.847,dz:-0.532,tr:'Çatı katı · Yatak odası',en:'Attic floor · Bedroom'},
  {id:15,file:'angora_15.jpg',floor:3,outdoor:false,x:0.681,floorY:9.4705,y:11.021,z:-5.234,dx:-0.028,dz:-1.0,tr:'Çatı katı · Banyo',en:'Attic floor · Bathroom'},
  {id:16,file:'angora_16.jpg',floor:2,outdoor:false,x:0.404,floorY:6.3714,y:7.921,z:-5.754,dx:0.742,dz:0.671,tr:'1. kat · Giyinme odası',en:'First floor · Dressing room'},
  {id:17,file:'angora_17.jpg',floor:2,outdoor:false,x:0.784,floorY:6.3714,y:7.921,z:4.757,dx:-0.468,dz:-0.884,tr:'1. kat · Yatak odası',en:'First floor · Bedroom'},
  {id:18,file:'angora_18.jpg',floor:2,outdoor:false,x:-1.001,floorY:6.3714,y:7.921,z:-2.823,dx:0.501,dz:0.865,tr:'1. kat · Kat holü · Merdiven',en:'First floor · Landing · Stairs'},
  {id:19,file:'angora_19.jpg',floor:2,outdoor:false,x:-0.539,floorY:6.3714,y:7.921,z:-5.504,dx:-0.872,dz:-0.49,tr:'1. kat · Ebeveyn yatak odası',en:'First floor · Primary bedroom'},
  {id:20,file:'angora_20.jpg',floor:1,outdoor:false,x:-4.35,floorY:3.0996,y:4.65,z:-6.9,dx:0.62,dz:0.78,tr:'Giriş katı · Salon',en:'Ground floor · Living room'},
  {id:21,file:'angora_21.jpg',floor:1,outdoor:false,x:-0.598,floorY:3.0996,y:4.65,z:1.283,dx:-0.862,dz:0.507,tr:'Giriş katı · Mutfak',en:'Ground floor · Kitchen'},
  {id:22,file:'angora_22.jpg',floor:1,outdoor:false,x:-4.172,floorY:3.0996,y:4.65,z:3.544,dx:0.936,dz:-0.351,tr:'Giriş katı · Mutfak',en:'Ground floor · Kitchen'},
  {id:23,file:'angora_23.jpg',floor:1,outdoor:false,x:-0.216,floorY:3.0996,y:4.65,z:-6.846,dx:-0.714,dz:0.7,tr:'Giriş katı · Yemek alanı',en:'Ground floor · Dining area'},
  {id:24,file:'angora_24.jpg',floor:0,outdoor:true,x:0.5,floorY:0,y:3.0,z:-11.2,dx:0.15,dz:0.99,tr:'Havuz ve bahçe',en:'Pool and garden'},
  {id:25,file:'angora_25.jpg',floor:0,outdoor:true,x:3.0,floorY:0,y:1.7,z:-13.5,dx:0.03,dz:1.0,tr:'Bahçe · Arka cephe',en:'Garden · Rear facade'},
  {id:26,file:'angora_26.jpg',floor:0,outdoor:true,x:-1.5,floorY:0,y:2.6,z:-10.0,dx:0.42,dz:0.91,tr:'Havuz ve bahçe',en:'Pool and garden'},
  {id:27,file:'angora_27.jpg',floor:0,outdoor:true,x:5.5,floorY:0,y:3.4,z:-12.0,dx:-0.3,dz:0.95,tr:'Havuz ve bahçe',en:'Pool and garden'},
  {id:29,file:'angora_29.jpg',floor:3,outdoor:false,x:0.446,floorY:9.4705,y:11.021,z:-1.318,dx:0.0,dz:-1.0,tr:'Çatı katı · Kat holü',en:'Attic floor · Landing'},
  {id:30,file:'angora_30.jpg',floor:2,outdoor:false,x:-1.423,floorY:6.3714,y:7.921,z:0.081,dx:-0.71,dz:0.705,tr:'1. kat · Yatak odası',en:'First floor · Bedroom'},
  {id:31,file:'angora_31.jpg',floor:2,outdoor:false,x:-1.862,floorY:6.3714,y:7.921,z:-7.377,dx:0.562,dz:0.827,tr:'1. kat · Ebeveyn yatak odası',en:'First floor · Primary bedroom'},
  {id:32,file:'angora_32.png',floor:2,outdoor:false,x:1.814,floorY:6.3714,y:7.921,z:-6.094,dx:-0.044,dz:-0.999,tr:'1. kat · Ebeveyn banyosu',en:'First floor · En-suite bathroom'},
  {id:33,file:'angora_33.jpg',floor:2,outdoor:false,x:-0.539,floorY:6.3714,y:7.921,z:-2.022,dx:-0.998,dz:-0.064,tr:'1. kat · Oturma alanı',en:'First floor · Sitting area'},
  {id:34,file:'angora_34.jpg',floor:2,outdoor:false,x:-0.853,floorY:6.3714,y:7.921,z:1.316,dx:0.655,dz:-0.756,tr:'1. kat · Kat holü · Merdiven',en:'First floor · Landing · Stairs'},
  {id:35,file:'angora_35.jpg',floor:2,outdoor:false,x:0.581,floorY:6.3714,y:7.921,z:0.569,dx:-0.565,dz:-0.825,tr:'1. kat · Kat holü',en:'First floor · Landing'},
  {id:36,file:'angora_36.jpg',floor:1,outdoor:true,x:-6.535,floorY:3.0996,y:4.65,z:3.789,dx:-0.054,dz:-0.999,tr:'Yan bahçe',en:'Side garden'},
  {id:37,file:'angora_37.jpg',floor:1,outdoor:true,x:-2.778,floorY:3.0996,y:4.65,z:5.688,dx:1.0,dz:0.0,tr:'Giriş sundurması',en:'Entrance porch'},
  {id:38,file:'angora_38.jpg',floor:1,outdoor:true,x:2.418,floorY:3.0996,y:4.65,z:7.935,dx:0.0,dz:-1.0,tr:'Ön cephe · Giriş',en:'Front facade · Entrance'},
  {id:39,file:'angora_39.jpg',floor:1,outdoor:false,x:2.859,floorY:3.0996,y:4.65,z:2.447,dx:0.563,dz:-0.826,tr:'Giriş katı · Misafir WC',en:'Ground floor · Guest WC'},
  {id:40,file:'angora_40.jpg',floor:1,outdoor:false,x:0.09,floorY:3.0996,y:4.65,z:-0.704,dx:0.691,dz:0.723,tr:'Giriş katı · Antre',en:'Ground floor · Entry hall'},
  {id:41,file:'angora_41.jpg',floor:1,outdoor:false,x:1.812,floorY:3.0996,y:4.65,z:1.793,dx:0.738,dz:0.675,tr:'Giriş katı · Giriş holü',en:'Ground floor · Entrance'},
  {id:42,file:'angora_42.jpg',floor:1,outdoor:false,x:-0.817,floorY:3.0996,y:4.65,z:-1.148,dx:0.997,dz:0.079,tr:'Giriş katı · Antre · Merdiven',en:'Ground floor · Entry hall · Stairs'},
  {id:43,file:'angora_43.jpg',floor:1,outdoor:false,x:5.719,floorY:3.0996,y:4.65,z:-0.351,dx:-0.046,dz:0.999,tr:'Garaj',en:'Garage'},
  {id:44,file:'angora_44.jpg',floor:1,outdoor:false,x:5.543,floorY:3.0996,y:4.65,z:-2.448,dx:-0.225,dz:-0.974,tr:'Garaj · Depo',en:'Garage · Storage'},
  {id:45,file:'angora_45.jpg',floor:0,outdoor:false,x:-0.032,floorY:0,y:1.55,z:-1.825,dx:-0.995,dz:-0.1,tr:'Bodrum · Misafir WC',en:'Basement · Guest WC'},
  {id:46,file:'angora_46.jpg',floor:0,outdoor:false,x:-0.182,floorY:0,y:1.55,z:-1.249,dx:0.997,dz:-0.073,tr:'Bodrum · Misafir WC',en:'Basement · Guest WC'},
  {id:47,file:'angora_47.jpg',floor:0,outdoor:false,x:-0.836,floorY:0,y:1.55,z:-2.87,dx:0.998,dz:-0.056,tr:'Bodrum · Hol · Merdiven',en:'Basement · Hall · Stairs'},
  {id:48,file:'angora_48.jpg',floor:0,outdoor:false,x:-1.784,floorY:0,y:1.55,z:-2.987,dx:-0.029,dz:1.0,tr:'Bodrum · Hol · Asansör',en:'Basement · Hall · Lift'},
  {id:49,file:'angora_49.jpg',floor:0,outdoor:false,x:-1.926,floorY:0,y:1.55,z:-1.747,dx:0.009,dz:1.0,tr:'Asansör kabini',en:'Lift car'},
  {id:50,file:'angora_50.jpg',floor:0,outdoor:true,x:-6.832,floorY:0,y:1.55,z:-8.16,dx:-0.155,dz:0.988,tr:'Yan bahçe',en:'Side garden'},
  {id:51,file:'angora_51.jpg',floor:0,outdoor:true,x:-6.12,floorY:0,y:1.55,z:-8.717,dx:0.87,dz:-0.494,tr:'Havuz · Teras',en:'Pool · Terrace'},
  {id:52,file:'angora_52.jpg',floor:0,outdoor:true,x:8.174,floorY:0,y:1.55,z:-7.327,dx:0.0,dz:1.0,tr:'Bahçe merdiveni',en:'Garden steps'},
  {id:53,file:'angora_53.jpg',floor:0,outdoor:true,x:2.374,floorY:0,y:1.55,z:-10.893,dx:0.586,dz:0.81,tr:'Havuz terası',en:'Pool terrace'},
  {id:54,file:'angora_54.jpg',floor:0,outdoor:true,x:6.714,floorY:0,y:1.55,z:-10.171,dx:-0.783,dz:0.622,tr:'Havuz terası',en:'Pool terrace'},
  {id:55,file:'angora_55.jpg',floor:1,outdoor:true,x:8.082,floorY:3.0996,y:4.65,z:1.992,dx:0.0,dz:-1.0,tr:'Yan bahçe · Havuz manzarası',en:'Side garden · Pool view'},
  {id:56,file:'angora_56.jpg',floor:1,outdoor:true,x:6.515,floorY:3.0996,y:4.65,z:7.9,dx:0.0,dz:-1.0,tr:'Açık otopark · Garaj girişi',en:'Driveway · Garage door'},];
// A photograph's caption in the viewer's language; the drawing's own room
// names, never an invented description of what the frame contains.
export const photoCaption = (point, lang) => (lang === 'en' ? point.en : point.tr);
