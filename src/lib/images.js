/**
 * Photographs go through a canvas before they go anywhere near the network.
 *
 * A phone camera hands you 4–12 MB per shot. Eight of those is a minute of
 * uploading on a street corner and a tour that takes just as long to open on
 * the client's side, for pixels no one will ever see — in the tour a photo is a
 * frame on a wall, a metre wide at arm's length. 1600px on the long edge is
 * already more than that needs.
 *
 * It also quietly solves HEIC: an iPhone hands over `image/heic`, which no
 * browser will render in an <img> but every browser will decode into a canvas,
 * and what comes back out is a JPEG everybody can read.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export const ACCEPT = 'image/*';
/** Refuse the truly silly before spending a decode on it. */
export const MAX_BYTES = 25 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });
}

/**
 * Resolves with a JPEG `File` no larger than MAX_EDGE on its long side.
 * If the browser cannot decode the file at all, the original is returned — an
 * upload that might work beats a failure we invented ourselves.
 */
export async function downscale(file) {
  let img;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', QUALITY));
  if (!blob) return file;
  // a canvas cannot make a photo better, so keep whichever is smaller
  if (blob.size >= file.size && file.type === 'image/jpeg') return file;
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}

/** A thumbnail to show while the bytes are still going up. */
export function previewUrl(file) {
  return URL.createObjectURL(file);
}
