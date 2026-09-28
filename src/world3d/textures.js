import * as THREE from 'three';

/** Canvas-backed textures — keeps Hebrew text crisp and in-world, with no font loader. */

const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function finish(c, { repeat } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

/** A shop sign: emoji, name, and a coloured bar underneath. */
export function signTexture(emoji, name, color) {
  const c = canvas(512, 160);
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0e1219';
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 16);
  ctx.fillRect(0, 144, 512, 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 150);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `72px ${FONT}`;
  ctx.fillText(emoji, 66, 82);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 58px ${FONT}`;
  ctx.direction = 'rtl';
  ctx.fillText(name, 290, 80);

  return finish(c);
}

/** The floor: one texture painted from the tile grid, so the whole city is a single draw call. */
export function groundTexture(grid, colors, tilePx = 16) {
  const h = grid.length;
  const w = grid[0].length;
  const c = canvas(w * tilePx, h * tilePx);
  const ctx = c.getContext('2d');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = colors[grid[y][x]] ?? '#1b3226';
      ctx.fillRect(x * tilePx, y * tilePx, tilePx, tilePx);
      ctx.strokeStyle = 'rgba(0,0,0,0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * tilePx + 0.5, y * tilePx + 0.5, tilePx - 1, tilePx - 1);
    }
  }

  const tex = finish(c);
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** A flat emoji on transparent background, for billboarded props. */
export function emojiTexture(emoji, size = 128) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size * 0.78}px ${FONT}`;
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
  return finish(c);
}

/** The big screen in the plaza. */
export function billboardTexture(lines) {
  const c = canvas(640, 360);
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 640, 360);
  grad.addColorStop(0, '#12301f');
  grad.addColorStop(1, '#0f131c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 360);

  ctx.strokeStyle = '#44e092';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 630, 350);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.fillStyle = '#44e092';
  ctx.font = `bold 72px ${FONT}`;
  ctx.fillText(lines[0], 320, 130);
  ctx.fillStyle = '#dfe2ef';
  ctx.font = `36px ${FONT}`;
  ctx.fillText(lines[1], 320, 205);
  ctx.fillStyle = '#f5c542';
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText(lines[2], 320, 285);

  return finish(c);
}

/** A floating name tag for an avatar. */
export function labelTexture(text) {
  const c = canvas(256, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(15,19,28,0.78)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 48, 24);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillStyle = '#dfe2ef';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(text, 128, 33);
  return finish(c);
}
