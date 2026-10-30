// The pages of the walkthrough of the first start, in their order.
export const PAGES = ['lists', 'row', 'edit', 'sample'];

// The walkthrough shows at the start of a new install only: no seen flag and no stored state.
export const shouldShow = ({ seen, hasState }) => !seen && !hasState;

// The index of the page after a move of `direction` (1, -1 or 0). It stays in the pages.
export const step = (index, direction) => Math.min(Math.max(index + direction, 0), PAGES.length - 1);

// Atrás shows on every page but the first.
export const hasBack = (index) => index > 0;

export const isLast = (index) => index === PAGES.length - 1;

// A key that starts with `#name` shows the icon `name` of the sprite, then the rest of its text.
const keyPart = (text) => {
  const match = text.match(/^#([a-z][\w-]*)(?: (.*))?$/s);
  return match ? { text: match[2] ?? '', key: true, icon: match[1] } : { text, key: true };
};

// The parts of a page text. A text between two backticks is a key, such as `←` or `+`; a
// backtick with no pair stays in the text. A text between two `**` is bold: its parts, keys too,
// have `strong: true`. A `**` with no pair stays in the text.
export const textParts = (text) => {
  const pieces = text.split('`');
  // An even count of pieces means that the last backtick has no pair.
  const open = pieces.length % 2 === 0 ? pieces.splice(-2).join('`') : null;
  const raw = pieces.map((piece, index) => ({ text: piece, key: index % 2 === 1 }));
  if (open !== null) raw.push({ text: open, key: false });
  // Only the `**` marks outside the keys count; an odd last one has no pair.
  const marks = raw.reduce((count, part) => (part.key ? count : count + part.text.split('**').length - 1), 0);
  let paired = marks - (marks % 2);
  let strong = false;
  const parts = raw.flatMap((part) => {
    if (part.key) return [{ ...part, strong }];
    const [first, ...chunks] = part.text.split('**');
    const out = [];
    let current = first;
    for (const chunk of chunks) {
      if (paired > 0) {
        out.push({ text: current, key: false, strong });
        strong = !strong;
        paired -= 1;
        current = chunk;
      } else current += `**${chunk}`;
    }
    out.push({ text: current, key: false, strong });
    return out;
  });
  return parts
    .filter((part) => part.text)
    .reduce((joined, part) => {
      const last = joined.at(-1);
      if (last && !last.key && !part.key && last.strong === part.strong) last.text += part.text;
      else joined.push(part.key ? { ...keyPart(part.text), strong: part.strong } : { ...part });
      return joined;
    }, [])
    .map(({ strong: bold, ...part }) => (bold ? { ...part, strong: true } : part));
};
