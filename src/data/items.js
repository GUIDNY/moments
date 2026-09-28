/** Everything coins can be spent on. Purely cosmetic, plus payout charms. */

export const AVATARS = [
  { id: 'rookie', kind: 'avatar', emoji: '🧑', price: 0,
    name: { en: 'Rookie', he: 'מתחיל' },
    desc: { en: 'Everyone starts here.', he: 'כאן כולם מתחילים.' } },
  { id: 'cat', kind: 'avatar', emoji: '🐱', price: 300,
    name: { en: 'Alley Cat', he: 'חתול רחוב' },
    desc: { en: 'Nine lives, zero patience.', he: 'תשעה חיים, אפס סבלנות.' } },
  { id: 'robot', kind: 'avatar', emoji: '🤖', price: 900,
    name: { en: 'Little Bot', he: 'רובוט קטן' },
    desc: { en: 'Never blinks, never misses.', he: 'לא ממצמץ, לא מפספס.' } },
  { id: 'ninja', kind: 'avatar', emoji: '🥷', price: 1600,
    name: { en: 'Ninja', he: 'נינג׳ה' },
    desc: { en: 'In and out before you look up.', he: 'נכנס ויוצא לפני שהספקת לראות.' } },
  { id: 'astronaut', kind: 'avatar', emoji: '🧑‍🚀', price: 3200,
    name: { en: 'Astronaut', he: 'אסטרונאוט' },
    desc: { en: 'Came a long way for this.', he: 'עשה דרך ארוכה בשביל זה.' } },
  { id: 'dragon', kind: 'avatar', emoji: '🐲', price: 6000,
    name: { en: 'Baby Dragon', he: 'דרקון קטן' },
    desc: { en: 'Small, loud, extremely proud.', he: 'קטן, רועש, וגאה מאוד.' } },
];

export const PERKS = [
  { id: 'lucky-hat', kind: 'perk', emoji: '🎩', price: 500, multiplier: 1.15,
    name: { en: 'Lucky Hat', he: 'כובע מזל' },
    desc: { en: '+15% coins from every game.', he: '‎+15% מטבעות מכל משחקון.' } },
  { id: 'golden-watch', kind: 'perk', emoji: '⌚', price: 1800, multiplier: 1.35,
    name: { en: 'Golden Watch', he: 'שעון זהב' },
    desc: { en: '+35% coins from every game.', he: '‎+35% מטבעות מכל משחקון.' } },
  { id: 'trophy', kind: 'perk', emoji: '🏆', price: 5000, multiplier: 1.6,
    name: { en: 'Town Trophy', he: 'גביע העיר' },
    desc: { en: '+60% coins from every game.', he: '‎+60% מטבעות מכל משחקון.' } },
];

export const SHOP_ITEMS = [...AVATARS.filter((a) => a.price > 0), ...PERKS];

export const ITEMS_BY_ID = Object.fromEntries([...AVATARS, ...PERKS].map((i) => [i.id, i]));

export const avatarEmoji = (id) => ITEMS_BY_ID[id]?.emoji ?? '🧑';

export function perkMultiplier(equippedPerk) {
  const perk = equippedPerk ? ITEMS_BY_ID[equippedPerk] : null;
  return perk?.multiplier ?? 1;
}
