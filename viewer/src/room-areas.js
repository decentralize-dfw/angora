// Room areas supplied by the owner, kept on the viewer side.
//
// They are not in the model source and cannot be derived from it: rooms.json
// states outright that its room partitions are unverified and that it makes no
// component-to-room area assignment, and its floor figures are a finish
// projection rather than net usable area. The model is also developed
// separately, so this schedule lives here rather than being written into
// build/ - nothing under it is touched, and a new model export keeps these.
//
// Keyed by the source room id, so a renamed room cannot silently take another
// room's figure. Where the schedule's names did not map onto exactly one room
// the entry is left out and the tag falls back to the room's registered DWG
// span; those cases are listed at the bottom.
export const ROOM_AREAS = {
  // Bodrum. The schedule lists three entries against six rooms.
  'f0-B10': 1.73,   // Tuvalet - the only sanitary room on the floor

  // Zemin kat.
  'f1-Z06': 53.20,  // Salon
  'f1-Z04': 25.84,  // Mutfak
  'f1-Z07': 20.86,  // Garaj
  'f1-Z02': 11.56,  // Hol - Antre, the only hall left once Giriş is placed
  'f1-Z01': 5.04,   // Giriş
  'f1-Z03': 2.04,   // Tuvalet - WC

  // 1. kat. Every room maps, and the pairing of the two bedrooms is not a
  // guess: f2-106's own registered spans are 2,95 x 4,10 = 12,10 m2, which is
  // the schedule's Oda 2 at 12,05 to within 5 cm2, leaving Oda 1 for f2-107.
  'f2-102': 22.07,  // Master Bedroom - Ebeveyn yatak odası
  'f2-105': 14.59,  // Salon - Oturma alanı
  'f2-107': 13.41,  // Oda 1
  'f2-106': 12.05,  // Oda 2
  'f2-101': 8.72,   // Hol - Kat holü
  'f2-104': 8.55,   // Master Bedroom Tuvalet - Ebeveyn banyosu
  'f2-108': 7.88,   // Tuvalet - Banyo
  'f2-103': 7.55,   // Master Bedroom Giyinme - Giyinme odası

  // 2. kat. The bedrooms pair by span the same way: f3-C02 measures
  // 2,15 x 4,30, the smaller of the two, against Oda 1 at 10,53.
  'f3-C05': 23.63,  // Salon - Oturma alanı
  'f3-C04': 19.77,  // Oda 2
  'f3-C02': 10.53,  // Oda 1
  'f3-C03': 5.74,   // Tuvalet - Banyo
};

// Left out on purpose, pending a decision from the owner:
//   f0 Salon 54,18      - Bahçe salonu and the basement Mutfak share the same
//                         8,40 m registered span, so they read as one space and
//                         it is not clear whether the figure covers both.
//   f0 Müştemilat 26,56 - closest is f0-B02 (3,00 x 7,60), but neither of the
//                         two rooms named "Oda" is identified as the guest house.
//   f1 Depo 5,56        - the only unplaced room is f1-Z08 "Tesisat odası",
//                         which is a plant room, not a store.
//   f3 Mutfak 2,87      - the second floor carries no kitchen in the model.
// Unlisted in the schedule and so left as they are: f0 Hol, f0 Oda (B04),
// f0 Mutfak, f1 Yemek alanı, f3 Kat holü.
