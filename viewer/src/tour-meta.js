// Task 4.2: the two facts main.js needs about the tour, split out so the
// 26 KB script and cue tables load only when the tour is actually pressed.
export const TOUR_DURATION = {tr: 401.64, en: 433.18};
export const tourLang = lang => (lang === 'en' ? 'en' : 'tr');
