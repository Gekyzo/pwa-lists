import { emptyState, GROUPS, SORTS } from '#store';

export const STORAGE_KEY = 'lists.v1';
export const CORRUPT_KEY = `${STORAGE_KEY}.corrupt`;

const LISTS = ['active', 'saved'];

// Versions 1 to 7 have a second list, `next`, and `again`, the mark of a ticked one-time item that
// comes back at the next trip. Both are items to buy at the next trip now: they go to Compra, not
// ticked.
const OLD_LISTS = ['next'];

const unique = (values) => new Set(values).size === values.length;

const lower = (text) => text.toLowerCase();

// `shops` only groups a view, so a bad entry is dropped and the item stays valid.
const normalizeShops = (shops) => {
  if (!Array.isArray(shops)) return [];
  const seen = new Set();
  return shops
    .filter((shop) => typeof shop === 'string')
    .map((shop) => shop.trim())
    .filter((shop) => {
      if (shop === '' || seen.has(lower(shop))) return false;
      seen.add(lower(shop));
      return true;
    });
};

const normalizeItem = (item) => {
  if (typeof item !== 'object' || item === null) return null;
  const { id, name, recurrent, list, bought, again, shops, quantity, aisle } = item;
  const valid =
    typeof id === 'string' &&
    id !== '' &&
    typeof name === 'string' &&
    name.trim() !== '' &&
    [...LISTS, ...OLD_LISTS].includes(list) &&
    typeof bought === 'boolean' &&
    (again === undefined || typeof again === 'boolean');
  if (!valid) return null;
  // `recurrent` is a mark of Bodega: Stash drops it. A ticked recurrent item of Bodega with `again`
  // keeps its tick, as Bodega kept it.
  const comesBack = list === 'next' || (list === 'active' && bought && recurrent !== true && again === true);
  return {
    id,
    name: name.trim(),
    list: list === 'saved' ? 'saved' : 'active',
    bought: list === 'active' && bought && !comesBack,
    shops: normalizeShops(shops),
    quantity: typeof quantity === 'string' ? quantity.trim() : '',
    aisle: typeof aisle === 'string' ? aisle.trim() : '',
  };
};

// `aisles` only groups a view, so a bad entry is dropped and the state stays valid. Versions 1 to 6
// have no aisles.
const normalizeAisles = (aisles) => {
  if (!Array.isArray(aisles)) return [];
  const seen = new Set();
  return aisles
    .filter((aisle) => typeof aisle === 'string')
    .map((aisle) => aisle.trim())
    .filter((aisle) => {
      if (aisle === '' || seen.has(lower(aisle))) return false;
      seen.add(lower(aisle));
      return true;
    });
};

// The aisle of an item takes the spelling of its entry in `aisles`; an aisle that is not there is
// cleared.
const knownAisles = (items, aisles) => {
  const spelling = new Map(aisles.map((aisle) => [lower(aisle), aisle]));
  return items.map((item) => ({ ...item, aisle: spelling.get(lower(item.aisle)) ?? '' }));
};

// Each shop gets the spelling of its first use, so that two spellings do not make two groups.
const oneSpelling = (items) => {
  const first = new Map();
  for (const item of items) for (const shop of item.shops) if (!first.has(lower(shop))) first.set(lower(shop), shop);
  return items.map((item) => ({ ...item, shops: item.shops.map((shop) => first.get(lower(shop))) }));
};

// Versions 1 and 2 have `grouped`, a boolean for the recipe grouping. Stash has no recipes, so the
// recipe grouping of a Bodega state becomes the shop grouping.
const groupOf = (data) => {
  if (GROUPS.includes(data.group)) return data.group;
  return data.grouped === false ? 'none' : 'shop';
};

const VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Returns a clean version 9 state, or null when the data is not a known state. The recipes, the
// sent recipes and the menu of a Bodega state are dropped.
const normalizeState = (data) => {
  if (typeof data !== 'object' || data === null || !VERSIONS.includes(data.version) || !Array.isArray(data.items)) return null;
  const items = data.items.map(normalizeItem);
  if (items.includes(null)) return null;
  const valid = unique(items.map((item) => item.id)) && unique(items.map((item) => lower(item.name)));
  if (!valid) return null;
  const aisles = normalizeAisles(data.aisles);
  return {
    version: 9,
    items: knownAisles(oneSpelling(items), aisles),
    group: groupOf(data),
    sort: SORTS.includes(data.sort) ? data.sort : 'custom',
    aisles,
  };
};

const parse = (text) => {
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { invalidJson: true };
  }
};

export const load = (storage) => {
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (text === null) return emptyState();
    const state = normalizeState(parse(text).data);
    if (state) return state;
    storage.setItem(CORRUPT_KEY, text);
  } catch {
    // Storage is not available: the app works in memory.
  }
  return emptyState();
};

export const save = (storage, state) => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const exportJson = (state) => JSON.stringify(state, null, 2);

// Local time, to the second, so two exports of one day get two names.
export const exportFilename = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `stash-${day}-${time}.json`;
};

export const importJson = (text) => {
  const { data, invalidJson } = parse(text);
  if (invalidJson) return { error: { key: 'error.invalidJson' } };
  const state = normalizeState(data);
  return state ? { state } : { error: { key: 'error.notBackup' } };
};

// The language that the user chose. It is a preference of the device, not a part of the state.
export const LANGUAGE_KEY = 'lists.lang';

