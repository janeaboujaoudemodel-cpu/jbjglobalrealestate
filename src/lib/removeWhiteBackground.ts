/**
 * Client-side white background removal for logo uploads.
 * Detects near-white corners and replaces white pixels with transparent.
 */

/**
 * Check if a pixel is near-white (R, G, B all > threshold).
 */
function isNearWhite(r: number, g: number, b: number, threshold: number = 240): boolean {
  return r > threshold && g > threshold && b > threshold;
}

/**
 * Detect if the image has a white background by sampling corner pixels.
 * Returns true if at least 3 of 4 corners are near-white.
 */
function hasWhiteBackground(imageData: ImageData, w: number, h: number): boolean {
  const d = imageData.data;
  const corners = [
    [0, 0],             // top-left
    [w - 1, 0],         // top-right
    [0, h - 1],         // bottom-left
    [w - 1, h - 1],     // bottom-right
  ];
  let whiteCount = 0;
  for (const [x, y] of corners) {
    const idx = (y * w + x) * 4;
    if (isNearWhite(d[idx], d[idx + 1], d[idx + 2])) whiteCount++;
  }
  return whiteCount >= 3;
}

/**
 * Remove white/near-white background from image data URL.
 * Returns a new data URL (PNG with transparency) if background was removed,
 * or the original if no white background was detected.
 */
export async function removeWhiteBackground(
  dataUrl: string,
  threshold: number = 240
): Promise<{ result: string; removed: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ result: dataUrl, removed: false });
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);

      if (!hasWhiteBackground(imageData, w, h)) {
        resolve({ result: dataUrl, removed: false });
        return;
      }

      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (isNearWhite(d[i], d[i + 1], d[i + 2], threshold)) {
          d[i + 3] = 0; // set alpha to 0
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve({ result: canvas.toDataURL('image/png'), removed: true });
    };
    img.onerror = () => resolve({ result: dataUrl, removed: false });
    img.src = dataUrl;
  });
}
