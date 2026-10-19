import { activeItems, compareNames } from '#store';

const reject = (state, key) => ({ state, error: { key } });

// Two spellings of a shop name are one shop.
const keyOf = (name) => name.toLowerCase();

const hasShop = (item, name) => item.shops.some((shop) => keyOf(shop) === keyOf(name));

const namesOf = (items) => {
  const names = new Map();
  for (const item of items) for (const shop of item.shops) if (!names.has(keyOf(shop))) names.set(keyOf(shop), shop);
  return [...names.values()].sort(compareNames);
};

const setShops = (state, id, shops) => ({
  state: { ...state, items: state.items.map((item) => (item.id === id ? { ...item, shops } : item)) },
});

// The shops in use, in name order. A shop exists while an item has it.
export const shopNames = (state) => namesOf(state.items);

// The shops that the field of an item offers: the shops in use that the item does not have.
export const shopSuggestions = (state, id) => {
  const item = state.items.find((entry) => entry.id === id);
  return item ? shopNames(state).filter((shop) => !hasShop(item, shop)) : [];
};

// A name that is a shop in use takes the spelling of that shop. A shop that the item has
// already returns the same state object.
export const addItemShop = (state, id, rawName) => {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return reject(state, 'error.itemNotFound');
  const typed = String(rawName ?? '').trim();
  if (!typed) return reject(state, 'error.shopRequired');
  const name = shopNames(state).find((shop) => keyOf(shop) === keyOf(typed)) ?? typed;
  return hasShop(item, name) ? { state } : setShops(state, id, [...item.shops, name]);
};

export const removeItemShop = (state, id, name) => {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return reject(state, 'error.itemNotFound');
  if (!hasShop(item, name)) return { state };
  return setShops(state, id, item.shops.filter((shop) => keyOf(shop) !== keyOf(name)));
};

// A list by shop, with the shops in name order. An item of two shops is in the two groups.
// `total` is the count of `items`. `rest` holds the items with no shop.
export const shopGroups = (state) => {
  const source = activeItems(state);
  const groups = namesOf(source).map((shop) => {
    const items = source.filter((item) => hasShop(item, shop));
    return { shop, items, total: items.length };
  });
  return { groups, rest: source.filter((item) => item.shops.length === 0) };
};

// The shop lists: `null` is `Todas`, `''` is `Sin tienda`, a name is a shop.
export const inShop = (item, shop) => (shop === null ? true : shop === '' ? item.shops.length === 0 : hasShop(item, shop));

// The state with only the items of one shop list. Operations still run on the full state.
export const shopState = (state, shop) =>
  shop === null ? state : { ...state, items: state.items.filter((item) => inShop(item, shop)) };

// The chips of the shop lists of Compra: Todas, each shop in name order, then Sin tienda when an
// item has no shop. `count` is the items of the list. No chip when no item has a shop.
export const shopChips = (state) => {
  const names = namesOf(state.items);
  if (!names.length) return [];
  const chip = (shop) => ({ shop, count: state.items.filter((item) => inShop(item, shop)).length });
  const none = state.items.some((item) => item.shops.length === 0) ? [chip('')] : [];
  return [chip(null), ...names.map(chip), ...none];
};

// The choice when its chip still exists, in the spelling of the chip; Todas if not.
export const validShop = (state, shop) => {
  if (shop === null) return null;
  const chip = shopChips(state).find((entry) => entry.shop !== null && keyOf(entry.shop) === keyOf(shop));
  return chip ? chip.shop : null;
};

// The shop list of Compra after `shop`, in chip order and from the start after the end:
// `{ shop, count }`. Null when no other shop list has an item.
export const nextShop = (state, shop) => {
  const chips = shopChips(state).filter((chip) => chip.shop !== null);
  const at = chips.findIndex((chip) => chip.shop === shop);
  const order = [...chips.slice(at + 1), ...chips.slice(0, at + 1)];
  return order.find((chip) => chip.shop !== shop) ?? null;
};

// The shop list of Compra before `shop`, in chip order and from the end after the start:
// `{ shop, count }`. Null when no other shop list has an item.
export const previousShop = (state, shop) => {
  const chips = shopChips(state).filter((chip) => chip.shop !== null);
  const at = chips.findIndex((chip) => chip.shop === shop);
  const order = at < 0 ? chips : [...chips.slice(at + 1), ...chips.slice(0, at)];
  return order.reverse().find((chip) => chip.shop !== shop) ?? null;
};

// An add from a shop list puts its shop on the item. Todas, Sin tienda and an error change nothing.
export const withShop = (result, id, shop) => {
  if (result.error || !shop) return result;
  return { ...result, state: addItemShop(result.state, id, shop).state };
};