// The stored language when it is one of `supported`, else null: the app follows the phone.
export const loadLanguage = (storage, supported) => {
  try {
    const lang = storage.getItem(LANGUAGE_KEY);
    return supported.includes(lang) ? lang : null;
  } catch {
    return null;
  }
};

// `null` removes the choice.
export const saveLanguage = (storage, lang) => {
  try {
    if (lang === null) storage.removeItem(LANGUAGE_KEY);
    else storage.setItem(LANGUAGE_KEY, lang);
    return true;
  } catch {
    return false;
  }
};

// The hand that the user holds the phone with. It is a preference of the device, as the language is.
export const HAND_KEY = 'lists.hand';

// The stored hand when it is `left`, else `right`.
export const loadHand = (storage) => {
  try {
    return storage.getItem(HAND_KEY) === 'left' ? 'left' : 'right';
  } catch {
    return 'right';
  }
};

// `right` is the hand of an app with no choice: it removes the key.
export const saveHand = (storage, hand) => {
  try {
    if (hand === 'left') storage.setItem(HAND_KEY, 'left');
    else storage.removeItem(HAND_KEY);
    return true;
  } catch {
    return false;
  }
};

// Whether Compra shows the row of shop lists. A preference of the device, as the hand is.
export const SHOP_LISTS_KEY = 'lists.shopLists';

// `hide` when stored, else `show`.
export const loadShopLists = (storage) => {
  try {
    return storage.getItem(SHOP_LISTS_KEY) === 'hide' ? 'hide' : 'show';
  } catch {
    return 'show';
  }
};

// `show` is the choice of an app with no choice: it removes the key.
export const saveShopLists = (storage, choice) => {
  try {
    if (choice === 'hide') storage.setItem(SHOP_LISTS_KEY, 'hide');
    else storage.removeItem(SHOP_LISTS_KEY);
    return true;
  } catch {
    return false;
  }
};

// What Terminar compra does at first with an item not bought: `keep` it in Compra or `save` it
// (TRIP-7). A preference of the device, as the hand is.
export const TRIP_END_KEY = 'lists.tripEnd';

// `save` when stored, else `keep`.
export const loadTripEnd = (storage) => {
  try {
    return storage.getItem(TRIP_END_KEY) === 'save' ? 'save' : 'keep';
  } catch {
    return 'keep';
  }
};

// `keep` is the choice of an app with no choice: it removes the key.
export const saveTripEnd = (storage, choice) => {
  try {
    if (choice === 'save') storage.setItem(TRIP_END_KEY, 'save');
    else storage.removeItem(TRIP_END_KEY);
    return true;
  } catch {
    return false;
  }
};

// The colours of the app: `light`, `dark`, or `system` to follow the phone. A preference of the
// device, as the hand is.
export const THEME_KEY = 'lists.theme';
const THEMES = ['light', 'dark'];

// The stored theme when it is `light` or `dark`, else `system`.
export const loadTheme = (storage) => {
  try {
    const theme = storage.getItem(THEME_KEY);
    return THEMES.includes(theme) ? theme : 'system';
  } catch {
    return 'system';
  }
};

// `system` is the theme of an app with no choice: it removes the key.
export const saveTheme = (storage, theme) => {
  try {
    if (THEMES.includes(theme)) storage.setItem(THEME_KEY, theme);
    else storage.removeItem(THEME_KEY);
    return true;
  } catch {
    return false;
  }
};

// The space of the rows: `compact` shows more rows on one screen, `normal` is the default. A
// preference of the device, as the hand is.
export const DENSITY_KEY = 'lists.density';

// The stored density when it is `compact`, else `normal`.
export const loadDensity = (storage) => {
  try {
    return storage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'normal';
  } catch {
    return 'normal';
  }
};

// `normal` is the density of an app with no choice: it removes the key.
export const saveDensity = (storage, density) => {
  try {
    if (density === 'compact') storage.setItem(DENSITY_KEY, density);
    else storage.removeItem(DENSITY_KEY);
    return true;
  } catch {
    return false;
  }
};

// Set after the walkthrough of the first start closed. It is a preference of the device, as the
// hand is.
export const ONBOARDED_KEY = 'lists.onboarded';

// A storage that cannot be read counts as seen, so the walkthrough does not show at each start.
export const loadOnboarded = (storage) => {
  try {
    return storage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return true;
  }
};

export const saveOnboarded = (storage) => {
  try {
    storage.setItem(ONBOARDED_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

// True when the storage holds a state, valid or not: the install is not new.
export const hasStoredState = (storage) => {
  try {
    return storage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

// Set after Compra showed the slide of a row one time (ROW-14). A preference of the device, as the
// hand is.
export const SWIPE_HINT_KEY = 'lists.swipeHint';

// A storage that cannot be read counts as not shown: the app cannot save it either, so the hint
// plays at each start.
export const loadSwipeHint = (storage) => {
  try {
    return storage.getItem(SWIPE_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveSwipeHint = (storage) => {
  try {
    storage.setItem(SWIPE_HINT_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

// Every key that the app writes to the storage: the state, its corrupt copy and each preference of the
// device. Borrar todos los datos removes them all (BACKUP-7).
export const APP_KEYS = [
  STORAGE_KEY,
  CORRUPT_KEY,
  LANGUAGE_KEY,
  HAND_KEY,
  SHOP_LISTS_KEY,
  TRIP_END_KEY,
  THEME_KEY,
  DENSITY_KEY,
  ONBOARDED_KEY,
  SWIPE_HINT_KEY,
];

// After it, the install counts as new: the next start shows the walkthrough.
export const resetAll = (storage) => {
  try {
    APP_KEYS.forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
};
