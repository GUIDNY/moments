/** Everything coins can be spent on. */

export const AVATARS = [
  { id: 'trader', kind: 'avatar', emoji: '🧑‍💼', name: 'סוחר מתחיל', price: 0, desc: 'הדמות שאיתה כולם מתחילים.' },
  { id: 'bull', kind: 'avatar', emoji: '🐂', name: 'השור', price: 300, desc: 'תמיד מאמין שזה הולך למעלה.' },
  { id: 'bear', kind: 'avatar', emoji: '🐻', name: 'הדוב', price: 300, desc: 'תמיד מאמין שזה הולך למטה.' },
  { id: 'robot', kind: 'avatar', emoji: '🤖', name: 'בוט מסחר', price: 900, desc: 'לא ישן, לא אוכל, רק סוחר.' },
  { id: 'ninja', kind: 'avatar', emoji: '🥷', name: 'נינג׳ת נרות', price: 1600, desc: 'נכנס ויוצא לפני שהספקת לראות.' },
  { id: 'whale', kind: 'avatar', emoji: '🐋', name: 'הלוויתן', price: 3200, desc: 'מזיז את השוק בהזמנה אחת.' },
  { id: 'unicorn', kind: 'avatar', emoji: '🦄', name: 'חד-קרן', price: 6000, desc: 'שווי מדומיין, כיף אמיתי.' },
];

export const PERKS = [
  {
    id: 'lucky-tie',
    kind: 'perk',
    emoji: '👔',
    name: 'עניבת מזל',
    price: 500,
    multiplier: 1.15,
    desc: '‎+15% מטבעות מכל משחקון.',
  },
  {
    id: 'golden-watch',
    kind: 'perk',
    emoji: '⌚',
    name: 'שעון זהב',
    price: 1800,
    multiplier: 1.35,
    desc: '‎+35% מטבעות מכל משחקון.',
  },
  {
    id: 'bull-charm',
    kind: 'perk',
    emoji: '🏆',
    name: 'גביע הבורסה',
    price: 5000,
    multiplier: 1.6,
    desc: '‎+60% מטבעות מכל משחקון.',
  },
];

export const SHOP_ITEMS = [...AVATARS.filter((a) => a.price > 0), ...PERKS];

export const ITEMS_BY_ID = Object.fromEntries([...AVATARS, ...PERKS].map((i) => [i.id, i]));

export const avatarEmoji = (id) => ITEMS_BY_ID[id]?.emoji ?? '🧑‍💼';

export function perkMultiplier(equippedPerk) {
  const perk = equippedPerk ? ITEMS_BY_ID[equippedPerk] : null;
  return perk?.multiplier ?? 1;
}
