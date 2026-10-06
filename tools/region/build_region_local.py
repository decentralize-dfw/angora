"""Bölge haritasının "çevrede" katmanı - ürün sahibinin işaretlediği yerler.

    python3 tools/region/build_region_local.py

Ürün sahibi (28.09): Google Haritalar ekran görüntülerinde çevredeki
yerleri işaretledi ("bunların hiçbirini göstermiyoruz") ve üç site kapısını
gösterdi. Ayrıca: "yazılımcı, emlakçı tarzı normal adamı ilgilendirmeyen
hard ticarileri göstermeyelim; kuaför, veteriner, terzi gözüksün, muslukçu
gözükmesin".

Konumlar TAHMİN DEĞİL, ölçüldü: her ekran görüntüsü haritaya, OSM'deki adlı
sokak kesişimleri + modelden gelen villa (+ güvenilir tek mekânlar) çapa
alınarak oturtuldu (dönüş 0, ölçek + öteleme en küçük kareler; çapa
sapması 1-7 m). Üstüne OSM yolları bindirilip gözle doğrulandı. Görüntü ->
harita dönüşümleri:
  gorsel-1 (Hitit Blv./Meraklı/Gülümser)  6,55 px/m
  gorsel-2 (Saltoğlu Angora/Şehitler P.)   3,06 px/m
  gorsel-3 (Okyanus Cd./Yelkenli Cd.)      2,76 px/m
  gorsel-4 (Beysupark AVM, S. Saltoğlu)    3,40 px/m (ölçek çubuğu)
  gorsel-5 (Hitit/Kanuni kavşağı)          0,62 px/m
OSM'de poligonu olan yerler (basketbol/tenis sahası) OSM konumuna oturur;
kapılar en yakın yol eksenine iner. Koordinat: region-streets ile aynı
(adres noktası merkezli, x=doğu, y=güney, metre).

Çıktı: viewer/src/region-local.json
"""
import json, math, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
streets = json.load(open(os.path.join(ROOT, 'viewer/src/region-streets.json')))
places = json.load(open(os.path.join(ROOT, 'viewer/src/region-places.json')))

