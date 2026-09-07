"""Keep photo-group review state and source references explicit; no auto pass."""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
inventory=json.loads((ROOT/'build/reference/source-inventory.json').read_text())
specs={
 'exterior':('Cepheler ve mahalle',['01_front','15_pool_grade_review'],['Panjur konumları, kiremit tonu ve cephe ışığı','Komşu cepheleri ve bitki çeşitleri','Yol ve arazi birleşimlerinin bütün mahallede kontrolü']),
 'asansor':('Asansör',['17_lift_garden'],['Kapı ve kabin ayrıntılarının fotoğraf oranları','Dört durakta kapı hareketi ve hol bağlantısı']),
 'kat_1_bahce':('Bahçe ve havuz',['15_pool_grade_review'],['Bitkiler, çitler, taş derzleri ve bahçe ayrıntıları','Havuz suyu ve döşeme renk eşlemesi']),
 'kat_1_bodrum_mutfak':('Bodrum mutfak',['16_basement_kitchen'],['Yeşil camların geçirgenliği ve dolap iç rafları','Ahşap çerçeve oranları, buzdolabı boyası ve kulplar','Fotoğrafa göre aydınlatma ve yüzey tonu']),
 'kat_1_bodrum_salon':('Bodrum salon',['04_garden_lounge'],['Güncel sahnede fotoğrafla oda karşılaştırması']),
 'kat_1_bodrum_wc':('Bodrum WC / B03',['18_garden_wc'],['Dekorasyon, raf içeriği ve armatür ayrıntıları','Kapı açılımının fotoğrafla son kontrolü']),
 'kat_2_garaj':('Garaj',[],['Garaj içi için özel inceleme kamerası','İç donatı, tesisat, zemin ve kapı mekanizması']),
 'kat_2_giris':('Giriş ve hol',[],['Giriş mobilyaları ve hol ayrıntıları','Kapılar, merdiven ve oda geçişleri']),
 'kat_2_giris_wc':('Giriş WC / Z03',[],['Fotoğrafa özgü lavabo, ayna, klozet ve malzemeler']),
 'kat_2_on_giris':('Ön giriş ve yaklaşım',['01_front'],['Taş kaplama deseni, bahçe kapıları ve bitki yerleşimi']),
 'kat_2_ust_mutfak':('Giriş katı mutfak',['10_main_kitchen'],['Güncel sahnede fotoğrafla oda karşılaştırması']),
 'kat_2_ust_salon':('Giriş katı salon',['05_main_lounge','09_main_panorama'],['Güncel sahnede fotoğrafla oda karşılaştırması']),
 'kat_3_banyok':('Ortak banyo',['14_shared_bathroom'],['Güncel sahnede fotoğrafla oda karşılaştırması']),
 'kat_3_hol':('Yatak katı holü',[],['Hol için özel inceleme kamerası','Açıklık, merdiven, korkuluk ve dolap yerleşimi']),
 'kat_3_master_bedroom':('Ebeveyn odası, banyo ve giyinme',['06_master_bedroom','12_dressing','13_master_bathroom'],['Her fotoğrafın yatak odası / banyo / giyinme hacmine ayrılması','Üç hacmin güncel sahnede ayrı kontrolü']),
 'kat_3_yatak_odalari':('Diğer yatak odaları',['11_southwest_bedroom'],['Fotoğrafların ayrı yatak odalarına eşlenmesi','Her oda için kamera ve oda kontrolü']),
 'kat_4':('Çatı katındaki hacimler',['07_attic'],['Fotoğrafların ayrı hacimlere eşlenmesi','Her oda ve banyo için ayrı kamera ve kontrol'])}
records=[]
for folder,(label,cameras,open_items) in specs.items():
    photos=[f for f in inventory['files'] if 'contact_sheet' in f and (f['path'].split('/')[0] if '/' in f['path'] else 'exterior')==folder]
    records.append({'photo_group':folder,'space':label,'photos':[{'path':f['path'],'sha256':f['sha256']} for f in photos],
        'cameras':cameras,'review_state':'compared_corrections_applied_open_items_remain' if folder in ['exterior','asansor','kat_1_bahce','kat_1_bodrum_mutfak','kat_1_bodrum_wc'] else 'current_revision_photo_review_pending',
        'open_items':open_items,'photo_match_approved':False,'dimension_labels_enabled':False})
master=ROOT/'build/blender/angora21-working.blend'
report={'native_master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'phase_1_complete':False,
 'source_photo_files':inventory['photos'],'unique_source_photos':inventory['unique_photos'],
 'note':'Photo folders can contain several spaces. A group is not an automatically approved room.',
 'acceptance':['CAD room boundary and openings','Photo-specific fixed fittings','Separate furniture layer','Material and light comparison','Clearances and navigation','Verified dimension-to-room association'],
 'groups':records}
(ROOT/'build/room-review-register.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
qa=json.loads((ROOT/'build/qa-report.json').read_text())
status={'stage':'CAD_grades_PBR_kitchen_lift_WC_review','status':'work_in_progress','native_sha256':report['native_master_sha256'],
 'phase_1_complete':False,'web_release_ready':False,'github_push_status':'main_delivery_published_and_incrementally_updated',
 'completed_this_pass':['27-library Blender delivery','77 packed PBR materials and 385 downloadable PNG maps','20 common-origin GLB streams','CAD BK/TK levels for site grading','Basement kitchen access, tilework and three-arm candle fixture','Lift shaft cut through all landing slabs','WC fixtures moved into B03 and Z03, clear of lift cabins','Continuous pool coping/deck interfaces','White CAD entry-door faces'],
 'current_reports':['build/qa-report.json','build/blender/layer-qa.json','build/glb/stream-qa-report.json','build/lift-fixture-qa.json','build/room-review-register.json'],
 'pending':['Photo agreement for every room and elevation','Glazing, shutter states, hardware and material calibration','Garden detail, planting and neighboring facades','Complete road/terrain junctions','Verified dimension associations','Initial neighborhood LOD and measured mobile performance','MERGVS sales interface after model verification']}
(ROOT/'build/photo-detail-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2))
print('REVIEW_REGISTER',len(records),'source photos',inventory['photos'],flush=True)
