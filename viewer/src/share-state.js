const VIEWS = ['region', 'neighborhood', 'building', 'f0', 'f1', 'f2', 'f3'];
const SEASONS = ['172', '80', '355'];
const STYLES = ['soft', 'sun'];
const DEFAULTS = {view: 'neighborhood', hour: 12.5, season: '172', style: 'soft'};
const snapHour = hour => Math.round(hour * 12) / 12;
const formatHour = hour => String(Number(snapHour(hour).toFixed(2)));

export function readShareState(search) {
  const params = new URLSearchParams(search), state = {};
  if (VIEWS.includes(params.get('view'))) state.view = params.get('view');
  const hour = Number(params.get('hour'));
  if (params.has('hour') && Number.isFinite(hour) && hour >= 6 && hour <= 21) state.hour = snapHour(hour);
  if (SEASONS.includes(params.get('season'))) state.season = params.get('season');
  if (STYLES.includes(params.get('light'))) state.style = params.get('light');
  return state;
}

export function shareSearch(state) {
  const params = new URLSearchParams();
  if (VIEWS.includes(state.view) && state.view !== DEFAULTS.view) params.set('view', state.view);
  if (Number.isFinite(state.hour) && snapHour(state.hour) !== DEFAULTS.hour) params.set('hour', formatHour(state.hour));
  if (SEASONS.includes(state.season) && state.season !== DEFAULTS.season) params.set('season', state.season);
  if (STYLES.includes(state.style) && state.style !== DEFAULTS.style) params.set('light', state.style);
  const search = params.toString();
  return search ? `?${search}` : '';
}