# rank: 1 = sıkışık yerde önce yerleşir (kapılar hep önce), yoksa 2.
# g: region-places grupları - 0 eğitim, 1 sağlık, 2 yeme içme, 3 alışveriş,
# 4 spor/park, 5 hizmet
LOCAL = [
    # görsel-1: Hitit Bulvarı batısı
    {'name': 'Masha Kuaför', 'g': 5, 'x': -150.1, 'y': -0.8},
    {'name': 'Angora Veteriner Kliniği', 'en': 'Angora Veterinary Clinic', 'g': 1, 'x': -152.8, 'y': 25.5},
    {'name': 'Yigitistan Art Studio', 'g': 5, 'x': -140.9, 'y': 49.6},
    # görsel-2: Şehitler Parkı (spor alanı) - sahalar OSM poligonlarından
    {'name': 'GMO Simitçi', 'g': 2, 'x': -114.6, 'y': -283.7},
    {'name': 'Basketbol sahası', 'en': 'Basketball court', 'g': 4, 'x': -138, 'y': -238},
    {'name': 'Tenis kortu', 'en': 'Tennis court', 'g': 4, 'x': -111, 'y': -234},
    {'name': 'Koşu yolu', 'en': 'Running path', 'g': 4, 'x': -144.7, 'y': -181.7},
    # görsel-3: Okyanus Caddesi
    {'name': 'Deniz Parkı', 'en': 'Deniz Park', 'g': 4, 'x': -150.3, 'y': -1142.9},
    {'name': 'Okyanus Parkı', 'en': 'Okyanus Park', 'g': 4, 'x': -201.0, 'y': -1071.2},
    {'name': 'Melis Kuruyemiş & Market', 'g': 3, 'x': -331.4, 'y': -904.7},
    # görsel-4: Beysupark
    {'name': 'Beysupark AVM', 'en': 'Beysupark Mall', 'g': 3, 'x': -1037.9, 'y': -780.9, 'rank': 1,
     'list': 'Migros · SushiCo · OT Cafe · Paris Kuaför · Eczane · Balıkçı · Kasap · Base Life Club · Eşarj'},
    {'name': 'Migros', 'g': 3, 'x': -997.6, 'y': -931.2},
    {'name': 'Starbucks', 'g': 2, 'x': -917.9, 'y': -863.9},
    {'name': 'Angora Robin Hood Drink Shop', 'g': 2, 'x': -808.5, 'y': -963.9},
    {'name': 'Çocuk bahçesi', 'en': 'Playground', 'g': 4, 'x': -846.7, 'y': -927.4},
    {'name': 'Anıt Çiçek', 'g': 3, 'x': -834.0, 'y': -922.1},
    {'name': 'Merve Parkı', 'en': 'Merve Park', 'g': 4, 'x': -939, 'y': -759},
    {'name': 'Eşarj şarj istasyonu', 'en': 'Eşarj EV charging', 'g': 5, 'x': -1104.9, 'y': -713.9},
    # görsel-5: Hitit / Kanuni Sultan Süleyman kavşağı çevresi
    {'name': 'Afitap Meyhane Beytepe', 'g': 2, 'x': -711.4, 'y': 652.4},
    {'name': 'Beytepe 1923', 'g': 3, 'x': -604, 'y': 1054, 'rank': 1, 'list': 'Kafe · restoran · Migros · Starbucks'},
    {'name': 'Park', 'g': 4, 'x': -348.1, 'y': 660.3},
]
# Kapılar: görsel-3 (Saltoğlu Angora Cd., kuzeybatı), görsel-4 (Saltoğlu
# Angora Cd., Beysupark tarafı), görsel-5 (Hitit Bulvarı, güney - Besteci
# kavşağı). En yakın yol eksenine indirilir.
GATES = [(-563.9, -1092.2), (-748.2, -676.5), (-136.0, 124.0)]
# Normal ziyaretçiyi ilgilendirmeyen ticari / kurumsal kayıtlar.
COMMERCIAL = re.compile(
    r'gayrimenkul|emlak|real estate|keller williams|sigorta|\bofis\b|office|modern ofis|teknokent|ar-?ge\b|arge|'
    r'bilişim|bilgisayar|technology|\btech\b|yazılım|software|entertainment|elektronik harp|havacılık|uzay sanayi|'
    r'datateam|cerebrum|harita imar|planlama|mimarlık(?! fakültesi)|architect|mühendislik\b|engineering|danışman|consult|'
    r'tesisat|muslukçu|inşaat|peyzaj|fidan|lastik|auto vogue|\bbosch\b|yatsan|işbir yatak|toplu yapı|keyvan|'
    r'ticari|tanıtım ofisi|cyberpark|\bdfs\b|work inn|'
    # üniversite içi birim ve binalar (kampüs tek işaretle kalır)
    r'bölümü|mühendisliği|enstitüsü|laboratuva|kütüphanesi|rektörlük|öğrenci işleri|bilgi işlem|daire başkanlığı|'
    r'^b\d+$|^amfi$|yıldız amfi|yurt kantini|yemekhane|üniversitesi kongre|heykel|pansiyon|güvenlik$|geyik bakım',
    re.IGNORECASE)

roads = [[(p[i], p[i + 1]) for i in range(0, len(p), 2)] for c, n, p in streets['roads']]
def snap(x, y):
    best, bd = (x, y), 1e9
    for pts in roads:
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            dx, dy = bx - ax, by - ay; l2 = dx * dx + dy * dy or 1
            t = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / l2))
            px, py = ax + t * dx, ay + t * dy; d = math.hypot(px - x, py - y)
            if d < bd: bd, best = d, (px, py)
    return (round(best[0], 1), round(best[1], 1)) if bd < 30 else (x, y)

gates = [dict(zip(('x', 'y'), snap(x, y))) for x, y in GATES]
hide_dots = [i for i, t in enumerate(places['dots']) if len(t) > 3 and t[3] and COMMERCIAL.search(t[3])]
# 06.10 ürün sahibi: OSM'in iki 'Beytepe Ormanı' noktası Hacettepe Ormanı'nın üstünde - ormanlar region-map.js'te elle
hide_dots += [i for i, t in enumerate(places['dots']) if len(t) > 3 and t[3] and re.search(r'Ormanı', t[3])]
hide_curated = [i for i, c in enumerate(places['curated']) if COMMERCIAL.search(c['name'])]
out = {'generated_for': 'Bölge haritası - çevrede katmanı (28.09.2026)',
       'source': 'ürün sahibinin Google Haritalar işaretlemeleri, OSM sokak kesişimleriyle ölçülerek haritaya oturtuldu; basketbol/tenis OSM poligonları',
       'places': LOCAL, 'gates': gates, 'hideDots': hide_dots, 'hideCurated': hide_curated,
       'majorRoads': ['Kanuni Sultan Süleyman Bulvarı', 'Hitit Bulvarı', 'Beyler Caddesi']}
path = os.path.join(ROOT, 'viewer/src/region-local.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, indent=1)
print(len(LOCAL), 'yer,', len(gates), 'kapı', gates, '| gizlenen atlas kaydı', len(hide_dots), '+', len(hide_curated))
print('gizlenenler:', [places['dots'][i][3] for i in hide_dots])
