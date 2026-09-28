/** Block-figure colour sets. Each shop avatar maps to one; NPCs pick at random. */
export const SKINS = {
  trader: { skin: '#f3c9a0', shirt: '#7aa2ff', pants: '#2f3646', hat: '#1f2733' },
  bull: { skin: '#e6b98c', shirt: '#44e092', pants: '#1f4d36', hat: '#2a6b4a' },
  bear: { skin: '#dcae86', shirt: '#ffb4aa', pants: '#5a2e2a', hat: '#7a3b35' },
  robot: { skin: '#b9c4d6', shirt: '#8fa3bf', pants: '#4a5468', hat: '#c1c1ff' },
  ninja: { skin: '#2b3140', shirt: '#171b25', pants: '#171b25', hat: '#c1c1ff' },
  whale: { skin: '#9fd4f0', shirt: '#3f87c7', pants: '#1f4f78', hat: '#7ec8f2' },
  unicorn: { skin: '#ffd9f0', shirt: '#e2a7ff', pants: '#9b6ad6', hat: '#f5c542' },
};

export const NPC_SKINS = [
  { skin: '#f3c9a0', shirt: '#e88f6f', pants: '#3a4254', hat: '#2b3140' },
  { skin: '#c98d5f', shirt: '#8fd6a8', pants: '#2f3646', hat: '#44e092' },
  { skin: '#e8c39a', shirt: '#c1c1ff', pants: '#474f63', hat: '#7aa2ff' },
  { skin: '#a9784f', shirt: '#f5c542', pants: '#3b4356', hat: '#d8a62f' },
  { skin: '#ffd9c0', shirt: '#ff9db0', pants: '#5b3a4a', hat: '#ffb4aa' },
];

export const skinFor = (avatarId) => SKINS[avatarId] ?? SKINS.trader;
