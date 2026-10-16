export const ART_SIZE = [1448, 1086];
export const ROCK_RECTS = [
  [0, 0, 498, 540], [500, 0, 476, 540], [977, 0, 471, 540],
  [0, 541, 490, 545], [492, 541, 490, 545], [983, 541, 465, 545]
];
export const SHIP_RECT = [0, 45, 660, 582];
export const BURST_RECT = [480, 582, 440, 504];

export function drawAtlas(ctx, image, rect, x, y, width, height = width) {
  if (!image?.complete || !image.naturalWidth) return false;
  ctx.drawImage(image, ...rect, x - width / 2, y - height / 2, width, height);
  return true;
}
